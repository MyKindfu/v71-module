export function getElmAccessState(map, elm) {
    return map.get(elm);
}
/**
 * 设置元素最近访问时间
 */
export function updateAccessDate(map, elm) {
    const state = {
        date: new Date(),
        // @ts-ignore
        oriDisabledValue: typeof elm.disabled === 'undefined' ? false : !!elm.disabled,
    };
    const last = map.get(elm);
    if (last) {
        state.oriDisabledValue = last.oriDisabledValue;
    }
    map.set(elm, state);
}
function cleanAccessDate(map, elm) {
    map.delete(elm);
}
/**
 * 根据传入数字计算当前时间与上次访问时间判断是否具有访问权限
 */
export function isAccessible(map, elm, delta) {
    const now = new Date();
    const state = getElmAccessState(map, elm);
    // console.info(map, now, delta)
    if (!state) {
        return true;
    }
    const last = state.date;
    if (now.getTime() - last.getTime() > delta) {
        return true;
    }
    return false;
}
/** 设置元素一定有效时间的 disabled 禁用状态 */
export function setElmDurationDisabled(map, elm, duration) {
    const state = getElmAccessState(map, elm);
    const oriDisabledValue = state
        ? state.oriDisabledValue
        : (typeof elm.disabled === 'undefined' ? false : true);
    if (oriDisabledValue === true) {
        return;
    }
    // ! 捕获阶段 延迟禁用，否则默认行为可能不会被执行
    // setTimeout(dom => {
    //  dom.disabled = true
    // }, 0, elm)
    elm.disabled = true;
    // 原本无 disabled 状态的才恢复可用
    // 若原本就禁用状态则不还原可用
    setTimeout((mp, dom) => {
        // 清理目的是能读取到（可能被其它方法修改的）元素 disabled 值
        cleanAccessDate(mp, elm);
        dom.disabled = false;
    }, duration, map, elm);
}
/**
 * 清除指定元素的点击限流状态
 */
// function cleanDomThrottleState(elm: HTMLElement) {
//   elm && cleanAccessDate(acMap, elm)
// }
/**
 * 检查元素是否为 grid, rpt 搜索按钮，返回基准按钮元素
 * 实际触发元素可能为 <button> 或者其子元素 <i>
 */
export function matchedSearchElm(ev, matchingCtor) {
    const elm = ev.target;
    if (!elm || !elm.nodeName) {
        return;
    }
    for (const ctor of matchingCtor) {
        if (!ctor) {
            continue;
        }
        if (elm.matches(ctor)) { // 点击按钮元素
            return elm;
        }
        else if (elm.matches('i')) { // 点击按钮子元素
            const pe = elm.parentElement;
            if (pe && pe.matches(ctor)) {
                return pe;
            }
        }
    }
}
/**
 * 读取DOM元素 data-click-throttle-time 属性值作为限流时间
 * 若元素未设置，则实用默认值
 */
export function retriveThrottleLimit(elm, defaultLimit) {
    const ret = elm.dataset
        ? (elm.dataset.clickThrottleTime ? +elm.dataset.clickThrottleTime : defaultLimit)
        : defaultLimit;
    return ret >= 0 ? ret : defaultLimit;
}
export function doThrottle(ev, map, elm, limit) {
    if (isAccessible(map, elm, limit)) {
        if (ev.eventPhase === 1) { // 捕获
            updateAccessDate(map, elm);
            // console.info('passed', ev)
        }
        else if (ev.eventPhase === 3) { // 冒泡
            setElmDurationDisabled(map, elm, limit);
        }
    }
    else {
        if (ev.eventPhase === 1) { // 捕获
            ev.stopPropagation();
            ev.preventDefault();
        }
    }
}
