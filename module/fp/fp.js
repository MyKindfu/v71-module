import { map, take, tap } from 'rxjs/operators';
import { get, post } from '../shared/index';
/** 采集指纹（共读取三次） */
export function read() {
    const url = "//127.0.0.1:7701/fp/read" /* read */;
    const ret$ = get(url).pipe(map(res => res.dat && res.dat.fp ? res.dat.fp : ''), tap(fp => {
        if (!fp) {
            throw new Error('采集指纹失败');
        }
    }), take(1));
    return ret$;
}
/** 校验指纹对应（单次）采集结果 */
export function verify(fp) {
    const url = "//127.0.0.1:7701/fp/verify" /* verify */;
    const ret$ = post(url, {
        data: { fp },
    }).pipe(map(res => !!res.dat), take(1));
    return ret$;
}
