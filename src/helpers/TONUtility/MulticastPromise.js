// @flow

type MulticastListener<Value> = {
    resolve: (value: Value) => void;
    reject: (error: Error) => void;
};

export default class MulticastPromise<Value> {
    listeners: MulticastListener<Value>[];
    onComplete: ?(() => void);

    constructor() {
        this.listeners = [];
        this.onComplete = null;
    }

    listen(): Promise<Value> {
        const listener: MulticastListener<Value> = {
            resolve: () => {
            },
            reject: () => {
            },
        };
        this.listeners.push(listener);
        return new Promise((resolve, reject) => {
            listener.resolve = resolve;
            listener.reject = reject;
        });
    }

    resolve(value: Value) {
        this.complete(listener => listener.resolve(value));
    }

    reject(error: Error) {
        this.complete(listener => listener.reject(error));
    }

    complete(completeListener: (listener: MulticastListener<Value>) => void) {
        const { listeners } = this;
        this.listeners = [];
        if (this.onComplete) {
            this.onComplete();
        }
        listeners.forEach(listener => completeListener(listener));
    }
}
