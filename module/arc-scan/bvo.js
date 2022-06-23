import { from as ofrom, of, timer, EMPTY } from 'rxjs';
import { catchError, concatMap, delay, map, mergeMap, retry, tap, } from 'rxjs/operators';
import { get, post, readLocalImgBase64 } from '../shared/index';
import { UItoastr } from '../shared/uitoastr/index';
/** 启动远程 OCR 服务 */
export function startOcrService() {
    // const url = bvoUrlPrefix + '/restart'
    const url = "//127.0.0.1:7701/bvo/restart" /* startOcrService */;
    return get(url).pipe(map(res => {
        if (res.err) {
            UItoastr({ type: 'error', title: '凭证图片OCR服务启动失败', msg: res.msg ? res.msg : '' });
            throw new Error('启动OCR服务失败');
        }
        return res;
    }), delay(2000), retry(3));
}
// 持续检查sc-service服务ocr处理图片操作，直到处理结束返回 Observable<true>
export function intvGetOcrRet() {
    // UItoastr({
    //   type: 'info',
    //   title: '凭证图片处理中，请等待……',
    //   className: 'ocr-info',
    //   onlyOne: true,
    // })
    // const url = bvoUrlPrefix + '/result'
    const url = "//127.0.0.1:7701/bvo/result" /* queryOcrResult */;
    const intv$ = timer(30000, 15 * 1000);
    const ret$ = intv$.pipe(tap(() => {
        UItoastr({
            type: 'info',
            title: '获取凭证图片处理结果',
            className: 'ocr-info',
            onlyOne: true,
        });
    }), concatMap(() => get(url)), map(data => {
        const dat = data.dat;
        const ret = new Map();
        if (dat && Array.isArray(dat)) {
            for (const row of dat) {
                row.filename && ret.set(row.filename, row);
            }
        }
        console.info('bvo ret', ret);
        return ret;
    }));
    return ret$;
}
/** 根据图片 path 读取图片 base64 */
export function readOcrRetImg(path) {
    // const url = UrlList.readOcrRetImg
    // const data = { file: path }
    // return post(url, { data }).pipe(
    //   map(res => {
    //     if (res.err) {
    //       return ''
    //     }
    //     return res.dat ? res.dat : ''
    //   }),
    // )
    return readLocalImgBase64(path);
}
/**
 * 检查sc-service服务ocr 扫描文件变动监听状态 true: 监听中
 * https://127.0.0.1:7701/bvo/start  开启监听
 * https://127.0.0.1:7701/bvo/stop  停止监听
 * https://127.0.0.1:7701/bvo/restart  停止监听并重置扫描结果
 */
export function isOcrWatching() {
    // const url = bvoUrlPrefix + '/isrunning'
    const url = "//127.0.0.1:7701/bvo/isrunning" /* isOcrWatching */;
    return get(url).pipe(map(data => !!data.dat));
}
/** 删除远程 OCR 识别结果图片 */
export function unlinkOcrImg(paths) {
    // const url = bvoUrlPrefix + '/unlink'
    const url = "//127.0.0.1:7701/bvo/unlink" /* unlinkOcrImg */;
    const ret$ = get(url, {
        data: {
            files: paths,
        },
    });
    return ret$;
}
// 删除Ocr服务端扫描记录
export function deleteOcrRetRow(filename) {
    const url = "//127.0.0.1:7701/bvo/unlink" /* unlinkOcrImg */;
    return get(url, {
        data: {
            files: [filename],
        },
    }).pipe(map(res => {
        if (res.err) {
            throw new Error('删除Ocr结果记录失败' + res.msg);
        }
        return res;
    }), delay(1000), retry(1), map(res => {
        return res.err ? false : true;
    }), catchError(err => {
        console.error(err);
        return of(true);
    }));
}
/** 仅校验流水号差异度 相差不大的视为匹配 */
export function distinguishSingleId(data, srcMap) {
    if (!data || !data.length) {
        return EMPTY;
    }
    // // tslint:disable-next-line
    // debugger
    // const url = bvoUrlPrefix + '/distinguish_single_id'
    const url = "//127.0.0.1:7701/bvo/distinguish_single_id" /* distinguishSingleId */;
    return ofrom(data).pipe(mergeMap(row => {
        const srcRow = srcMap.get(+row.ID);
        if (!srcRow) {
            return EMPTY;
        }
        const drow = Object.assign({}, row, { ocrSn: srcRow.sn });
        const req$ = get(url, {
            data: drow,
        });
        return req$.pipe(map(res => {
            if (!res.err && res.dat) {
                return res.dat;
            }
        }), catchError(err => {
            return of(void 0);
        }));
    }, 3));
}
/** 多条匹配记录筛选 */
export function distinguishMultiId(data, srcMap) {
    if (!data || !data.length) {
        return EMPTY;
    }
    // // tslint:disable-next-line
    // debugger
    // const url = bvoUrlPrefix + '/distinguish_multi_id'
    const url = "//127.0.0.1:7701/bvo/distinguish_multi_id" /* distinguishMultiId */;
    const drows = [];
    for (const row of data) {
        const srcRow = srcMap.get(+row.ID);
        if (srcRow) {
            const drow = Object.assign({}, row, { ocrSn: srcRow.sn });
            drows.push(drow);
        }
    }
    const req$ = post(url, {
        data: {
            rows: drows,
        },
    });
    return req$.pipe(mergeMap(res => {
        if (!res.err && res.dat) {
            return ofrom(res.dat);
        }
        return EMPTY;
    }), catchError(err => {
        return of(void 0);
    }));
}
