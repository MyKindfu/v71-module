import { info } from "@waiting/log";
import { ImgCaptureRet, RxCam } from "rxcam";
import { forkJoin, fromEvent, merge, of, timer, Observable } from "rxjs";
import {
  catchError,
  concatMap,
  debounceTime,
  delay,
  filter,
  finalize,
  map,
  mapTo,
  mergeMap,
  pluck,
  retry,
  shareReplay,
  switchMap,
  tap,
  timeout,
} from "rxjs/operators";

import { ArcImgSaveOpts } from "../arc/index";
import { PrevImgOpts } from "../arc/model";
import { getArccodeByXM, getArcImg } from "../arc/share";
import { readAll, IDData } from "../idc/index";
import {
  readLocalImgBase64,
  DataURISchemePrefix,
  UItoastr,
} from "../shared/index";

import { saveArcImg, showHouseImgByXM } from "./archive";
import {
  ArcEvent,
  ArcPkgTypeSelectOptionData,
  ACTIONS,
  HandleCaptureOpts,
  HandleCombinedEventOpts,
  HandleEventSubjectOpts,
  UIOpts,
} from "./model";
import { genHisDrawOptionsFromArcCodeContent, showArcImg } from "./share";
import { takePhoto, toggleCam } from "./snapshot";
import {
  initUI,
  setElmsValidState,
  setIdcBtnAvailable,
  showImg,
  updateMonDrawHisSelect,
  updateShareQuerySelect,
} from "./ui";

/** 绑定模态框内指定元素点击事件流 */
export function bindClickEvent(ctx: HTMLDivElement): Observable<MouseEvent> {
  return fromEvent<MouseEvent>(ctx, "click").pipe(
    debounceTime(100)
    // pluck<MouseEvent, HTMLElement>('target'),
    // filter(eventFilter),
  );
}

/** 绑定模态框内拍照按钮keyup事件 */
export function bindKeyboardEvent(
  ctx: HTMLDivElement
): Observable<KeyboardEvent> {
  return fromEvent<KeyboardEvent>(ctx, "keyup").pipe(
    debounceTime(100),
    filter(keyEventFilter)
  );
}

/** 绑定模态框内指定元素MouseDown事件流 */
export function bindMouseDownEvent(
  ctx: HTMLDivElement
): Observable<MouseEvent> {
  return fromEvent<MouseEvent>(ctx, "mousedown");
}

/** 绑定模态框内指定元素MouseUp事件流 */
export function bindMouseUpEvent(ctx: HTMLDivElement): Observable<MouseEvent> {
  return fromEvent<MouseEvent>(ctx, "mouseup");
}

/** 返回档案采集类型当前选中项的 id/text 键值对. 只考虑单选 */
export function bindArcPkgTypeChangeEvent<T extends ArcPkgTypeSelectOptionData>(
  dialogCtx: HTMLDivElement,
  uiOpts: UIOpts,
  initialArcEvent: ArcEvent,
  selector: string[]
): Observable<T> {
  const events$ = selector.map((ctor) => {
    const sel = <HTMLSelectElement>dialogCtx.querySelector(ctor);
    return fromEvent<Event>(sel, "change-capture");
  });

  const data$ = merge(...events$).pipe(
    tap(() => {
      const box = dialogCtx.querySelector(uiOpts.shareImgBoxSelector);
      if (box) {
        box.innerHTML = "";
      }
    }),
    pluck<Event, HTMLSelectElement>("target"),
    map((elm) => {
      const options = elm.selectedOptions;
      const data = <T>{
        id: "",
        text: "",
      };
      if (options.length) {
        data.id = options[0].value; // 不考虑多选情况
        data.text = options[0].text;
      }
      return { data, elm };
    }),
    map(({ data, elm }) => {
      if (!data.id) {
        data.id = elm.selectedOptions[0] ? elm.selectedOptions[0].value : "";
        data.text = elm.selectedOptions[0] ? elm.selectedOptions[0].text : "";
      }
      return { data, elm };
    })
  );

  const ret$ = data$.pipe(
    map(({ data, elm }) => {
      const ev = { ...initialArcEvent, action: ACTIONS.pkgSelectChanged };

      if (elm.matches(uiOpts.arcPkgTypeSelctor)) {
        const drawHisSelector = dialogCtx.querySelector(uiOpts.drawHisSelector);
        if (drawHisSelector) {
          drawHisSelector.innerHTML = "";
        }

        info(["selectedData: ", data]);
        ev.payload.arcTypeSelectedData = data;
      }
      return { data, elm, ev };
    }),
    mergeMap(({ data, elm, ev }) => {
      if (elm.matches(uiOpts.drawHisSelector)) {
        const pdata: PrevImgOpts = {
          ArcCode: data.id.toString(),
          EleId: +ev.payload.arcTypeSelectedData.id,
        };
        const img$ = getArcImg(pdata).pipe(
          tap((arr) => {
            showArcImg(dialogCtx, uiOpts, arr);
          })
        );
        return img$.pipe(mapTo({ data, elm }));
      }
      return of({ data, elm });
    }),
    map(({ data }) => data)
    // startWith({
    //   // id: elm.selectedOptions[0] ? elm.selectedOptions[0].value : '',
    //   // text: elm.selectedOptions[0] ? elm.selectedOptions[0].text : '',
    //   id: '',
    //   text: '',
    // } as T),
  );

  // distinctUntilChanged((p, q) => {
  //   const elm1 = p.target as HTMLSelectElement
  //   const elm2 = p.target as HTMLSelectElement
  //   const bool = elm1 && elm2 && elm1.selectedOptions[0].value === elm2.selectedOptions[0].value
  //   return bool
  // }),
  // shareReplay(1),

  return ret$;
}

function keyEventFilter(ev: KeyboardEvent): boolean {
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

export function eventFilter(elm: HTMLElement): boolean {
  if (!elm || !elm.nodeName) {
    return false;
  }
  // @ts-ignore
  if (typeof elm.disabled !== "undefined" && elm.disabled) {
    return false;
  }
  // const list = ['BUTTON', 'I', 'INPUT', 'LABEL', 'SPAN', 'DIV', 'IMG']
  const list = ["BUTTON", "I", "INPUT", "LABEL", "SPAN", "IMG"];
  const parentEle = <HTMLLabelElement | HTMLDivElement>elm.parentElement;

  if (!list.includes(elm.nodeName)) {
    return false;
  } else if (parentEle && parentEle.classList.contains("disabled")) {
    return false;
  }
  return true;
}

// 文件上传事件
export function bindFileInputEvent(ctx: HTMLDivElement, selector: string) {
  const input = <HTMLInputElement>ctx.querySelector(selector);

  return fromEvent<MouseEvent>(input, "change").pipe(
    pluck<MouseEvent, HTMLInputElement>("target"),
    pluck<HTMLElement, FileList>("files")
  );
}

/** 处理内部订阅切换摄像头事件 */
export function handleEventSwitchCam(cam: RxCam | null, sidx: number) {
  if (!cam) {
    // const errEvent = <ArcEvent> {
    //   action: ACTIONS.savePhotoFail,
    //   payload: {
    //     ...ev.payload,
    //     err: 'camInst got by sym invalid',
    //   },
    // }
    // return subject.next(errEvent)
    throw new Error("handleEventSwitchCam() cam 为空");
  }

  return toggleCam(cam, sidx)
    .pipe
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
    ();
}

/** 处理模态框恢复事件。 若视频已停止则重新连接 */
export function handleEventDlgRestored(cam: RxCam | null): Observable<boolean> {
  if (cam) {
    const live = cam.isPlaying();

    if (!live) {
      const sidx = cam.curStreamIdx;

      return cam.connect(+sidx).pipe(
        mapTo(true),
        timeout(5000),
        retry(1),
        catchError((err: Error) => {
          UItoastr({
            type: "warning",
            title: "恢复视频失败",
            // msg: err && err.message ? err.message : '',
            msg: "可尝试切换到其它视频解决",
          });
          info(["handleEventDlgRestored() 恢复视频失败", err]);
          return of(false);
        })
      );
    } else {
      return of(true).pipe(
        tap(() => {
          cam.playVideo();
        })
      );
    }
  } else {
    return of(false);
  }
}

/**
 * 读取二代证合成照显示并上传档案服务
 * 返回 IData 中 imagePath, compositePath 替换为对应图片的 base64
 */
function handleReadIdcImg(
  dialogCtx: HTMLDivElement,
  uiOpts: UIOpts,
  arcTypeSelectedData: ArcPkgTypeSelectOptionData,
  arcCode: string,
  userName: string
): Observable<IDData> {
  const iddata$: Observable<IDData> = readAll().pipe(shareReplay(1));

  const avatarImg$ = iddata$.pipe(
    map((iddata) => iddata.imagePath),
    mergeMap(readLocalImgBase64),
    map((base64) => `${DataURISchemePrefix.jpg}${base64}`)
  );
  const saveCompositeImg$ = iddata$.pipe(
    map((iddata) => iddata.compositePath),
    mergeMap(readLocalImgBase64),
    map((base64) => `${DataURISchemePrefix.jpg}${base64}`),
    concatMap((base64) => {
      const pdata: ArcImgSaveOpts = {
        arcCode,
        creater: userName,
        ELEID: arcTypeSelectedData ? +arcTypeSelectedData.id : 0,
      };
      return saveArcImg(dialogCtx, uiOpts, pdata, base64).pipe(
        map(() => base64)
      );
    }),
    catchError((err: Error) => {
      showImg(dialogCtx, uiOpts, "");
      UItoastr({
        type: "error",
        title: "保存档案图片失败",
        msg: err && err.message ? err.message : "",
      });

      throw err;
    })
  );

  const imgsBase64$ = forkJoin(avatarImg$, saveCompositeImg$);

  const ret$ = of(null).pipe(
    tap(() => {
      setElmsValidState(dialogCtx, uiOpts, false);
      setIdcBtnAvailable(dialogCtx, uiOpts, false); // 二代证采集合成
    }),
    switchMap(() => iddata$),
    concatMap((iddata) => {
      return imgsBase64$.pipe(
        map(([avatarImg, compositeImg]) => {
          iddata.imagePath = avatarImg;
          iddata.compositePath = compositeImg;
          return iddata;
        })
      );
    }),
    tap((iddata) => {
      showImg(dialogCtx, uiOpts, iddata.compositePath); // compositePath 已替换为图片 base64
    }),
    finalize(() => {
      setElmsValidState(dialogCtx, uiOpts, true);
      setIdcBtnAvailable(dialogCtx, uiOpts, true); // 二代证采集合成
    })
  );

  return ret$;
}

/** 处理内部 combined 合并事件流 */
export function handleCombinedEvent(
  options: HandleCombinedEventOpts
): Observable<ArcEvent> {
  const {
    arcCode,
    dialogCtx,
    uiOpts,
    ev,
    eventSubject,
    initialArcEvent,
    userName,
  } = options;
  // console.info('combined ev', ev)
  const { payload } = ev;

  switch (ev.action) {
    case ACTIONS.closeCamdlg:
      return of(ev).pipe(
        tap((event) => {
          setTimeout(() => {
            const newEvent: ArcEvent = {
              ...event,
              action: ACTIONS.camdlgClosed,
            };
            eventSubject.next(newEvent);
          }, 100); // @HARDCODE
        })
      );
      break;

    // 二代证采集并保存档案图片
    case ACTIONS.takeIdcImg:
      return handleReadIdcImg(
        dialogCtx,
        uiOpts,
        payload.arcTypeSelectedData,
        arcCode,
        userName
      ).pipe(
        tap((iddata) => {
          const newEvent: ArcEvent = { ...ev, action: ACTIONS.takeIdcImgSucc };
          newEvent.payload.iddata = iddata; // 包含图片 base64
          eventSubject.next(newEvent);
        }),
        mapTo(ev),
        catchError((err: Error) => {
          ev.action = ACTIONS.takeIdcImgFail;
          ev.payload.err = err;
          return of(ev);
        })
      );
      break;

    case ACTIONS.takePhotoSucc:
      showImg(
        dialogCtx,
        uiOpts,
        ev.payload.imgInfo ? ev.payload.imgInfo.url : ""
      );

      const data = {
        arcCode,
        ELEID: +payload.arcTypeSelectedData.id,
        creater: userName,
      };

      UItoastr({
        type: "info",
        title: "采集保存中……",
        msg: payload.arcTypeSelectedData.text,
        onlyOne: true,
        className: `post-arc-img-${payload.arcTypeSelectedData.id}`,
      });

      if (!data.ELEID) {
        UItoastr({ type: "error", title: "档案采集类型选项为空" });
        return of(ev);
      }
      return saveArcImg(
        dialogCtx,
        uiOpts,
        data,
        payload.imgInfo ? payload.imgInfo.url : ""
      ).pipe(
        // return this.postArcImg(data, payload.imgInfo ? payload.imgInfo.url : '').pipe(
        tap(() => {
          UItoastr({
            type: "success",
            title: "采集保存成功",
            msg: payload.arcTypeSelectedData.text,
            onlyOne: true,
            className: `post-arc-img-${payload.arcTypeSelectedData.id}`,
          });

          const arcEvent = {
            ...initialArcEvent,
            action: ACTIONS.savePhotoSucc,
          };
          eventSubject.next(arcEvent);
        }),
        mapTo(ev),
        catchError((err: Error) => {
          info(["保存档案图片失败", err]);
          UItoastr({
            type: "error",
            title: "采集保存失败",
            msg: payload.data.arcTypeSelectedData.text,
          });

          const arcEvent = {
            ...initialArcEvent,
            action: ACTIONS.savePhotoFail,
          };
          arcEvent.payload.err = err;
          eventSubject.next(arcEvent);

          return of(ev);
        })
      );
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
export function handleEventSubject(
  options: HandleEventSubjectOpts
): Observable<ArcEvent> {
  const { dialogCtx, uiOpts, ev, rxCam } = options;
  const { payload } = ev;

  switch (ev.action) {
    case ACTIONS.camdlgClosed:
      // 在 pipe 的 concatMap 中执行，保证执行之后才执行（可能的）camdlgRestored 事件
      return timer(100).pipe(
        tap(() => {
          initUI(dialogCtx, uiOpts);
          if (rxCam) {
            // cam.pauseVideo()
            rxCam.disconnect();
          }
        }),
        mapTo(ev)
      );
      break;

    case ACTIONS.camdlgRestored:
      return handleEventDlgRestored(rxCam).pipe(mapTo(ev));
      break;

    // 在 pageinit 页面js中各自处理
    case ACTIONS.localRource:
      {
        updateShareQuerySelect(dialogCtx, uiOpts);
        //   const gyrBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareGyrBoxSelector)
        //   const localBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareLocalBoxSelector)
        //   gyrBox.classList.add('hidden')
        //   localBox.classList.remove('hidden')
      }
      break;

    // 显示共有人档案图片
    case ACTIONS.spoLocalQuery:
      {
        const CXND = (<HTMLSelectElement>(
          dialogCtx.querySelector(".history-draw-year")
        )).value.trim();
        const ZJHM = (<HTMLInputElement>(
          dialogCtx.querySelector("#local-zjhm")
        )).value.trim();
        const XINGMING = (<HTMLInputElement>(
          dialogCtx.querySelector("#local-xingming")
        )).value.trim();

        if (!XINGMING || !ZJHM) {
          UItoastr({
            type: "warning",
            title: "输入您所需查询的姓名/证件号码!",
            msg: "",
            onlyOne: true,
          });
          return of(ev);
        }

        // $dialog.find('#preview-box').empty()
        (<HTMLDivElement>(
          dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
        )).innerHTML = "";

        const data = {
          YHMC: XINGMING,
          ZJHM,
          CXND,
          ELEID: +payload.arcTypeSelectedData.id,
        };

        // 显示指定职工的档案图片
        return getArccodeByXM(data).pipe(
          mergeMap((arr) => {
            const opts = genHisDrawOptionsFromArcCodeContent(arr);
            const steam$ = updateMonDrawHisSelect(dialogCtx, uiOpts, opts).pipe(
              mapTo(ev)
            );
            return steam$;
          }),
          mapTo(ev),
          catchError((err: Error) => {
            (<HTMLDivElement>(
              dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
            )).innerHTML = "";
            $(
              <HTMLSelectElement>dialogCtx.querySelector(uiOpts.drawHisSelector)
            ).empty();
            UItoastr({
              type: "warning",
              title: "该年度无档案资料",
              msg: err && err.message ? err.message : "",
              onlyOne: true,
            });
            return of(ev);
          })
        );
      }
      break;

    // 配偶房管局图片查询
    case ACTIONS.spouseQuery:
      {
        const XINGMING = (<HTMLInputElement>(
          dialogCtx.querySelector("#das-xingming")
        )).value.trim();
        const ZJHM = (<HTMLInputElement>(
          dialogCtx.querySelector("#das-zjhm")
        )).value.trim();
        const HTBAH = (<HTMLInputElement>(
          dialogCtx.querySelector("#das-htbah")
        )).value.trim();

        if (!HTBAH) {
          if (!XINGMING || !ZJHM) {
            UItoastr({
              type: "warning",
              title: "输入该共有人/配偶的姓名和证件号码!",
              msg: "",
              onlyOne: true,
            });
            return of(ev);
          }
        }

        // $dialog.find('#preview-box').empty()
        (<HTMLDivElement>(
          dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
        )).innerHTML = "";
        // @ts-ignore
        App.blockUI({ boxed: true });

        const data = {
          XINGMING,
          ZJHM,
          ELEID: +payload.arcTypeSelectedData.id,
          HTBAH,
          QZH: "",
        };

        return showHouseImgByXM(dialogCtx, uiOpts, data).pipe(
          tap(() => {
            // @ts-ignore
            App.unblockUI();
          }),
          mapTo(ev),
          catchError((err: Error) => {
            // @ts-ignore
            App.unblockUI();
            UItoastr({
              type: "warning",
              title: "该配偶/共有人该元素下无房管局档案",
              msg: err && err.message ? err.message : "",
              onlyOne: true,
            });

            return of(ev);
          })
        );
      }
      break;
  }

  return of(ev);
}

/** 响应采集图像事件并更新结果图片 */
export function handleCapture(
  options: HandleCaptureOpts
): Observable<ImgCaptureRet> {
  const { dialogCtx, uiOpts, rxCam, snapOpts } = options;
  setElmsValidState(dialogCtx, uiOpts, false);
  showImg(dialogCtx, uiOpts, ""); // 先清空

  const previewDelayTime =
    snapOpts && snapOpts.previewSnapRetTime && snapOpts.previewSnapRetTime > 0
      ? +snapOpts.previewSnapRetTime
      : 0;

  return takePhoto(dialogCtx, uiOpts, <RxCam>rxCam, snapOpts).pipe(
    delay(previewDelayTime),
    tap(() => {
      // showImg(ret.url) // 由 'takePhotoSucc' 事件触发执行
      setElmsValidState(dialogCtx, uiOpts, true);
    }),
    catchError((err: Error) => {
      setElmsValidState(dialogCtx, uiOpts, true);
      throw err;
    }),
    tap((imgInfo) => {
      if (!imgInfo.url) {
        UItoastr({ type: "warning", title: "图像采集结果空" });
        return;
      }
      // info(['图像采集成功', imgInfo])
      info(["图像采集成功"]);
      // this.eventSubject.next({
      //   action: ACTIONS.takePhotoSucc,
      // })
    })
  );
}
