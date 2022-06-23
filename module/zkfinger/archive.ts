import { Observable, Observer, Subject, Subscription } from 'rxjs'
import { filter, map, take, timeout } from 'rxjs/operators'

import { initialWsEvent, initialWsOpts } from './config'
import {
  Actions,
  InitialWsOpts,
  ParamArg,
  SrvEvent,
  WsEvent,
  WsOpts,
  WsResults,
  WsSendData,
} from './model'
import RxWebsocketSubject from './rxws'


export class Zkf {
  eventObb: Observable<WsEvent>
  options: WsOpts
  private wsSubject: RxWebsocketSubject<any> | null
  private wsSub: Subscription | null
  private subject: Subject<WsEvent>
  private keppAliveSub: Subscription | null

  constructor(options?: InitialWsOpts) {
    this.options = this.parseOptions(options)
    this.wsSubject = null
    this.wsSub = null
    this.keppAliveSub = null
    this.subject = new Subject()
    this.eventObb = Observable.create((obv: Observer<WsEvent>) => {
      this.subject.subscribe(
        data => obv.next(data),
        err => obv.error(err),
      )
    })
  }
  parseOptions(options?: InitialWsOpts): WsOpts {
    return options ? { ...initialWsOpts, ...options } : { ...initialWsOpts }
  }
  connect(): void {
    this.disconnect()
    this.wsSubject = new RxWebsocketSubject(`${this.options.host}:${this.options.port}`)
    this.subject.next({ ...initialWsEvent, action: Actions.wsConnected })

    this.wsSub = this.wsSubject.subscribe(
      data => this.handleMsgEventData(data),

      (err: Error) => {
        if (err && err.message && err.message.includes('net::ERR_CONNECTION_REFUSED')) {
          this.subject.next({
            ...initialWsEvent,
            action: Actions.wsNoneAvailable,
          })
        }
        else {
          this.subject.next({
            ...initialWsEvent,
            action: Actions.wsClosedException,
            err,
          })
        }
      },

      () => this.subject.next({
        ...initialWsEvent,
        action: Actions.wsClosed,
      }),
    )

  }

  disconnect(): void {
    this.wsSub && this.wsSub.unsubscribe()
    this.wsSubject && this.wsSubject.unsubscribe()
    this.keppAliveSub && this.keppAliveSub.unsubscribe()
    this.keppAliveSub = this.wsSub = this.wsSubject = null

    this.subject.next({ ...initialWsEvent, action: Actions.wsDisconnected })
  }

  getStatus(): Observable<WsResults> {
    return this.sendMsg(SrvEvent.getstatus)
  }

  openDev(): Observable<WsResults> {
    return this.sendMsg(SrvEvent.open, { FakeFunOn: 0 })
  }

  register(): Observable<WsResults> {
    return this.sendMsg(SrvEvent.register)
  }

  cancelregister(): Observable<WsResults> {
    return this.sendMsg(SrvEvent.cancelregister)
  }

  closeDev(): Observable<WsResults> {
    return this.sendMsg(SrvEvent.close)
  }

  /* -------- private --------------- */
  private handleMsgEventData(data: WsResults): void {
    const event = { ...initialWsEvent, payload: data }

    if (! data) {
      event.action = Actions.invalidRecvedData
      this.subject.next(event)
      return
    }
    const ret = data.ret
    const str = data.function

    if (ret === 0) {
      const eventName = <SrvEvent> SrvEvent[str]
      event.action = eventName ? eventName : SrvEvent.onUnknownEvent
    }
    else if (ret === -10014 && str === SrvEvent.getstatus) {
      event.action = SrvEvent.getstatus
    }
    else {
      event.action = Actions.exception
    }

    this.subject.next(event)
  }

  private sendMsg(methodName: string, args?: ParamArg): Observable<any> {
    const ret$ = <Observable<string>> Observable.create((obv: Observer<string>) => {
      const data = this.parseSendOpts(methodName, args)
      const req$ = this.subject.pipe(
        filter(ev => {
          if (ev && ev.payload && ev.payload.function === SrvEvent.onenroll && methodName === SrvEvent.register) {
            return true
          }
          else if (ev && ev.payload && ev.payload.function === methodName) {
            return true
          }
          else {
            return false
          }
        }),
        map(ev => ev.payload ? ev.payload : ''),
        take(1),
        timeout(1000 * 60 * 10),
      )

      if (this.wsSubject) {
        this.wsSubject.send(data)
        this.subject.next({
          ...initialWsEvent,
          action: Actions.wsSend,
        })
      }
      else {
        this.subject.next({
          ...initialWsEvent,
          action: Actions.wsNoneAvailable,
        })
        throw new Error(Actions.wsNoneAvailable)
      }

      const sub = req$.pipe(
        take(1),
      )
        .subscribe(
          str => obv.next(str),
          err => obv.error(err),
          () => obv.complete(),
      )
      return () => sub.unsubscribe()
    })

    return ret$
  }

  private parseSendOpts(methodName: string, args?: ParamArg): WsSendData {
    const ret = <WsSendData> {
      module: 'fingerprint',
      function: methodName,
      parameter: '',
    }

    if (typeof args === 'undefined') {
      return ret
    }

    if (args && typeof args === 'object') {
      ret.parameter = args
    }

    return ret
  }

} // END of class

export function init(options?: InitialWsOpts): Zkf {
  return new Zkf(options)
}

