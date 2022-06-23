import { Actions, WsEvent, WsOpts } from './model'

export const initialWsOpts: WsOpts = {
  host: 'ws://127.0.0.1',
  port: 22003,
  keepAliveInterval: 60 * 1000, // msec
}

export const initialWsEvent: WsEvent = {
  action: Actions.noneAvailable,
}



