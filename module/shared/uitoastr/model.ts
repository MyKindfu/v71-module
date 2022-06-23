
export interface UItoastrOpts {
  title: string
  msg: string
  type: 'success' | 'info' | 'warning' | 'error'
  /** 显示关闭按钮 */
  closeButton: boolean,
  debug: boolean,
  /** Bottom Right|Bottom Left|Top Left|Top Center|Bottom Center|Top Full Width|Bottom Full Width */
  positionClass: 'toast-top-right',
  /** 提示显示时长 */
  showDuration: number,
  hideDuration: number,
  timeOut: number,
  extendedTimeOut: number,
  showEasing: 'swing',
  hideEasing: 'linear',
  showMethod: 'fadeIn',
  hideMethod: 'fadeOut',
  onclick: (() => void) | null,
  className: string,
  closeDuration: number,
  /** 相同className类名只打开一个 重复调用时前关闭已打开的 */
  onlyOne: boolean,
  /** 是否显示信息之前清除已有的所有提示 */
  clear: boolean,
}
