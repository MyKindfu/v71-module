
export interface AjaxResp <T = any> {
  err: number
  /** 有可能只返回 state 值而无 err 值，此时根据 state 值生成 err 值 */
  state: number
  dat?: T
  msg?: string | null
  [key: string]: any
}

export interface AjaxOptsExt {
  /** 使用 toastr提示消息 */
  notify: boolean,

}
