import { RxRequestInit } from 'rxxfetch'

import { AjaxOptsExt } from './model'


export const initialArgs: RxRequestInit = {
  timeout: 60 * 1000,
}
export const initialAjaxOptsExt: AjaxOptsExt = {
  notify: true,
}
