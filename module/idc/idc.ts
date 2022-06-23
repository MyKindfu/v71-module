import { Observable } from 'rxjs'
import { catchError, concatMap, map, take, tap } from 'rxjs/operators'

import { get, readLocalImgBase64, Base64Text } from '../shared/index'

import { UrlList } from './config'
import { IDData } from './model'


/** 读取身份证信息 包括生成图片 */
export function readAll(): Observable<IDData> {
  const url = UrlList.readAll
  return readCard(url)
}


/** 读取身份证基本信息 不包括头像 */
export function readBase(): Observable<IDData> {
  // const url = UrlList.readBase
  const url = UrlList.readBase
  return readCard(url, false).pipe(
    catchError((err: Error) => {
      // 兼容老sc-tools客户端接口
      if (err && err.message.includes('404')) {
        return readCard(UrlList.read, false)
      }
      else {
        throw err
      }
    }),
  )
}
export {
  readBase as read,
}


/** 读取身份证合成图片 base64 */
export function readCompositeImg(): Observable<Base64Text> {
  const ret$ = readAll().pipe(
    concatMap(data => readLocalImgBase64(data.compositePath)),
  )
  return ret$
}


function readCard(url: string, notify: boolean = true): Observable<IDData> {
  const ret$ = get<IDData>(url, {}, { notify }).pipe(
    tap(res => {
      if (! res || ! res.dat || ! res.dat.base) {
        throw new Error('读取二代证信息空')
      }
    }),
    map(res => <IDData> res.dat),
    take(1),
  )

  return ret$
}
