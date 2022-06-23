import { error, setRunLevel, warn } from '@waiting/log'
import { throwError, Observable } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { get as rxget, post as rxpost, RxRequestInit } from 'rxxfetch'

import { UItoastr } from '../uitoastr/index'
import { UItoastrOpts } from '../uitoastr/model'

import { initialAjaxOptsExt, initialArgs } from './config'
import { AjaxOptsExt, AjaxResp } from './model'


export {
  Args,
  ArgsRequestInitCombined,
  JsonType,
  ObbRetType,
  PlainJsonValueType,
  PlainObject,
  RxRequestInit,
} from 'rxxfetch'


// @ts-ignore
if (ST.userinfo && typeof ST.userinfo.logLevel === 'string') {
  // @ts-ignore
  setRunLevel(ST.userinfo.logLevel)
}
else {
  setRunLevel('error')
}


/**
 * Fetch GET 返回数据类型固定为 json
 * @returns Observable<AjaxResp<T>> 泛型T为 AjaxResp.dat 类型，默认 any
 */
export function get<T = any>(url: string, init?: RxRequestInit, options?: AjaxOptsExt) {
  const initNew = init ? { ...initialArgs, ...init } : { ...initialArgs }
  return myajax<T>(url, initNew, 'get', options)
}


/**
 * Fetch POST 返回数据类型固定为 json
 * @returns Observable<AjaxResp<T>> 泛型T为 AjaxResp.dat 类型，默认 any
 */
export function post<T = any>(url: string, init?: RxRequestInit, options?: AjaxOptsExt): Observable<AjaxResp<T>> {
  const initNew = init ? { ...initialArgs, ...init } : { ...initialArgs }
  return myajax<T>(url, initNew, 'post', options)
}


/** 处理返回数据 err/state 值 */
function parseRespState<T>(data: AjaxResp<T>): AjaxResp<T> {
  // data.state : 5初始化值, 1错误, 3失败, 7完成, 9成功. 若data.jump真则跳转
  if (! data) {
    throw new TypeError('返回数据结构非法空')
  }

  if (typeof data.err !== 'undefined') {
    data.err = +data.err
  }
  if (typeof data.state !== 'undefined') {
    data.state = +data.state
  }
  if (typeof data.err !== 'number' && typeof data.state !== 'number') {
    throw new TypeError('返回数据 state/err 值非法')
  }

  if (typeof data.err === 'undefined') {
    if (data.state >= 5) {
      data.err = 0
    }
    else if (data.state === -1) {
      data.err = -1
    }
    else {
      data.err = 1
    }
  }

  return data
}


/** 分析请求结果 若异常则抛出异常 */
function parseRespErr(data: AjaxResp): void {
  if (data.err) {
    if (data.state === -1) { // session过期弹出验证密码弹窗
      // options.notify && data.msg && UItoastr({ type: 'warning', title: '登录状态无效', msg: data.msg, timeOut: 10000 })

      // @ts-ignore
      $('#dialog_verification_login_password').modal('show')

      // @FIXME
      // @ts-ignore
      DT.lock_worker && DT.lock_workedata.postMessage('stop')
    }
    else {
      throw new Error(data.msg ? data.msg : 'Ajax Error without error message')
    }
  }
  // else {
  //   if (typeof data.jump === 'string') {
  //     window.location.href = data.jump
  //     return
  //   }
  // }
}


/** 处理异常弹框显示 */
function handleRespErr(errorObj: Error, options: AjaxOptsExt): void {
  if (options && options.notify) {
    notifyException('error', errorObj.message)
  }
}


/** 使用 toastr 显示异常信息 */
function notifyException(notifyType: UItoastrOpts['type'], message: string | null | void): void {
  UItoastr({ type: notifyType, title: 'AJAX 请求异常', msg: message ? message : 'unknown', timeOut: 20000 })
  switch (notifyType) {
    case 'error' :
      error('AJAX 请求异常:' + message)
      break

    case 'warning':
      warn('AJAX 请求异常:' + message)
      break

    default:
      warn('AJAX 请求异常:' + message)
      break
  }
}


function myajax<T>(
  url: string,
  init: RxRequestInit,
  type: 'get' | 'post',
  options?: AjaxOptsExt,
) {
  const opts: AjaxOptsExt = options ? { ...initialAjaxOptsExt, ...options } : { ...initialAjaxOptsExt }
  let req$: Observable<AjaxResp<T>>

  if (type === 'get') {
    req$ = rxget<AjaxResp<T>>(url, init)
  }
  else if (type === 'post') {
    req$ = rxpost<AjaxResp<T>>(url, init)
  }
  else {
    return throwError(new TypeError('myajax type value invalid'))
  }

  const ret$: Observable<AjaxResp<T>> = req$.pipe(
    map(parseRespState),
    tap(parseRespErr),
    catchError((err: Error) => {
      handleRespErr(err, opts)
      throw err
    }),
  )

  return ret$
}

