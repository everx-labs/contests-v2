// @flow
import { Platform } from 'react-native';

import TONEnvironment from './TONEnvironment';

export default class TONWorkerThread {
    // constructor
    workerThread: Worker;
    constructor(workerName: string) {
        if (TONEnvironment.isProduction() && Platform.OS !== 'web') { // iOS, Android in production
            this.workerThread = new Worker(`${workerName}.thread.js`);
        } else {
            const rootFolder = Platform.OS === 'web' ? '.' : './web';
            this.workerThread = new Worker(`${rootFolder}/workers/${workerName}.thread.js`);
        }
    }

    dispatch(params: *): Promise<*> {
        return new Promise((resolve, reject) => {
            this.workerThread.onmessage = (message: any) => {
                this.workerThread.terminate();
                let response = message;
                if (Platform.OS === 'web') { // web (instanceof MessageEvent)
                    response = message.data;
                } else { // mobile (instanceof String)
                    try {
                        response = JSON.parse(message); // trying to parse an Object from String
                    } catch (error) {
                        //
                    }
                }
                resolve(response);
            };
            this.workerThread.onerror = (error) => { // N.B. not supported on react native!!!
                this.workerThread.terminate();
                reject(error);
            };
            let message = params;
            if (Platform.OS === 'web') { // web (will be wrapped with MessageEvent)
                // nothing
            } else { // mobile (only String is supported to post)
                message = params instanceof Object ? JSON.stringify(params) : message;
            }
            this.workerThread.postMessage(message);
        });
    }
}
