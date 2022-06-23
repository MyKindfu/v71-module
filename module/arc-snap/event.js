import { info } from '@waiting/log';
import { forkJoin, fromEvent, merge, of, timer, } from 'rxjs';
import { catchError, concatMap, debounceTime, delay, filter, finalize, map, mapTo, mergeMap, pluck, retry, shareReplay, switchMap, tap, timeout, } from 'rxjs/operators';
import { getArccodeByXM, getArcImg } from '../arc/share';
import { readAll } from '../idc/index';
import { readLocalImgBase64, UItoastr, } from '../shared/index';
import { saveArcImg, showHouseImgByXM } from './archive';
import { genHisDrawOptionsFromArcCodeContent, showArcImg } from './share';
import { takePhoto, toggleCam } from './snapshot';
import { initUI, setElmsValidState, setIdcBtnAvailable, showImg, updateMonDrawHisSelect, updateShareQuerySelect, } from './ui';
/** 绑定模态框内指定元素点击事件流 */
export function bindClickEvent(ctx) {
    return fromEvent(ctx, 'click')
        .pipe(debounceTime(100));
}
/** 绑定模态框内拍照按钮keyup事件 */
export function bindKeyboardEvent(ctx) {
    return fromEvent(ctx, 'keyup')
        .pipe(debounceTime(100), filter(keyEventFilter));
}
/** 绑定模态框内指定元素MouseDown事件流 */
export function bindMouseDownEvent(ctx) {
    return fromEvent(ctx, 'mousedown');
}
/** 绑定模态框内指定元素MouseUp事件流 */
export function bindMouseUpEvent(ctx) {
    return fromEvent(ctx, 'mouseup');
}
/** 返回档案采集类型当前选中项的 id/text 键值对. 只考虑单选 */
export function bindArcPkgTypeChangeEvent(dialogCtx, uiOpts, initialArcEvent, selector) {
    const events$ = selector.map(ctor => {
        const sel = dialogCtx.querySelector(ctor);
        return fromEvent(sel, 'change-capture');
    });
    const data$ = merge(...events$).pipe(tap(() => {
        const box = dialogCtx.querySelector(uiOpts.shareImgBoxSelector);
        if (box) {
            box.innerHTML = '';
        }
    }), pluck('target'), map(elm => {
        const options = elm.selectedOptions;
        const data = {
            id: '',
            text: '',
        };
        if (options.length) {
            data.id = options[0].value; // 不考虑多选情况
            data.text = options[0].text;
        }
        return { data, elm };
    }), map(({ data, elm }) => {
        if (!data.id) {
            data.id = elm.selectedOptions[0] ? elm.selectedOptions[0].value : '';
            data.text = elm.selectedOptions[0] ? elm.selectedOptions[0].text : '';
        }
        return { data, elm };
    }));
    const ret$ = data$.pipe(map(({ data, elm }) => {
        const ev = Object.assign({}, initialArcEvent, { action: "pkgSelectChanged" /* pkgSelectChanged */ });
        if (elm.matches(uiOpts.arcPkgTypeSelctor)) {
            const drawHisSelector = dialogCtx.querySelector(uiOpts.drawHisSelector);
            if (drawHisSelector) {
                drawHisSelector.innerHTML = '';
            }
            info(['selectedData: ', data]);
            ev.payload.arcTypeSelectedData = data;
        }
        return { data, elm, ev };
    }), mergeMap(({ data, elm, ev }) => {
        if (elm.matches(uiOpts.drawHisSelector)) {
            const pdata = {
                ArcCode: data.id.toString(),
                EleId: +ev.payload.arcTypeSelectedData.id,
            };
            const img$ = getArcImg(pdata).pipe(tap(arr => {
                showArcImg(dialogCtx, uiOpts, arr);
            }));
            return img$.pipe(mapTo({ data, elm }));
        }
        return of({ data, elm });
    }), map(({ data }) => data));
    // distinctUntilChanged((p, q) => {
    //   const elm1 = p.target as HTMLSelectElement
    //   const elm2 = p.target as HTMLSelectElement
    //   const bool = elm1 && elm2 && elm1.selectedOptions[0].value === elm2.selectedOptions[0].value
    //   return bool
    // }),
    // shareReplay(1),
    return ret$;
}
function keyEventFilter(ev) {
    if (!ev) {
        return false;
    }
    // @ts-ignore
    if (ev.altKey || ev.ctrlKey || ev.shiftKey) {
        return false;
    }
    if (ev.which && +ev.which !== 13) {
        return false;
    }
    return true;
}
export function eventFilter(elm) {
    if (!elm || !elm.nodeName) {
        return false;
    }
    // @ts-ignore
    if (typeof elm.disabled !== 'undefined' && elm.disabled) {
        return false;
    }
    // const list = ['BUTTON', 'I', 'INPUT', 'LABEL', 'SPAN', 'DIV', 'IMG']
    const list = ['BUTTON', 'I', 'INPUT', 'LABEL', 'SPAN', 'IMG'];
    const parentEle = elm.parentElement;
    if (!list.includes(elm.nodeName)) {
        return false;
    }
    else if (parentEle && parentEle.classList.contains('disabled')) {
        return false;
    }
    return true;
}
// 文件上传事件
export function bindFileInputEvent(ctx, selector) {
    const input = ctx.querySelector(selector);
    return fromEvent(input, 'change')
        .pipe(pluck('target'), pluck('files'));
}
/** 处理内部订阅切换摄像头事件 */
export function handleEventSwitchCam(cam, sidx) {
    if (!cam) {
        // const errEvent = <ArcEvent> {
        //   action: ACTIONS.savePhotoFail,
        //   payload: {
        //     ...ev.payload,
        //     err: 'camInst got by sym invalid',
        //   },
        // }
        // return subject.next(errEvent)
        throw new Error('handleEventSwitchCam() cam 为空');
    }
    return toggleCam(cam, sidx).pipe(
    // tap(constraints => {
    //   const errEvent = <ArcEvent> {
    //     action: ACTIONS.switchCamSucc,
    //     payload: {
    //       ...ev.payload,
    //       constraints,
    //     },
    //   }
    //   subject.next(errEvent)
    // }),
    // catchError((err: Error) => {
    //   const errEvent = <ArcEvent> {
    //     action: ACTIONS.switchCamFail,
    //     payload: {
    //       ...ev.payload,
    //       err,
    //     },
    //   }
    //   subject.next(errEvent)
    //   return EMPTY
    // }),
    );
}
/** 处理模态框恢复事件。 若视频已停止则重新连接 */
export function handleEventDlgRestored(cam) {
    if (cam) {
        const live = cam.isPlaying();
        if (!live) {
            const sidx = cam.curStreamIdx;
            return cam.connect(+sidx).pipe(mapTo(true), timeout(5000), retry(1), catchError((err) => {
                UItoastr({
                    type: 'warning',
                    title: '恢复视频失败',
                    // msg: err && err.message ? err.message : '',
                    msg: '可尝试切换到其它视频解决',
                });
                info(['handleEventDlgRestored() 恢复视频失败', err]);
                return of(false);
            }));
        }
        else {
            return of(true).pipe(tap(() => {
                cam.playVideo();
            }));
        }
    }
    else {
        return of(false);
    }
}
/**
 * 读取二代证合成照显示并上传档案服务
 * 返回 IData 中 imagePath, compositePath 替换为对应图片的 base64
 */
function handleReadIdcImg(dialogCtx, uiOpts, arcTypeSelectedData, arcCode, userName) {
    const iddata$ = readAll().pipe(shareReplay(1));
    const avatarImg$ = iddata$.pipe(map(iddata => iddata.imagePath), mergeMap(readLocalImgBase64), map(base64 => `${"data:image/jpeg;base64," /* jpg */}${base64}`));
    const saveCompositeImg$ = iddata$.pipe(map(iddata => iddata.compositePath), mergeMap(readLocalImgBase64), map(base64 => `${"data:image/jpeg;base64," /* jpg */}${base64}`), concatMap(base64 => {
        const pdata = {
            arcCode,
            creater: userName,
            ELEID: arcTypeSelectedData ? +arcTypeSelectedData.id : 0,
        };
        return saveArcImg(dialogCtx, uiOpts, pdata, base64).pipe(map(() => base64));
    }), catchError((err) => {
        showImg(dialogCtx, uiOpts, '');
        UItoastr({ type: 'error', title: '保存档案图片失败', msg: err && err.message ? err.message : '' });
        throw err;
    }));
    const imgsBase64$ = forkJoin(avatarImg$, saveCompositeImg$);
    const ret$ = of(null).pipe(tap(() => {
        setElmsValidState(dialogCtx, uiOpts, false);
        setIdcBtnAvailable(dialogCtx, uiOpts, false); // 二代证采集合成
    }), switchMap(() => iddata$), concatMap(iddata => {
        return imgsBase64$.pipe(map(([avatarImg, compositeImg]) => {
            iddata.imagePath = avatarImg;
            iddata.compositePath = compositeImg;
            return iddata;
        }));
    }), tap(iddata => {
        showImg(dialogCtx, uiOpts, iddata.compositePath); // compositePath 已替换为图片 base64
    }), finalize(() => {
        setElmsValidState(dialogCtx, uiOpts, true);
        setIdcBtnAvailable(dialogCtx, uiOpts, true); // 二代证采集合成
    }));
    return ret$;
}
/** 处理内部 combined 合并事件流 */
export function handleCombinedEvent(options) {
    const { arcCode, dialogCtx, uiOpts, ev, eventSubject, initialArcEvent, userName, } = options;
    // console.info('combined ev', ev)
    const { payload } = ev;
    switch (ev.action) {
        case "closeCamdlg" /* closeCamdlg */:
            return of(ev).pipe(tap(event => {
                setTimeout(() => {
                    const newEvent = Object.assign({}, event, { action: "camdlgClosed" /* camdlgClosed */ });
                    eventSubject.next(newEvent);
                }, 100); // @HARDCODE
            }));
            break;
        // 二代证采集并保存档案图片
        case "takeIdcImg" /* takeIdcImg */:
            return handleReadIdcImg(dialogCtx, uiOpts, payload.arcTypeSelectedData, arcCode, userName)
                .pipe(tap(iddata => {
                const newEvent = Object.assign({}, ev, { action: "takeIdcImgSucc" /* takeIdcImgSucc */ });
                newEvent.payload.iddata = iddata; // 包含图片 base64
                eventSubject.next(newEvent);
            }), mapTo(ev), catchError((err) => {
                ev.action = "takeIdcImgFail" /* takeIdcImgFail */;
                ev.payload.err = err;
                return of(ev);
            }));
            break;
        case "takePhotoSucc" /* takePhotoSucc */:
            showImg(dialogCtx, uiOpts, ev.payload.imgInfo ? ev.payload.imgInfo.url : '');
            const data = {
                arcCode,
                ELEID: +payload.arcTypeSelectedData.id,
                creater: userName,
            };
            UItoastr({
                type: 'info',
                title: '采集保存中……',
                msg: payload.arcTypeSelectedData.text,
                onlyOne: true,
                className: `post-arc-img-${payload.arcTypeSelectedData.id}`,
            });
            if (!data.ELEID) {
                UItoastr({ type: 'error', title: '档案采集类型选项为空' });
                return of(ev);
            }
            return saveArcImg(dialogCtx, uiOpts, data, payload.imgInfo ? payload.imgInfo.url : '').pipe(
            // return this.postArcImg(data, payload.imgInfo ? payload.imgInfo.url : '').pipe(
            tap(() => {
                UItoastr({
                    type: 'success',
                    title: '采集保存成功',
                    msg: payload.arcTypeSelectedData.text,
                    onlyOne: true,
                    className: `post-arc-img-${payload.arcTypeSelectedData.id}`,
                });
                const arcEvent = Object.assign({}, initialArcEvent, { action: "savePhotoSucc" /* savePhotoSucc */ });
                eventSubject.next(arcEvent);
            }), mapTo(ev), catchError((err) => {
                info(['保存档案图片失败', err]);
                UItoastr({
                    type: 'error',
                    title: '采集保存失败',
                    msg: payload.data.arcTypeSelectedData.text,
                });
                const arcEvent = Object.assign({}, initialArcEvent, { action: "savePhotoFail" /* savePhotoFail */ });
                arcEvent.payload.err = err;
                eventSubject.next(arcEvent);
                return of(ev);
            }));
            break;
        // 共享按钮点击事件
        // case ACTIONS.latexShareInit:
        //   setBtnGroupToggle(dialogCtx, uiOpts, true)
        //   const elm = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareContainerSelector)
        //   elm.classList.remove('hidden')
        //   // eventSubject.next({
        //   //   action: ACTIONS.localRource,
        //   //   payload: ev.payload,
        //   // })
        //   break
        default:
            eventSubject.next(ev);
            break;
    }
    return of(ev);
}
/**
 * 处理 eventSubject 事件流（内部外部都可能触发）
 * 注意：不要在此函数内继续调用 eventSubject.next()
 *
 */
export function handleEventSubject(options) {
    const { dialogCtx, uiOpts, ev, rxCam, } = options;
    const { payload } = ev;
    switch (ev.action) {
        case "camdlgClosed" /* camdlgClosed */:
            // 在 pipe 的 concatMap 中执行，保证执行之后才执行（可能的）camdlgRestored 事件
            return timer(100).pipe(tap(() => {
                initUI(dialogCtx, uiOpts);
                if (rxCam) {
                    // cam.pauseVideo()
                    rxCam.disconnect();
                }
            }), mapTo(ev));
            break;
        case "camdlgRestored" /* camdlgRestored */:
            return handleEventDlgRestored(rxCam).pipe(mapTo(ev));
            break;
        // 在 pageinit 页面js中各自处理
        case "localRource" /* localRource */:
            {
                updateShareQuerySelect(dialogCtx, uiOpts);
                //   const gyrBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareGyrBoxSelector)
                //   const localBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareLocalBoxSelector)
                //   gyrBox.classList.add('hidden')
                //   localBox.classList.remove('hidden')
            }
            break;
        // 显示共有人档案图片
        case "spoLocalQuery" /* spoLocalQuery */:
            {
                const CXND = dialogCtx.querySelector('.history-draw-year').value.trim();
                const ZJHM = dialogCtx.querySelector('#local-zjhm').value.trim();
                const XINGMING = dialogCtx.querySelector('#local-xingming').value.trim();
                if (!XINGMING || !ZJHM) {
                    UItoastr({ type: 'warning', title: '输入您所需查询的姓名/证件号码!', msg: '', onlyOne: true });
                    return of(ev);
                }
                // $dialog.find('#preview-box').empty()
                dialogCtx.querySelector(uiOpts.shareImgBoxSelector).innerHTML = '';
                const data = {
                    YHMC: XINGMING,
                    ZJHM,
                    CXND,
                    ELEID: +payload.arcTypeSelectedData.id,
                };
                // 显示指定职工的档案图片
                return getArccodeByXM(data).pipe(mergeMap(arr => {
                    const opts = genHisDrawOptionsFromArcCodeContent(arr);
                    const steam$ = updateMonDrawHisSelect(dialogCtx, uiOpts, opts).pipe(mapTo(ev));
                    return steam$;
                }), mapTo(ev), catchError((err) => {
                    dialogCtx.querySelector(uiOpts.shareImgBoxSelector).innerHTML = '';
                    $(dialogCtx.querySelector(uiOpts.drawHisSelector)).empty();
                    UItoastr({
                        type: 'warning',
                        title: '该年度无档案资料',
                        msg: err && err.message ? err.message : '',
                        onlyOne: true,
                    });
                    return of(ev);
                }));
            }
            break;
        // 配偶房管局图片查询
        case "spouseQuery" /* spouseQuery */:
            {
                const XINGMING = dialogCtx.querySelector('#das-xingming').value.trim();
                const ZJHM = dialogCtx.querySelector('#das-zjhm').value.trim();
                const HTBAH = dialogCtx.querySelector('#das-htbah').value.trim();
                if (!HTBAH) {
                    if (!XINGMING || !ZJHM) {
                        UItoastr({ type: 'warning', title: '输入该共有人/配偶的姓名和证件号码!', msg: '', onlyOne: true });
                        return of(ev);
                    }
                }
                // $dialog.find('#preview-box').empty()
                dialogCtx.querySelector(uiOpts.shareImgBoxSelector).innerHTML = '';
                // @ts-ignore
                App.blockUI({ boxed: true });
                const data = {
                    XINGMING,
                    ZJHM,
                    ELEID: +payload.arcTypeSelectedData.id,
                    HTBAH,
                    QZH: '',
                };
                return showHouseImgByXM(dialogCtx, uiOpts, data).pipe(tap(() => {
                    // @ts-ignore
                    App.unblockUI();
                }), mapTo(ev), catchError((err) => {
                    // @ts-ignore
                    App.unblockUI();
                    UItoastr({
                        type: 'warning',
                        title: '该配偶/共有人该元素下无房管局档案',
                        msg: err && err.message ? err.message : '',
                        onlyOne: true,
                    });
                    return of(ev);
                }));
            }
            break;
    }
    return of(ev);
}
/** 响应采集图像事件并更新结果图片 */
export function handleCapture(options) {
    const { dialogCtx, uiOpts, rxCam, snapOpts } = options;
    setElmsValidState(dialogCtx, uiOpts, false);
    showImg(dialogCtx, uiOpts, ''); // 先清空
    const previewDelayTime = snapOpts && snapOpts.previewSnapRetTime && snapOpts.previewSnapRetTime > 0
        ? +snapOpts.previewSnapRetTime
        : 0;
    return takePhoto(dialogCtx, uiOpts, rxCam, snapOpts).pipe(delay(previewDelayTime), tap(() => {
        // showImg(ret.url) // 由 'takePhotoSucc' 事件触发执行
        setElmsValidState(dialogCtx, uiOpts, true);
    }), catchError((err) => {
        setElmsValidState(dialogCtx, uiOpts, true);
        throw err;
    }), tap(imgInfo => {
        if (!imgInfo.url) {
            UItoastr({ type: 'warning', title: '图像采集结果空' });
            return;
        }
        // info(['图像采集成功', imgInfo])
        info(['图像采集成功']);
        // this.eventSubject.next({
        //   action: ACTIONS.takePhotoSucc,
        // })
    }));
}
