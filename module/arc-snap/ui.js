import { timer } from 'rxjs';
import { mapTo, tap } from 'rxjs/operators';
import { blankImgURL } from './config';
/** 初始化模态框各标签按钮样式 */
export function initUI(dialogCtx, uiOpts) {
    // const dialogCtx = initialArcConfigs.dialogCtx
    showImg(dialogCtx, uiOpts, ''); // 清空结果图片
    // 清空采集类型下拉
    $(dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor)).empty().trigger('change');
    // 清空保存结果统计
    $(dialogCtx.querySelector(uiOpts.uploadMemoSelector)).empty();
    // 隐藏共享窗口
    $(dialogCtx.querySelector(uiOpts.shareContainerSelector)).addClass('hidden');
    $(dialogCtx.querySelector(uiOpts.shareImgBoxSelector)).empty();
    // 操作按钮显示
    $(dialogCtx.querySelector(uiOpts.takePhotoSelector)).removeClass('hidden');
    $(dialogCtx.querySelector(uiOpts.idcCompositeSelector)).removeClass('hidden');
    $(dialogCtx.querySelector(uiOpts.selectLocalFileSelector)).removeClass('hidden');
    //
    const clip = dialogCtx.querySelector('.clip_container');
    if (clip) {
        clip.classList.remove('hidden');
    }
    // 共享按钮隐藏
    $(dialogCtx.querySelector(uiOpts.shareBtnGroupSelector)).addClass('hidden');
    // 公共扫描按钮
    $(dialogCtx.querySelector(uiOpts.commonScanSelector)).removeClass('hidden');
    $(dialogCtx.querySelector(uiOpts.commonScanBtnGroupSelector)).addClass('hidden');
    // 隐藏公共扫描窗口
    $(dialogCtx.querySelector(uiOpts.commonScanContainerSelector)).addClass('hidden');
    $(dialogCtx.querySelector(uiOpts.commonScanImgBoxSelector)).empty();
    dialogCtx.querySelectorAll('input[type=radio],input[type=checkbox]')
        .forEach(input => {
        const pClassList = input.parentElement.classList;
        if (input.checked) {
            if (pClassList.contains('btn-form-radio') ||
                pClassList.contains('btn-form-checkbox')) {
                pClassList.add('active');
            }
        }
        else {
            if (pClassList.contains('btn-form-radio') || pClassList.contains('btn-form-checkbox')) {
                pClassList.remove('active');
            }
        }
    });
}
/** 根据摄像头个数生成对应label切换按钮 */
export function genCamSelectLabels(dialogCtx, uiOpts, camCount) {
    if (camCount <= 1) {
        return;
    }
    const html = [];
    for (let i = 0; i < camCount; i++) {
        const active = i === 0 ? ' active' : '';
        const checked = i === 0 ? ' checked' : '';
        html.push(`
      <label class="btn btn-default btn-form-radio connect-cam cam-sidx-radio ${active}">
        <input type="radio" name="cam_select_radio" value="${i}" ${checked}>视频 ${i + 1}</label>`);
    }
    // 摄像头切换按钮容器
    const container = dialogCtx.querySelector(uiOpts.camSelectLabelsSelector);
    container.innerHTML = html.join('');
}
/** 根据摄像头序号读取保存的旋转角度值并更新对应的按钮样式及input选项值 */
export function updateCamSelectLabelActive(dialogCtx, uiOpts, sidx, rotate) {
    const curLabel = dialogCtx.querySelector(uiOpts.labelRotateSelector + '.active');
    const curInput = curLabel ? curLabel.querySelector('input[type=radio]') : null;
    if (curInput) {
        if (+curInput.value === rotate) {
            return;
        }
        curInput.checked = false;
        curLabel.classList.remove('active');
    }
    const targetInput = dialogCtx.querySelector(uiOpts.labelRotateSelector + ` > input[value="${rotate}"]`);
    if (targetInput) {
        targetInput.checked = true;
        const label = targetInput.closest(uiOpts.labelRotateSelector);
        label && label.classList.add('active');
    }
}
/** 读取当前旋转值保存到摄像头采集旋转角度列表 用于更新UI按钮 */
export function updateCamRotateMap(dialogCtx, uiOpts, sidx) {
    const input = dialogCtx.querySelector(uiOpts.labelRotateSelector + ' > input:checked');
    const rotate = input ? +input.value : 0;
    return rotate;
}
/** 在采集结果区域显示图片 */
export function showImg(dialogCtx, uiOpts, url) {
    const previewImg = dialogCtx.querySelector(uiOpts.snapRetSelector);
    if (previewImg && previewImg.nodeName === 'IMG') {
        previewImg.src = url ? url : blankImgURL;
    }
}
/** 切换设置多个控制按钮、下拉的可用状态 */
export function setElmsValidState(dialogCtx, uiOpts, valid) {
    setArcPkgTypeSelectValidState(dialogCtx, uiOpts, valid); // 采集类型下拉
    setBtnValidState(dialogCtx, uiOpts, valid); // 采集按钮
    // setIdcBtnAvailable(dialogCtx, uiOpts, valid) // 二代证采集合成
    setBtnGroupValidState(dialogCtx, uiOpts, valid); // 采集参数按钮
    setCloseBtnState(dialogCtx, uiOpts, valid); // 模态框关闭按钮
}
/** 设置模态框关闭按钮 禁用/有效 状态 */
export function setCloseBtnState(dialogCtx, uiOpts, valid) {
    const btns = dialogCtx.querySelectorAll(uiOpts.closeBtnSelector);
    btns.forEach(btn => (btn.disabled = valid ? false : true));
}
/** 设置radio/checkbox选择按钮钮父级LABEL 禁用/有效 状态 */
export function setBtnGroupValidState(dialogCtx, uiOpts, valid) {
    dialogCtx.querySelectorAll(uiOpts.btnGrorpSelector)
        .forEach(node => {
        const elm = node.parentElement;
        if (!elm) {
            return;
        }
        if (elm.nodeName === 'LABEL') {
            if (valid) {
                elm.classList.remove('disabled');
            }
            else {
                elm.classList.add('disabled');
            }
        }
        else if (elm.nodeName === 'INPUT') {
            elm.disabled = valid ? false : true;
        }
    });
}
/** 设置拍照按钮 禁用/有效 状态 */
export function setBtnValidState(dialogCtx, uiOpts, valid) {
    const elm = dialogCtx.querySelector(uiOpts.takePhotoSelector);
    switch (elm.nodeName) {
        case 'LABEL':
            valid ? elm.classList.remove('disabled') : elm.classList.add('disabled');
            break;
        default: {
            const label = elm.closest('label' + uiOpts.takePhotoSelector);
            if (label) {
                valid ? label.classList.remove('disabled') : label.classList.add('disabled');
            }
            break;
        }
    }
}
/** 设置二代证采集合成照 禁用/有效 状态 */
export function setIdcBtnAvailable(dialogCtx, uiOpts, valid) {
    const elm = dialogCtx.querySelector(uiOpts.idcCompositeSelector);
    switch (elm.nodeName) {
        case 'LABEL':
            valid ? elm.classList.remove('disabled') : elm.classList.add('disabled');
            break;
        default: {
            const label = elm.closest('label' + uiOpts.idcCompositeSelector);
            if (label) {
                valid ? label.classList.remove('disabled') : label.classList.add('disabled');
            }
            break;
        }
    }
}
/** 设置公共扫描按钮 禁用/有效 状态 */
export function setcommonScanBtnAvailable(dialogCtx, uiOpts, valid) {
    const elm = dialogCtx.querySelector(uiOpts.commonScanSelector);
    switch (elm.nodeName) {
        case 'LABEL':
            valid ? elm.classList.remove('disabled') : elm.classList.add('disabled');
            break;
        default: {
            const label = elm.closest('label' + uiOpts.commonScanSelector);
            if (label) {
                valid ? label.classList.remove('disabled') : label.classList.add('disabled');
            }
            break;
        }
    }
}
/**
 * 设置采集,上传,二代证,共享,扫描 按钮组  隐藏/显示
 * @param opentype: string, share显示共享按钮组 common-scan显示公共扫描按钮组  其他显示初始上传,二代证,共享,扫描按钮
 */
export function setBtnGroupToggle(dialogCtx, uiOpts, opentype) {
    const takePhoto = dialogCtx.querySelector(uiOpts.takePhotoSelector); // 按钮拍照
    const idc = dialogCtx.querySelector(uiOpts.idcCompositeSelector); // 按钮二代证
    // 按钮选择文件
    const selectFile = dialogCtx.querySelector(uiOpts.selectLocalFileSelector);
    const share = dialogCtx.querySelector(uiOpts.latexShareSelector); // 共享按钮
    const shareGroup = dialogCtx.querySelector(uiOpts.shareBtnGroupSelector); // 共享按钮组
    const clip = dialogCtx.querySelector('.clip_container'); // 剪裁
    const commonScan = dialogCtx.querySelector(uiOpts.commonScanSelector); // 扫描按钮
    const commonScanGroup = dialogCtx.querySelector(uiOpts.commonScanBtnGroupSelector); // 扫描按钮组
    const arcCaptureLeft = dialogCtx.querySelector(uiOpts.arcCaptureLeftSelecotr); // 采集模态框左侧
    const arcCaptureRight = dialogCtx.querySelector(uiOpts.arcCaptureRightSelecotr); // 采集模态框右侧
    if (opentype === 'share') { // 显示共享按钮组
        takePhoto.classList.add('hidden');
        idc.classList.add('hidden');
        selectFile.classList.add('hidden');
        share.classList.add('hidden');
        shareGroup.classList.remove('hidden');
        commonScan.classList.add('hidden');
        if (clip) {
            clip.classList.add('hidden');
        }
        commonScanGroup.classList.add('hidden');
        // 隐藏采集模态框右侧 左侧全宽
        arcCaptureLeft.classList.remove('col-lg-8');
        arcCaptureLeft.classList.remove('col-lg-8');
        arcCaptureLeft.classList.add('col-md-12');
        arcCaptureLeft.classList.add('col-lg-12');
        arcCaptureRight.classList.add('hidden');
    }
    else if (opentype === 'common-scan') { // 显示公共扫描按钮组
        takePhoto.classList.add('hidden');
        idc.classList.add('hidden');
        selectFile.classList.add('hidden');
        share.classList.add('hidden');
        shareGroup.classList.add('hidden');
        if (clip) {
            clip.classList.add('hidden');
        }
        commonScan.classList.add('hidden');
        commonScanGroup.classList.remove('hidden');
        // 隐藏采集模态框右侧 左侧全宽
        arcCaptureLeft.classList.remove('col-lg-8');
        arcCaptureLeft.classList.remove('col-lg-8');
        arcCaptureLeft.classList.add('col-md-12');
        arcCaptureLeft.classList.add('col-lg-12');
        arcCaptureRight.classList.add('hidden');
    }
    else { // 初始化 显示初始上传,二代证,共享,扫描按钮
        takePhoto.classList.remove('hidden');
        idc.classList.remove('hidden');
        selectFile.classList.remove('hidden');
        share.classList.remove('hidden');
        shareGroup.classList.add('hidden');
        if (clip) {
            clip.classList.remove('hidden');
        }
        commonScan.classList.remove('hidden');
        commonScanGroup.classList.add('hidden');
        // 隐藏采集模态框右侧 左侧全宽
        arcCaptureLeft.classList.remove('col-md-12');
        arcCaptureLeft.classList.remove('col-lg-12');
        arcCaptureLeft.classList.add('col-lg-8');
        arcCaptureLeft.classList.add('col-lg-8');
        arcCaptureRight.classList.remove('hidden');
    }
}
/** 切换档案采集类型下拉可用状态 */
export function setArcPkgTypeSelectValidState(dialogCtx, uiOpts, valid) {
    const selectElm = dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor);
    selectElm.disabled = valid ? false : true;
}
/** 更新档案袋类型下拉菜单以及初始化类型采集计数器 */
export function updateArcPkgTypeSelect(dialogCtx, uiOpts, data) {
    const selectElm = dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor);
    const $sel = $(selectElm);
    if (data.length) {
        $sel.select2({ data });
        initImgMemo(dialogCtx, uiOpts, data);
    }
    else {
        $sel.empty();
        initImgMemo(dialogCtx, uiOpts, []);
    }
    // fix: FireFox 不能触发
    const ret$ = timer(1000).pipe(tap(() => {
        $sel.trigger('change');
    }), mapTo(true));
    return ret$;
}
/** 生成共享查询年度,2010-到当前年度 */
export function updateShareQuerySelect(dialogCtx, uiOpts) {
    const selectElm = dialogCtx.querySelector(uiOpts.shareQuerySelector);
    const $sel = $(selectElm);
    const data = [];
    const nowYear = new Date().getFullYear();
    for (let i = nowYear; i >= 2010; i--) {
        data.push({
            id: +i,
            text: `${i}年`,
        });
    }
    $sel.select2({ data });
}
/** 更新历史提取下拉菜单 */
export function updateMonDrawHisSelect(dialogCtx, uiOpts, data) {
    const selectElm = dialogCtx.querySelector(uiOpts.drawHisSelector);
    selectElm.classList.remove('hidden');
    const $sel = $(selectElm);
    if (data.length) {
        $sel.select2({ data });
    }
    else {
        $sel.empty();
        $sel.addClass('hidden');
    }
    // fix: FireFox 不能触发
    const ret$ = timer(1000).pipe(tap(() => {
        $sel.trigger('change');
    }), mapTo(true));
    return ret$;
}
/** 根据采集类型生成对应图片采集结果计数 */
export function initImgMemo(dialogCtx, uiOpts, options) {
    const memo = dialogCtx.querySelector(uiOpts.uploadMemoSelector);
    if (!options || !options.length) {
        memo.innerHTML = '';
        return;
    }
    const html = [];
    for (const row of options) {
        if (!row || !row.text || typeof row.id === 'undefined') {
            continue;
        }
        html.push(`<li><span class="arctype-${row.id} bold">0</span> 个： ${row.text} </li>\n`);
    }
    memo.innerHTML = html.join('');
}
/** 更新采集类型对应的已采集计数器 */
export function updateImgMemo(dialogCtx, uiOpts, arcPkgTypeId) {
    const memo = dialogCtx.querySelector(uiOpts.uploadMemoSelector);
    const span = memo.querySelector(`span.arctype-${arcPkgTypeId}`);
    if (span) {
        const count = +span.innerHTML;
        span.innerHTML = (count + 1).toString();
    }
}
/** 标准证照后批量更新采集计数器 */
export function updateImgMemoBatch(dialogCtx, uiOpts, ret) {
    const memo = dialogCtx.querySelector(uiOpts.uploadMemoSelector);
    for (const ele of ret) {
        const span = memo.querySelector(`span.arctype-${ele.ELEID}`);
        if (span) {
            span.innerHTML = ele.NUM.toString();
        }
    }
}
/** 点击切换摄像头按钮后从 UI 获取期望切换的摄像头序列号 */
export function getCurStreamIdx(dialogCtx, uiOpts) {
    const input = dialogCtx.querySelector(uiOpts.camSidxSelecotr + ' > input:checked');
    return input ? +input.value : 0;
}
export function triggerFileInput(dialogCtx, uiOpts) {
    const input = dialogCtx.querySelector(uiOpts.fileInputSelector);
    input && input.click && input.click();
}
/** 档案证照库显示/隐藏 */
export function setCritertionLibToggle(dialogCtx, uiOpts, valid) {
    const ciritBx = dialogCtx.querySelector(uiOpts.critertionLibSelector);
    if (valid && ciritBx) {
        ciritBx.classList.remove('hidden');
    }
    else {
        ciritBx.classList.add('hidden');
    }
}
