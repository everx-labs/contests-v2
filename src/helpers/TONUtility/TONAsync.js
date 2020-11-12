// @flow

import TONLog from './TONLog';

/**
 * Represents a guard for single async operation.
 */
export interface TONAsyncOperation {
    /**
     * Run async operation if no other async operation is running.
     * @param operation
     * @param name
     */
    run(operation: () => Promise<void>, name?: string): void;

    /**
     * Execute sync operation and then stay in running state for specified timeout.
     * @param ms
     * @param operation
     * @param name
     */
    execThenTimeout(ms: number, operation: () => void, name?: string): void;

    guardNavigation(operation: () => void): void;
}

type TONAsyncOperationOptions = {
    onRunningChanged: (running: string) => void,
};

const log = new TONLog('TONAsync');
export default class TONAsync {
    static log = log;

    static operation(options?: TONAsyncOperationOptions): TONAsyncOperation {
        const onRunningChanged = options && options.onRunningChanged;
        return {
            running: '',
            run(operation: () => Promise<void>, name?: string) {
                (async () => {
                    try {
                        if (this.running !== '') {
                            return;
                        }
                        this.running = name || 'operation';
                        if (onRunningChanged) {
                            onRunningChanged(this.running);
                        }
                        try {
                            await operation();
                        } finally {
                            this.running = '';
                            if (onRunningChanged) {
                                onRunningChanged('');
                            }
                        }
                    } catch (error) {
                        log.error(
                            `Async operation [${name || ''}] failed: `,
                            error.message || error,
                        );
                    }
                })();
            },
            execThenTimeout(ms: number, work: () => void, name?: string) {
                this.run(async () => {
                    work();
                    await TONAsync.timeout(ms);
                }, name);
            },
            guardNavigation(operation: () => void): void {
                this.execThenTimeout(1000, operation, 'navigation');
            },
        };
    }

    static async timeout(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(() => resolve(), ms);
        });
    }

    static async withInterval<Result>(
        ms: number,
        checkResult: () => (Result | typeof undefined),
    ): Promise<Result> {
        return new Promise<Result>((resolve, reject) => {
            const runCheck = () => {
                try {
                    const result = checkResult();
                    if (result !== undefined) {
                        resolve(result);
                    } else {
                        setTimeout(runCheck, ms);
                    }
                } catch (error) {
                    reject(error);
                }
            };
            runCheck();
        });
    }

    /** Converts callback style function into Promise */
    static makeAsync(original: any): (...args: any) => Promise<any> {
        return (...args) => {
            return new Promise((resolve, reject) => {
                original(...args, (err, value) => {
                    return err ? reject(err) : resolve(value);
                });
            });
        };
    }

    /** Same as makeAsync, but callback args reversed: (value, err) */
    static makeAsyncRev(original: any): (...args: any) => Promise<any> {
        return (...args) => {
            return new Promise((resolve, reject) => {
                original(...args, (value, err) => {
                    return err ? reject(err) : resolve(value);
                });
            });
        };
    }
}
