import * as FilterFns from './filter'
import { ThrottleAcMapModel, ThrottleLimits, ThrottleMatchingCtor } from './model'


/** 设置有效的 Click 事件回调函数集合 */
export const filters: Array<keyof typeof FilterFns> = [
  'throttle',
]

/** 默认节流时间 */
export const defaultThrottleLimits: ThrottleLimits = {
  menuLink: 2000,
  gridSearchBtn: 500,
  rptSearchBtn: 2000,
}

/** 用于匹配目标按钮按钮的选择器数组 */
export const throttleMatchingCtor: ThrottleMatchingCtor = {
  menuLink: ['a.nav-link-leaf[data-mid]'],
  gridSearchBtn: ['button.btn-ext-search'],
  rptSearchBtn: ['button.btn-rpt-search'],
}


export const throttleAcMap: ThrottleAcMapModel = new WeakMap()
