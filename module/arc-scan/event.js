import { fromEvent } from 'rxjs';
import { debounceTime, filter, pluck, } from 'rxjs/operators';
// 绑定模态框内指定元素点击事件流
export function bindClickEvent(ctx) {
    return fromEvent(ctx, 'click')
        .pipe(debounceTime(50), pluck('target'), filter(eventFilter));
}
function eventFilter(elm) {
    if (!elm || !elm.nodeName) {
        return false;
    }
    // @ts-ignore
    if (typeof elm.disabled !== 'undefined' && elm.disabled) {
        return false;
    }
    const list = ['BUTTON', 'I', 'INPUT', 'LABEL', 'SPAN'];
    if (!list.includes(elm.nodeName)) {
        return false;
    }
    return true;
}
// 文件上传事件
export function bindFileInputEvent(ctx, selector) {
    const input = ctx.querySelector(selector);
    return fromEvent(input, 'change')
        .pipe(pluck('target'), pluck('files'));
}
// 处理对话框恢复事件
export function handleEventDlgRestored(ev, subject, scanner) {
    scanner && scanner.connect()
        .subscribe(() => null, err => {
        subject.next({
            action: "exception" /* exception */,
            err,
            msg: 'connect ws service fail',
            payload: {},
        });
    });
}
