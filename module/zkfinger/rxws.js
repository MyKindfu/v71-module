import { empty, interval, Observable, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, share, takeWhile } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/websocket';
// https://stackoverflow.com/questions/38108814/rx-observable-websocket-immediately-complete-after-reconnect
export default class RxWebsocketSubject extends Subject {
    constructor(url, reconnectInterval = 5000, reconnectAttempts = 10, resultSelector, serializer) {
        super();
        this.url = url;
        this.reconnectInterval = reconnectInterval;
        this.reconnectAttempts = reconnectAttempts;
        this.resultSelector = resultSelector;
        this.serializer = serializer;
        this.reconnectionObservable = null;
        this.socketSub = null;
        this.connectionObserver = null;
        this.connectionStatus = new Observable(observer => {
            this.connectionObserver = observer;
        })
            .pipe(share(), distinctUntilChanged());
        if (!this.resultSelector) {
            this.resultSelector = this.defaultResultSelector;
        }
        if (!this.serializer) {
            this.serializer = this.defaultSerializer;
        }
        this.wsSubjectConfig = {
            url: this.url,
            closeObserver: {
                next: (ev) => {
                    this.socketSub = null;
                    this.connectionObserver && this.connectionObserver.next(false);
                },
            },
            openObserver: {
                next: (ev) => {
                    this.connectionObserver && this.connectionObserver.next(true);
                },
            },
        };
        this.connect();
        this.connectionStatus.subscribe(isConnected => {
            if (!this.reconnectionObservable && !isConnected) {
                this.reconnect();
            }
        });
    }
    defaultResultSelector(e) {
        return JSON.parse(e.data);
    }
    defaultSerializer(data) {
        return JSON.stringify(data);
    }
    connect() {
        this.socketSub = new WebSocketSubject(this.wsSubjectConfig);
        this.socketSub.subscribe(msg => this.next(msg), (err) => {
            if (!this.socketSub) {
                this.reconnect();
            }
            else {
                this.error(err);
            }
        });
    }
    reconnect() {
        this.reconnectionObservable = interval(this.reconnectInterval)
            .pipe(takeWhile((v, index) => {
            return index < this.reconnectAttempts && !this.socketSub;
        }), catchError(err => {
            console.info('retry connect by reconnectionObservable()', err);
            return empty();
        }));
        this.reconnectionObservable.subscribe(() => this.connect(), () => { }, () => {
            this.reconnectionObservable = null;
            if (!this.socketSub) {
                this.connectionObserver && this.connectionObserver.complete();
                this.error(new Error('net::ERR_CONNECTION_REFUSED'));
            }
        });
    }
    send(data) {
        if (this.socketSub && this.serializer) {
            // const dataNew = this.serializer(data)
            this.socketSub.next(data);
        }
    }
}
