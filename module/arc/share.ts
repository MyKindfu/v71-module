import { of, Observable } from 'rxjs'
import { filter, map, mapTo, tap } from 'rxjs/operators'

import { ArcEvent, UIOpts } from '../arc-snap/model'
import { updateImgMemoBatch } from '../arc-snap/ui'
import { post, JsonType } from '../shared/ajax/index'
import { UItoastr } from '../shared/index'

import { UrlList } from './config'
import { CritertLibOpts, HisDrawDataArray, HouseOpts, IdentOpsts, ImgMemoData, PrevImgOpts } from './model'


/** 获取指定职工的档案编码 */
export function getArccodeByXM(data: IdentOpsts): Observable<HisDrawDataArray[]> {
  const year = data.CXND || '所有'
  // @ts-ignore
  App.blockUI({ boxed: true, message: '正在获取' + year + '年度[' + data.YHMC + ']的提取档案' })
  // const url = 'previewController/getShareInfoByZJHMEleID.do'
  const ret$ = post(UrlList.getArccodeByXM, { data }, { notify: false })
    .pipe(
      tap(() => {
        // @ts-ignore
        App.unblockUI()
      }),
      tap(res => {
        if (res.msg) {
          throw new Error(res.msg)
        }
        else if (!res.dat || !res.dat.length) {
          throw new Error('')
        }

      }),
      map(res => <HisDrawDataArray[]> res.dat),

    )
  return ret$
}


/** 根据 EleId 和 ArcCode 获取图片 */
export function getArcImg(data: PrevImgOpts): Observable<JsonType[]> {
  // @ts-ignore
  App.blockUI({ boxed: true, message: '正在展示图片信息' })
  // const url = 'previewController/getThumbnailBig.do'
  return post(
    UrlList.getArcImg,
    {
      data: {
        P_JSON: JSON.stringify(data),
      },
    },
    { notify: false },
  )
    .pipe(
      tap(() => {
        // @ts-ignore
        App.unblockUI()
      }),
      tap(res => {
        if (!res.dat || res.msg) {
          throw new Error(res.msg ? res.msg : '元素下无照片')
        }
      }),
      map(res => JSON.parse(res.dat)),
      tap(row => {
        if (row.errorCode !== '00000' || row.errorInfo !== '交易成功') {
          const msg = '代码：' + (row.errorInfo ? row.errorInfo : '未知')
          throw new Error(msg)
        }

        if (!row.content || !row.content.length) { // 该元素下没有照片
          const msg = '元素下无照片'
          throw new Error(msg)
        }
      }),
      map(row => <JsonType[]> row.content),
    )
}


/** 房管局图片来源 */
export function getHouseImgByXM(data: HouseOpts): Observable<JsonType[]> {
  // const url = 'previewController/getImgByXMZJHM.do'
  return post(UrlList.getHouseImgByXM, { data })
    .pipe(
      tap(res => {
        if (!res.dat || !res.dat.length) {
          throw new Error('获取结果空')
        }
        else if (res.msg) {
          throw new Error(res.msg)
        }
      }),
      map(res => <JsonType[]> res.dat),
    )
}

/** 根据用户信息获取标准档案到档案袋 */
export function saveToDaPackage(data: CritertLibOpts): Observable<JsonType[]> {
  // const url = 'previewController/saveToDaPackage.do'
  return post(UrlList.saveToDaPackage, { data })
    .pipe(
      tap(res => {
        if (res.msg) {
          UItoastr({
            type: 'warning',
            title: res.msg,
            msg: '',
            onlyOne: true,
            timeOut: 2000,
          })
        }
      }),
      filter(res => {
        if (res.msg) {
          return false
        }
        else {
          return true
        }
      }),
      map(res => <JsonType[]> res.dat),

    )
}

/** 处理标准档案证照 */
export function dealWithCritEvent(
  arcEvent: ArcEvent,
  arcCode: string,
  dialogCtx: HTMLDivElement,
  uiOpts: UIOpts,
  criterTag: boolean,
): Observable<string> {
  if (!criterTag) {
    return of(arcCode)
  }
  const extInfo = arcEvent.payload.externalInfo
  if (typeof extInfo === 'undefined' || !Object.keys(extInfo).length) {
    UItoastr({
      type: 'warning',
      title: '未配置单位/个人用户信息',
      msg: '',
      onlyOne: true,
      className: 'fetch-arc-code',
      timeOut: 2000,
    })
    return of(arcCode)
  }

  const arc = { ARCCODE: arcCode }
  const data = { ...arc, ...extInfo }

  return saveToDaPackage(data).pipe(
    tap(dat => {
      if (!dat.length) {
        // UItoastr({ type: 'warning', title: '无标准证照档案', onlyOne: true })
        return
      }
      else {
        const ret: ImgMemoData[] = []
        const tip: string [] = []
        for (const ele of dat) {
          ret.push({
            ELEID: <number> ele.ELEID,
            NUM: <number> ele.NUM,
          })
          tip.push(<string> ele.ELENAME)
        }
        updateImgMemoBatch(dialogCtx, uiOpts, ret)
        UItoastr({
          type: 'success',
          title: '',
          msg: `[${tip.join(',')}]已标准证照成功`,
          onlyOne: true,
          className: 'fetch-arc-code',
          timeOut: 2000,
        })
      }
    }),
    mapTo(arcCode),
  )

}


