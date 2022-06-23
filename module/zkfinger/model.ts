// import { AjaxResp } from '../shared/ajax/model'

export type SendArgs = Array<string | number> | string | number

export interface WsOpts {
  host: string
  port: number
  keepAliveInterval: number
}

export interface InitialWsOpts extends Partial<WsOpts> { }

export interface WsSendData {
  module: string
  function: string
  parameter: string | ParamArg
}

export interface ParamArg {
  FakeFunOn: number
}
export const enum Actions {
  exception = 'exception',
  initial = 'initial',
  invalidRecvedData = 'invalidRecvedData',
  invalidRecvCb = 'invalidRecvCallbackFunction',
  noneAvailable = 'eventNoneAvailable',
  wsConnected = 'connected',
  wsClosed = 'socketClosed',
  wsClosedException = 'socketClosedWithException',
  wsDisconnected = 'disconnected',
  wsNoneAvailable = 'wsNoneAvailable',
  wsSend = 'wsSend',
  wsRecv = 'wsRecv',
}

// ws服务端推送事件名
export enum SrvEvent {
  info = 'info', // 获取信息
  open = 'open', // 打开设备
  register = 'register', // 登记采集
  cancelregister = 'cancelregister', // 取消登记采集
  onenroll = 'onenroll', // 指纹采集
  oncapture = 'oncapture', // 登录
  getstatus = 'getstatus', // 获取设备状态
  close = 'close', // 关闭设备
  onUnknownEvent = 'onUnknownEvent',
}

export interface WsEvent {
  action: Actions | SrvEvent
  err?: Error
  msg?: string
  payload?: any
}

export interface WsResults {
  data: any
  datatype?: string
  error: string
  function: string
  module: string
  ret: number
}


/** 服务端状态码 */
export const enum ServiceStatus {
  successful = 0,
  failure = -10001, // 失败
  serviceNotInit = -10002, // 服务未初始化
  invalidParam = -10003, // 无效参数或者参数格式错误
  errorModel = -10004, // 模式错误
  interfaceNotAllowed = -10005, // 接口不支持
  initFingerprintFail = -10006, // 初始化指纹库失败
  openFingerpDeviceFail = -10007, // 打开指纹采集设备失败
  closeFingerpDeviceFail = -10008, // 关闭设备失败
  fakeFinger = -10009, // 假手指
  continueFingerprinting = -10010, // 继续按指纹采集
  acquisitionFailure = -10011, // 采集失败
  exportTempFail = -10012, // 导出模板失败
  wsUseing = -10013, // 正在使用websocket连接
  connectIdentInconsistent = -10014, // 未打开设备或者webs连接标识不一致
  exception = -10015, // 捕捉到异常
  registDifferentLastTime = -10016, // 登记时与上一次指纹不同
  currentFingerpConnectWs = -10017, // 该指纹已建立webs连接
  deviceDisconnect = -10018, // 指纹设备处于异常状态，比如断开连接
}


export interface LoginDat {
  listArea: any
  user: string[]
  finger1: string
  finger2: string
  ecccert: string
  ispwdexp: string
  isfinger: string
  isecccert: string
  listCenters: any
  isbookinday: string
  jclsh: string
  bookdate: string
  bookindaymsg: string
  isbookindayconfirm: string
}

