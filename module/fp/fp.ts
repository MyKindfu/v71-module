import { Observable } from 'rxjs'
import { map, take, tap } from 'rxjs/operators'

import { get, post, Base64Text } from '../shared/index'

import { UrlList } from './config'
import { FPData } from './model'


/** 采集指纹（共读取三次） */
export function read(): Observable<Base64Text> {
  const url = UrlList.read
  const ret$ = get<FPData>(url).pipe(
    map(res => res.dat && res.dat.fp ? res.dat.fp : ''),
    tap(fp => {
      if (! fp) {
        throw new Error('采集指纹失败')
      }
    }),
    take(1),
  )

  return ret$
}


/** 校验指纹对应（单次）采集结果 */
export function verify(fp: string): Observable<boolean> {
  const url = UrlList.verify
  const ret$ = post<boolean>(url, {
    data: { fp },
  }).pipe(
    map(res => !! res.dat),
    take(1),
  )

  return ret$
}

