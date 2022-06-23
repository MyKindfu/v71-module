import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

import { post } from '../ajax/index'

import { UrlList } from './config'
import { Base64Text } from './model'


/** 读取本地图片 base64 */
export function readLocalImgBase64(path: string): Observable<Base64Text> {
  const url = UrlList.readLocalImgBase64
  const data = { file: path }

  return post(url, { data }).pipe(
    map(res => {
      if (res.err) {
        return ''
      }
      return res.dat ? res.dat : ''
    }),
  )
}
