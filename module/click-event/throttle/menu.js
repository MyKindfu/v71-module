import { defaultThrottleLimits, throttleAcMap, throttleMatchingCtor, } from '../config';
import { doThrottle, retriveThrottleLimit, } from './helper';
const ctors = throttleMatchingCtor.menuLink;
const defaultLimit = defaultThrottleLimits.menuLink;
/** 处理左侧页面菜单 */
export const handleMenuLink = ev => {
    const elm = matchedElm(ev, ctors);
    if (!elm) {
        return false;
    }
    // 以下为对匹配元素执行规则
    // 读取DOM元素 data-click-throttle-time 属性值作为限流时间
    const delta = retriveThrottleLimit(elm, defaultLimit);
    doThrottle(ev, throttleAcMap, elm, delta);
    return true;
};
/**
 * 检查元素是否为相关按钮，返回基准按钮元素
 * 实际触发元素可能为 <button> 或者其子元素 <i>
 */
function matchedElm(ev, matchingCtor) {
    const elm = ev.target;
    if (!elm) {
        return;
    }
    for (const ctor of matchingCtor) {
        if (!ctor) {
            continue;
        }
        if (elm.matches(ctor)) { // 点击按钮元素
            return elm;
        }
    }
}
