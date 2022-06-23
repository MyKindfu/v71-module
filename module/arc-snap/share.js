import { setBtnGroupToggle } from './ui';
/** 获得共享照片展示 */
export function showArcImg(dialogCtx, uiOpts, data) {
    const previewBox = dialogCtx.querySelector(uiOpts.shareImgBoxSelector);
    // const pBox = <HTMLDivElement> previewBox.closest('#preview-content')
    previewBox.innerHTML = '';
    const html = [];
    for (const row of data) {
        html.push(`<div class="preview-list">
    <i class="check-mark hidden fa fa-check-circle" aria-hidden="true"></i>
    <img class="preview-img" src="data:image/jpg;base64,${row.FILEINFO}" title="${row.CREATETIME}"
     data-path="${row.FULLPATH}" data-code="${row.fundcode}"></div>`);
    }
    previewBox.innerHTML = html.join('');
}
/** 选择图片 */
export function checkPreviewImg(element) {
    const warp = element.closest('.preview-list');
    const checkMark = warp.querySelector('.check-mark');
    if (checkMark) {
        checkMark.classList.toggle('hidden');
        element.classList.toggle('check-true');
    }
}
/** 全选 */
export function checkSquareImg(dialogCtx) {
    dialogCtx.querySelectorAll('.preview-list')
        .forEach(element => {
        const checkMark = element.querySelector('.check-mark');
        const checkImg = element.querySelector('.preview-img');
        if (checkMark) {
            checkMark.classList.remove('hidden');
            checkImg.classList.add('check-true');
        }
    });
}
/** 选择图片来源 */
export function selectShareRource(dialogCtx, uiOpts, subject, event) {
    const pkgid = $(dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor)).val();
    const previewBox = dialogCtx.querySelector(uiOpts.shareImgBoxSelector);
    previewBox.innerHTML = '';
    if (!pkgid) {
        return;
    }
    const input = dialogCtx.querySelector(uiOpts.shareRourceSelector + ' > input:checked');
    const rource = input ? +input.value : 0;
    if (rource === 0) {
        subject.next({
            action: "localRource" /* localRource */,
            payload: event.payload,
        });
    }
    else {
        // 房管局
        subject.next({
            action: "houseRource" /* houseRource */,
            payload: event.payload,
        });
    }
}
/** 根据读取到配偶身份证信息填充表单 */
export function fillIdcard(dialogCtx, data) {
    // tslint:disable-next-line:no-shadowed-variable
    const name = dialogCtx.querySelector('#local-xingming');
    const idcard = dialogCtx.querySelector('#local-zjhm');
    if (data && data.base) {
        name.value = data.base.name;
        idcard.value = data.base.idc;
    }
    else {
        name.value = '';
        idcard.value = '';
    }
}
/** 关闭共享窗口 */
export function shareClose(dialogCtx, uiOpts) {
    setBtnGroupToggle(dialogCtx, uiOpts, '');
    const box = dialogCtx.querySelector(uiOpts.shareContainerSelector);
    if (box) {
        box.classList.add('hidden');
    }
}
export function genHisDrawOptionsFromArcCodeContent(content) {
    const ret = [];
    if (content && Array.isArray(content)) {
        for (let i = 0, len = content.length; i < len; i++) {
            const row = content[i];
            ret.push({
                id: row.ARCCODE,
                text: row.SYDATE,
            });
        }
    }
    return ret;
}
