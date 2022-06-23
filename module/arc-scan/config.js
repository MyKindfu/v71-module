import { Subject } from 'rxjs';
export const subject = new Subject();
export const scannerInstMap = new Map();
export const initialUIOpts = {
    arcPkgTypeSelctor: 'select.pkg-type-list',
    btnGrorpSelector: 'input[type=checkbox], input[type=radio]',
    btnScanSelector: '.start-scan',
    closeBtnSelector: '.close,.btn-close-modal',
    failResultUlSelector: '.fail-result-ul',
    fileInputSelector: '.file-input',
    selectLocalFileSelector: '.select-local-file',
    snapRetSelector: 'img.snap-ret',
    succSavedImgCountSelector: '.succ-saved-img-count',
    failedImgCountSelector: '.failed-img-count',
    scannedPageCountSelector: '.scanned-page-count',
    uploadMemoSelector: '.upload-memo-list',
    scanStatusContent: '.scan-status-content',
};
export const initialArcConfigs = {
    arcCode: '',
    dialogCtx: document.querySelector('div'),
    uiOpts: Object.assign({}, initialUIOpts),
};
export const succFilepathSet = new Set(); // 档案保存成功
export const failImgMap = new Map(); // 档案保存失败 <filename, filepath>
export const processingImgSet = new Set(); // 处理中
