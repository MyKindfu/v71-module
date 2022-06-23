/**
 * 档案 公共扫描
 *
 * @author: luoxiao
 * @date: 2019/08/20
 */
import { info, log } from '@waiting/log';
import { from, of } from 'rxjs';
import { catchError, mapTo, mergeMap, reduce, tap } from 'rxjs/operators';
import UUID from 'uuidjs';
import { postArcImg } from '../arc';
import { UItoastr } from '../shared';
import { setcommonScanBtnAvailable, setBtnGroupToggle, setElmsValidState, updateImgMemo } from './ui';
// 高扫计数
let commonScanNum = 0;
let getImageNum = 0;
/** 保存选中的图片 */
export function saveCommonScan(dialogCtx, uiOpts, arcCode, userName) {
    const commonScanImgBox = dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector);
    const imgs = commonScanImgBox.querySelectorAll('img.check-true');
    if (imgs.length === 0) {
        UItoastr({ type: 'warning', title: '请选择需要保存的扫描图片', msg: '' });
        return of(null);
    }
    if (!arcCode) {
        UItoastr({ type: 'warning', title: '未获取到ARCCODE', msg: '' });
        return of(null);
    }
    if (!userName) {
        UItoastr({ type: 'warning', title: '未获取到操作员信息', msg: '' });
        return of(null);
    }
    const arcPkgType = dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor);
    const arcTypeSelectedData = $(arcPkgType).val();
    if (!arcTypeSelectedData) {
        UItoastr({ type: 'warning', title: '请选择档案采集类型', msg: '' });
        return of(null);
    }
    // 遍历图片
    /*  imgs.forEach((val, idx, array) => {
   
       const ImgBase64 = val.src
       if (ImgBase64) {
         uploadCommonScanImg(dialogCtx, uiOpts, arcTypeSelectedData, ImgBase64, arcCode, userName)
       }
   
     }) */
    const pdata = {
        arcCode,
        creater: userName,
        ELEID: arcTypeSelectedData ? +arcTypeSelectedData : 0,
    };
    // @ts-ignore
    App.blockUI({ boxed: true, message: '正在保存图片到服务器，请稍后...' });
    // 将遍历到的图片保存到服务器
    const ret$ = from(imgs).pipe(mergeMap(param => saveArcImg2(dialogCtx, uiOpts, pdata, param, param.src), 1), tap(data => {
        info(['图片保存成功', data]);
    }), mapTo(null), reduce((acc, curr) => {
        acc = acc + 1;
        return acc;
    }, 0), tap(data => {
        UItoastr({
            type: 'success',
            title: '档案图片保存成功,共计上传' + data + '张',
            msg: '',
            onlyOne: true,
        });
        info(['档案图片保存成功']);
        // @ts-ignore
        App.unblockUI();
    }), mapTo(null), catchError((err) => {
        info(['档案图片保存失败', err]);
        UItoastr({
            type: 'error',
            title: '档案图片保存失败',
            msg: '',
        });
        // @ts-ignore
        App.unblockUI();
        return of(null);
    }));
    return ret$;
}
/** 发送图片到服务器 原档案saveArcImg 这里需要删除DOM所以独立 */
export function saveArcImg2(dialogCtx, uiOpts, data, imgEle, imgUrl) {
    // 发送imgUrl 包括 base64 头部
    setElmsValidState(dialogCtx, uiOpts, false);
    const arcPkgTypeId = data.ELEID;
    const ret$ = postArcImg(data, imgUrl).pipe(tap(() => {
        // 删除已经成功的图片，避免后续发送服务器出错，二次保存问题
        const commonScanList = imgEle.closest('.common-scan-list');
        commonScanList.remove();
        updateImgMemo(dialogCtx, uiOpts, arcPkgTypeId); // 更新采集类型对应的已采集计数器
        setElmsValidState(dialogCtx, uiOpts, true);
        // 查询还剩多少张图片，没有则关闭扫描窗体
        const commonScanImgBox = dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector);
        const imgs = commonScanImgBox.querySelectorAll('img.common-scan-img');
        // 如果没有图片了，则关闭扫描窗口
        if (imgs.length === 0) {
            commonScanClose(dialogCtx, uiOpts); // 关闭扫描窗体
        }
    }), catchError(err => {
        setElmsValidState(dialogCtx, uiOpts, true);
        throw err;
    }));
    return ret$;
}
/** 开始扫描并打开窗口 */
export function openCommonScan(dialogCtx, uiOpts, arcCode) {
    const commonScanBtn = dialogCtx.querySelector(uiOpts.commonScanSelector);
    if (commonScanBtn.classList.contains('disabled')) {
        return;
    }
    if (!arcCode) {
        UItoastr({ type: 'warning', title: '未获取到ARCCODE', msg: '' });
        return;
    }
    const arcPkgType = dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor);
    const arcTypeSelectedData = $(arcPkgType).val();
    if (!arcTypeSelectedData) {
        UItoastr({ type: 'warning', title: '请选择档案采集类型', msg: '' });
        return;
    }
    try {
        // 公共扫描 定义websocket路径
        const commonScanWs = new WebSocket('ws://127.0.0.1:8844/gjj-api/scanner/');
        keepCommonScanWebsocket(dialogCtx, uiOpts, commonScanWs);
    }
    catch (ex) {
        console.info(ex);
        UItoastr({ type: 'error', title: '服务错误，请检查扫描服务状态！', msg: '' });
        setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
    }
}
/** 监控公共扫描websocket状态 */
export function keepCommonScanWebsocket(dialogCtx, uiOpts, commonScanWs) {
    setcommonScanBtnAvailable(dialogCtx, uiOpts, false); // 公共扫描按钮禁用
    // 获取随机数uuid用于扫描进程
    const scan_uuid = UUID.generate();
    if (commonScanWs) {
        commonScanWs.onopen = (evt) => {
            log('公共扫描服务连接已启动 ...');
            commonScanWs.send('{\"action\":\"doscan\",\"wrkno\":\"' + scan_uuid + '\"}');
            // @ts-ignore
            App.blockUI({ boxed: true, message: '扫描中，请稍后...' });
        };
        commonScanWs.onmessage = (evt) => {
            log('返回扫描服务结果!');
            // log('返回扫描服务结果: ' + evt.data)
            if (evt && evt.data) {
                const ws_data = JSON.parse(evt.data);
                // 获取扫描信息及图片列表
                if (ws_data && ws_data.wrkimgs.length > 0 && ws_data.action === 'doscan') {
                    // 显示扫描内容窗
                    setBtnGroupToggle(dialogCtx, uiOpts, 'common-scan');
                    $(dialogCtx.querySelector(uiOpts.commonScanContainerSelector)).removeClass('hidden');
                    $(dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector)).empty();
                    // 更新扫描图片数
                    commonScanNum = ws_data.wrkimgs.length;
                    // 获取图片
                    getCommonScanImg(commonScanWs, ws_data.wrkimgs, ws_data.wrkno);
                    // UItoastr({ type: 'warning', title: '扫描成功，请等待图片加载完毕...', msg: '' })
                }
                // 获取图片base64
                else if (ws_data && ws_data.wrkimgs.length > 0 && ws_data.action === 'getimage') {
                    // 渲染图片
                    showCommonScanArcImg(dialogCtx, uiOpts, commonScanWs, ws_data.wrkimgs[0]);
                }
                // 未扫描到图片
                else if (ws_data && ws_data.wrkimgs.length === 0 && ws_data.action === 'doscan') {
                    UItoastr({ type: 'error', title: '未发现纸张或扫描仪状态异常，请检查！', msg: '' });
                    // @ts-ignore
                    App.unblockUI();
                    setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
                    // 关闭websocket链接
                    commonScanWs.close();
                    getImageNum = 0;
                    getImageNum = 0;
                }
                else {
                    UItoastr({ type: 'error', title: '扫描服务返回错误', msg: ws_data ? ws_data : '' });
                    // @ts-ignore
                    App.unblockUI();
                    setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
                    // 关闭websocket链接
                    commonScanWs.close();
                    getImageNum = 0;
                    getImageNum = 0;
                }
            }
            else {
                UItoastr({ type: 'error', title: '扫描服务返回错误', msg: evt && evt.data ? evt.data : '' });
                // @ts-ignore
                App.unblockUI();
                setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
                // 关闭websocket链接
                commonScanWs.close();
                getImageNum = 0;
                getImageNum = 0;
            }
        };
        commonScanWs.onerror = (evt) => {
            UItoastr({ type: 'error', title: '服务连接错误，请检查扫描服务状态！', msg: '' });
            // @ts-ignore
            App.unblockUI();
            setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
            // 关闭websocket链接
            commonScanWs.close();
            getImageNum = 0;
            getImageNum = 0;
        };
        commonScanWs.onclose = (evt) => {
            log('公共扫描服务连接已关闭');
            // @ts-ignore
            App.unblockUI();
            setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
            getImageNum = 0;
            getImageNum = 0;
        };
    }
}
/** 根据扫描结果获取扫描图片 */
export function getCommonScanImg(commonScanWs, wrkimgs, wrkno) {
    if (wrkimgs) {
        wrkimgs.forEach((val, idx, array) => {
            if (val) {
                commonScanWs.send('{\"action\":\"getimage\",\"wrkno\":\"' + wrkno + '\",\"imgsrc\":\"' + val + '\"}');
            }
        });
    }
}
/** 展示扫描图片 */
export function showCommonScanArcImg(dialogCtx, uiOpts, commonScanWs, img64) {
    const commonScanImgBox = dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector);
    if (img64) {
        const html = '<div class="col-xs-12 col-md-6 common-scan-list">' +
            '<i class="check-mark hidden fa fa-check-circle" aria-hidden="true"></i>' +
            '<div class="common-scan-img-content"><img class="common-scan-img" src="data:image/jpg;base64,' +
            img64 + '"></div></div>';
        commonScanImgBox.innerHTML = commonScanImgBox.innerHTML + html;
        getImageNum = getImageNum + 1;
        // 对比扫描到的图片数量与生成图片数量
        if (commonScanNum === getImageNum) {
            UItoastr({ type: 'success', title: '图片扫描成功,共计扫描' + commonScanNum + '张！', msg: '', onlyOne: true });
            // @ts-ignore
            App.unblockUI();
            setcommonScanBtnAvailable(dialogCtx, uiOpts, true); // 公共扫描按钮取消禁用
            // 关闭websocket链接
            commonScanWs.close();
            getImageNum = 0;
            getImageNum = 0;
        }
    }
}
/** 选择图片 */
export function checkCommonScanImg(element) {
    const warp = element.closest('.common-scan-list');
    const checkMark = warp.querySelector('.check-mark');
    const imgContent = warp.querySelector('.common-scan-img-content');
    if (checkMark) {
        checkMark.classList.toggle('hidden');
        element.classList.toggle('check-true');
        imgContent.classList.toggle('check-true');
    }
}
/** 全选 */
export function checkSquareCommonScanImg(dialogCtx) {
    dialogCtx.querySelectorAll('.common-scan-list')
        .forEach(element => {
        const checkMark = element.querySelector('.check-mark');
        const checkImg = element.querySelector('.common-scan-img');
        const imgContent = element.querySelector('.common-scan-img-content');
        if (checkMark) {
            checkMark.classList.remove('hidden');
            checkImg.classList.add('check-true');
            imgContent.classList.add('check-true');
        }
    });
}
/** 取消公共扫描窗口 */
export function commonScanCancel(dialogCtx, uiOpts) {
    if (!confirm('确认取消本次扫描吗?取消后，本次扫描记录将被清空。')) {
        return;
    }
    commonScanClose(dialogCtx, uiOpts);
}
/** 关闭公共扫描窗口 */
export function commonScanClose(dialogCtx, uiOpts) {
    const box = dialogCtx.querySelector(uiOpts.commonScanContainerSelector);
    if (box) {
        setBtnGroupToggle(dialogCtx, uiOpts, '');
        box.classList.add('hidden');
        $(dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector)).empty();
    }
}
/** 旋转公共扫描图片 */
export function rotateImgCommonScan(dialogCtx, uiOpts, rotateImgBtn, angle) {
    if (rotateImgBtn.classList.contains('disabled')) {
        return of(null);
    }
    const commonScanImgBox = dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector);
    const imgs = commonScanImgBox.querySelectorAll('img.check-true');
    if (imgs.length === 0) {
        UItoastr({ type: 'warning', title: '请选择需要进行旋转的扫描图片', msg: '' });
        return of(null);
    }
    // 按钮disabled
    switch (rotateImgBtn.nodeName) {
        case 'LABEL':
            rotateImgBtn.classList.add('disabled');
            break;
        default: {
            const label = rotateImgBtn.closest('label' + uiOpts.commonScanSelector);
            if (label) {
                rotateImgBtn.classList.add('disabled');
            }
            break;
        }
    }
    // @ts-ignore
    App.blockUI({ boxed: true, message: '旋转图片中，请稍后...' });
    // 将遍历到的图片进行旋转
    const ret$ = from(imgs).pipe(mergeMap(param => rotateBase64Img(param, angle), 5), tap(data => {
        info(['图片旋转成功', data]);
    }), mapTo(null), reduce((acc, curr) => {
        acc = acc + 1;
        return acc;
    }, 0), tap(data => {
        UItoastr({
            type: 'success',
            title: '图片旋转成功,共计旋转' + data + '张',
            msg: '',
            onlyOne: true,
        });
        info(['图片旋转成功,共计旋转' + data + '张']);
        // @ts-ignore
        App.unblockUI();
        // 按钮取消disabled
        switch (rotateImgBtn.nodeName) {
            case 'LABEL':
                rotateImgBtn.classList.remove('disabled');
                break;
            default: {
                const label = rotateImgBtn.closest('label' + uiOpts.commonScanSelector);
                if (label) {
                    rotateImgBtn.classList.remove('disabled');
                }
                break;
            }
        }
    }), mapTo(null), catchError((err) => {
        info(['图片旋转失败', err]);
        UItoastr({
            type: 'error',
            title: '图片旋转失败',
            msg: '',
        });
        // @ts-ignore
        App.unblockUI();
        // 按钮取消disabled
        switch (rotateImgBtn.nodeName) {
            case 'LABEL':
                rotateImgBtn.classList.remove('disabled');
                break;
            default: {
                const label = rotateImgBtn.closest('label' + uiOpts.commonScanSelector);
                if (label) {
                    rotateImgBtn.classList.remove('disabled');
                }
                break;
            }
        }
        return of(null);
    }));
    return ret$;
}
/** 旋转base64图片 */
export function rotateBase64Img(imgEle, edg) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('无法获取到画布，转换失败');
        return of(null);
    }
    const ImgBase64 = imgEle.src;
    let imgW = 0; // 图片宽度
    let imgH = 0; // 图片高度
    let size = 0; // canvas初始大小
    if (edg % 90 !== 0) {
        console.error('旋转角度必须是90的倍数!');
        return of(null);
    }
    (edg < 0) && (edg = (edg % 360) + 360);
    const quadrant = (edg / 90) % 4; // 旋转象限
    const cutCoor = { sx: 0, sy: 0, ex: 0, ey: 0 }; // 裁剪坐标
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = ImgBase64;
    image.onload = () => {
        imgW = image.width;
        imgH = image.height;
        size = imgW > imgH ? imgW : imgH;
        canvas.width = size * 2;
        canvas.height = size * 2;
        switch (quadrant) {
            case 0:
                cutCoor.sx = size;
                cutCoor.sy = size;
                cutCoor.ex = size + imgW;
                cutCoor.ey = size + imgH;
                break;
            case 1:
                cutCoor.sx = size - imgH;
                cutCoor.sy = size;
                cutCoor.ex = size;
                cutCoor.ey = size + imgW;
                break;
            case 2:
                cutCoor.sx = size - imgW;
                cutCoor.sy = size - imgH;
                cutCoor.ex = size;
                cutCoor.ey = size;
                break;
            case 3:
                cutCoor.sx = size;
                cutCoor.sy = size - imgW;
                cutCoor.ex = size + imgH;
                cutCoor.ey = size + imgW;
                break;
        }
        ctx.translate(size, size);
        ctx.rotate(edg * Math.PI / 180);
        ctx.drawImage(image, 0, 0);
        const imgData = ctx.getImageData(cutCoor.sx, cutCoor.sy, cutCoor.ex, cutCoor.ey);
        if (quadrant % 2 === 0) {
            canvas.width = imgW;
            canvas.height = imgH;
        }
        else {
            canvas.width = imgH;
            canvas.height = imgW;
        }
        ctx.putImageData(imgData, 0, 0);
        // 将图片换成旋转后的
        imgEle.src = canvas.toDataURL('image/jpeg', 0.8);
    };
    return of(null);
}
