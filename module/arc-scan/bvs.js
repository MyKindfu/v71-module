import { interval } from 'rxjs';
import { catchError, concatMap, filter, map, mapTo, retry, take, tap, timeout, } from 'rxjs/operators';
import { get } from '../shared/ajax/index';
import { UItoastr } from '../shared/uitoastr/index';
/** 初始化BVS环境 清理临时文件 */
export function initSplit() {
    const url = "//127.0.0.1:7701/bvs/init" /* bvsInitSplit */;
    return get(url).pipe(retry(2), map(res => {
        if (res.err) {
            UItoastr({ type: 'error', title: '初始化BVS应用启动失败', msg: res.msg ? res.msg : '' });
            throw new Error('初始化BVS应用失败');
        }
        return true;
    }), tap(() => console.info('BVS初始化成功')));
}
/** 调用BVS接口开始切分图片 */
export function startSplit(bankRegId) {
    // const url = bvsUrlPrefix + '/run/' + bankRegId
    const url = "//127.0.0.1:7701/bvs/run" /* bvsStartSplit */ + '/' + bankRegId;
    const req$ = get(url);
    return req$.pipe(mapTo(void 0));
}
/** 持续检查BVS切分处理图片进程，直到处理结束返回 */
export function isSplitProcessComplete() {
    // const url = bvsUrlPrefix + '/isrunning'
    const url = "//127.0.0.1:7701/bvs/isrunning" /* bvsIsSplitProcessComplete */;
    const intv$ = interval(5000);
    const req$ = get(url);
    const ret$ = intv$.pipe(tap(() => {
        UItoastr({
            type: 'info',
            title: '图片处理中',
            className: 'bvs-info',
            onlyOne: true,
        });
    }), concatMap(() => req$), filter(res => {
        return !res.err && res.dat === 'complete' ? true : false;
    }), take(1), mapTo(void 0), timeout(600 * 1000));
    return ret$;
}
/** 获取页面扫描切分凭证图片结果数组 */
export function readSplitRet() {
    // const url = bvsUrlPrefix + '/result'
    const url = "//127.0.0.1:7701/bvs/result" /* bvsReadSplitRet */;
    return get(url).pipe(map(res => {
        return res.dat ? res.dat : [];
    }), catchError(err => {
        console.error(err);
        return [];
    }));
}
