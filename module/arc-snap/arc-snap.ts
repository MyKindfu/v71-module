/**
 * 档案采集、上传
 *
 * @author: waiting
 * @date: 2018/04/10
 */
import { error } from '@waiting/log'
import { InitialOpts, RxCam } from 'rxcam'
import { merge, of, Observable, Subject, Subscription } from 'rxjs'
import {
  catchError,
  concatMap,
  filter,
  map,
  mapTo,
  mergeMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators'

import {
  dealWithCritEvent,
  ArcCodeInitOpts,
  ArcImgSaveOpts,
  HouseOpts,
} from '../arc/index'
import { ExternalInfo, HisDrawSelectOptionData } from '../arc/model'
import { readBase } from '../idc/index'
import { UItoastr } from '../shared/index'

import {
  handleFiles,
  initArcCode,
  saveArcImg,
  showHouseImgByXM,
} from './archive'
import { getClipBoxArg, handleClip, initClipContainer, saveLocalStorage } from './clip'
import {
  checkCommonScanImg,
  checkSquareCommonScanImg,
  commonScanCancel,
  openCommonScan,
  rotateImgCommonScan,
  saveCommonScan,
} from './common-scan'
import {
  initialUIOpts,
} from './config'
import {
  bindArcPkgTypeChangeEvent,
  bindClickEvent,
  bindFileInputEvent,
  bindKeyboardEvent,
  eventFilter,
  handleCapture,
  handleCombinedEvent,
  handleEventSubject,
  handleEventSwitchCam,
} from './event'
import {
  ArcEvent,
  ArcPkgTypeSelectOptionData,
  ACTIONS,
  ClipConfig,
  UIOpts,
} from './model'
import { checkPreviewImg, checkSquareImg, fillIdcard, selectShareRource, shareClose } from './share'
import {
  getLastCamRotateValue, initRxCam, updateCamRotateValue,
} from './snapshot'
import {
  getCurStreamIdx,
  initUI,
  setCritertionLibToggle,
  setElmsValidState,
  showImg,
  triggerFileInput,
  updateCamRotateMap,
  updateCamSelectLabelActive,
} from './ui'


export class ArcSnap {
  /** （缓存的）最近获取的 arcCode 值 */
  arcCode: string
  rxCam: RxCam | null
  /** （全局）采集模态框DOM对象 */
  dialogCtx: HTMLDivElement
  userName: string
  initCamOpts: InitialOpts
  clipConfig: ClipConfig
  uiOpts: UIOpts

  /** 模态框内点击事件流 */
  click$: Observable<MouseEvent>
  /** 模态框内keyup事件流 */
  keyboard$: Observable<KeyboardEvent>
  /** 模态框内采集类型下拉变化事件流 */
  selectedData$: Observable<ArcPkgTypeSelectOptionData | HisDrawSelectOptionData>
  /** 模态框内上传本地图片事件流 */
  file$: Observable<FileList>
  /** 供外部/内部发送消息的 Subject */
  eventSubject: Subject<ArcEvent>

  private fileSub: Subscription | null
  private selectedDataSub: Subscription | null
  private combinedSub: Subscription | null
  private initialArcEvent: ArcEvent

  constructor(
    ctx: HTMLDivElement,
    userName: string,
    initCamOpts: InitialOpts,
    clipConfig: ClipConfig,
    UIOptions?: UIOpts,
  ) {

    this.arcCode = ''
    this.rxCam = null
    this.dialogCtx = ctx
    this.userName = userName
    this.initCamOpts = initCamOpts
    this.clipConfig = clipConfig
    this.uiOpts = { ...initialUIOpts, ...UIOptions }

    this.initialArcEvent = {
      action: ACTIONS.noneAvailable,
      payload: {
        arcTypeSelectedData: { id: '', text: '' },
        userName: this.userName,
      },
    }
    this.eventSubject = new Subject<ArcEvent>()
    this.click$ = bindClickEvent(this.dialogCtx)
    this.keyboard$ = bindKeyboardEvent(this.dialogCtx)
    this.selectedData$ = bindArcPkgTypeChangeEvent(
      this.dialogCtx,
      this.uiOpts,
      this.initialArcEvent,
      [this.uiOpts.arcPkgTypeSelctor, this.uiOpts.drawHisSelector],
    )
    this.file$ = bindFileInputEvent(this.dialogCtx, this.uiOpts.fileInputSelector)

    this.fileSub = null
    this.selectedDataSub = null
    this.combinedSub = null


    this.initCamDlg()
    this.initCam().pipe(
      take(1),
    ).subscribe()

    this.subscribeEvent()
  }

  /** 初始化采集模态框 */
  initCamDlg() {
    this.arcCode = ''
    if (!this.dialogCtx) {
      throw new Error('initCamDlg() ctx 参数空')
    }
    initUI(this.dialogCtx, this.uiOpts)
    // 初始化时禁用 待摄像头初始化成功后再启用
    setElmsValidState(this.dialogCtx, this.uiOpts, false)
  }

  initCam(): Observable<RxCam> {
    return initRxCam(
      this.dialogCtx,
      this.uiOpts,
      this.initCamOpts,
    )
      .pipe(
        tap(cam => {
          if (cam) {
            this.rxCam = cam
            this.dialogCtx.setAttribute('inited', '1')
          }
          else {
            throw new Error('initCamera() 初始化 Cam 失败')
          }
        }),
        tap(() => {
          const clipConf = this.clipConfig

          if (clipConf && clipConf.width > 0 && clipConf.height > 0) {
            initClipContainer(this.dialogCtx, this.uiOpts)
            // @ts-ignore
            const lsConfig = <ClipConfig> getLocalStorage('clipConfig') || {}
            const conf = { ...clipConf, ...lsConfig }

            getClipBoxArg(conf.width, conf.height, conf.clipX, conf.clipY)
          }
        }),
      )
  }

  /** 初始化获取（页面）级别 arcCode */
  initArcCode(data: ArcCodeInitOpts): Observable<string> {
    this.arcCode = ''
    const arcEvent = { ...this.initialArcEvent }
    arcEvent.payload.externalInfo = <ExternalInfo | undefined> data.D
    let criterTag: boolean = false

    if (data.D && Object.keys(data.D).length) {
      criterTag = true
      setCritertionLibToggle(this.dialogCtx, this.uiOpts, true)
    }
    else {
      criterTag = false
      setCritertionLibToggle(this.dialogCtx, this.uiOpts, false)
    }

    arcEvent.action = ACTIONS.fetchArcCode
    this.eventSubject.next(arcEvent)

    UItoastr({
      type: 'info',
      title: '获取档案袋信息中……',
      msg: '',
      onlyOne: true,
      className: 'fetch-arc-code',
    })

    return initArcCode(this.dialogCtx, this.uiOpts, data).pipe(
      tap(arcCode => {
        this.arcCode = arcCode

        if (arcCode) {
          UItoastr({
            type: 'success',
            title: '获取档案袋信息成功',
            msg: '',
            onlyOne: true,
            className: 'fetch-arc-code',
            timeOut: 2000,
          })
        }
        else {
          UItoastr({
            type: 'error',
            title: '获取档案袋信息 arcCode 失败',
            msg: '',
            className: 'fetch-arc-code',
            onlyOne: true,
          })
        }
      }),
      // filter(arcCode => !!arcCode && criterTag),
      mergeMap(arcCode => {
        return dealWithCritEvent(arcEvent, arcCode, this.dialogCtx, this.uiOpts, criterTag).pipe(
          mapTo(arcCode),
        )
      }),
    )
  }

  // processCamdlgRestored(): Observable<boolean> {
  //   return handleEventDlgRestored(this.rxCam)
  // }


  /** 保存图片到档案服务 (原名 saveArcImg) */
  postArcImg(data: ArcImgSaveOpts, imgUrl: string) {
    if (! data.ELEID) {
      UItoastr({ type: 'warning', title: '档案采集类型选项为空' })
      return of(void 0)
    }
    return saveArcImg(this.dialogCtx, this.uiOpts, data, imgUrl)
  }


  /** 显示指定职工的档案图片 */
  // showArcImgByXM(data: IdentOpsts): Observable<null> {
  //   return showArcImgByXM(this.dialogCtx, this.uiOpts, data)
  // }


  /** 显示指定职工的房管局来源共享图片 */
  showHouseImgByXM(data: HouseOpts): Observable<null> {
    return showHouseImgByXM(this.dialogCtx, this.uiOpts, data)
  }


  private subscribeEvent() {
    const file$: Observable<ArcEvent> = this.file$
      .pipe(
        mergeMap(files => handleFiles(files, 2000)),
        map(imgInfo => {
          const arcEvent = <ArcEvent> { ...this.initialArcEvent }
          arcEvent.action = ACTIONS.takePhotoSucc
          arcEvent.payload.imgInfo = imgInfo

          return arcEvent
        }),
        tap(ev => {
          const { imgInfo } = ev.payload
          showImg(this.dialogCtx, this.uiOpts, imgInfo ? imgInfo.url : '')

          const input = <HTMLInputElement> this.dialogCtx.querySelector(this.uiOpts.fileInputSelector)
          if (input) {
            try { // release file lock by browser
              input.type = ''
              input.type = 'file'
            }
            catch (ex) {
              console.info(ex)
            }
          }
        }),
      )

    const selectedData$: Observable<ArcPkgTypeSelectOptionData | HisDrawSelectOptionData> = this.selectedData$.pipe(
      // distinctUntilChanged((p, q) => p.id === q.id),
      // tap(data => {
      //   info(['selectedData: ', data])
      //   const ev = { ...this.initialArcEvent, action: ACTIONS.pkgSelectChanged }
      //   ev.payload.arcTypeSelectedData = data
      //   this.eventSubject.next(ev)
      // }),
      tap(() => { // 档案类型变化 清空预览图片
        // const { dialogCtx, uiOpts } = this
        // $dialog.find('#preview-box').empty()
        // const box = dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
        // if (box) {
        //   box.innerHTML = ''
        // }
      }),
    )

    const mergeEvent$ = merge(this.click$, this.keyboard$)
    const clickEvent$: Observable<ArcEvent> = mergeEvent$.pipe(
      filter(event => {
        if (event && event.type === 'keyup') {
          return true
        }
        else if (!event.target) {
          return false
        }
        else {
          const elm = <HTMLElement> (event && event.target)
          return eventFilter(elm)
        }
      }),
      concatMap(event => {
        const elm = <HTMLElement> (event && event.target)

        const { arcCode, dialogCtx, uiOpts, rxCam, userName } = this
        const arcEvent = <ArcEvent> { ...this.initialArcEvent }
        const sidx = getCurStreamIdx(dialogCtx, uiOpts)
        arcEvent.payload.rotate = getLastCamRotateValue(sidx)

        if (elm.matches(uiOpts.takePhotoSelector) || event.type === 'keyup') {  // 采集按钮
          arcEvent.action = ACTIONS.takePhoto
          const snapOpts = { jpegQuality: 94, ...this.initCamOpts.snapOpts }
          return handleCapture({
            arcCode,
            dialogCtx,
            uiOpts,
            rxCam,
            snapOpts,
            userName,
          })
            .pipe(
              mergeMap(imgRet => {
                if (this.clipConfig && this.clipConfig.width && this.clipConfig.height) {
                  return handleClip(dialogCtx, uiOpts, imgRet).pipe(
                    tap(() => {
                      saveLocalStorage(dialogCtx)
                    }),
                    mergeMap(ret => {
                      if (rxCam) {
                        return rxCam.thumbnail(ret.url, ret.options).pipe(
                          map(data => {
                            ret.url = data
                            return ret
                          }),
                        )
                      }
                      else {
                        return of(ret)
                      }
                    }),
                  )
                }
                else {
                  return of(imgRet)
                }
              }),
              map(imgRet => {
                arcEvent.action = ACTIONS.takePhotoSucc
                arcEvent.payload.imgInfo = {
                  name: '',
                  url: imgRet.url,
                  size: imgRet.url.length,
                  snapOpts: imgRet.options,
                }

                return arcEvent
              }),
            )
        }
        else if (elm.matches(uiOpts.camSidxSelecotr)) { // 切换指定摄像头
          arcEvent.action = ACTIONS.switchCam
          const rotate = getLastCamRotateValue(sidx)

          updateCamSelectLabelActive(dialogCtx, uiOpts, sidx, rotate)

          return handleEventSwitchCam(this.rxCam, sidx)
            .pipe(
              mapTo(arcEvent),
            )
        }
        else if (elm.matches(uiOpts.labelRotateSelector)) { // 采集旋转角度
          arcEvent.action = ACTIONS.toggleRotate

          const rotate = updateCamRotateMap(dialogCtx, uiOpts, sidx)
          updateCamRotateValue(sidx, rotate)
          arcEvent.payload.rotate = rotate
        }
        else if (elm.matches(uiOpts.selectLocalFileSelector)) { // 打开选择本地图片对话框 用于上传
          arcEvent.action = ACTIONS.openSelectLocalFile
          triggerFileInput(dialogCtx, uiOpts)
        }
        else if (elm.classList.contains('close') || elm.classList.contains('btn-close-modal')) { // 关闭模态框按钮
          arcEvent.action = ACTIONS.closeCamdlg

          this.arcCode = ''
          /**
           * 在下方 camdlgClosed 事件中执行
           * 否则可能在恢复了窗口后却断开了视频 !
           */
          // return timer(500).pipe(
          //   tap(() => {
          //     if (this.rxCam) {
          //       // this.cam.pauseVideo()
          //       this.rxCam.disconnect()
          //     }
          //     initUI(dialogCtx, uiOpts)
          //   }),
          //   mapTo(arcEvent),
          // )
        }
        else if (elm.matches(uiOpts.critertionLibSelector)) { // 标准证照库
          arcEvent.action = ACTIONS.critertionLib
          return dealWithCritEvent(arcEvent, arcCode, dialogCtx, uiOpts, true).pipe(
            mapTo(arcEvent),
          )
        }
        else if (elm.matches(uiOpts.latexShareSelector)) {// 共享按钮点击事件触发
          arcEvent.action = ACTIONS.latexShareInit
        }
        else if (elm.matches(uiOpts.checkImgSelector)) {// 选择共享图片事件
          arcEvent.action = ACTIONS.checkImg
          arcEvent.payload.prop = elm
          checkPreviewImg(elm)
        }
        else if (elm.matches(uiOpts.shareRourceSelector)) {// 共享图片来源
          arcEvent.action = ACTIONS.shareRource
          selectShareRource(dialogCtx, uiOpts, this.eventSubject, arcEvent)
        }
        else if (elm.matches(uiOpts.shareSaveSelector)) {// 保存共享图片
          arcEvent.action = ACTIONS.shareSave
        }
        else if (elm.matches(uiOpts.shareCloseSelector)) {// 关闭共享窗口
          shareClose(dialogCtx, uiOpts)
        }
        else if (elm.matches(uiOpts.shareSpouseSelector)) {// 配偶房管局
          arcEvent.action = ACTIONS.spouseQuery
        }
        else if (elm.matches(uiOpts.shareSpoLocalSelector)) {// 配偶本地图片
          arcEvent.action = ACTIONS.spoLocalQuery
        }
        else if (elm.matches(uiOpts.readIDCard)) {// 配偶本地信息读取身份证
          arcEvent.action = ACTIONS.readIDCard
          return readBase().pipe(
            tap(ret => {
              fillIdcard(dialogCtx, ret)
            }),
            mapTo(arcEvent),
          )
        }
        else if (elm.matches(uiOpts.shareCheckSquare)) {// 全选 共享图片
          checkSquareImg(dialogCtx)
        }
        else if (elm.matches(uiOpts.idcCompositeSelector)) {  // 读取二代证合成照
          arcEvent.action = ACTIONS.takeIdcImg
        }
        else if (elm.matches(uiOpts.shareFillSelfSelector)) { // 共享填充本人信息
          arcEvent.action = ACTIONS.shareFillSelf
        }
        else if (elm.matches(uiOpts.commonScanSelector)) {// 公共扫描按钮点击事件触发
          arcEvent.action = ACTIONS.commonScanInit
          openCommonScan(dialogCtx, uiOpts, arcCode)
        }
        else if (elm.matches(uiOpts.commonScanSaveSelector)) {// 保存公共扫描图片
          arcEvent.action = ACTIONS.commonScanSave
          return saveCommonScan(dialogCtx, uiOpts, arcCode, userName)
            .pipe(
              mapTo(arcEvent),
              catchError((err: Error) => {
                throw err
              }),
            )

        }
        else if (elm.matches(uiOpts.commonScanCloseSelector)) {// 关闭公共扫描窗口
          commonScanCancel(dialogCtx, uiOpts)
        }
        else if (elm.matches(uiOpts.commonScanCheckSquare)) {// 公共扫描图片全选
          checkSquareCommonScanImg(dialogCtx)
        }
        else if (elm.matches(uiOpts.checkCommonScanImgSelector)) {// 选择公共扫描图片事件
          arcEvent.action = ACTIONS.checkImg
          arcEvent.payload.prop = elm
          checkCommonScanImg(elm)
        }
        else if (elm.matches(uiOpts.commonScanRotateL90Selector)) {// 公共扫描图片左旋转90度点击事件触发
          arcEvent.action = ACTIONS.commonScanInit
          return rotateImgCommonScan(dialogCtx, uiOpts, elm, -90)
            .pipe(
              mapTo(arcEvent),

            )
        }
        else if (elm.matches(uiOpts.commonScanRotateR90Selector)) {// 公共扫描图片右旋转90度点击事件触发
          arcEvent.action = ACTIONS.commonScanInit
          return rotateImgCommonScan(dialogCtx, uiOpts, elm, 90)
            .pipe(
              mapTo(arcEvent),

            )
        }

        return of(arcEvent)
      }),
    )

    this.combinedSub = merge(clickEvent$, file$)
      .pipe(
        withLatestFrom(selectedData$),  // 采集类型必须填充触发一次change事件数据流才会通过!
        map((elms: [ArcEvent, ArcPkgTypeSelectOptionData | HisDrawSelectOptionData]) => {
          const [ev] = elms

          // if (ev.payload.arcTypeSelectedData) {
          //   ev.payload.arcTypeSelectedData.id = +selData.id
          //   ev.payload.arcTypeSelectedData.text = selData.text
          // }
          return ev
        }),
        mergeMap((ev: ArcEvent) => {
          return handleCombinedEvent({
            arcCode: this.arcCode,
            dialogCtx: this.dialogCtx,
            uiOpts: this.uiOpts,
            ev,
            eventSubject: this.eventSubject,
            initialArcEvent: this.initialArcEvent,
            userName: this.userName,
          })
        }),
      )
      .subscribe(
        () => {},
        err => {
          error(err)
        },
      )

    // ! 不能在这里 this.eventSubject.next() 发消息 否则死循环
    this.eventSubject.pipe(
      concatMap(ev => {
        return handleEventSubject({
          arcCode: this.arcCode,
          dialogCtx: this.dialogCtx,
          uiOpts: this.uiOpts,
          ev,
          userName: this.userName,
          rxCam: this.rxCam,
        })
      }),
    )
      .subscribe(
        () => { },
        error,
        () => {
          this.fileSub && this.fileSub.unsubscribe()
          this.combinedSub && this.combinedSub.unsubscribe()
          this.selectedDataSub && this.selectedDataSub.unsubscribe()
        },
      )

  }
}

