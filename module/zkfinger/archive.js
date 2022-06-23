import { Observable, Subject } from 'rxjs';
import { filter, map, take, timeout } from 'rxjs/operators';
import { initialWsEvent, initialWsOpts } from './config';
import { SrvEvent, } from './model';
import RxWebsocketSubject from './rxws';
export class Zkf {
    constructor(options) {
        this.options = this.parseOptions(options);
        this.wsSubject = null;
        this.wsSub = null;
        this.keppAliveSub = null;
        this.subject = new Subject();
        this.eventObb = Observable.create((obv) => {
            this.subject.subscribe(data => obv.next(data), err => obv.error(err));
        });
    }
    parseOptions(options) {
        return options ? Object.assign({}, initialWsOpts, options) : Object.assign({}, initialWsOpts);
    }
    connect() {
        this.disconnect();
        this.wsSubject = new RxWebsocketSubject(`${this.options.host}:${this.options.port}`);
        this.subject.next(Object.assign({}, initialWsEvent, { action: "connected" /* wsConnected */ }));
        this.wsSub = this.wsSubject.subscribe(data => this.handleMsgEventData(data), (err) => {
            if (err && err.message && err.message.includes('net::ERR_CONNECTION_REFUSED')) {
                this.subject.next(Object.assign({}, initialWsEvent, { action: "wsNoneAvailable" /* wsNoneAvailable */ }));
            }
            else {
                this.subject.next(Object.assign({}, initialWsEvent, { action: "socketClosedWithException" /* wsClosedException */, err }));
            }
        }, () => this.subject.next(Object.assign({}, initialWsEvent, { action: "socketClosed" /* wsClosed */ })));
    }
    disconnect() {
        this.wsSub && this.wsSub.unsubscribe();
        this.wsSubject && this.wsSubject.unsubscribe();
        this.keppAliveSub && this.keppAliveSub.unsubscribe();
        this.keppAliveSub = this.wsSub = this.wsSubject = null;
        this.subject.next(Object.assign({}, initialWsEvent, { action: "disconnected" /* wsDisconnected */ }));
    }
    getStatus() {
        return this.sendMsg(SrvEvent.getstatus);
    }
    openDev() {
        return this.sendMsg(SrvEvent.open, { FakeFunOn: 0 });
    }
    register() {
        return this.sendMsg(SrvEvent.register);
    }
    cancelregister() {
        return this.sendMsg(SrvEvent.cancelregister);
    }
    closeDev() {
        return this.sendMsg(SrvEvent.close);
    }
    /* -------- private --------------- */
    handleMsgEventData(data) {
        const event = Object.assign({}, initialWsEvent, { payload: data });
        if (!data) {
            event.action = "invalidRecvedData" /* invalidRecvedData */;
            this.subject.next(event);
            return;
        }
        const ret = data.ret;
        const str = data.function;
        if (ret === 0) {
            const eventName = SrvEvent[str];
            event.action = eventName ? eventName : SrvEvent.onUnknownEvent;
        }
        else if (ret === -10014 && str === SrvEvent.getstatus) {
            event.action = SrvEvent.getstatus;
        }
        else {
            event.action = "exception" /* exception */;
        }
        this.subject.next(event);
    }
    sendMsg(methodName, args) {
        const ret$ = Observable.create((obv) => {
            const data = this.parseSendOpts(methodName, args);
            const req$ = this.subject.pipe(filter(ev => {
                if (ev && ev.payload && ev.payload.function === SrvEvent.onenroll && methodName === SrvEvent.register) {
                    return true;
                }
                else if (ev && ev.payload && ev.payload.function === methodName) {
                    return true;
                }
                else {
                    return false;
                }
            }), map(ev => ev.payload ? ev.payload : ''), take(1), timeout(1000 * 60 * 10));
            if (this.wsSubject) {
                this.wsSubject.send(data);
                this.subject.next(Object.assign({}, initialWsEvent, { action: "wsSend" /* wsSend */ }));
            }
            else {
                this.subject.next(Object.assign({}, initialWsEvent, { action: "wsNoneAvailable" /* wsNoneAvailable */ }));
                throw new Error("wsNoneAvailable" /* wsNoneAvailable */);
            }
            const sub = req$.pipe(take(1))
                .subscribe(str => obv.next(str), err => obv.error(err), () => obv.complete());
            return () => sub.unsubscribe();
        });
        return ret$;
    }
    parseSendOpts(methodName, args) {
        const ret = {
            module: 'fingerprint',
            function: methodName,
            parameter: '',
        };
        if (typeof args === 'undefined') {
            return ret;
        }
        if (args && typeof args === 'object') {
            ret.parameter = args;
        }
        return ret;
    }
} // END of class
export function init(options) {
    return new Zkf(options);
}
