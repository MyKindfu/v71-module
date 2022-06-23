import { PageToImgRet } from 'bank-voucher-ocr'
import { interval, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  filter,
  map,
  mapTo,
  retry,
  take,
  tap,
  timeout,
} from 'rxjs/operators'

import { get } from '../shared/ajax/index'
import { UItoastr } from '../shared/uitoastr/index'

import { UrlList } from './config'
import { BankRegId } from './model'


/** 初始化BVS环境 清理临时文件 */
export function initSplit(): Observable<boolean> {
  const url = UrlList.bvsInitSplit
  return get<void>(url).pipe(
    retry(2),
    map(res => {
      if (res.err) {
        UItoastr({ type: 'error', title: '初始化BVS应用启动失败', msg: res.msg ? res.msg : '' })
        throw new Error('初始化BVS应用失败')
      }
      return true
    }),
    tap(() => console.info('BVS初始化成功')),
  )
}


/** 调用BVS接口开始切分图片 */
export function startSplit(bankRegId: BankRegId): Observable<void> {
  // const url = bvsUrlPrefix + '/run/' + bankRegId
  const url = UrlList.bvsStartSplit + '/' + bankRegId
  const req$ = get<void>(url)

  return req$.pipe(
    mapTo(void 0),
  )
}


/** 持续检查BVS切分处理图片进程，直到处理结束返回 */
export function isSplitProcessComplete(): Observable<void> {
  // const url = bvsUrlPrefix + '/isrunning'
  const url = UrlList.bvsIsSplitProcessComplete
  const intv$ = interval(5000)
  const req$ = get(url)

  const ret$ = intv$.pipe(
    tap(() => {
      UItoastr({
        type: 'info',
        title: '图片处理中',
        className: 'bvs-info',
        onlyOne: true,
      })
    }),
    concatMap(() => req$),
    filter(res => {
      return ! res.err && res.dat === 'complete' ? true : false
    }),
    take(1),
    mapTo(void 0),
    timeout(600 * 1000),
  )

  return ret$
}


/** 获取页面扫描切分凭证图片结果数组 */
export function readSplitRet(): Observable<PageToImgRet[]> {
  // const url = bvsUrlPrefix + '/result'
  const url = UrlList.bvsReadSplitRet
  return get<PageToImgRet[]>(url).pipe(
    map(res => {
      return res.dat ? res.dat : []
    }),
    catchError(err => {
      console.error(err)
      return []
    }),
  )
}
