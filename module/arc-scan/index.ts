/**
 * 银行进账单档案扫描、匹配
 *
 * @author: waiting
 * @date: 2018/05/20
 */

export * from './arc-scan'
export * from './model'
export {
  queryOcrRetMatch,
} from './archive'
export {
  isOcrWatching,
} from './bvo'
export {
  initScanner,
  startScan,
} from './scan'
