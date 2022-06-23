/**
 * 指定模块打包整包输出
 * 编译执行命令 `npm run build`
 * 直接打包命令 `npm run rp`
 * 输出结果 <指定路径>bundle.umd.(min.)?js)
 * 导出模块名不能带有减号 -
 *
 * @author: waiting
 * @date: 2018/04/29
 */
import * as arcScan from './arc-scan/index'
import * as arcSnap from './arc-snap/index'
import * as arc from './arc/index'
import * as bjca from './bjca/index'
import * as clickEvent from './click-event/index'
import * as fp from './fp/index'
import * as idc from './idc/index'
import * as zkf from './zkfinger/index'

export {
  arc,
  arcScan,
  arcSnap,
  bjca,
  clickEvent,
  fp,
  idc,
  zkf,
}
