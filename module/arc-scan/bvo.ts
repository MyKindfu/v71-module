import { EncodedText, Filename, OcrRetObject } from 'bank-voucher-ocr'
import { from as ofrom, of, timer, EMPTY, Observable } from 'rxjs'
import {
  catchError,
  concatMap,
  delay,
  map,
  mergeMap,
  retry,
  tap,
} from 'rxjs/operators'

import { get, post, readLocalImgBase64 } from '../shared/index'
import { UItoastr } from '../shared/uitoastr/index'

import { UrlList } from './config'
import { DistinguishRow, OcrRetObjectExt, QueryOcrMatchRetRow } from './model'


/** 启动远程 OCR 服务 */
export function startOcrService() {
  // const url = bvoUrlPrefix + '/restart'
  const url = UrlList.startOcrService
  return get(url).pipe(
    map(res => {
      if (res.err) {
        UItoastr({ type: 'error', title: '凭证图片OCR服务启动失败', msg: res.msg ? res.msg : '' })
        throw new Error('启动OCR服务失败')
      }
      return res
    }),
    delay(2000),
    retry(3),
  )
}

// 持续检查sc-service服务ocr处理图片操作，直到处理结束返回 Observable<true>
export function intvGetOcrRet(): Observable<Map<Filename, OcrRetObject>> {
  // UItoastr({
  //   type: 'info',
  //   title: '凭证图片处理中，请等待……',
  //   className: 'ocr-info',
  //   onlyOne: true,
  // })
  // const url = bvoUrlPrefix + '/result'
  const url = UrlList.queryOcrResult
  const intv$ = timer(30000, 15 * 1000)

  const ret$ = intv$.pipe(
    tap(() => {
      UItoastr({
        type: 'info',
        title: '获取凭证图片处理结果',
        className: 'ocr-info',
        onlyOne: true,
      })
    }),
    concatMap(() => get(url)),
    map(data => {
      const dat = data.dat
      const ret = <Map<Filename, OcrRetObject>> new Map()

      if (dat && Array.isArray(dat)) {
        for (const row of dat) {
          row.filename && ret.set(row.filename, row)
        }
      }

      console.info('bvo ret', ret)
      return ret
    }),

  )

  return ret$
}


/** 根据图片 path 读取图片 base64 */
export function readOcrRetImg(path: string): Observable<EncodedText> {
  // const url = UrlList.readOcrRetImg
  // const data = { file: path }

  // return post(url, { data }).pipe(
  //   map(res => {
  //     if (res.err) {
  //       return ''
  //     }
  //     return res.dat ? res.dat : ''
  //   }),
  // )
  return readLocalImgBase64(path)
}


/**
 * 检查sc-service服务ocr 扫描文件变动监听状态 true: 监听中
 * https://127.0.0.1:7701/bvo/start  开启监听
 * https://127.0.0.1:7701/bvo/stop  停止监听
 * https://127.0.0.1:7701/bvo/restart  停止监听并重置扫描结果
 */
export function isOcrWatching(): Observable<boolean> {
  // const url = bvoUrlPrefix + '/isrunning'
  const url = UrlList.isOcrWatching
  return get(url).pipe(
    map(data => !!data.dat),
  )
}


/** 删除远程 OCR 识别结果图片 */
export function unlinkOcrImg(paths: string[]) {
  // const url = bvoUrlPrefix + '/unlink'
  const url = UrlList.unlinkOcrImg
  const ret$ = get(url, {
    data: {
      files: paths,
    },
  })

  return ret$
}

// 删除Ocr服务端扫描记录
export function deleteOcrRetRow(filename: Filename) {
  const url = UrlList.unlinkOcrImg
  return get(url, {
    data: {
      files: [filename],
    },
  }).pipe(
    map(res => {
      if (res.err) {
        throw new Error('删除Ocr结果记录失败' + res.msg)
      }
      return res
    }),
    delay(1000),
    retry(1),
    map(res => {
      return res.err ? false : true
    }),
    catchError(err => {
      console.error(err)
      return of(true)
    }),
  )
}

/** 仅校验流水号差异度 相差不大的视为匹配 */
export function distinguishSingleId(
  data: QueryOcrMatchRetRow[],
  srcMap: Map<number, OcrRetObjectExt>,
): Observable<QueryOcrMatchRetRow | void> {

  if (! data || ! data.length) {
    return EMPTY
  }
  // // tslint:disable-next-line
  // debugger

  // const url = bvoUrlPrefix + '/distinguish_single_id'
  const url = UrlList.distinguishSingleId

  return ofrom(data).pipe(
    mergeMap(row => {
      const srcRow = srcMap.get(+row.ID)

      if (! srcRow) {
        return EMPTY
      }
      const drow: DistinguishRow = { ...row, ocrSn: srcRow.sn }
      const req$ = get(url, {
        data: drow,
      })

      return req$.pipe(
        map(res => {
          if (!res.err && res.dat) {
            return <QueryOcrMatchRetRow> res.dat
          }
        }),
        catchError(err => {
          return of(void 0)
        }),
      )
    }, 3),
  )
}

/** 多条匹配记录筛选 */
export function distinguishMultiId(
  data: QueryOcrMatchRetRow[],
  srcMap: Map<number, OcrRetObjectExt>,
): Observable<QueryOcrMatchRetRow | void> {

  if (! data || ! data.length) {
    return EMPTY
  }
  // // tslint:disable-next-line
  // debugger

  // const url = bvoUrlPrefix + '/distinguish_multi_id'
  const url = UrlList.distinguishMultiId
  const drows = <DistinguishRow[]> []

  for (const row of data) {
    const srcRow = srcMap.get(+row.ID)
    if (srcRow) {
      const drow: DistinguishRow = { ...row, ocrSn: srcRow.sn }
      drows.push(drow)
    }
  }
  const req$ = post(url, {
    data: {
      rows: drows,
    },
  })

  return req$.pipe(
    mergeMap(res => {
      if (!res.err && res.dat) {
        return ofrom(<QueryOcrMatchRetRow[]> res.dat)
      }
      return EMPTY
    }),
    catchError(err => {
      return of(void 0)
    }),
  )
}
