import { Filename, OcrRetObject } from 'bank-voucher-ocr'

import {
  ImgFileInfo,
 } from '../arc/index'
import {
  AjaxResp,
 } from '../shared/ajax/model'

export interface ArcConfigs {
  arcCode: string
  dialogCtx: HTMLDivElement // 档案采集模态框容器
  uiOpts: UIOpts
}


export const enum Actions {
  noneAvailable = 'n/a',
  error = 'error',
  exception = 'exception',
  initial = 'initial',
  scannerReady = 'scannerReady',
  dlgClosed = 'dlgClosed',
  dlgRestored = 'dlgRestored',
  closeDlg = 'closeDlg',
  fetchArcCode = 'fetchArcCode',
  fetchArcCodeSucc = 'fetchArcCodeSucc',
  fetchArcCodeFail = 'fetchArcCodeFail',
  openSelectLocalFile = 'openSelectLocalFile',
  scan = 'scan',
  scanSucc = 'scanSucc',
  scanFail = 'scanFail',
  savePhoto = 'savePhoto',
  savePhotoSucc = 'savePhotoSucc',
  savePhotoFail = 'savePhotoFail',
  test = 'test',
}

export interface ArcEvent {
  action: Actions
  err?: Error
  msg?: string  // for error or exception
  payload: {
    arcTypeSelectedData?: ArcPkgTypeSelectOptionData
    constraints?: MediaStreamConstraints
    err?: any,
    fileList?: string[], // 扫描结果 图片路径数组
    sidx?: number
    sym?: symbol
    rotate?: number // 采集旋转角度
    imgInfo?: ImgFileInfo
    [prop: string]: any,
  }
}

export interface UIOpts {
  /** 采集类型下拉选择器 */
  arcPkgTypeSelctor: string
  /** LABEL选择按钮元素选择器 */
  btnGrorpSelector: string
  /** 开始扫描选择器 */
  btnScanSelector: string
  /** 模态框关闭按钮选择器 */
  closeBtnSelector: string
  /** UL 显示失败图片地址 */
  failResultUlSelector: string
  /** input[type=file] 元素选择器 */
  fileInputSelector: string
  /** 选择本地图片文件上传按钮选择器 */
  selectLocalFileSelector: string
  /** 采集结果预览图片选择器 */
  snapRetSelector: string
  /** 成功匹配保存档案图片计数选择器 span */
  succSavedImgCountSelector: string
  /** 失败匹配图片计数选择器 span */
  failedImgCountSelector: string
  /** （本次）批量扫描页面数量选择器 span */
  scannedPageCountSelector: string
  /** 采集保存结果统计信息 */
  uploadMemoSelector: string
  /** 大银行下拉 */
  // bankRegIdSelectSelector: string
  /** 模态框 显示高扫进度内容选择器ul */
  scanStatusContent: string
}

// 采集类型下拉选项数据
export interface ArcPkgTypeSelectOptionData {
  id: string | number
  text: string
}


// ca_bank_settlement.js ELEID==337
/** 银行结算信息管理 由后台自动获取pkgCode生成arcCode */
export interface ArcScanImgCombineSaveOpts {
  creater: string
  pic: string  // 图片 base64
  dzdid: number // 对账单ID
}


export interface QueryOcrMatchRet extends AjaxResp {
  dat?: QueryOcrMatchRetRow[]
}

export interface QueryOcrMatchRetRow {
  filename: Filename, // 合并生成
  filepath: string, // 合并生成
  // 以下为服务端匹配返回结果
  BANKREGID: string // "2"
  DZDID: string  // "52043"
  FSE: string  // "29009.81"
  ID: string  // "3"
  JZRQ: string  // "20180521"
  SERIALNO: string  // "0.29926302296120033"
  YHJSLSH: string // "5100017080NDPPQV2L2"
  PAYACCNO: string  // 付款账号
  DESACCNO: string // 收款账号
}
// 当一条ocr提取记录有多条对账单记录匹配时发送到sc-service进行相似度匹配检查的数据结构
export interface DistinguishRow extends QueryOcrMatchRetRow {
  ocrSn: string // ocr 识别的流水号，匹配对应字段名为 YHJSLSH
}

export interface OcrRetObjectExt extends OcrRetObject {
  id: string
  bankName: string  // 保存原bank值，原bank改为保存bankRegId值
}

/** 保存凭证图片需要的参数值 */
export interface ImgPostParams {
  creater: string
  /** 批次流水号 */
  hslsh: string
  /** 大银行bankRegId */
  bankid: number
  /** 账户id */
  bankaccid: string
  /** 开始日期 YYYY-MM-DD */
  begindate: string
  /** 结束日期 YYYY-MM-DD */
  enddate: string
  /** 图片base64 */
  pic: string
  /** 扫描序号 */
  scaninx: number
  /** 保存地址 */
  url: string
}

export enum BankRegId {
  /** 工行 */
  icbc = 1,
  /** 建行 */
  ccb = 2,
  /** 农行 */
  abc = 3,
  /** 中行 */
  boc = 4,
  /** 交行 */
  bocm = 5,
  /** 招行 */
  cmb = 7,
  /** 自贡 */
  zigong = 10,
}
