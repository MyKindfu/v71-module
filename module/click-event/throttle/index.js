import { handleGridSearchBtn } from './grid';
import { handleMenuLink } from './menu';
import { handleRptSearchBtn } from './rpt';
const fns = [
    handleGridSearchBtn,
    handleMenuLink,
    handleRptSearchBtn,
];
/**
 * 限制指定时间内点击事件对象不可用（无法再次点击）
 * 若处理函数返回 true 则结束
 */
export const throttle = ev => {
    const ret = fns.some(fn => fn(ev));
    return ret;
};
