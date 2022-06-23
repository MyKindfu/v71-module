import { map } from 'rxjs/operators';
import { post } from '../ajax/index';
/** 读取本地图片 base64 */
export function readLocalImgBase64(path) {
    const url = "//127.0.0.1:7701/bvo/readimg" /* readLocalImgBase64 */;
    const data = { file: path };
    return post(url, { data }).pipe(map(res => {
        if (res.err) {
            return '';
        }
        return res.dat ? res.dat : '';
    }));
}
