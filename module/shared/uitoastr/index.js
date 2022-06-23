import { initialOpts } from './config';
/**
 * 模态消息框
 * 清除当前所有提示使用 toastr.clear() 命令
 * @require toastr.js
 */
export function UItoastr(options) {
    const opts = Object.assign({}, initialOpts, options);
    if (opts.clear) {
        // @ts-ignore
        toastr.clear();
    }
    else if (opts.onlyOne) {
        let s = '.toast.toast-modal';
        if (opts.className) {
            s = s + '.' + opts.className;
        }
        // @ts-ignore
        toastr.clear($(s), { force: true });
    }
    // Wire up an event handler to a button in the toast, if it exists
    const $toast = toastr[opts.type](opts.msg, opts.title);
    if (!$toast) {
        throw new Error('toast instance invalid');
    }
    $toast.addClass('toast-modal');
    if (opts.className) {
        $toast.addClass(opts.className);
        delete opts.className;
    }
    if ($toast.find('.clear').length) {
        $toast.one('click', '.clear', () => {
            // @ts-ignore
            toastr.clear($toast, { force: true });
        });
    }
}
