/* eslint-disable class-methods-use-this,no-param-reassign */
// @flow

import type {
    TONCacheConfigurator,
    TONStringEncryptor,
} from './TONCache';

import TONLog from './TONLog';

export type TONLimitedFetcherListener<Params> = {
    open: (params: Params) => void,
    close: () => void,
};

export type TONLimitedFetcherListenerOptions = {
    onError?: (error: any) => void,
};

export type TONLimitedFetcherFetchOptions<Data> = {
    postInterim: (data: Data) => void,
};

type Listener<Params, Data> = {
    key: string,
    params: ?Params,
    onData: (data: Data) => void,
    onError?: (error: any) => void,
};

type Queue<Params, Data> = {
    key: string,
    params: Params,
    listeners: Listener<Params, Data>[],
}

const log = new TONLog('TONLimitedFetcher');
export default class TONLimitedFetcher<Params, Data> implements TONCacheConfigurator {
    static log = log;
    loadingLimit: number;

    constructor() {
        this.loadedData = new Map();
        this.loadingQueues = new Map();
        this.waitingQueues = [];
        this.loadingLimit = 10;
    }

    // TONCacheConfigurator

    // eslint-disable-next-line no-unused-vars
    setEncryptor(encryptor: ?TONStringEncryptor): void {
        this.reset();
    }

    // eslint-disable-next-line no-unused-vars
    setScope(scope: ?string): void {
        this.reset();
    }

    // Virtuals
    keyOfParams(params: Params): string {
        const paramsType = typeof params;
        if (paramsType === 'string' || paramsType === 'number') {
            return (params: any);
        }
        return JSON.stringify((params: any));
    }

    // eslint-disable-next-line no-unused-vars
    async fetchData(params: Params, options: TONLimitedFetcherFetchOptions<Data>): Promise<any> {
        return params;
    }

    // Public
    reset() {
        this.loadedData.clear();
        this.loadingQueues.clear();
        this.waitingQueues = [];
    }

    getCounters(): { loaded: number, loading: number, waiting: number } {
        return {
            loaded: this.loadedData.size,
            loading: this.loadingQueues.size,
            waiting: this.waitingQueues.length,
        };
    }

    createListener(onData: (data: Data) => void, options?: TONLimitedFetcherListenerOptions): TONLimitedFetcherListener<Params> {
        const listener = {
            key: '',
            params: (null: any),
            onData,
            onError: options?.onError,
        };
        return {
            open: (params: Params) => {
                this.openListener(listener, params);
            },
            close: () => {
                this.closeListener(listener);
            },
        };
    }

    // Internals
    loadedData: Map<string, Data>;
    loadingQueues: Map<string, Queue<Params, Data>>;
    waitingQueues: Queue<Params, Data>[];

    openListener(listener: Listener<Params, Data>, params: Params) {
        this.closeListener(listener);
        listener.params = params;
        listener.key = this.keyOfParams(params);

        // If data is already loaded just provide it and return closed listener
        const loadedData = this.loadedData.get(listener.key);
        if (loadedData !== undefined) {
            listener.onData(loadedData);
            return;
        }

        let queue = this.loadingQueues.get(listener.key);
        if (!queue) {
            // If requested data does not loading place request to waiting queue
            const waitingQueueIndex = this.waitingQueues.findIndex(x => x.key === listener.key);
            if (waitingQueueIndex >= 0) {
                // Temporary remove from waiting (then push back as most wanted)
                [queue] = this.waitingQueues.splice(waitingQueueIndex, 1);
            } else {
                queue = {
                    key: listener.key,
                    params,
                    listeners: [],
                };
            }
            // Push to back of waiting queue (most wanted)
            this.waitingQueues.push(queue);
        }
        queue.listeners.push(listener);
        this.checkWaiting();
    }

    closeListener(listener: Listener<Params, Data>) {
        const loadingQueue = this.loadingQueues.get(listener.key);
        if (loadingQueue) {
            // If request in loading queue remove it from queue
            const requestIndex = loadingQueue.listeners.indexOf(listener);
            if (requestIndex >= 0) {
                loadingQueue.listeners.splice(requestIndex, 1);
            }
        } else {
            const waitingQueueIndex = this.waitingQueues.findIndex(x => x.key === listener.key);
            if (waitingQueueIndex >= 0) {
                // If request in waiting queue, remove it from queue
                const waitingQueue = this.waitingQueues[waitingQueueIndex];
                const requestIndex = waitingQueue.listeners.indexOf(listener);
                if (requestIndex >= 0) {
                    if (waitingQueue.listeners.length > 1) {
                        waitingQueue.listeners.splice(requestIndex, 1);
                    } else {
                        // If waiting queue have emptied, remove queue itself
                        this.waitingQueues.splice(waitingQueueIndex, 1);
                    }
                }
            }
        }
        listener.key = '';
        listener.params = null;
    }

    checkWaiting() {
        while (this.waitingQueues.length > 0 && this.loadingQueues.size < this.loadingLimit) {
            const queue = this.waitingQueues.pop();
            this.loadingQueues.set(queue.key, queue);
            this.fetchDataForQueue(queue);
        }
    }

    fetchDataForQueue(queue: Queue<Params, Data>) {
        (async () => {
            try {
                const finalData = await this.fetchData(
                    queue.params,
                    {
                        postInterim: (interimData: Data) => {
                            this.loadedData.set(queue.key, interimData);
                            TONLimitedFetcher.notifyListeners(queue, interimData, undefined);
                        },
                    },
                );
                this.loadingQueues.delete(queue.key);
                this.loadedData.set(queue.key, finalData);
                TONLimitedFetcher.notifyListeners(queue, finalData);
            } catch (error) {
                log.error(`fetchDataForQueue [${queue.key}'] fetch failed: `, error);
                this.loadingQueues.delete(queue.key);
                TONLimitedFetcher.notifyListeners(queue, undefined, error);
            }
            this.checkWaiting();
        })();
    }

    static notifyListeners(queue: Queue<Params, Data>, data?: Data, error?: Error) {
        try {
            if (data !== undefined) {
                queue.listeners.forEach(x => x.onData((data: any)));
            }
            if (error) {
                queue.listeners.forEach((x) => {
                    if (x.onError) {
                        x.onError(error);
                    }
                });
            }
        } catch (postError) {
            log.error(`fetchDataForQueue [${queue.key}'] listeners failed: `, postError);
        }
    }
}
