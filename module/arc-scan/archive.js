import { from as ofrom, of, EMPTY } from 'rxjs';
import { catchError, delay, filter, map, mapTo, merge, mergeMap, retry, tap } from 'rxjs/operators';
import { get, post } from '../shared/ajax/index';
import { UItoastr } from '../shared/uitoastr/index';
import { distinguishMultiId, distinguishSingleId } from './bvo';
import { initialArcConfigs } from './config';
import { BankRegId, } from './model';
/** 提交ocr结果到服务端作匹配，获取对账单 DZDID。 忽略掉已失败的记录 */
export function queryOcrRetMatch(sn, data, failedMap, processingSet) {
    if (!sn) {
        throw new Error('流水号sn不能空');
    }
    const arr = [];
    const tmpMap = new Map();
    let id = 1;
    for (const row of data.values()) {
        if (failedMap.size && failedMap.has(row.filename)) { // 忽略掉已匹配失败的
            continue;
        }
        if (processingSet.size && processingSet.has(row.filename)) { // 忽略掉正在匹配处理中的
            continue;
        }
        const tmpRow = Object.assign({}, row);
        tmpRow.id = id + '';
        tmpRow.bankName = row.bank;
        tmpRow.bank = BankRegId[tmpRow.bankName];
        arr.push(tmpRow);
        tmpMap.set(id, tmpRow);
        processingSet.add(tmpRow.filename);
        id++;
    }
    const url = 'caBankSettlementController/matchYHJSLSXX_DA.do';
    const pdata = {
        sn,
        data: arr,
    };
    if (!arr.length) {
        return EMPTY;
    }
    return post(url, {
        data: { pdata: JSON.stringify(pdata) },
    }).pipe(catchError(() => {
        for (const row of tmpMap.values()) {
            failedMap.set(row.filename, row.path);
            // processingImgSet.delete(row.filename)
        }
        return EMPTY;
    }), mergeMap(res => handleQueryOcrRetMatch(res, tmpMap)));
}
export function combineSaveScanImg(data) {
    // creater: string
    // pic: string  // 图片 base64
    // DZDID: number // 对账单ID
    // 'mugShotController/saveYhjsxxFile.do'
    const req$ = post("mugShotController/saveYhjsxxFile.do" /* combineSaveScanImg */, { data });
    return req$
        .pipe(map(res => {
        if (res.err) {
            throw new Error('保存档案图片失败' + res.msg);
        }
        return res;
    }), delay(1000), retry(1), map(res => {
        return res.err ? false : true;
    }));
}
/** 处理后台匹配DZDID ajax请求结果 */
function handleQueryOcrRetMatch(res, srcMap) {
    if (!res || !res.dat || !Array.isArray(res.dat)) {
        return EMPTY;
    }
    else {
        const resRows = res.dat;
        const { single, multi } = filterQueryRetRow(resRows);
        const singleRowsTmp = []; // 唯一匹配的(可能流水号有差异)
        const singleRows2 = []; // 唯一匹配的(可能流水号有差异)
        const multiRows = []; // 多匹配的
        for (const id of single) {
            const row = retrieveRowsFromQueryOcrMatchRetRows(resRows, id)[0];
            const tmpRow = srcMap.get(+id);
            if (tmpRow) {
                row.filename = tmpRow.filename;
                row.filepath = tmpRow.path ? tmpRow.path : '';
                singleRowsTmp.push(row);
            }
        }
        // // tslint:disable-next-line
        // debugger
        for (const id of multi) {
            for (const row of retrieveRowsFromQueryOcrMatchRetRows(resRows, id)) {
                row && row.DZDID && multiRows.push(row);
            }
        }
        // 判断流水号是否相符
        const validRows = [];
        for (const row of singleRowsTmp) {
            const srcRow = srcMap.get(+row.ID);
            if (srcRow) {
                if (!srcRow.sn) {
                    validRows.push(row);
                }
                else if (srcRow.sn === row.YHJSLSH) {
                    validRows.push(row);
                }
                else {
                    singleRows2.push(row);
                }
            }
        }
        const valid$ = ofrom(validRows); // 有效唯一匹配
        const single$ = distinguishSingleId(singleRows2, srcMap); // 唯一匹配需要校验流水号差异度
        const multi$ = distinguishMultiId(multiRows, srcMap); // 远程请求辨识
        const combined$ = single$.pipe(merge(multi$));
        const ret$ = valid$.pipe(merge(combined$), filter(row => !!row && row.DZDID.length > 0 ? true : false), map(row => {
            if (row) {
                if (!row.filename || !row.filepath) {
                    const tmpRow = srcMap.get(+row.ID);
                    if (row && tmpRow) {
                        row.filename = tmpRow.filename;
                        row.filepath = tmpRow.path ? tmpRow.path : '';
                    }
                }
            }
            return row;
        }));
        return ret$;
    }
}
// FSE可能为负数
// tslint:disable-next-line
// {"YHJSLSH":"411099036","FSE":"664700","JZRQ":"20180620","BANKREGID":"3","DZDID":"59920","ID":"2", "DESACCNO": "123", "PAYACCNO": "123"},
// {"YHJSLSH":"411205435","FSE":"124800","JZRQ":"20180620","BANKREGID":"3","DZDID":"59921","ID":"3", ...}
// tslint:disable-next-line
// {"YHJSLSH":"...1000002","FSE":"5518.58","JZRQ":"20180620","BANKREGID":"1","DZDID":"59571","ID":"1", "DESACCNO": "123", "PAYACCNO": "123"},
// {"YHJSLSH":"...1000003","FSE":"5518.58","JZRQ":"20180620","BANKREGID":"1","DZDID":"59570","ID":"1", ...},
// {"YHJSLSH":"...1000002","FSE":"5518.58","JZRQ":"20180620","BANKREGID":"1","DZDID":"59571","ID":"2", ...},
// {"YHJSLSH":"...1000003","FSE":"5518.58","JZRQ":"20180620","BANKREGID":"1","DZDID":"59570","ID":"2", ...},
/** 从匹配结果中提取DZDID唯一匹配的记录, 以及匹配多条DZDID，忽略掉无匹配的输入 */
function filterQueryRetRow(data) {
    const single = new Set(); // row.ID
    const multi = new Set(); // row.ID
    for (const row of data) {
        const id = row.ID;
        if (multi.has(id)) { // 有重复匹配并且已添加过
            continue;
        }
        else if (single.has(id)) { // 第二次匹配
            single.delete(id);
            multi.add(id);
        }
        else if (row.DZDID) {
            single.add(id);
        }
    }
    return { single, multi };
}
/** 根据ID从匹配结果数组中提取row.ID相同的行，返回数组 */
function retrieveRowsFromQueryOcrMatchRetRows(data, id) {
    const ret = [];
    if (data && data.length && id) {
        for (const row of data) {
            if (row.ID === id) {
                ret.push(Object.assign({}, row));
            }
        }
    }
    return ret;
}
/** 直接保存切分后的凭证图片文件到服务器，不做ocr处理 */
export function saveSplitImg(data) {
    const url = data.url;
    const req$ = post(url, { data });
    const dialogCtx = initialArcConfigs.dialogCtx;
    const StatusContent = dialogCtx.querySelector(initialArcConfigs.uiOpts.scanStatusContent);
    const ret$ = req$.pipe(map(res => {
        if (!res.err) {
            return;
        }
        throw new Error(res.msg ? res.msg : 'saveSplitImg()');
    }), tap(() => {
        $(StatusContent).prepend('<li>图片序号' + data.scaninx + '保存成功</li>');
    }), catchError(err => {
        $(StatusContent).prepend('<li>保存凭证图片失败' + err.msg ? err.msg : '' + '</li>');
        UItoastr({ type: 'error', title: '保存凭证图片失败', msg: err.msg ? err.msg : '' });
        return EMPTY;
    }));
    return ret$;
}
/**
 * 根据文件名生成序列号
 * 文件名格式 20180705-A15307725600001-0.2834807279585585-0.jpg
 */
export function genSBIndex(name) {
    if (!name) {
        throw new Error('文件名空');
    }
    console.info('genSBIndex() filename: ' + name);
    const arr = name.slice(0, name.lastIndexOf('.')).split('-');
    const file = arr[1]; // A15307725600001
    let idx = arr.length < 4 ? 0 : +arr[3]; // 0
    if (isNaN(idx) || idx < 0) {
        idx = 0;
    }
    let baseIdx = +file.slice(-5);
    if (isNaN(baseIdx)) {
        baseIdx = 0;
    }
    const ret = baseIdx + idx;
    console.info('genSBIndex() ret: ' + ret);
    return ret;
}
/**
 * 通知 远程ocr-service 服务执行ocr任务， 需传入主机（ip）地址
 * demo: https://127.0.0.1:7702/bvo/start/https%3A%2F%2F127.0.0.1%3A8443%2Fgjjv71
 *
 * @deprecated 使用 notifyOcrServiceToStart() 替代
 * @param host - 远程ocr服务地址. 从 ST.userinfo.ocrServiceHost 取值
 */
export function notifyStartServerOcrTask(host) {
    if (!host) {
        host = 'https://127.0.0.1:7702/';
    }
    else {
        if (host.slice(-1) !== '/') {
            host = host + '/';
        }
    }
    // @ts-ignore
    const base = getBaseURL(); // 本系统地址, 供ocr-service回写数据
    const url = `${host}bvo/start/` + encodeURIComponent(base);
    return get(url).pipe(catchError(err => {
        // warn(err)
        return EMPTY;
    }));
}
/**
 * 通知远程 OCR 服务执行识别任务。
 * 由远程服务从核心接口获取未 OCR 识别凭证图片进行识别，
 * 然后调用核心接口回写凭证信息。
 * 可在本地扫描开始或者结束后执行通知。
 * 远程服务器 URL 从 ST.OCRServiceUrl 读取，
 *
 * @param host - 远程服务主机. webserviceConfig.xml 中通过 ocr_service 配置
 *
 * demo: 请求地址 https://192.168.0.2:7701/bvo/start_das_ocr/https%3A%2F%2F127.0.0.1%3A8443%2Fgjjv71
 */
export function notifyOcrServiceToStart(host) {
    // @ts-ignore
    // 本核心系统 URL，用于远程服务调用核心系统接口取数
    const selfUrl = ST.base;
    if (host) {
        if (host.slice(-1) === '/') {
            host = host.slice(0, -1);
        }
        const url = `${host}/bvo/start_das_ocr/` + encodeURIComponent(selfUrl);
        const ret$ = get(url).pipe(mapTo(void 0));
        return ret$;
    }
    else {
        console.info('notifyOcrServiceToStart() 未定义 ocr_service 主机');
        return of(void 0);
    }
}
