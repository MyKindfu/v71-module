import { InitialOpts, RxCam } from 'rxcam'

import { CamsRotateMap, UIOpts } from './model'

// export const subject = new Subject<ArcEvent>()

// 摄像头序列号对应的旋转角度. 用于切换摄像头后更新旋转按钮选中
export const camsRotateMap: CamsRotateMap = new Map()

export const initialCamOpts: Partial<InitialOpts> = {
  ctx: <HTMLElement> document.querySelector('#my_camera'),
}

export const camInstMap = new Map<symbol, RxCam>()


export const initialUIOpts: UIOpts = {
  arcPkgTypeSelctor: 'select.pkg-type-list', // 采集类型下拉选择器
  btnGrorpSelector: 'input[type=checkbox], input[type=radio]',  // LABEL选择按钮元素选择器
  camSidxSelecotr: '.cam-sidx-radio',  // 摄像头序号对应选择按钮选择器
  arcCaptureLeftSelecotr: '.arc_capture_left',  // 采集模态框左侧
  arcCaptureRightSelecotr: '.arc_capture_right',  // 采集模态框右侧
  camSelectLabelsSelector: '.cam-select-labels',  // 摄像头对应切换按钮的包裹容器选择器
  closeBtnSelector: '.close,.btn-close-modal',   // 模态框关闭按钮选择器
  fileInputSelector: '.file-input',  // input[type=file] 元素选择器
  labelRotateSelector: 'label.img-rotation',    // 采集旋转角度label按钮
  selectLocalFileSelector: '.select-local-file',  // 选择本地图片文件上传按钮选择器
  snapRetSelector: 'img.snap-ret',   // 采集结果预览图片选择器
  takePhotoSelector: '.take-snapshot', // 采集按钮选择器 可能是label/i/span
  toggleCamBtnSelector: '.toggle-cam',  // 切换下一个摄像头按钮选择器
  uploadMemoSelector: '.upload-memo-list',  // 采集保存结果统计信息
  latexShareSelector: '.latex-share', // 共享预览选择器
  readIDCard : '.readIdCard', // 本地配偶信息读取身份证
  rxcamContainer: '.rxcam-canvas-container', // 拍摄视频容器
  shareContainerSelector: '#preview-container', // 共享功能容器选择器
  shareImgBoxSelector: '#preview-box', // 共享功能预览图片容器选择器
  shareGyrBoxSelector: '#gyr_box',  // 共享-共有人容器选择器
  shareLocalBoxSelector: '#local_box',  // 共享-本地来源容器选择器
  shareCloseSelector: '.share-close', // 共享窗口关闭选择器
  checkImgSelector: 'img.preview-img', // 选择批量上传的图片
  critertionLibSelector: '.critertion-lib', // 标准证照库
  shareRourceSelector: 'label.share-relation', // 共享图片来源
  shareSaveSelector : '.share-save', // 共享图保存
  shareCheckSquare : '.share-check-square', // 全选
  shareBtnGroupSelector: '.btn-share-group', // 共享按钮组
  shareFillSelfSelector:  '.fill-self-info',  // 共享本地,填充本人信息
  shareSpouseSelector : '.query-spouse', // 配偶房管局图片查询
  shareSpoLocalSelector : '.query-local-spouse', // 本地来源配偶图片
  drawHisSelector: '.history-draw-list', // 带档案的历史提取
  shareQuerySelector:  'select.history-draw-year', // 共享查询条件-年度
  idcCompositeSelector: '.take-idc-composite',
  commonScanSelector: '.common-scan', // 公共扫描按钮选择器
  commonScanContainerSelector: '#common-scan-container', // 公共扫描功能容器选择器
  commonScanImgBoxSelector: '#common-scan-box', // 公共扫描功能预览图片容器选择器
  commonScanCloseSelector: '.common-scan-close', // 公共扫描窗口关闭选择器
  commonScanSaveSelector : '.common-scan-save', // 公共扫描图保存
  commonScanCheckSquare : '.common-scan-check-square', // 公共扫描图全选
  commonScanRotateL90Selector : '.common-scan-rotatel90', // 公共扫描图片左旋转90度按钮
  commonScanRotateR90Selector : '.common-scan-rotater90', // 公共扫描图片右旋转90度按钮
  commonScanBtnGroupSelector: '.btn-common-scan-group', // 公共扫描按钮组
  checkCommonScanImgSelector: 'img.common-scan-img', // 选择公共扫描图片

}

// export const initialArcConfigs: ArcConfigs = {
//   arcCode: '',
//   userName: 'n/a',
//   dialogCtx: <HTMLDivElement> document.querySelector('div'),
//   uiOpts: { ...initialUIOpts },
// }

/** 空白占位图片base64 */
export const blankImgURL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAHoAwAALAAAAAABAAEAAAICRAEAOw=='
