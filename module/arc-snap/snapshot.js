import { RxCamFactory, } from 'rxcam';
import { EMPTY } from 'rxjs';
import { catchError, mapTo, mergeMap, tap } from 'rxjs/operators';
import { UItoastr } from '../shared/index';
import { camsRotateMap, initialCamOpts } from './config';
import { genCamSelectLabels, getCurStreamIdx, setArcPkgTypeSelectValidState, setBtnValidState, setCloseBtnState, setElmsValidState, } from './ui';
export function initRxCam(dialogCtx, uiOpts, initialOpts) {
    const opts = Object.assign({}, initialCamOpts, initialOpts);
    const cam$ = RxCamFactory(opts);
    const ret$ = cam$.pipe(mergeMap(cam => {
        return cam.connect().pipe(tap(constraints => {
            // subject.next({
            //   action: ACTIONS.camReady,
            //   payload: { constraints, sym, userName: initialArcConfigs.userName },
            // })
            const count = cam.getAllVideoInfo().length;
            if (count) {
                // 根据配置参数、采集参数以及摄像头个数生成对应旋转角度用于切换摄像头后更新UI上旋转按钮选中
                genCamsRotateList(count, opts);
                genCamSelectLabels(dialogCtx, uiOpts, count);
                setElmsValidState(dialogCtx, uiOpts, true);
                // camInstMap.set(sym, cam)
            }
            else {
                setElmsValidState(dialogCtx, uiOpts, false);
                setArcPkgTypeSelectValidState(dialogCtx, uiOpts, true); // 采集类型下拉
                setBtnValidState(dialogCtx, uiOpts, false); // 采集按钮
                // setBtnGroupValidState(true) // 采集参数按钮 // @TODO 本地选择图片也可以根据采集旋转参数进行处理
                setCloseBtnState(dialogCtx, uiOpts, true); // 模态框关闭按钮
            }
        }), mapTo(cam));
    }), catchError((err) => {
        setElmsValidState(dialogCtx, uiOpts, false);
        setArcPkgTypeSelectValidState(dialogCtx, uiOpts, true); // 采集类型下拉
        setBtnValidState(dialogCtx, uiOpts, false); // 采集按钮
        // setBtnGroupValidState(dialogCtx, uiOpts, true) // 采集参数按钮 // @TODO 本地选择图片也可以根据采集旋转参数进行处理
        setCloseBtnState(dialogCtx, uiOpts, true); // 模态框关闭按钮
        UItoastr({ type: 'warning', title: '初始化摄像头失败', msg: err.message, className: 'init-arc-snap-fail' });
        return EMPTY;
    }));
    return ret$;
}
// export function getCamInstbySym(sym: symbol): RxCam | void {
//   return camInstMap.get(sym)
// }
/** 采集图像并且更新预览结果 */
export function takePhoto(dialogCtx, uiOpts, cam, options) {
    const opts = genCaptureOpts(dialogCtx, uiOpts, options); // 处理采集旋转角度
    return cam.snapshot(opts);
}
export function toggleCam(cam, sidx) {
    return typeof sidx === 'undefined' || typeof +sidx !== 'number'
        ? cam.connectNext()
        : cam.connect(+sidx);
}
/** 根据用户传入采集参数与从对话框元素获取采集参数（旋转角度）合并生成采集参数 */
export function genCaptureOpts(dialogCtx, uiOpts, options) {
    const sidx = getCurStreamIdx(dialogCtx, uiOpts);
    const rotate = getLastCamRotateValue(sidx);
    const opts = Object.assign({ rotate }, options);
    return opts;
}
/** 根据配置参数、采集参数生成摄像头对应的采集旋转角度列表 htmlelement */
export function genCamsRotateList(count, options) {
    const sconfigs = options.streamConfigs;
    const sopts = options.snapOpts;
    for (let i = 0; i < count; i++) {
        const sconfig = sconfigs ? sconfigs[i] : null;
        let rotate = sconfig && sconfig.rotate ? +sconfig.rotate : 0;
        if (sopts && typeof sopts.rotate === 'number') {
            rotate = sopts.rotate;
        }
        updateCamRotateValue(i, rotate);
    }
}
/** 读取上次摄像头对应的旋转角度值。与UI当前选中按钮值可能不一致 */
export function getLastCamRotateValue(sidx) {
    const ret = camsRotateMap.get(sidx);
    return ret ? ret : 0;
}
/** 保存摄像头采集旋转角度 用于更新UI按钮 */
export function updateCamRotateValue(sidx, rotate) {
    camsRotateMap.set(+sidx, +rotate);
}
