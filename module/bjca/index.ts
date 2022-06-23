import { init, Bjca, CertInfo, CertKinds } from 'bjca'
import { forkJoin, fromEvent, Observable } from 'rxjs'
import { debounceTime, filter, map, mapTo, mergeMap, tap } from 'rxjs/operators'

import { post } from '../shared/index'

import { UIOpts } from './model'

/**
 * @description CA模块主初始化
 * @param uiOpts
 */
export function initCA(uiOpts: UIOpts): Bjca {
  const ca: Bjca = init()

  getLoginConf().pipe(
    filter(res => res === '2' ? true : false),
  )
  .subscribe(
    () => {
      const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
      const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)
      toggleElmValidState(nameInput, false)
      updateInputs(uiOpts, '')
      onUsbkeyInsert(ca, uiOpts)
    },
  )
  validateUIOpts(uiOpts)
  bindFormLoginClick(uiOpts)
  subscribeEvent(ca, uiOpts)
  ca.connect()
  return ca
}

/**
 * @description 只用于CA采集
 */
export function initCollectCA(): Bjca {
  const ca: Bjca = init()
  ca.connect()

  return ca
}

function validateUIOpts(uiOpts: UIOpts) {
  const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
  const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)
  const certIdInput = <HTMLInputElement> form.querySelector(uiOpts.certIdInputSelector)
  const pwdInput = <HTMLInputElement> form.querySelector(uiOpts.pwdInputSelector)
  const btnLogin = <HTMLButtonElement> form.querySelector(uiOpts.pwdInputSelector)

  if (! form) {
    alert('表单不存在')
    throw new Error('表单不存在')
  }
  if (! nameInput) {
    alert('表单用户名输入框不存在')
    throw new Error('表单用户名输入框不存在')
  }
  if (! certIdInput) {
    alert('表单证书ID输入框不存在')
    throw new Error('表单证书ID输入框不存在')
  }
  if (! pwdInput) {
    alert('表单证书口令输入框不存在')
    throw new Error('表单证书口令输入框不存在')
  }
  if (! btnLogin) {
    alert('表单证书登录按钮不存在')
    throw new Error('表单证书登录按钮不存在')
  }
}

function bindFormLoginClick(uiOpts: UIOpts) {
  const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
  const btnLogin = <HTMLButtonElement> form.querySelector(uiOpts.btnLoginSelector)

  fromEvent(<HTMLButtonElement> btnLogin, 'click').pipe(
    tap(() => toggleElmValidState(btnLogin, false)),
    debounceTime(500),
    mapTo(true),
  )

  // event$.pipe(
  //     filter(() => !! form.useCA),
  //     mergeMap(() => validCert(ca, uiOpts)),
  //   )
  //   .subscribe(
  //     res => {
  //       toggleElmValidState(btnLogin, true)

  //       if (!res) {
  //         alert('未返回操作员数据')
  //       }
  //       else {
  //         const userInfo = res.dat.user

  //         // @ts-ignore
  //         window.DT.user = {
  //           'userid':    userInfo[0],
  //           'username':  userInfo[1],
  //           'roleid':    userInfo[3],
  //           'finger1':   res.dat.finger1 || '',
  //           'finger2':   res.dat.finger2 || '',
  //           'isfinger':  res.dat.isfinger || '0',
  //           'ecccert':   res.dat.ecccert || '',
  //           'isecccert': res.dat.isecccert || '0',
  //         }
  //         // @ts-ignore
  //         nextStep(res)
  //       }

  //     },
  //     err => {
  //       alert(err)
  //       console.error(err)
  //       toggleElmValidState(btnLogin, true)
  //     },
  //   )

    // event$.pipe(
    //   filter(() => ! form.useCA),
    // )
    .subscribe(
      // @ts-ignore
      () => btn_login_click(),

    )
}



function subscribeEvent(ca: Bjca, uiOpts: UIOpts) {
  const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)

  form.useCA = 0
  ca.eventObb.subscribe(ev => {
    console.info('outer ev:', ev)
    if (ev.payload) {
      if (ev.action === 'usbkeyChange') {
        if (ev.payload.retVal === 'insert') {
          form.useCA = 1
          onUsbkeyInsert(ca, uiOpts)
        }
        else if (ev.payload.retVal === 'remove') {
          form.useCA = 0
          onUsbkeyRemove(uiOpts)
        }
      }
    }
  })
}


/** 获取登录方式 0:普通，1:USBKEY,2:BJCA */
function getLoginConf(): Observable<string> {
  const url = 'loginController/getLoginCon.do'

  return post<string>(url).pipe(
    map(res => {
      if (res && ! res.msg) {
        return res.dat ? res.dat : ''
      }
      return ''
    }),
  )
}


/** 根据用户证书获取核心用户名 */
function userNameByYYZS(YYZS: string) {
  const url = 'loginController/getUsersByCAZS.do'
  const res$ = post<any>(url, {
    data: {
      YYZS,
    },
  })

  return res$.pipe(
    tap(res => {
      if (res && res.err) {
        throw new Error(res.msg ? res.msg : res.dat)
      }
    }),
  )

}


function onUsbkeyInsert(ca: Bjca, uiOpts: UIOpts) {
  const conf$ = getLoginConf()
  const list$ = ca.getUserList()

  forkJoin(conf$, list$).pipe(
    tap(([config]) => {
      const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
      const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)
      const forceCA = config && config === '2' ? true : false
      if (!forceCA) {
        toggleElmValidState(nameInput, true)
      }
    }),
    map(([, list]) => list),
    filter(data => !!data && Array.isArray(data) && !!data.length),
    mergeMap(data => {
      return ca.getSignCert(data[0].certId).pipe(// 获取用户签名证书
        tap(cert => {
          if (!cert) {
            throw new Error('获取用户签名证书失败')
          }

        }),
      )
    }),
    mergeMap(res => {
      // 获取证书有效期
      return ca.getCertInfo(res, [CertKinds.not_before, CertKinds.not_after]).pipe(
        // tap(console.log),
        // tap(validateCertExpiry), // 验证证书有效期
        map(certInfo => {
          validateCertExpiry(certInfo)
          return res
        }),
      )
    }),
    mergeMap(res => {
      return userNameByYYZS(res)
    }),
  )
  .subscribe(
    data => {
      const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
      if (data && data.msg) {
        updateInputs(uiOpts, '')
        const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)
        toggleElmValidState(nameInput, false)
        alert(data.msg)
        return
      }
      if (data && data.dat && data.dat.length) {
        const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)

        form.useCA = 1
        toggleElmValidState(nameInput, false)
      }

      if (form.useCA) {
        const userCode = data.dat && data.dat[0].USERCODE ? data.dat[0].USERCODE : ''
        updateInputs(uiOpts, userCode)
      }
    },
    // console.error,
    err => {
      alert(err.msg)
      return
    },
  )
}

function onUsbkeyRemove(uiOpts: UIOpts) {
  const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
  const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)

  getLoginConf().subscribe(
    res => {
      if (res && res === '2') {
        toggleElmValidState(nameInput, false)
        alert('用户登录类型为CA登录，请插入CA！')
      }
      else {
        toggleElmValidState(nameInput, true)

      }
    },
  )

  updateInputs(uiOpts, '')
  form && form.reset()
}

// 更新输入框
function updateInputs(uiOpts: UIOpts, userCode: string) {
  const form = <HTMLFormElement> document.querySelector(uiOpts.formSelector)
  const nameInput = <HTMLInputElement> form.querySelector(uiOpts.usernameInputSelector)
  // const certIdInput = <HTMLInputElement> form.querySelector(uiOpts.certIdInputSelector)
  userCode ? nameInput.value = userCode : nameInput.value = ''

}


function validateCertExpiry(info: Partial<CertInfo>) {
  if (! info.not_before || ! info.not_after) {
    throw new Error('证书有效期为空')
  }
  // YYYYMMDDHHmmss
  const startStr = info.not_before
  const endStr = info.not_after
  const now = new Date()
  const start = new Date(
    +startStr.slice(0, 4), // YYYY
    +startStr.slice(4, 6) - 1, // MM
    +startStr.slice(6, 8), // DD
    +startStr.slice(8, 10),  // HH
    +startStr.slice(10, 12),  // mm
    +startStr.slice(12, 14),  // ss
  )
  const end = new Date(
    +endStr.slice(0, 4),
    +endStr.slice(4, 6) - 1,
    +endStr.slice(6, 8),
    +endStr.slice(8, 10),
    +endStr.slice(10, 12),
    +endStr.slice(12, 14),
  )

  if (now < start) {
    throw new Error('证书有效期尚未开始')
  }
  if (now >= end) {
    throw new Error('证书已过期 请尽快到北京数字证书认证中心办理证书更新手续！')
  }
  const diff = Math.floor((+end - +now) / (1000 * 3600 * 24))

  if (diff <= 30) {
    alert('您的证书距离过期还有：' + diff + '天，请尽快到北京数字证书认证中心办理证书更新手续！')
  }
}

// 切换输入框状态有效
function toggleElmValidState(elm: HTMLInputElement | HTMLButtonElement, valid: boolean) {
  elm.disabled = ! valid
}
