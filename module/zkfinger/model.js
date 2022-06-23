// import { AjaxResp } from '../shared/ajax/model'
// ws服务端推送事件名
export var SrvEvent;
(function (SrvEvent) {
    SrvEvent["info"] = "info";
    SrvEvent["open"] = "open";
    SrvEvent["register"] = "register";
    SrvEvent["cancelregister"] = "cancelregister";
    SrvEvent["onenroll"] = "onenroll";
    SrvEvent["oncapture"] = "oncapture";
    SrvEvent["getstatus"] = "getstatus";
    SrvEvent["close"] = "close";
    SrvEvent["onUnknownEvent"] = "onUnknownEvent";
})(SrvEvent || (SrvEvent = {}));
