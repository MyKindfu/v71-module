import { of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { blankImgURL } from './config';
import { bindMouseDownEvent, bindMouseUpEvent } from './event';
export function initClipContainer(dialogCtx, uiOpts) {
    const rxcamCon = dialogCtx.querySelector(uiOpts.rxcamContainer);
    if (rxcamCon) {
        const html = [];
        html.push(`
      <div class="clip_container">
        <div class="clip_box clip_box_top"></div>
        <div class="clip_box clip_box_left"></div>
        <div class="clip_box clip_box_center">
            <div class="clip_box_size"></div>
            <div class="clip_box_handle"></div>
        </div>
        <div class="clip_box clip_box_right"></div>
        <div class="clip_box clip_box_bottom"></div>
      </div>
    `);
        $(rxcamCon).prepend(html.join(''));
    }
}
const dialog = document.querySelector('#comm_dialog_arc_capture');
bindMouseDownEvent(dialog).subscribe(mEvent => {
    const elemt = (mEvent && mEvent.target);
    const self = {
        x: 0,
        y: 0,
    };
    if (elemt.matches('.clip_box_size')) { // 拖动
        const clip = dialog.querySelector('.clip_box_center');
        self.x = mEvent.clientX - clip.offsetLeft;
        self.y = mEvent.clientY + document.documentElement.scrollTop - clip.offsetTop;
        try {
            mEvent.preventDefault();
        }
        catch (o) {
            mEvent.returnValue = false;
        }
        document.onmousemove = () => {
            const rxcamCon = dialog.querySelector('.clip_container');
            const maskCenter = dialog.querySelector('.clip_box_center');
            const e = event;
            let top = e.clientY + document.documentElement.scrollTop - self.y;
            let left = e.clientX - self.x;
            top = Math.max(top, 0);
            left = Math.max(left, 0);
            top = Math.min(top, $(rxcamCon).height() - maskCenter.offsetHeight);
            left = Math.min(left, $(rxcamCon).width() - maskCenter.offsetWidth);
            setMaskStyle(top, left);
        };
    }
    else if (elemt.matches('.clip_box_handle')) { // 拉伸
        const handle = dialog.querySelector('.clip_box_handle');
        const rxcamCon = dialog.querySelector('.clip_container');
        const maskCenter = dialog.querySelector('.clip_box_center');
        self.x = mEvent.clientX - handle.offsetLeft;
        self.y = mEvent.clientY + document.documentElement.scrollTop - handle.offsetTop;
        try {
            mEvent.preventDefault();
        }
        catch (o) {
            mEvent.returnValue = false;
        }
        try {
            mEvent.stopPropagation();
        }
        catch (o) {
            mEvent.cancelBubble = true;
        }
        document.onmousemove = () => {
            const e = event;
            let top = e.clientY + document.documentElement.scrollTop - self.y;
            let left = e.clientX - self.x;
            top = Math.max(top, 0);
            left = Math.max(left, 0);
            const wPoor = $(rxcamCon).width() - maskCenter.offsetLeft;
            const hPoor = $(rxcamCon).height() - maskCenter.offsetTop;
            top = top + 10 > hPoor ? hPoor - 10 : top;
            left = left + 10 > wPoor ? wPoor - 10 : left;
            setHandleStyle(top, left);
        };
    }
});
bindMouseUpEvent(dialog).subscribe(() => {
    document.onmousemove = null;
});
export function setHandleStyle(top, left) {
    const clipHandle = dialog.querySelector('.clip_box_handle');
    const maskCenter = dialog.querySelector('.clip_box_center');
    clipHandle.style.top = top + 'px';
    clipHandle.style.left = left + 'px';
    maskCenter.style.width = (left + 10) + 'px';
    maskCenter.style.height = (top + 10) + 'px';
    setMaskStyle(maskCenter.offsetTop, maskCenter.offsetLeft);
}
/** 根据剪裁框大小确定位置 */
export function getClipBoxArg(width, height, clipX, clipY) {
    const rxcamCon = dialog.querySelector('.clip_container');
    const maskCenter = dialog.querySelector('.clip_box_center');
    const conWidth = $(rxcamCon).width();
    const conHeight = $(rxcamCon).height();
    const clipWidth = Math.min(conWidth, width);
    const clipHeight = Math.min(conHeight, height);
    $(maskCenter).width(clipWidth);
    $(maskCenter).height(clipHeight);
    clipX = typeof clipX === 'undefined' ? (conWidth - clipWidth) / 2 : Math.min(conWidth - clipWidth, clipX);
    clipY = typeof clipY === 'undefined' ? (conHeight - clipHeight) / 2 : Math.min(conHeight - clipHeight, clipY);
    setMaskStyle(clipY, clipX);
}
/** 根据X,Y坐标确定剪裁框  */
export function setMaskStyle(top, left) {
    const rxcamCon = dialog.querySelector('.clip_container');
    const maskTop = dialog.querySelector('.clip_box_top');
    const maskLeft = dialog.querySelector('.clip_box_left');
    const maskRight = dialog.querySelector('.clip_box_right');
    const maskBottom = dialog.querySelector('.clip_box_bottom');
    const maskCenter = dialog.querySelector('.clip_box_center');
    const conWidth = $(rxcamCon).width();
    const conHeight = $(rxcamCon).height();
    maskTop.style.height = top + 'px';
    maskBottom.style.height = conHeight - top - maskCenter.offsetHeight + 'px';
    maskLeft.style.top = maskRight.style.top = maskCenter.style.top = top + 'px';
    maskLeft.style.width = maskCenter.style.left = left + 'px';
    maskRight.style.width = conWidth - left - maskCenter.offsetWidth + 'px';
    maskLeft.style.height = maskRight.style.height = maskCenter.offsetHeight + 'px';
}
/** 图片剪裁 */
export function clipImg() {
    const saleRate = {
        clipLeft: 0,
        clipTop: 0,
        clipRight: 0,
        clipBottom: 0,
    };
    const rxcamCon = dialog.querySelector('.clip_container');
    const maskCenter = dialog.querySelector('.clip_box_center');
    const conWidth = $(rxcamCon).width();
    const conHeight = $(rxcamCon).height();
    const boxWidth = $(maskCenter).width();
    const boxHeight = $(maskCenter).height();
    const boxLft = maskCenter.offsetLeft;
    const boxTop = maskCenter.offsetTop;
    const rateLeft = boxLft / conWidth;
    const rateTop = boxTop / conHeight;
    const rateRight = (conWidth - boxLft - boxWidth) / conWidth;
    const rateBottom = (conHeight - boxTop - boxHeight) / conHeight;
    saleRate.clipLeft = Math.max(rateLeft, 0);
    saleRate.clipTop = Math.max(rateTop, 0);
    saleRate.clipRight = Math.max(rateRight, 0);
    saleRate.clipBottom = Math.max(rateBottom, 0);
    return saleRate;
}
export function getClipImgUrl(dialogCtx, uiOpts, imgRet) {
    const imgContainer = dialogCtx.querySelector(uiOpts.rxcamContainer);
    const imgWidth = imgRet.options.width;
    const imgHeight = imgRet.options.height;
    const rate = clipImg();
    const clipLeft = Math.floor(rate.clipLeft * imgRet.options.width);
    const clipTop = Math.floor(rate.clipTop * imgRet.options.height);
    const clipRight = rate.clipRight * imgRet.options.width;
    const clipBottom = rate.clipBottom * imgRet.options.height;
    const clipWidth = Math.floor(imgWidth - clipLeft - clipRight);
    const clipHeight = Math.floor(imgHeight - clipTop - clipBottom);
    const drawImgArg = {
        drawLeft: clipLeft,
        drawTop: clipTop,
        drawWidth: clipWidth,
        drawheight: clipHeight,
    };
    if (imgRet.options.rotate === 90) {
        drawImgArg.drawLeft = clipBottom;
        drawImgArg.drawTop = clipLeft;
        drawImgArg.drawWidth = clipHeight;
        drawImgArg.drawheight = clipWidth;
    }
    else if (imgRet.options.rotate === -90) {
        drawImgArg.drawLeft = clipTop;
        drawImgArg.drawTop = clipRight;
        drawImgArg.drawWidth = clipHeight;
        drawImgArg.drawheight = clipWidth;
    }
    else if (imgRet.options.rotate === 180) {
        drawImgArg.drawLeft = clipRight;
        drawImgArg.drawTop = clipBottom;
        drawImgArg.drawWidth = clipWidth;
        drawImgArg.drawheight = clipHeight;
    }
    const clipCanvas = document.createElement('canvas');
    const ctx = clipCanvas.getContext('2d');
    if (!ctx) {
        console.error('无法获取到画布，剪裁失败');
        return of(null);
    }
    const hostImg = new Image();
    hostImg.src = imgRet.url;
    hostImg.onload = () => {
        clipCanvas.width = drawImgArg.drawWidth;
        clipCanvas.height = drawImgArg.drawheight;
        ctx.drawImage(hostImg, drawImgArg.drawLeft, drawImgArg.drawTop, drawImgArg.drawWidth, drawImgArg.drawheight, 0, 0, drawImgArg.drawWidth, drawImgArg.drawheight);
        const url = clipCanvas.toDataURL();
        if (url) {
            ctx.stroke();
        }
        const clipWarp = imgContainer.querySelector(imgRet.options.previewSnapRetSelector);
        clipWarp.src = url;
    };
    return of(null);
}
/** 获取减剪裁后数据 */
export function handleClip(dialogCtx, uiOpts, imgRet) {
    return getClipImgUrl(dialogCtx, uiOpts, imgRet).pipe(delay(500), map(_ => {
        const img = dialogCtx.querySelector(imgRet.options.previewSnapRetSelector);
        const url = img.src || imgRet.url;
        const width = img.naturalWidth || imgRet.options.width;
        const height = img.naturalHeight || imgRet.options.height;
        const options = Object.assign({}, imgRet.options, { width, height });
        const clipImgObj = { url, options };
        img.src = blankImgURL;
        return Object.assign({}, imgRet, clipImgObj);
    }));
}
/** 保存到 saveLocalStorage */
export function saveLocalStorage(dialogCtx) {
    const maskCenter = dialogCtx.querySelector('.clip_box_center');
    const boxWidth = $(maskCenter).width();
    const boxHeight = $(maskCenter).height();
    const boxLft = maskCenter.offsetLeft;
    const boxTop = maskCenter.offsetTop;
    const arg = {
        width: Math.round(boxWidth),
        height: Math.round(boxHeight),
        clipX: Math.round(boxLft),
        clipY: Math.round(boxTop),
    };
    // @ts-ignore
    const oldArg = getLocalStorage('clipConfig') || {};
    if (Object.values(oldArg).toString() !== Object.values(arg).toString()) {
        // @ts-ignore
        setLocalStorage('clipConfig', arg);
    }
}
