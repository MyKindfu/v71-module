import { ArcPkgInitOpts, GetArcCodeOpts } from './model'


export const enum UrlList {
  getArccodeByXM = 'previewController/getShareInfoByZJHMEleID.do',
  getArcImg = 'previewController/getThumbnailBig.do',
  getCode = 'mugShotController/getCode.do',
  getHouseImgByXM = 'previewController/getImgByXMZJHM.do',
  initArcPkg = 'previewController/getPkgByKeyCode.do',
  postArcImg = 'mugShotController/saveFile.do',
  saveToDaPackage = 'previewController/saveToDaPackage.do',
}


/** 第一步请求参数 */
export const initArcPkgInitOpts: ArcPkgInitOpts = {
  URL: '',
  FLOWID: 0,
}
/** 第二步请求参数 */
export const initGetArcCodeOpts: GetArcCodeOpts = {
  arcCode: '',
  areaid: 0,
  creater: '',
  descript: '',
  keyword: '个人资料拍照',
  owners: '个人资料拍照',
  title: '个人资料拍照',
}
