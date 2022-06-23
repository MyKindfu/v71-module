import { fromEvent, of } from 'rxjs';
import { debounceTime, filter, map, mapTo, mergeMap, pluck, switchMap, take, tap } from 'rxjs/operators';
import { post, UItoastr } from '../shared/index';
import { init } from './archive';
import { SrvEvent } from './model';
export function factoryZkf(el) {
    const zkf = init();
    zkf.connect();
    return subscribeEvent(zkf, el);
}
function subscribeEvent(zkf, el) {
    return bindClickEvent(document).pipe(mergeMap(elm => {
        if (elm.matches('#BtnZKFCERT')) { // 采集
            return registerIntercept(zkf).pipe(mergeMap(() => {
                return zkf.register().pipe(map(res => res.ret), filter(ret => ret === 0 ? true : false), tap(() => initModal(el)), tap(() => {
                    // @ts-ignore
                    $(el).modal('show');
                }), mapTo(zkf));
            }));
        }
        else if (elm.matches('#btn-entry-zkf')) { // 登录
            return validateUser(el).pipe(filter(val => val !== '' ? true : false), mergeMap(() => registerIntercept(zkf)), tap(() => {
                const fingerImgbox = el.querySelector('.finger-img-box');
                fingerImgbox.classList.remove('hidden');
                UItoastr({ type: 'info', title: '请录入指纹...', msg: '', onlyOne: true });
            }));
        }
        else {
            return of(zkf);
        }
    }), switchMap(() => {
        return zkf.eventObb.pipe(filter(ev => {
            if (!ev || !ev.payload || !ev.payload.function) {
                return false;
            }
            const funName = ev.payload.function;
            if (funName !== SrvEvent.onenroll && funName !== SrvEvent.oncapture) {
                return false;
            }
            return true;
        }), map(ev => ev.payload), mergeMap(dat => {
            if (dat.function === SrvEvent.onenroll) { // 采集
                return onenroll(zkf, dat, el);
            }
            else { // oncapture
                return oncapture(zkf, dat, el);
            }
        }));
    }));
}
/** 登录检查用户名 */
function validateUser(el) {
    const userName = el.querySelector('#zkfuname');
    return of(userName.value).pipe(tap(val => {
        if (!val) {
            UItoastr({ type: 'warning', title: '请输入用户名', msg: '', onlyOne: true });
        }
    }), filter(val => val ? true : false), mergeMap(code => checkUser(code)));
}
function checkUser(code) {
    const url = 'loginController/checkUser.do';
    const data = { USERCODE: code };
    return post(url, { data })
        .pipe(tap(res => {
        if (res.msg) {
            UItoastr({ type: 'warning', title: res.msg, msg: '', onlyOne: true });
        }
    }), filter(res => res.msg ? false : true), mapTo(code));
}
/** 采集出错重新采集 */
function collectErr(zkf) {
    return zkf.register().pipe(mapTo(zkf));
}
/** 出错采集页面还原 */
function initModal(el) {
    const $cjcs = $(el.querySelector('#cjcs'));
    const img = el.querySelector('.zkfimg-box > img');
    const $btnSave = $(el.querySelector('#BtnSaveZkf'));
    img.src = 'img/zkfinger0.png';
    $cjcs.text(0);
    $btnSave.prop('disabled', true);
}
/** 更新采集UI */
function updateUI(el, dat) {
    const $cjcs = $(el.querySelector('#cjcs'));
    const finger = el.querySelector('#zkfinger-tmp');
    const img = el.querySelector('.zkfimg-box > img');
    const $btnSave = $(el.querySelector('#BtnSaveZkf'));
    if (dat.data && dat.data.enroll_index) {
        const index = dat.data.enroll_index;
        $cjcs.text(index);
        if (index === 1) {
            img.src = 'img/zkfinger30.gif';
        }
        else if (index === 2) {
            img.src = 'img/zkfinger60.gif';
        }
        else if (index === 3) {
            img.src = 'img/zkfinger100.gif';
        }
    }
    if (dat.datatype && dat.datatype === 'template' && dat.data.template) {
        const fingerTmp = dat.data && dat.data.template;
        finger.value = fingerTmp;
        $btnSave.prop('disabled', false);
        UItoastr({ type: 'success', title: '指纹采集成功', onlyOne: true });
    }
}
/** 采集事件 */
function onenroll(zkf, dat, el) {
    const data$ = of(dat);
    if (dat.ret !== 0) {
        return data$.pipe(tap(() => {
            initModal(el);
            UItoastr({ type: 'warning', title: `${dat.error}, 请重新采集` || '采集错误，请重新采集', msg: '', onlyOne: true });
        }), mergeMap(() => collectErr(zkf)));
    }
    else {
        return data$.pipe(tap(() => {
            updateUI(el, dat);
        }), filter(() => {
            return dat.datatype && dat.datatype === 'template' && dat.data.template ? true : false;
        }), mergeMap(() => closeDev(zkf)));
    }
}
/** 登录事件 */
function oncapture(zkf, dat, el) {
    if (dat.ret !== 0) {
        return of(dat).pipe(tap(() => {
            UItoastr({ type: 'warning', title: `${dat.error}, 请重新录入` || '录入错误，请重新录入', msg: '', onlyOne: true });
        }), mapTo(zkf));
    }
    else {
        return zkfLogin(el, dat).pipe(filter(() => {
            return dat.datatype && dat.datatype === 'template' && dat.data.template ? true : false;
        }), mergeMap(() => closeDev(zkf)));
    }
}
function afterLogin(el, dat) {
    const contentBox = el.querySelector('.finger-content');
    const fingerImgBox = el.querySelector('.finger-img-box');
    contentBox.classList.remove('hidden');
    fingerImgBox.classList.add('hidden');
    el.style.display = 'none';
    const userInfo = dat.user;
    // @ts-ignore
    window.DT.user = {
        userid: userInfo[0],
        username: userInfo[1],
        roleid: userInfo[3],
        finger1: dat.finger1 || '',
        finger2: dat.finger2 || '',
        isfinger: dat.isfinger || '0',
        ecccert: dat.ecccert || '',
        isecccert: dat.isecccert || '0',
    };
}
/** 登录请求 */
function zkfLogin(el, dat) {
    if (dat.datatype && dat.datatype === 'template' && dat.data.template) {
        const nativetmp = dat.data.template;
        const user = el.querySelector('#zkfuname');
        const usercode = user.value;
        const url = 'loginController/loginZkf.do';
        const data = {
            usercode,
            nativetmp,
        };
        return post(url, { data })
            .pipe(tap(res => {
            if (res.msg) {
                UItoastr({ type: 'warning', title: res.msg, msg: '', onlyOne: true });
            }
        }), filter(res => res.state && res.state === 9 ? true : false), tap(res => {
            if (res.dat) {
                afterLogin(el, res.dat);
            }
        }), tap(res => {
            const row = res && res.dat;
            const isbookinday = row.isbookinday;
            const isbookindayconfirm = row.isbookindayconfirm;
            const bookinday_msg = row.bookindaymsg;
            const bookinday_jclsh = row.jclsh;
            const bookinday_bookdate = row.bookdate;
            if (isbookinday === '1') {
                UItoastr({ type: 'warning', title: bookinday_msg || '正在进入日结。。', msg: '', onlyOne: true });
                if (isbookindayconfirm === '1') {
                    setTimeout(() => {
                        window.location.href = `BookInDayController/bookin_day_check_confirm.do?jclsh=
              ${bookinday_jclsh}&bookdate=${bookinday_bookdate}`;
                    }, 2000);
                }
            }
            else {
                // @ts-ignore
                nextStep(res);
            }
        }), mapTo(null));
    }
    else {
        return of(null);
    }
}
/** 关闭设备 */
export function closeDev(zkf) {
    return zkf.closeDev().pipe(mapTo(zkf));
}
/** 打开设备及检查 */
export function registerIntercept(zkf) {
    return zkf.getStatus().pipe(map(res => res.ret), filter(ret => ret === 0 || ret === -10014 ? true : false), mergeMap(ret => {
        if (ret === 0) {
            return of(true);
        }
        else {
            return zkf.openDev().pipe(map(res => res.ret), tap(oret => {
                if (oret !== 0) {
                    UItoastr({ type: 'warning', title: '打开指纹设备失败', msg: '', onlyOne: true });
                }
            }), filter(oret => oret === 0 ? true : false));
        }
    }), mapTo(zkf), take(1));
}
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
    const list = ['BtnZKFCERT', 'btn-entry-zkf'];
    const id = elm.getAttribute('id');
    if (elm.nodeName !== 'BUTTON' || !id || !list.includes(id)) {
        return false;
    }
    return true;
}
