import {
  defaultThrottleLimits,
  throttleAcMap,
  throttleMatchingCtor,
} from '../config'
import { Filter } from '../model'

import {
  doThrottle,
  matchedSearchElm,
  retriveThrottleLimit,
} from './helper'


const ctors: string[] = throttleMatchingCtor.rptSearchBtn
const defaultLimit: number = defaultThrottleLimits.rptSearchBtn


/** 处理 RPT 搜索按钮 */
export const handleRptSearchBtn: Filter = ev => {
  const elm = matchedSearchElm(ev, ctors)
  if (! elm) {
    return false
  }
  // 以下为对匹配元素执行规则

  // 读取DOM元素 data-click-throttle-time 属性值作为限流时间
  const delta = retriveThrottleLimit(elm, defaultLimit)

  doThrottle(ev, throttleAcMap, elm, delta)

  return true
}
