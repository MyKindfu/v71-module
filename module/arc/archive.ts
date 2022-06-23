import { of, Observable } from 'rxjs'
import { concatMap, map, mapTo, take, tap } from 'rxjs/operators'

import {
  post,
  JsonType,
  UItoastr,
 } from '../shared/index'

import { initArcPkgInitOpts, initGetArcCodeOpts, UrlList } from './config'
import {
  ArcCodeInitOpts,
  ArcImgSaveOpts,
  ArcPkgContent,
  ArcPkgData,
  ArcPkgInitOpts,
  ArcPkgTypeSelectOptionData,
  GetArcCodeOpts,
} from './model'


/** 初始化档案袋 先根据参数获取档案袋code然后获取arccode */
export function initArcCombined(data: ArcCodeInitOpts): Observable<{arcCode: string, arcPkgContents: ArcPkgContent[]}> {
  const arcPkgInitOpts: ArcPkgInitOpts = {  // 第一步请求参数
    ...initArcPkgInitOpts,
    URL: data.URL,
    FLOWID: data.FLOWID,
  }

  const {
    arcCode,
    areaid,
    creater,
    descript,
    keyword,
    owners,
    title,
  } = data
  const getArcCodeOpts: GetArcCodeOpts = {  // 第二步请求参数
    ...initGetArcCodeOpts,
    arcCode,
    areaid,
    creater,
    descript,
    keyword,
    owners,
    title,
  }

  let init$ = of(getArcCodeOpts)
  if (!data.arcCode) {  // 首次获取arcCode, 先初始化档案袋 pkgCode
    // 初始化档案袋
    init$ = initArcPkg(arcPkgInitOpts).pipe(
      map(({ PKGKEYCODE }) => {
        getArcCodeOpts.arcCode = PKGKEYCODE // 以 PKGKEYCODE 作为临时 arcCode 去请求真正的 arcCode
        return getArcCodeOpts
      }),
    )
  }
  const ret$ = init$.pipe(
    concatMap(opts => {
      return getCodeByPkgCode(UrlList.getCode, opts) // 根据档案袋code获取arcCode
    }),
  )

  return ret$
}


/** 初始化档案袋 返回档案袋信息 （ 包括编号 PKGKEYCODE) */
export function initArcPkg(data: ArcPkgInitOpts): Observable<ArcPkgData> {
  const ret$ = post<ArcPkgData[]>(UrlList.initArcPkg, { data }).pipe(
    tap(res => {
      if (! res.dat || ! res.dat[0] || ! res.dat[0].PKGKEYCODE) {
        throw new Error('PKGKEYCODE 取值为空')
      }
    }),
    map(res => (<ArcPkgData[]> res.dat)[0]),
  )
  return ret$
}


/** 根据档案袋 pkgCode 获取 arcCode */
export function getCodeByPkgCode(url: string, data: GetArcCodeOpts) {
  // mugShotController/getCode.do
  return post<JsonType>(url, { data })
    .pipe(
      map(res => {
        const obj = {
          arcCode: '',
          arcPkgContents: <ArcPkgContent[]> [],
        }
        if (res && res.dat && (res.dat.arcCode || res.dat.OUT_ARCCODE)) {
          obj.arcCode = <string> (res.dat.arcCode ? res.dat.arcCode : res.dat.OUT_ARCCODE)
        }
        if (res && res.dat && res.dat.content) {
          obj.arcPkgContents = <ArcPkgContent[]> res.dat.content
        }

        return obj
      }),
      tap(({ arcCode }) => {
        if (! arcCode) {
          UItoastr({ type: 'warning', title: 'arcCode 取值为空' })
        }
      }),
    )
}


/** 发送图片 base64 到服务器 */
export function postArcImg(data: ArcImgSaveOpts, imgUrl: string): Observable<void> {
  // 发送 base64, 不包括 DATAURI sheme 头部
  const ret$ = post<void>(UrlList.postArcImg, {
    data: {
      pic: imgUrl.slice(imgUrl.indexOf('base64,') + 7),  // 'base64,'.length === 7
      json: JSON.stringify(data),
    },
  })
  .pipe(
    mapTo(void 0),
    take(1),
  )
  return ret$
}


/** 处理 getArcCode() 返回结果中 content 数据 */
export function genArcPkgOptionsFromArcCodeContent(content?: ArcPkgContent[]): ArcPkgTypeSelectOptionData[] {
  const ret: ArcPkgTypeSelectOptionData[] = []

  if (content && Array.isArray(content)) {
    for (let i = 0, len = content.length; i < len; i++) {
      const row = content[i]

      ret.push({
        id: row.ELEID,
        text: row.ELENAME,
      })
    }
  }

  return ret
}
