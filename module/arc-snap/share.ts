import { Subject } from 'rxjs'
import { JsonType } from 'rxxfetch'

import { HisDrawDataArray, HisDrawSelectOptionData } from '../arc/model'
import { IDData } from '../idc'

import { ArcEvent, ACTIONS, UIOpts } from './model'
import { setBtnGroupToggle } from './ui'


/** 获得共享照片展示 */
export function showArcImg(
  dialogCtx: HTMLDivElement,
  uiOpts: UIOpts,
  data: JsonType[],
): void {

  const previewBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
  // const pBox = <HTMLDivElement> previewBox.closest('#preview-content')
  previewBox.innerHTML = ''
  const html = <string[]> []

  for (const row of data) {
    html.push(`<div class="preview-list">
    <i class="check-mark hidden fa fa-check-circle" aria-hidden="true"></i>
    <img class="preview-img" src="data:image/jpg;base64,${row.FILEINFO}" title="${row.CREATETIME}"
     data-path="${row.FULLPATH}" data-code="${row.fundcode}"></div>`)
  }

  previewBox.innerHTML = html.join('')
}

/** 选择图片 */
export function checkPreviewImg(element: HTMLElement) {
  const warp = <HTMLDivElement> element.closest('.preview-list')
  const checkMark = <HTMLElement> warp.querySelector('.check-mark')
  if (checkMark) {
    checkMark.classList.toggle('hidden')
    element.classList.toggle('check-true')
  }
}

/** 全选 */
export function checkSquareImg(
  dialogCtx: HTMLDivElement,
): void {

  dialogCtx.querySelectorAll<HTMLDivElement>('.preview-list')
    .forEach(element => {
      const checkMark = <HTMLElement> element.querySelector('.check-mark')
      const checkImg = <HTMLElement> element.querySelector('.preview-img')
      if (checkMark) {
        checkMark.classList.remove('hidden')
        checkImg.classList.add('check-true')
      }
    })
}

/** 选择图片来源 */
export function selectShareRource(
  dialogCtx: HTMLDivElement,
  uiOpts: UIOpts,
  subject: Subject<ArcEvent>,
  event: ArcEvent,
): void {

  const pkgid = $(<HTMLSelectElement> dialogCtx.querySelector(uiOpts.arcPkgTypeSelctor)).val()
  const previewBox = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareImgBoxSelector)
  previewBox.innerHTML = ''

  if (!pkgid) {
    return
  }

  const input = <HTMLInputElement> dialogCtx.querySelector(
    uiOpts.shareRourceSelector + ' > input:checked')

  const rource = input ? +input.value : 0
  if (rource === 0) {
    subject.next({
      action: ACTIONS.localRource,
      payload: event.payload,
    })

  }
  else {
    // 房管局
    subject.next({
      action: ACTIONS.houseRource,
      payload: event.payload,
    })
  }
}


/** 根据读取到配偶身份证信息填充表单 */
export function fillIdcard(
  dialogCtx: HTMLDivElement,
  data: IDData,
): void {

  // tslint:disable-next-line:no-shadowed-variable
  const name = <HTMLInputElement> dialogCtx.querySelector('#local-xingming')
  const idcard = <HTMLInputElement> dialogCtx.querySelector('#local-zjhm')

  if (data && data.base) {
    name.value = data.base.name
    idcard.value = data.base.idc
  }
  else {
    name.value = ''
    idcard.value = ''
  }
}

/** 关闭共享窗口 */
export function shareClose(dialogCtx: HTMLDivElement, uiOpts: UIOpts): void {
  setBtnGroupToggle(dialogCtx, uiOpts, '')
  const box = <HTMLDivElement> dialogCtx.querySelector(uiOpts.shareContainerSelector)

  if (box) {
    box.classList.add('hidden')
  }
}

export function genHisDrawOptionsFromArcCodeContent(content: HisDrawDataArray[]): HisDrawSelectOptionData[] {
  const ret: HisDrawSelectOptionData[] = []

  if (content && Array.isArray(content)) {
    for (let i = 0, len = content.length; i < len; i++) {
      const row = content[i]

      ret.push({
        id: row.ARCCODE,
        text: row.SYDATE,
      })
    }
  }

  return ret
}
