// export const subject = new Subject<ArcEvent>()
// 摄像头序列号对应的旋转角度. 用于切换摄像头后更新旋转按钮选中
export const camsRotateMap = new Map();
export const initialCamOpts = {
    ctx: document.querySelector('#my_camera'),
};
export const camInstMap = new Map();
export const initialUIOpts = {
    arcPkgTypeSelctor: 'select.pkg-type-list',
    btnGrorpSelector: 'input[type=checkbox], input[type=radio]',
    camSidxSelecotr: '.cam-sidx-radio',
    arcCaptureLeftSelecotr: '.arc_capture_left',
    arcCaptureRightSelecotr: '.arc_capture_right',
    camSelectLabelsSelector: '.cam-select-labels',
    closeBtnSelector: '.close,.btn-close-modal',
    fileInputSelector: '.file-input',
    labelRotateSelector: 'label.img-rotation',
    selectLocalFileSelector: '.select-local-file',
    snapRetSelector: 'img.snap-ret',
    takePhotoSelector: '.take-snapshot',
    toggleCamBtnSelector: '.toggle-cam',
    uploadMemoSelector: '.upload-memo-list',
    latexShareSelector: '.latex-share',
    readIDCard: '.readIdCard',
    rxcamContainer: '.rxcam-canvas-container',
    shareContainerSelector: '#preview-container',
    shareImgBoxSelector: '#preview-box',
    shareGyrBoxSelector: '#gyr_box',
    shareLocalBoxSelector: '#local_box',
    shareCloseSelector: '.share-close',
    checkImgSelector: 'img.preview-img',
    critertionLibSelector: '.critertion-lib',
    shareRourceSelector: 'label.share-relation',
    shareSaveSelector: '.share-save',
    shareCheckSquare: '.share-check-square',
    shareBtnGroupSelector: '.btn-share-group',
    shareFillSelfSelector: '.fill-self-info',
    shareSpouseSelector: '.query-spouse',
    shareSpoLocalSelector: '.query-local-spouse',
    drawHisSelector: '.history-draw-list',
    shareQuerySelector: 'select.history-draw-year',
    idcCompositeSelector: '.take-idc-composite',
    commonScanSelector: '.common-scan',
    commonScanContainerSelector: '#common-scan-container',
    commonScanImgBoxSelector: '#common-scan-box',
    commonScanCloseSelector: '.common-scan-close',
    commonScanSaveSelector: '.common-scan-save',
    commonScanCheckSquare: '.common-scan-check-square',
    commonScanRotateL90Selector: '.common-scan-rotatel90',
    commonScanRotateR90Selector: '.common-scan-rotater90',
    commonScanBtnGroupSelector: '.btn-common-scan-group',
    checkCommonScanImgSelector: 'img.common-scan-img',
};
// export const initialArcConfigs: ArcConfigs = {
//   arcCode: '',
//   userName: 'n/a',
//   dialogCtx: <HTMLDivElement> document.querySelector('div'),
//   uiOpts: { ...initialUIOpts },
// }
/** 空白占位图片base64 */
export const blankImgURL = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAHoAwAALAAAAAABAAEAAAICRAEAOw==';
