import { RxCam, SnapOpts, StreamIdx } from 'rxcam'
import { Subject } from 'rxjs'

import { ArcPkgTypeSelectOptionData, ExternalInfo, ImgFileInfo } from '../arc/index'

export {
  ArcPkgTypeSelectOptionData,
}

// export interface ArcConfigs {
//   arcCode: string
//   dialogCtx: HTMLDivElement // 档案采集模态框容器
//   /** 当前登录用户 */
//   userName: string
//   uiOpts: UIOpts
// }

// 摄像头序列号对应的旋转角度. 用于切换摄像头后更新旋转按钮选中
export type CamsRotateMap = Map<StreamIdx, number>

export const enum ACTIONS {
  noneAvailable = 'n/a',
  error = 'error',
  initial = 'initial',
  camReady = 'camReady',
  camdlgClosed = 'camdlgClosed',
  camdlgRestored = 'camdlgRestored',
  closeCamdlg = 'closeCamdlg',
  checkImg = 'checkImg',
  fetchArcCode = 'fetchArcCode',
  fetchArcCodeSucc = 'fetchArcCodeSucc',
  fetchArcCodeFail = 'fetchArcCodeFail',
  getOldArccodeFail = 'getOldArccodeFail',
  getImgNull = 'getImgNull',
  houseRource = 'houseRource',
  latexShareInit = 'latexShareInit',
  localRource = 'localRource',
  openSelectLocalFile = 'openSelectLocalFile',
  pkgSelectChanged = 'pkgSelectChanged',
  readIDCard = 'readIDCard',
  /** 标准认证库 */
  critertionLib = 'critertionLib',
  /** 配偶房管局图片查询 */
  spouseQuery = 'spouseQuery',
  /** 共有人本地来源 */
  spoLocalQuery = 'spoLocalQuery',
  switchCam = 'switchCam',
  switchCamSucc = 'switchCamSucc',
  switchCamFail = 'switchCamFail',
  shareEve = 'shareEve',
  shareRource = 'shareRource',
  shareSave = 'shareSave',
  /** 共享本地填充本人信息 */
  shareFillSelf = 'shareFillSelf',
  toggleCam = 'toggleCam',
  toggleRotate = 'toggleRotate',
  /** 高拍仪采集 */
  takePhoto = 'takePhoto',
  takePhotoSucc = 'takePhotoSucc',
  takePhotoFail = 'takePhotoFail',
  /** 读取二代证，合成二代证图片 */
  takeIdcImg = 'takeIdcImg',
  takeIdcImgSucc = 'takeIdcImgSucc',
  takeIdcImgFail = 'takeIdcImgFail',
  /** 公共扫描 */
  commonScanInit = 'commonScanInit',
  commonScanSave = 'commonScanSave',

  savePhoto = 'savePhoto',
  savePhotoSucc = 'savePhotoSucc',
  savePhotoFail = 'savePhotoFail',
  test = 'test',

}

export interface ArcEvent {
  action: ACTIONS
  payload: {
    /** 当前登录用户 */
    userName: string
    /** 采集类型下拉选项选中项 */
    arcTypeSelectedData: ArcPkgTypeSelectOptionData
    constraints?: MediaStreamConstraints
    err?: any,
    sidx?: number
    sym?: symbol
    rotate?: number // 采集旋转角度
    imgInfo?: ImgFileInfo
    externalInfo?: ExternalInfo,
    [prop: string]: any,
  }
}

/** UI 按钮选择器 */
export interface UIOpts {
  /** 采集类型下拉选择器 */
  arcPkgTypeSelctor: string
  /** LABEL选择按钮元素选择器 */
  btnGrorpSelector: string
  /** 主副摄像头选择按钮选择器 */
  camSidxSelecotr: string
  /* 摄像头对应切换按钮的包裹容器选择器 */
  camSelectLabelsSelector: string
  /** 模态框关闭按钮选择器 */
  closeBtnSelector: string
  /** 采集模态框左侧 */
  arcCaptureLeftSelecotr: string
  /** 采集模态框右侧 */
  arcCaptureRightSelecotr: string
  /** input[type=file] 元素选择器 */
  fileInputSelector: string
  /** 采集旋转角度label按钮 */
  labelRotateSelector: string
  /** 选择本地图片文件上传按钮选择器 */
  selectLocalFileSelector: string
  /** 采集结果预览图片选择器 */
  snapRetSelector: string
  /** 采集按钮选择器 */
  takePhotoSelector: string
  /** 切换下一个摄像头按钮选择器 */
  toggleCamBtnSelector: string
  /** 采集保存结果统计信息 */
  uploadMemoSelector: string
  /** 共享预览选择器 */
  latexShareSelector: string
  /** 共享功能容器 */
  shareContainerSelector: string
  /** 共享图片预览容器 */
  shareImgBoxSelector: string
  /** 选择批量上传的图片 */
  checkImgSelector: string
  /** 标准证照库 */
  critertionLibSelector: string
  /** 本地配偶信息读取身份证 */
  readIDCard: string
  /** 拍摄视频容器 */
  rxcamContainer: string,
  /** 共享图片来源 */
  shareRourceSelector: string
  /** 共享窗口关闭 */
  shareCloseSelector: string
  /** 共享图保存 */
  shareSaveSelector: string
  /** 共享按钮组 */
  shareBtnGroupSelector: string
  /** 共享填充本人信息 */
  shareFillSelfSelector: string
  /** 全选 */
  shareCheckSquare: string
  /** 配偶房管局图片查询 */
  shareSpouseSelector: string
  /** 带档案的历史提取 */
  drawHisSelector: string
  /** 共享查询条件-年度 */
  shareQuerySelector: string
  /** 本地来源配偶图片 */
  shareSpoLocalSelector: string
  /** 共享-共有人容器选择器 */
  shareGyrBoxSelector: string
  /** 共享-本地容器选择器 */
  shareLocalBoxSelector: string
  /** 二代证采集合成按钮选择器 */
  idcCompositeSelector: string

  /** 公共扫描按钮选择器 */
  commonScanSelector: string
  /** 公共扫描功能容器选择器 */
  commonScanContainerSelector: string
  /** 公共扫描功能预览图片容器选择器 */
  commonScanImgBoxSelector: string
  /** 公共扫描窗口关闭选择器 */
  commonScanCloseSelector: string
  /** 公共扫描图保存 */
  commonScanSaveSelector: string
  /** 公共扫描图全选 */
  commonScanCheckSquare: string
  /** 公共扫描图左旋转90度 */
  commonScanRotateL90Selector: string
  /** 公共扫描图右旋转90度 */
  commonScanRotateR90Selector: string
  /** 公共扫描按钮组 */
  commonScanBtnGroupSelector: string
  /** 选择公共扫描图片 */
  checkCommonScanImgSelector: string

}


/* 采集类型下拉选项数据 */
// export interface ArcPkgTypeSelectOptionData {
//   id: string | number
//   text: string
// }

export interface HandleCombinedEventOpts {
  arcCode: string
  dialogCtx: HTMLDivElement
  uiOpts: UIOpts
  ev: ArcEvent
  eventSubject: Subject<ArcEvent>
  initialArcEvent: ArcEvent
  userName: string
}

export interface HandleEventSubjectOpts {
  arcCode: string
  dialogCtx: HTMLDivElement
  uiOpts: UIOpts
  ev: ArcEvent
  userName: string
  rxCam: RxCam | null
}

export interface HandleCaptureOpts {
  arcCode: string
  dialogCtx: HTMLDivElement
  uiOpts: UIOpts
  userName: string
  rxCam: RxCam | null
  snapOpts: Partial<SnapOpts>
}

export interface ClipConfig {
  width: number
  height: number
  clipX?: number
  clipY?: number
}
