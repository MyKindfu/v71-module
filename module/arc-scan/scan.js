import { init, } from 'kodak-scanner';
import { interval } from 'rxjs';
import { concatMap, map, take, tap, withLatestFrom, } from 'rxjs/operators';
import { UItoastr } from '../shared/uitoastr/index';
import { initialArcConfigs, scannerInstMap, subject } from './config';
import { setElmsValidState, updateScannedPageCount, } from './ui';
export function initScanner(sym, scanOptions, wsOptions) {
    const scanner = init(scanOptions, wsOptions);
    scanner.connect().pipe(tap(() => {
        scannerInstMap.set(sym, scanner);
        setElmsValidState(true);
        subject.next({
            action: "scannerReady" /* scannerReady */,
            payload: { sym },
        });
    }))
        .subscribe(() => null, err => {
        subject.next({
            action: "exception" /* exception */,
            err,
            msg: 'connect ws service fail',
            payload: {},
        });
    });
    return scanner;
}
export function getScannerInstbySym(sym) {
    return scannerInstMap.get(sym);
}
/** 开始扫描 返回图片文件路径数组 */
export function startScan(scanner, clearAll = false) {
    setElmsValidState(false);
    const dialogCtx = initialArcConfigs.dialogCtx;
    const StatusContent = dialogCtx.querySelector(initialArcConfigs.uiOpts.scanStatusContent);
    const scan$ = scanner.scan();
    const clearAndScan$ = scanner.clearAll().pipe(tap(() => {
        $(StatusContent).empty().prepend('<li>开始扫描凭证</li>');
        UItoastr({
            type: 'info',
            title: '开始扫描凭证',
            className: 'scan-info',
            onlyOne: true,
        });
    }), concatMap(() => scan$));
    const tips$ = interval(6000).pipe(take(100), tap(() => {
        setElmsValidState(true);
        $(StatusContent).prepend('<li>扫描凭证中，请等待……</li>');
        UItoastr({
            type: 'info',
            title: '扫描凭证中，请等待……',
            className: 'scan-info',
            onlyOne: true,
        });
    }));
    return tips$.pipe(withLatestFrom(clearAll ? clearAndScan$ : scan$), map(vals => vals[1]), take(1), // 扫描结束返回文件列表后即取消 tips$ 等所有订阅
    tap(fileListArr => {
        $(StatusContent).prepend('<li>扫描凭证结束,即将开始图片保存，请等待……</li>');
        UItoastr({
            type: 'success',
            title: '扫描凭证结束',
            className: 'scan-info',
            onlyOne: true,
        });
        updateScannedPageCount(fileListArr.length);
        subject.next({
            action: "scanSucc" /* scanSucc */,
            payload: { fileListArr },
        });
    }));
}
