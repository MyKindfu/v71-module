import { of } from 'rxjs';
import { filter, map, mapTo, tap } from 'rxjs/operators';
import { updateImgMemoBatch } from '../arc-snap/ui';
import { post } from '../shared/ajax/index';
import { UItoastr } from '../shared/index';
/** 获取指定职工的档案编码 */
export function getArccodeByXM(data) {
    const year = data.CXND || '所有';
    // @ts-ignore
    App.blockUI({ boxed: true, message: '正在获取' + year + '年度[' + data.YHMC + ']的提取档案' });
    // const url = 'previewController/getShareInfoByZJHMEleID.do'
    const ret$ = post("previewController/getShareInfoByZJHMEleID.do" /* getArccodeByXM */, { data }, { notify: false })
        .pipe(tap(() => {
        // @ts-ignore
        App.unblockUI();
    }), tap(res => {
        if (res.msg) {
            throw new Error(res.msg);
        }
        else if (!res.dat || !res.dat.length) {
            throw new Error('');
        }
    }), map(res => res.dat));
    return ret$;
}
/** 根据 EleId 和 ArcCode 获取图片 */
export function getArcImg(data) {
    // @ts-ignore
    App.blockUI({ boxed: true, message: '正在展示图片信息' });
    // const url = 'previewController/getThumbnailBig.do'
    return post("previewController/getThumbnailBig.do" /* getArcImg */, {
        data: {
            P_JSON: JSON.stringify(data),
        },
    }, { notify: false })
        .pipe(tap(() => {
        // @ts-ignore
        App.unblockUI();
    }), tap(res => {
        if (!res.dat || res.msg) {
            throw new Error(res.msg ? res.msg : '元素下无照片');
        }
    }), map(res => JSON.parse(res.dat)), tap(row => {
        if (row.errorCode !== '00000' || row.errorInfo !== '交易成功') {
            const msg = '代码：' + (row.errorInfo ? row.errorInfo : '未知');
            throw new Error(msg);
        }
        if (!row.content || !row.content.length) { // 该元素下没有照片
            const msg = '元素下无照片';
            throw new Error(msg);
        }
    }), map(row => row.content));
}
/** 房管局图片来源 */
export function getHouseImgByXM(data) {
    // const url = 'previewController/getImgByXMZJHM.do'
    return post("previewController/getImgByXMZJHM.do" /* getHouseImgByXM */, { data })
        .pipe(tap(res => {
        if (!res.dat || !res.dat.length) {
            throw new Error('获取结果空');
        }
        else if (res.msg) {
            throw new Error(res.msg);
        }
    }), map(res => res.dat));
}
/** 根据用户信息获取标准档案到档案袋 */
export function saveToDaPackage(data) {
    // const url = 'previewController/saveToDaPackage.do'
    return post("previewController/saveToDaPackage.do" /* saveToDaPackage */, { data })
        .pipe(tap(res => {
        if (res.msg) {
            UItoastr({
                type: 'warning',
                title: res.msg,
                msg: '',
                onlyOne: true,
                timeOut: 2000,
            });
        }
    }), filter(res => {
        if (res.msg) {
            return false;
        }
        else {
            return true;
        }
    }), map(res => res.dat));
}
/** 处理标准档案证照 */
export function dealWithCritEvent(arcEvent, arcCode, dialogCtx, uiOpts, criterTag) {
    if (!criterTag) {
        return of(arcCode);
    }
    const extInfo = arcEvent.payload.externalInfo;
    if (typeof extInfo === 'undefined' || !Object.keys(extInfo).length) {
        UItoastr({
            type: 'warning',
            title: '未配置单位/个人用户信息',
            msg: '',
            onlyOne: true,
            className: 'fetch-arc-code',
            timeOut: 2000,
        });
        return of(arcCode);
    }
    const arc = { ARCCODE: arcCode };
    const data = Object.assign({}, arc, extInfo);
    return saveToDaPackage(data).pipe(tap(dat => {
        if (!dat.length) {
            // UItoastr({ type: 'warning', title: '无标准证照档案', onlyOne: true })
            return;
        }
        else {
            const ret = [];
            const tip = [];
            for (const ele of dat) {
                ret.push({
                    ELEID: ele.ELEID,
                    NUM: ele.NUM,
                });
                tip.push(ele.ELENAME);
            }
            updateImgMemoBatch(dialogCtx, uiOpts, ret);
            UItoastr({
                type: 'success',
                title: '',
                msg: `[${tip.join(',')}]已标准证照成功`,
                onlyOne: true,
                className: 'fetch-arc-code',
                timeOut: 2000,
            });
        }
    }), mapTo(arcCode));
}
