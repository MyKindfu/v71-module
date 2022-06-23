
/**
 * 事件处理函数
 * @returns 是否有匹配元素且处理过
 */
export type Filter = (ev: MouseEvent) => boolean

export type ThrottleElm = HTMLButtonElement | HTMLLinkElement

export interface ElmAccessState {
  date: Date
  oriDisabledValue: boolean
}

export type ThrottleAcMapModel = WeakMap<HTMLElement, ElmAccessState>

/** Click 节流元素类型 */
export const enum ThrottleEntry {
  menuLink = '页面菜单',
  gridSearchBtn = 'Grid搜索按钮',
  rptSearchBtn = '报表搜索按钮',
}

/** Click 节流元素类型对应的限流时间阈值 */
export type ThrottleLimits = {
  [entry in keyof typeof ThrottleEntry]: number
}

/** Click 节流元素选择器 */
export type ThrottleMatchingCtor = {
  [entry in keyof typeof ThrottleEntry]: string[]
}
