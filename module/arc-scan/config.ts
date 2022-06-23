import { Filename } from 'bank-voucher-ocr'
import { Scanner } from 'kodak-scanner'
import { Subject } from 'rxjs'


import {
  ArcConfigs,
  ArcEvent,
  UIOpts,
 } from './model'

export const subject = new Subject<ArcEvent>()

export const scannerInstMap = new Map<symbol, Scanner>()


export const initialUIOpts: UIOpts = {
  arcPkgTypeSelctor: 'select.pkg-type-list',  // 采集类型下拉选择器
  btnGrorpSelector: 'input[type=checkbox], input[type=radio]',  // LABEL选择按钮元素选择器
  btnScanSelector: '.start-scan', // 开始扫描按钮
  closeBtnSelector: '.close,.btn-close-modal',   // 模态框关闭按钮选择器
  failResultUlSelector: '.fail-result-ul',
  fileInputSelector: '.file-input',  // input[type=file] 元素选择器
  selectLocalFileSelector: '.select-local-file',  // 选择本地图片文件上传按钮选择器
  snapRetSelector: 'img.snap-ret',   // 采集结果预览图片选择器
  succSavedImgCountSelector: '.succ-saved-img-count',
  failedImgCountSelector: '.failed-img-count', // 匹配失败图片数量选择器 span
  scannedPageCountSelector: '.scanned-page-count',  // （本次）批量扫描页面数量选择器 span
  uploadMemoSelector: '.upload-memo-list',  // 采集保存结果统计信息
  scanStatusContent: '.scan-status-content', // 模态框 显示高扫进度内容选择器ul
}

export const initialArcConfigs: ArcConfigs = {
  arcCode: '',
  dialogCtx: <HTMLDivElement> document.querySelector('div'),
  uiOpts: { ...initialUIOpts },
}

export const succFilepathSet = <Set<string>> new Set()  // 档案保存成功
export const failImgMap = <Map<Filename, string>> new Map()  // 档案保存失败 <filename, filepath>
export const processingImgSet = <Set<Filename>> new Set() // 处理中

// export const bvoUrlPrefix = '//127.0.0.1:7701/bvo'
// export const bvsUrlPrefix = '//127.0.0.1:7701/bvs'

// export const hostList = {
//   ocr: 'https://127.0.0.1:7702/',
// }

export const enum UrlList {
  combineSaveScanImg = 'mugShotController/saveYhjsxxFile.do',
  /** 初始化BVS环境 清理临时文件 */
  bvsInitSplit = '//127.0.0.1:7701/bvs/init',
  /** 调用BVS接口开始切分图片 */
  bvsStartSplit = '//127.0.0.1:7701/bvs/run',
  /** 检查 BVS 切分进程 */
  bvsIsSplitProcessComplete = '//127.0.0.1:7701/bvs/isrunning',
  /** 获取页面扫描切分凭证图片结果数组 */
  bvsReadSplitRet = '//127.0.0.1:7701/bvs/result',

  /** 启动远程 OCR 服务 */
  startOcrService = '//127.0.0.1:7701/bvo/restart',
  /** 查询远程 OCR 服务执行结果 */
  queryOcrResult = '//127.0.0.1:7701/bvo/result',
  /** 根据图片 path 读取图片 base64 */
  readOcrRetImg = '//127.0.0.1:7701/bvo/readimg',
  /** 检查sc-service服务ocr 扫描文件变动监听状态 true: 监听中 */
  isOcrWatching = '//127.0.0.1:7701/bvo/isrunning',
  /** 删除远程 OCR 识别结果图片 */
  unlinkOcrImg = '//127.0.0.1:7701/bvo/unlink',
  /** 仅校验流水号差异度 相差不大的视为匹配 */
  distinguishSingleId = '//127.0.0.1:7701/bvo/distinguish_single_id',
  /** 多条匹配记录筛选 */
  distinguishMultiId = '//127.0.0.1:7701/bvo/distinguish_multi_id',
}

