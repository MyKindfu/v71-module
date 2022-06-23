import { catchError, concatMap, map, take, tap } from 'rxjs/operators';
import { get, readLocalImgBase64 } from '../shared/index';
/** 读取身份证信息 包括生成图片 */
export function readAll() {
    const url = "//127.0.0.1:7701/idc/readall" /* readAll */;
    return readCard(url);
}
/** 读取身份证基本信息 不包括头像 */
export function readBase() {
    // const url = UrlList.readBase
    const url = "//127.0.0.1:7701/idc/readbase" /* readBase */;
    return readCard(url, false).pipe(catchError((err) => {
        // 兼容老sc-tools客户端接口
        if (err && err.message.includes('404')) {
            return readCard("//127.0.0.1:7701/idc/read" /* read */, false);
        }
        else {
            throw err;
        }
    }));
}
export { readBase as read, };
/** 读取身份证合成图片 base64 */
export function readCompositeImg() {
    const ret$ = readAll().pipe(concatMap(data => readLocalImgBase64(data.compositePath)));
    return ret$;
}
function readCard(url, notify = true) {
    const ret$ = get(url, {}, { notify }).pipe(tap(res => {
        if (!res || !res.dat || !res.dat.base) {
            throw new Error('读取二代证信息空');
        }
    }), map(res => res.dat), take(1));
    return ret$;
}
