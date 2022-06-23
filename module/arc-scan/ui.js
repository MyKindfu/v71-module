import { initialArcConfigs } from './config';
/** 初始化各标签按钮样式 */
export function initUI() {
    const dialogCtx = initialArcConfigs.dialogCtx;
    showImg(''); // 清空结果图片
    // 清空保存结果统计
    $(dialogCtx.querySelector(initialArcConfigs.uiOpts.uploadMemoSelector)).empty();
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
/** 在采集结果区域显示图片 */
export function showImg(url) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const previewImg = dialogCtx.querySelector(initialArcConfigs.uiOpts.snapRetSelector);
    if (previewImg && previewImg.nodeName === 'IMG') {
        previewImg.src = url
            ? url
            : 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAHoAwAALAAAAAABAAEAAAICRAEAOw=='; // 空白占位图片
    }
}
/** 切换设置多个控制按钮、下拉的可用状态 */
export function setElmsValidState(valid) {
    setBtnScanValidState(valid); // 采集按钮
    setBtnGroupValidState(valid); // 采集参数按钮
    setCloseBtnState(valid); // 模态框关闭按钮
}
/** 设置模态框关闭按钮 禁用/有效 状态 */
export function setCloseBtnState(valid) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    // @ts-ignore
    const btns = dialogCtx.querySelectorAll(initialArcConfigs.uiOpts.closeBtnSelector);
    btns.forEach(btn => (btn.disabled = valid ? false : true));
}
/** 设置radio/checkbox选择按钮钮父级LABEL 禁用/有效 状态 */
export function setBtnGroupValidState(valid) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    dialogCtx.querySelectorAll(initialArcConfigs.uiOpts.btnGrorpSelector)
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
/** 设置扫描按钮 禁用/有效 状态 */
export function setBtnScanValidState(valid) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const elm = dialogCtx.querySelector(initialArcConfigs.uiOpts.btnScanSelector);
    if (elm) {
        elm.disabled = !valid;
    }
}
export function triggerFileInput() {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const input = dialogCtx.querySelector(initialArcConfigs.uiOpts.fileInputSelector);
    input && input.click && input.click();
}
export function updateProcessedImgLi(failFilepathMap, succSet) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const ul = dialogCtx.querySelector(initialArcConfigs.uiOpts.failResultUlSelector);
    const li = [];
    const count = dialogCtx.querySelector(initialArcConfigs.uiOpts.succSavedImgCountSelector);
    count.innerHTML = ` ${succSet.size} `;
    updateFailedImgCount(failFilepathMap.size);
    for (const path of failFilepathMap.values()) {
        li.push(`<li>${path}</li>`);
    }
    $(ul).html(li.join(''));
}
/** 更新失败图片数量 失败原因可能是未匹配，未能保存 */
export function updateFailedImgCount(count) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const countSpan = dialogCtx.querySelector(initialArcConfigs.uiOpts.failedImgCountSelector);
    countSpan.innerHTML = ` ${count > 0 ? count : 0} `;
}
/** 更新（本次）批量扫描页面数量 */
export function updateScannedPageCount(count) {
    const dialogCtx = initialArcConfigs.dialogCtx;
    const countSpan = dialogCtx.querySelector(initialArcConfigs.uiOpts.scannedPageCountSelector);
    countSpan.innerHTML = ` ${count > 0 ? count : 0} `;
}
