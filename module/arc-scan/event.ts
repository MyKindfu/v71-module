import { Scanner } from 'kodak-scanner'
import { fromEvent, Subject } from 'rxjs'
import {
  debounceTime,
  filter,
  pluck,
} from 'rxjs/operators'

import { Actions, ArcEvent } from './model'


// 绑定模态框内指定元素点击事件流
export function bindClickEvent(ctx: HTMLDivElement) {
  return fromEvent<MouseEvent>(ctx, 'click')
    .pipe(
      debounceTime(50),
      pluck<MouseEvent, HTMLElement>('target'),
      filter(eventFilter),
    )
}


function eventFilter(elm: HTMLElement): boolean {
  if (! elm || ! elm.nodeName) {
    return false
  }
  // @ts-ignore
  if (typeof elm.disabled !== 'undefined' && elm.disabled) {
    return false
  }
  const list = ['BUTTON', 'I', 'INPUT', 'LABEL', 'SPAN']

  if (! list.includes(elm.nodeName)) {
    return false
  }
  return true
}


// 文件上传事件
export function bindFileInputEvent(ctx: HTMLDivElement, selector) {
  const input = <HTMLInputElement> ctx.querySelector(selector)

  return fromEvent<MouseEvent>(input, 'change')
    .pipe(
      pluck<MouseEvent, HTMLInputElement>('target'),
      pluck<HTMLElement, FileList>('files'),
    )
}


// 处理对话框恢复事件
export function handleEventDlgRestored(ev: ArcEvent, subject: Subject<ArcEvent>, scanner: Scanner | void) {
  scanner && scanner.connect()
    .subscribe(
      () => null,
      err => {
        subject.next({
          action: Actions.exception,
          err,
          msg: 'connect ws service fail',
          payload: {},
        })
      },
  )
}
