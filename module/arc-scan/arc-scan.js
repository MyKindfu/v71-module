import { from as ofrom, of } from 'rxjs';
import { catchError, concatMap, delay, filter, map, mapTo, mergeMap, startWith, tap, } from 'rxjs/operators';
import { UItoastr } from '../shared/uitoastr/index';
import { combineSaveScanImg, genSBIndex, notifyOcrServiceToStart, queryOcrRetMatch, saveSplitImg, } from './archive';
import { deleteOcrRetRow, intvGetOcrRet, readOcrRetImg, } from './bvo';
import { initSplit, isSplitProcessComplete, readSplitRet, startSplit } from './bvs';
import { failImgMap, initialArcConfigs, initialUIOpts, processingImgSet, subject, succFilepathSet, } from './config';
import { bindClickEvent, } from './event';
import { getScannerInstbySym, startScan, } from './scan';
import { initUI, setElmsValidState, triggerFileInput, updateProcessedImgLi, } from './ui';
/** ocr监控服务订阅 */
let intvGetOcrRetSub = null;
/** 内部subject订阅 */
let innerSubjectSub = null;
/** 内部模态框事件流订阅 */
let combinedSub = null;
// 初始化采集模态框绑定事件
export function initDlg(ctx, options, params) {
    initialArcConfigs.arcCode = '';
    if (!ctx) {
        throw new Error('initDlg() ctx 参数空');
    }
    succFilepathSet.clear();
    failImgMap.clear();
    processingImgSet.clear();
    // 发送ocr结果到服务器匹配, 匹配全部结束后直接保存档案袋图片
    // watchOcrSrvRet()
    if (!params || !params.bankid) {
        console.info(params);
        throw new Error('BANKREGID参数空');
    }
    initialArcConfigs.dialogCtx = ctx;
    initialArcConfigs.uiOpts = Object.assign({}, initialUIOpts, options);
    initUI();
    // 初始化禁用 等待摄像头初始化成功后再启用
    setElmsValidState(false);
    const sym = Symbol(Math.random());
    const initialArcEvent = {
        action: "n/a" /* noneAvailable */,
        payload: {
            arcTypeSelectedData: { id: '', text: '' },
            sym,
        },
    };
    subscribeEvent(initialArcConfigs.dialogCtx, initialArcConfigs.uiOpts, sym, initialArcEvent, params);
    setTimeout((sub) => {
        sub.next(Object.assign({}, initialArcEvent, { action: "initial" /* initial */ }));
    }, 10, subject);
    // @ts-ignore
    // 远程主机
    const host = ST.OCRServiceUrl;
    notifyOcrServiceToStart(host).subscribe();
    return subject;
}
export function destroy() {
    initialArcConfigs.arcCode = '';
    combinedSub && combinedSub.unsubscribe();
    intvGetOcrRetSub && intvGetOcrRetSub.unsubscribe();
    innerSubjectSub && innerSubjectSub.unsubscribe();
    initUI();
}
function subscribeEvent(ctx, uiOpts, scannerSym, event, params) {
    const click$ = bindClickEvent(ctx);
    const event$ = click$.pipe(map(elm => {
        const arcEvent = Object.assign({}, event);
        if (elm.matches(uiOpts.btnScanSelector)) { // 扫描按钮
            arcEvent.action = "scan" /* scan */;
        }
        else if (elm.matches(uiOpts.selectLocalFileSelector)) { // 打开选择本地图片对话框 用于上传
            arcEvent.action = "openSelectLocalFile" /* openSelectLocalFile */;
        }
        else if (elm.classList.contains('close') || elm.classList.contains('btn-close-modal')) { // 关闭模态框按钮
            arcEvent.action = "closeDlg" /* closeDlg */;
        }
        return arcEvent;
    }), startWith(Object.assign({}, event)));
    const combined$ = event$
        .pipe(map(ev => {
        const id = 337;
        const text = '凭证附件';
        if (ev.payload.arcTypeSelectedData) {
            ev.payload.arcTypeSelectedData.id = id;
            ev.payload.arcTypeSelectedData.text = text;
        }
        else {
            ev.payload.arcTypeSelectedData = { id, text };
        }
        return ev;
    }), catchError((err) => {
        const ev = {
            action: "error" /* error */,
            err,
            payload: {},
        };
        return of(ev);
    }));
    // 内部不能调用 subject.next() 否则死循环
    innerSubjectSub = subject.subscribe(ev => {
        const sym = ev.payload && ev.payload.sym ? ev.payload.sym : scannerSym;
        const scanner = getScannerInstbySym(sym);
        const dialogCtx = initialArcConfigs.dialogCtx;
        const StatusContent = dialogCtx.querySelector(initialArcConfigs.uiOpts.scanStatusContent);
        switch (ev.action) {
            case "scannerReady" /* scannerReady */:
                combinedSub = combined$.subscribe(subject); // 初始化成功才订阅
                // 目前对于扫描图片只切割不做ocr 故注释
                // startOcrService().subscribe() // 重启本地OCR服务
                break;
            case "openSelectLocalFile" /* openSelectLocalFile */:
                triggerFileInput();
                break;
            case "scan" /* scan */:
                if (scanner) {
                    startScanAndSplit(scanner, params).subscribe(() => {
                        // 废弃 ST.userinfo.ocrServiceHost
                        // @ts-ignore
                        // 远程主机
                        const host = ST.OCRServiceUrl;
                        notifyOcrServiceToStart(host).subscribe();
                    }, err => {
                        console.error(err);
                        UItoastr({ type: 'error', title: '采集操作发生错误', msg: err ? err : '' });
                        setElmsValidState(true);
                    }, () => {
                        setElmsValidState(true);
                        $(StatusContent).prepend('<li>本次凭证及扫描任务已全部结束！</li>');
                    });
                }
                else {
                    alert('scanner对象空');
                }
                break;
            case "scanSucc" /* scanSucc */:
                setElmsValidState(true);
                break;
            case "closeDlg" /* closeDlg */:
                setTimeout(() => {
                    subject.next(Object.assign({}, ev, { action: "dlgClosed" /* dlgClosed */ }));
                }, 500);
                break;
            case "dlgClosed" /* dlgClosed */:
                destroy();
                break;
            case "dlgRestored" /* dlgRestored */:
                // // handleEventDlgRestored(ev, subject, scanner)
                // watchOcrSrvRet()
                break;
        }
    });
    return subject;
}
/** 发送ocr结果到服务器匹配, 匹配全部结束后直接保存档案袋图片 */
export function watchOcrSrvRet() {
    if (intvGetOcrRetSub) {
        intvGetOcrRetSub.unsubscribe();
    }
    intvGetOcrRetSub = intvGetOcrRet().pipe(filter(retMap => retMap.size > 0), map(prepareOcrRet), concatMap(retMap => {
        const sn = Math.random() + '';
        return queryOcrRetMatch(sn, retMap, failImgMap, processingImgSet);
    }), filter(row => row && row.DZDID ? true : false), mergeMap(({ DZDID, filepath, filename }) => readAndSaveArcOcrImg(+DZDID, filepath, filename), 2))
        .subscribe(() => {
        updateProcessedImgLi(failImgMap, succFilepathSet);
    });
}
// 预处理ocr结果
function prepareOcrRet(srcMap) {
    const ret = new Map();
    for (const [name, obj] of srcMap.entries()) {
        // 转换农行sn的i为1
        if (obj.sn && obj.bank === 'abc') {
            obj.sn = obj.sn.replace(/i/g, '1');
        }
        ret.set(name, obj);
    }
    return ret;
}
// 匹配返回结果后读取图片base64保存为档案图片. 对账单id， 图片路径
function readAndSaveArcOcrImg(dzdid, filepath, filename) {
    if (!dzdid) {
        failImgMap.set(filename, filepath); // 输出失败文件路径
        // deleteOcrRetRow(filename).subscribe() // 不删除图片.供查阅
        return of(void 0);
    }
    if (succFilepathSet.has(filepath)) {
        deleteOcrRetRow(filename).subscribe();
        return of(void 0);
    }
    // 读取图片 base64
    return readOcrRetImg(filepath).pipe(mergeMap(pic => {
        const data = {
            // @ts-ignore
            creater: ST.userinfo.userName,
            dzdid,
            pic,
        };
        // 合并保存档案、更新对账单id
        return combineSaveScanImg(data).pipe(tap(succ => {
            if (succ) {
                succFilepathSet.add(filepath);
            }
            else {
                failImgMap.set(filename, filepath);
            }
        }), mergeMap(succ => {
            if (succ) {
                UItoastr({ type: 'success', title: '保存采集图片成功', className: 'ocr-arc-save-success', onlyOne: true });
                return deleteOcrRetRow(filename).pipe(catchError(err => {
                    console.info('保存档案图片成功后删除图片失败', err);
                    return of(void 0);
                }));
            }
            return of(void 0);
        }), catchError(err => {
            UItoastr({ type: 'error', title: '保存采集图片失败', msg: err ? err : '' });
            return of(void 0);
        }), mapTo(void 0));
    }));
}
/** 高扫执行扫描，扫描结束后本地bvs执行图片切分, 保存图片到档案服务 */
function startScanAndSplit(scanner, params) {
    if (!scanner) {
        throw new TypeError('scanner invalid');
    }
    const initBvs$ = initSplit();
    const scan$ = startScan(scanner);
    const split$ = startSplit(params.bankid);
    const splitComplete$ = isSplitProcessComplete();
    const readSplitRet$ = readSplitRet();
    // 每次扫描批次都更新
    params.hslsh = +(new Date()) + '';
    const ret$ = initBvs$.pipe(concatMap(() => scan$), // @DEBUG 期间屏蔽, 生产环境启用
    delay(10 * 1000), concatMap(() => split$), concatMap(() => splitComplete$), concatMap(() => readSplitRet$), concatMap(arr => {
        if (arr && arr.length) {
            return ofrom(arr);
        }
        throw new Error('获取扫描页面分割图片结果为空');
    }), mergeMap((row, index) => {
        // @ts-ignore
        const imgInfo = row.imgFile ? row.imgFile : row.imgInfo;
        return readOcrRetImg(imgInfo.path).pipe(map(pic => [pic, genSBIndex(imgInfo.name)]), concatMap(([pic, idx]) => {
            const pdata = Object.assign({}, params, { pic });
            pdata.scaninx = idx;
            return saveSplitImg(pdata);
        }));
    }, 1));
    return ret$;
}
