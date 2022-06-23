import { calcImgThumbResolution, takeThumbnail } from 'rxcam';
import { from as ofrom, fromEvent, } from 'rxjs';
import { catchError, concatMap, filter, map, mapTo, mergeMap, pluck, reduce, take, tap, timeout } from 'rxjs/operators';
import { genArcPkgOptionsFromArcCodeContent, 
// getArccodeByXM,
// getArcImg,
getHouseImgByXM, initArcCombined, postArcImg, } from '../arc/index';
import { showArcImg } from './share';
import { setElmsValidState, updateArcPkgTypeSelect, updateImgMemo } from './ui';
/**
 * 初始化档案袋及arcCode
 * 先根据参数获取档案袋code然后获取arccode
 */
export function initArcCode(dialogCtx, uiOpts, data) {
    // const { userName } = initialArcConfigs
    // subject.next({
    //   action: ACTIONS.fetchArcCode,
    //   payload: {
    //     userName,
    //   },
    // })
    // 两步自动初始化
    const ret$ = initArcCombined(data).pipe(mergeMap(ret => {
        const opts = genArcPkgOptionsFromArcCodeContent(ret.arcPkgContents);
        return updateArcPkgTypeSelect(dialogCtx, uiOpts, opts).pipe(mapTo(ret));
    }), 
    // tap(({ arcPkgContents }) => {
    //   // subject.next({
    //   //   action: ACTIONS.fetchArcCodeSucc,
    //   //   payload: { userName },
    //   // })
    // }),
    map(res => res.arcCode), catchError(err => {
        throw err;
    }));
    return ret$;
}
/** 读取已获取缓存的 arcCode */
// export function getArcCode(): string {
//   return initialArcConfigs.arcCode
// }
/** 发送图片到服务器 */
export function saveArcImg(dialogCtx, uiOpts, data, imgUrl) {
    // 发送imgUrl 包括 base64 头部
    setElmsValidState(dialogCtx, uiOpts, false);
    const arcPkgTypeId = data.ELEID;
    const ret$ = postArcImg(data, imgUrl).pipe(tap(() => {
        updateImgMemo(dialogCtx, uiOpts, arcPkgTypeId); // 更新采集类型对应的已采集计数器
        setElmsValidState(dialogCtx, uiOpts, true);
    }), catchError(err => {
        setElmsValidState(dialogCtx, uiOpts, true);
        throw err;
    }));
    return ret$;
}
/** 读取本地图片文件输出为 dataURL */
export function handleFiles(files, maxPixel) {
    const imageTypeRegex = /^image\//;
    const file$ = ofrom(files).pipe(filter(file => imageTypeRegex.test(file.type)));
    const img = new Image();
    const load$ = fromEvent(img, 'load').pipe(pluck('target'), take(files.length));
    const ret$ = file$.pipe(concatMap(file => {
        const proc$ = load$.pipe(take(1), mergeMap((target) => {
            // 根据 options.width 作为图片最大宽度按照imgWidth/imgHeight比例计算出图片缩减时正确的宽高
            const sopts = calcImgThumbResolution(target.width, target.height, maxPixel);
            return takeThumbnail(target, sopts).pipe(tap(() => {
                target.src && window.URL.revokeObjectURL(target.src);
                target.src = '';
            }));
        }));
        img.src = window.URL.createObjectURL(file);
        return proc$.pipe(map(url => {
            const info = {
                name: file.name,
                size: 0,
                url: '',
            };
            return Object.assign({}, info, { url, size: url.length });
        }), timeout(15000));
    }));
    return ret$.pipe(reduce((acc, curr) => {
        acc.push(curr);
        return acc;
    }, []), mergeMap(arr => ofrom(arr)));
}
/** 显示指定职工的档案图片 */
// export function showArcImgByXM(
//   dialogCtx: HTMLDivElement,
//   uiOpts: UIOpts,
//   data: IdentOpsts,
// ): Observable<null> {
//   return getArccodeByXM(data).pipe(
//     tap(arr => {
//       updateMonDrawHisSelect(dialogCtx, uiOpts, arr)
//     }),
//     concatMap(arcCode => {
//       const pdata: PrevImgOpts = {
//         ArcCode: arcCode,
//         EleId,
//       }
//       return getArcImg(pdata)
//     }),
//     tap(arr => {
//       showArcImg(dialogCtx, uiOpts, arr)
//     }),
//     mapTo(null),
//   )
// }
/** 显示指定职工的房管局来源共享图片 */
export function showHouseImgByXM(dialogCtx, uiOpts, data) {
    return getHouseImgByXM(data).pipe(tap(arr => {
        showArcImg(dialogCtx, uiOpts, arr);
    }), mapTo(null));
}
