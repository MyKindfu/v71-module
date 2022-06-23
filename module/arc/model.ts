export interface ArcPkgContent {
  ELECODE: string
  ELEID: number
  ELENAME: string
  PKGKEYCODE: string
  PKGNAME: string
  TITLE: string
  [prop: string]: string | number
}


/* 采集类型下拉选项数据 */
export interface ArcPkgTypeSelectOptionData {
  id: string | number
  text: string
}

/** getArccodeByXM返回的数据 */
export interface HisDrawDataArray {
  ARCID: string
  ARCCODE: string
  CALLURL: string
  SYDATE: string
  YHMC: string
  ZJHM: string
  ELEID: number
  [prop: string]: string | number
}
/** 历史提取下拉选项数据 */
export interface HisDrawSelectOptionData {
  id: string
  text: string
}

/** 第一步 获取初始 arccode 接口提交参数 */
export interface ArcPkgInitOpts {
  URL: string
  FLOWID: number
  D?: object
}
/** 第二步 根据pkgcode/arcCode 获取 arcCode 及档案采集下拉信息 */
export interface GetArcCodeOpts {
  arcCode: string
  areaid: number
  creater: string
  descript: string
  keyword: string
  owners: string
  title: string
}
/** arcCode 若空，发起两步请求，非空则仅第二步请求 */
export interface ArcCodeInitOpts extends ArcPkgInitOpts, GetArcCodeOpts { }

export interface ArcPkgData {
  CLSID: string // '2009'
  FLOWID: string  // "0"
  ITEMID: string  // '2'
  PKGCODE: string // 'GRZHSL'
  PKGDESCRIPT: string | null
  PKGID: string // '68'
  PKGKEYCODE: string  // '2.2009.0'
  PKGNAME: string // '个人开户登记'
}

export interface ArcImgSaveOpts {
  arcCode: string
  creater: string
  ELEID: number
}


/** 图片文件信息 */
export interface ImgFileInfo {
  name: string
  size: number  // url的长度
  url: string
  [key: string]: any
}
export interface ExternalInfo {
  USERTYPE: number
  YHMC: string
  YHBM: string
}

export interface PrevImgOpts {
  ArcCode: string
  EleId: number
}

/** 职工档案编码 */
export interface IdentOpsts {
  YHMC: string
  ZJHM: string
  CXND: string
  ELEID: number
}

export interface HouseOpts {
  XINGMING: string
  ZJHM: string
  // 后台未使用该字段
  // XMZJHM: number
  HTBAH: string
  QZH: string
}

/** 获取标准证照库接口参数 */
export interface CritertLibOpts {
  ARCCODE: string
  USERTYPE: number
  YHMC: string
  YHBM: string
}
/** 证照标准后的返回数据 */
export interface ImgMemoData {
  ELEID: number
  NUM: number
}

/** 剪裁比例 */
export interface ClipRate {
  clipLeft: number
  clipTop: number
  clipRight: number
  clipBottom: number
}

/** 剪裁后画图参数 */
export interface DrawImgArg {
  drawLeft: number
  drawTop: number
  drawWidth: number
  drawheight: number
}
