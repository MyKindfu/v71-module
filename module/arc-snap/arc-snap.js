/**
 * 档案采集、上传
 *
 * @author: waiting
 * @date: 2018/04/10
 */
import { error } from '@waiting/log';
import { merge, of, Subject } from 'rxjs';
import { catchError, concatMap, filter, map, mapTo, mergeMap, take, tap, withLatestFrom, } from 'rxjs/operators';
import { dealWithCritEvent, } from '../arc/index';
import { readBase } from '../idc/index';
import { UItoastr } from '../shared/index';
import { handleFiles, initArcCode, saveArcImg, showHouseImgByXM, } from './archive';
import { getClipBoxArg, handleClip, initClipContainer, saveLocalStorage } from './clip';
import { checkCommonScanImg, checkSquareCommonScanImg, commonScanCancel, openCommonScan, rotateImgCommonScan, saveCommonScan, } from './common-scan';
import { initialUIOpts, } from './config';
import { bindArcPkgTypeChangeEvent, bindClickEvent, bindFileInputEvent, bindKeyboardEvent, eventFilter, handleCapture, handleCombinedEvent, handleEventSubject, handleEventSwitchCam, } from './event';
import { checkPreviewImg, checkSquareImg, fillIdcard, selectShareRource, shareClose } from './share';
import { getLastCamRotateValue, initRxCam, updateCamRotateValue, } from './snapshot';
import { getCurStreamIdx, initUI, setCritertionLibToggle, setElmsValidState, showImg, triggerFileInput, updateCamRotateMap, updateCamSelectLabelActive, } from './ui';
export class ArcSnap {
    constructor(ctx, userName, initCamOpts, clipConfig, UIOptions) {
        this.arcCode = '';
        this.rxCam = null;
        this.dialogCtx = ctx;
        this.userName = userName;
        this.initCamOpts = initCamOpts;
        this.clipConfig = clipConfig;
        this.uiOpts = Object.assign({}, initialUIOpts, UIOptions);
        this.initialArcEvent = {
            action: "n/a" /* noneAvailable */,
            payload: {
                arcTypeSelectedData: { id: '', text: '' },
                userName: this.userName,
            },
        };
        this.eventSubject = new Subject();
        this.click$ = bindClickEvent(this.dialogCtx);
        this.keyboard$ = bindKeyboardEvent(this.dialogCtx);
        this.selectedData$ = bindArcPkgTypeChangeEvent(this.dialogCtx, this.uiOpts, this.initialArcEvent, [this.uiOpts.arcPkgTypeSelctor, this.uiOpts.drawHisSelector]);
        this.file$ = bindFileInputEvent(this.dialogCtx, this.uiOpts.fileInputSelector);
        this.fileSub = null;
        this.selectedDataSub = null;
        this.combinedSub = null;
        this.initCamDlg();
        this.initCam().pipe(take(1)).subscribe();
        this.subscribeEvent();
    }
    /** 初始化采集模态框 */
    initCamDlg() {
        this.arcCode = '';
        if (!this.dialogCtx) {
            throw new Error('initCamDlg() ctx 参数空');
        }
        initUI(this.dialogCtx, this.uiOpts);
        // 初始化时禁用 待摄像头初始化成功后再启用
        setElmsValidState(this.dialogCtx, this.uiOpts, false);
    }
    initCam() {
        return initRxCam(this.dialogCtx, this.uiOpts, this.initCamOpts)
            .pipe(tap(cam => {
            if (cam) {
                this.rxCam = cam;
                this.dialogCtx.setAttribute('inited', '1');
            }
            else {
                throw new Error('initCamera() 初始化 Cam 失败');
            }
        }), tap(() => {
            const clipConf = this.clipConfig;
            if (clipConf && clipConf.width > 0 && clipConf.height > 0) {
                initClipContainer(this.dialogCtx, this.uiOpts);
                // @ts-ignore
                const lsConfig = getLocalStorage('clipConfig') || {};
                const conf = Object.assign({}, clipConf, lsConfig);
                getClipBoxArg(conf.width, conf.height, conf.clipX, conf.clipY);
            }
        }));
    }
    /** 初始化获取（页面）级别 arcCode */
    initArcCode(data) {
        this.arcCode = '';
        const arcEvent = Object.assign({}, this.initialArcEvent);
        arcEvent.payload.externalInfo = data.D;
        let criterTag = false;
        if (data.D && Object.keys(data.D).length) {
            criterTag = true;
            setCritertionLibToggle(this.dialogCtx, this.uiOpts, true);
        }
        else {
            criterTag = false;
            setCritertionLibToggle(this.dialogCtx, this.uiOpts, false);
        }
        arcEvent.action = "fetchArcCode" /* fetchArcCode */;
        this.eventSubject.next(arcEvent);
        UItoastr({
            type: 'info',
            title: '获取档案袋信息中……',
            msg: '',
            onlyOne: true,
            className: 'fetch-arc-code',
        });
        return initArcCode(this.dialogCtx, this.uiOpts, data).pipe(tap(arcCode => {
            this.arcCode = arcCode;
            if (arcCode) {
                UItoastr({
                    type: 'success',
                    title: '获取档案袋信息成功',
                    msg: '',
                    onlyOne: true,
                    className: 'fetch-arc-code',
                    timeOut: 2000,
                });
            }
            else {
                UItoastr({
                    type: 'error',
                    title: '获取档案袋信息 arcCode 失败',
                    msg: '',
                    className: 'fetch-arc-code',
                    onlyOne: true,
                });
            }
        }), 
        // filter(arcCode => !!arcCode && criterTag),
        mergeMap(arcCode => {
            return dealWithCritEvent(arcEvent, arcCode, this.dialogCtx, this.uiOpts, criterTag).pipe(mapTo(arcCode));
        }));
    }
    // processCamdlgRestored(): Observable<boolean> {
    //   return handleEventDlgRestored(this.rxCam)
    // }
    /** 保存图片到档案服务 (原名 saveArcImg) */
    postArcImg(data, imgUrl) {
        if (!data.ELEID) {
            UItoastr({ type: 'warning', title: '档案采集类型选项为空' });
            return of(void 0);
        }
        return saveArcImg(this.dialogCtx, this.uiOpts, data, imgUrl);
    }
    /** 显示指定职工的档案图片 */
    // showArcImgByXM(data: IdentOpsts): Observable<null> {
    //   return showArcImgByXM(this.dialogCtx, this.uiOpts, data)
    // }
    /** 显示指定职工的房管局来源共享图片 */
    showHouseImgByXM(data) {
        return showHouseImgByXM(this.dialogCtx, this.uiOpts, data);
    }
    subscribeEvent() {
        const file$ = this.file$
            .pipe(mergeMap(files => handleFiles(files, 2000)), map(imgInfo => {
            const arcEvent = Object.assign({}, this.initialArcEvent);
            arcEvent.action = "takePhotoSucc" /* takePhotoSucc */;
            arcEvent.payload.imgInfo = imgInfo;
            return arcEvent;
        }), tap(ev => {
            const { imgInfo } = ev.payload;
            showImg(this.dialogCtx, this.uiOpts, imgInfo ? imgInfo.url : '');
            const input = this.dialogCtx.querySelector(this.uiOpts.fileInputSelector);
            if (input) {
                try { // release file lock by browser
                    input.type = '';
                    input.type = 'file';
                }
                catch (ex) {
                    console.info(ex);
                }
            }
        }));
        const selectedData$ = this.selectedData$.pipe(
        // distinctUntilChanged((p, q) => p.id === q.id),
        // tap(data => {
        //   info(['selectedData: ', data])
        //   const ev = { ...this.initialArcEvent, action: ACTIONS.pkgSelectChanged }
        //   ev.payload.arcTypeSelectedData = data
        //   this.eventSubject.next(ev)
        // }),
        tap(() => {
            // const { dialogCtx, uiOpts } = this
            // $dialog.find('#preview-box').empty()
            // const box = dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
            // if (box) {
            //   box.innerHTML = ''
            // }
        }));
        const mergeEvent$ = merge(this.click$, this.keyboard$);
        const clickEvent$ = mergeEvent$.pipe(filter(event => {
            if (event && event.type === 'keyup') {
                return true;
            }
            else if (!event.target) {
                return false;
            }
            else {
                const elm = (event && event.target);
                return eventFilter(elm);
            }
        }), concatMap(event => {
            const elm = (event && event.target);
            const { arcCode, dialogCtx, uiOpts, rxCam, userName } = this;
            const arcEvent = Object.assign({}, this.initialArcEvent);
            const sidx = getCurStreamIdx(dialogCtx, uiOpts);
            arcEvent.payload.rotate = getLastCamRotateValue(sidx);
            if (elm.matches(uiOpts.takePhotoSelector) || event.type === 'keyup') { // 采集按钮
                arcEvent.action = "takePhoto" /* takePhoto */;
                const snapOpts = Object.assign({ jpegQuality: 94 }, this.initCamOpts.snapOpts);
                return handleCapture({
                    arcCode,
                    dialogCtx,
                    uiOpts,
                    rxCam,
                    snapOpts,
                    userName,
                })
                    .pipe(mergeMap(imgRet => {
                    if (this.clipConfig && this.clipConfig.width && this.clipConfig.height) {
                        return handleClip(dialogCtx, uiOpts, imgRet).pipe(tap(() => {
                            saveLocalStorage(dialogCtx);
                        }), mergeMap(ret => {
                            if (rxCam) {
                                return rxCam.thumbnail(ret.url, ret.options).pipe(map(data => {
                                    ret.url = data;
                                    return ret;
                                }));
                            }
                            else {
                                return of(ret);
                            }
                        }));
                    }
                    else {
                        return of(imgRet);
                    }
                }), map(imgRet => {
                    arcEvent.action = "takePhotoSucc" /* takePhotoSucc */;
                    arcEvent.payload.imgInfo = {
                        name: '',
                        url: imgRet.url,
                        size: imgRet.url.length,
                        snapOpts: imgRet.options,
                    };
                    return arcEvent;
                }));
            }
            else if (elm.matches(uiOpts.camSidxSelecotr)) { // 切换指定摄像头
                arcEvent.action = "switchCam" /* switchCam */;
                const rotate = getLastCamRotateValue(sidx);
                updateCamSelectLabelActive(dialogCtx, uiOpts, sidx, rotate);
                return handleEventSwitchCam(this.rxCam, sidx)
                    .pipe(mapTo(arcEvent));
            }
            else if (elm.matches(uiOpts.labelRotateSelector)) { // 采集旋转角度
                arcEvent.action = "toggleRotate" /* toggleRotate */;
                const rotate = updateCamRotateMap(dialogCtx, uiOpts, sidx);
                updateCamRotateValue(sidx, rotate);
                arcEvent.payload.rotate = rotate;
            }
            else if (elm.matches(uiOpts.selectLocalFileSelector)) { // 打开选择本地图片对话框 用于上传
                arcEvent.action = "openSelectLocalFile" /* openSelectLocalFile */;
                triggerFileInput(dialogCtx, uiOpts);
            }
            else if (elm.classList.contains('close') || elm.classList.contains('btn-close-modal')) { // 关闭模态框按钮
                arcEvent.action = "closeCamdlg" /* closeCamdlg */;
                this.arcCode = '';
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
                arcEvent.action = "critertionLib" /* critertionLib */;
                return dealWithCritEvent(arcEvent, arcCode, dialogCtx, uiOpts, true).pipe(mapTo(arcEvent));
            }
            else if (elm.matches(uiOpts.latexShareSelector)) { // 共享按钮点击事件触发
                arcEvent.action = "latexShareInit" /* latexShareInit */;
            }
            else if (elm.matches(uiOpts.checkImgSelector)) { // 选择共享图片事件
                arcEvent.action = "checkImg" /* checkImg */;
                arcEvent.payload.prop = elm;
                checkPreviewImg(elm);
            }
            else if (elm.matches(uiOpts.shareRourceSelector)) { // 共享图片来源
                arcEvent.action = "shareRource" /* shareRource */;
                selectShareRource(dialogCtx, uiOpts, this.eventSubject, arcEvent);
            }
            else if (elm.matches(uiOpts.shareSaveSelector)) { // 保存共享图片
                arcEvent.action = "shareSave" /* shareSave */;
            }
            else if (elm.matches(uiOpts.shareCloseSelector)) { // 关闭共享窗口
                shareClose(dialogCtx, uiOpts);
            }
            else if (elm.matches(uiOpts.shareSpouseSelector)) { // 配偶房管局
                arcEvent.action = "spouseQuery" /* spouseQuery */;
            }
            else if (elm.matches(uiOpts.shareSpoLocalSelector)) { // 配偶本地图片
                arcEvent.action = "spoLocalQuery" /* spoLocalQuery */;
            }
            else if (elm.matches(uiOpts.readIDCard)) { // 配偶本地信息读取身份证
                arcEvent.action = "readIDCard" /* readIDCard */;
                return readBase().pipe(tap(ret => {
                    fillIdcard(dialogCtx, ret);
                }), mapTo(arcEvent));
            }
            else if (elm.matches(uiOpts.shareCheckSquare)) { // 全选 共享图片
                checkSquareImg(dialogCtx);
            }
            else if (elm.matches(uiOpts.idcCompositeSelector)) { // 读取二代证合成照
                arcEvent.action = "takeIdcImg" /* takeIdcImg */;
            }
            else if (elm.matches(uiOpts.shareFillSelfSelector)) { // 共享填充本人信息
                arcEvent.action = "shareFillSelf" /* shareFillSelf */;
            }
            else if (elm.matches(uiOpts.commonScanSelector)) { // 公共扫描按钮点击事件触发
                arcEvent.action = "commonScanInit" /* commonScanInit */;
                openCommonScan(dialogCtx, uiOpts, arcCode);
            }
            else if (elm.matches(uiOpts.commonScanSaveSelector)) { // 保存公共扫描图片
                arcEvent.action = "commonScanSave" /* commonScanSave */;
                return saveCommonScan(dialogCtx, uiOpts, arcCode, userName)
                    .pipe(mapTo(arcEvent), catchError((err) => {
                    throw err;
                }));
            }
            else if (elm.matches(uiOpts.commonScanCloseSelector)) { // 关闭公共扫描窗口
                commonScanCancel(dialogCtx, uiOpts);
            }
            else if (elm.matches(uiOpts.commonScanCheckSquare)) { // 公共扫描图片全选
                checkSquareCommonScanImg(dialogCtx);
            }
            else if (elm.matches(uiOpts.checkCommonScanImgSelector)) { // 选择公共扫描图片事件
                arcEvent.action = "checkImg" /* checkImg */;
                arcEvent.payload.prop = elm;
                checkCommonScanImg(elm);
            }
            else if (elm.matches(uiOpts.commonScanRotateL90Selector)) { // 公共扫描图片左旋转90度点击事件触发
                arcEvent.action = "commonScanInit" /* commonScanInit */;
                return rotateImgCommonScan(dialogCtx, uiOpts, elm, -90)
                    .pipe(mapTo(arcEvent));
            }
            else if (elm.matches(uiOpts.commonScanRotateR90Selector)) { // 公共扫描图片右旋转90度点击事件触发
                arcEvent.action = "commonScanInit" /* commonScanInit */;
                return rotateImgCommonScan(dialogCtx, uiOpts, elm, 90)
                    .pipe(mapTo(arcEvent));
            }
            return of(arcEvent);
        }));
        this.combinedSub = merge(clickEvent$, file$)
            .pipe(withLatestFrom(selectedData$), // 采集类型必须填充触发一次change事件数据流才会通过!
        map((elms) => {
            const [ev] = elms;
            // if (ev.payload.arcTypeSelectedData) {
            //   ev.payload.arcTypeSelectedData.id = +selData.id
            //   ev.payload.arcTypeSelectedData.text = selData.text
            // }
            return ev;
        }), mergeMap((ev) => {
            return handleCombinedEvent({
                arcCode: this.arcCode,
                dialogCtx: this.dialogCtx,
                uiOpts: this.uiOpts,
                ev,
                eventSubject: this.eventSubject,
                initialArcEvent: this.initialArcEvent,
                userName: this.userName,
            });
        }))
            .subscribe(() => { }, err => {
            error(err);
        });
        // ! 不能在这里 this.eventSubject.next() 发消息 否则死循环
        this.eventSubject.pipe(concatMap(ev => {
            return handleEventSubject({
                arcCode: this.arcCode,
                dialogCtx: this.dialogCtx,
                uiOpts: this.uiOpts,
                ev,
                userName: this.userName,
                rxCam: this.rxCam,
            });
        }))
            .subscribe(() => { }, error, () => {
            this.fileSub && this.fileSub.unsubscribe();
            this.combinedSub && this.combinedSub.unsubscribe();
            this.selectedDataSub && this.selectedDataSub.unsubscribe();
        });
    }
}
