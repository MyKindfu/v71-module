import { filters } from './config'
import * as cbs from './filter'


const activeFilters: typeof filters = []


export function bind(fnNames: typeof filters | void): void {
  activeFilters.length = 0

  if (fnNames && Array.isArray(fnNames) && fnNames.length) {
    fnNames.forEach(key => activeFilters.push(key))
  }
  else {
    filters.forEach(key => activeFilters.push(key))
  }

  document.addEventListener('click', click_event_cb, true)
  document.addEventListener('click', click_event_cb, false)
}

export function unbind(): void {
  document.removeEventListener('click', click_event_cb, true)
  document.removeEventListener('click', click_event_cb, false)
  activeFilters.length = 0
}


/**
 * Click 事件回调函数。在捕获及冒泡两个阶段都执行
 * 捕获阶段应为靠前时机，冒泡阶段应为最后时机
 */
function click_event_cb(ev: MouseEvent) {
  // console.info('tslib: phase', ev.eventPhase)
  // console.info(activeFilters, ev)

  if (! activeFilters || ! activeFilters.length) {
    return
  }

  for (const key of activeFilters) {
    const fn = cbs[key]
    if (typeof fn !== 'function') {
      continue
    }
    fn(ev)
  }
}
