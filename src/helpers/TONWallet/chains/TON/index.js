import EventEmitter from 'events';

import { TONLog } from '../../../TONUtility';

const TONWalletOnTONBlockNotification = 'TONWalletOnTONBlockNotification';
let blockNotifier = null;

const log = new TONLog('TON');

export default class TON {
    static log = log;

    static createBlockNotifier() {
        if (blockNotifier) {
            log.debug('Block notifications have started already');
            return;
        }
        blockNotifier = new EventEmitter();
        blockNotifier.setMaxListeners(100);
    }

    static notifyAboutNewBlock(block) {
        if (!blockNotifier) {
            TON.createBlockNotifier();
        }
        blockNotifier.emit(TONWalletOnTONBlockNotification, block);
    }

    static addListenerToBlockNotifier(listener = () => {}) {
        if (!blockNotifier) {
            TON.createBlockNotifier();
        }
        blockNotifier.addListener(TONWalletOnTONBlockNotification, listener);
    }

    static removeListenerFromBlockNotifier(listener) {
        if (!blockNotifier) {
            return;
        }
        blockNotifier.removeListener(TONWalletOnTONBlockNotification, listener);
    }

    static removeAllListeners() {
        if (!blockNotifier) {
            return;
        }
        blockNotifier.removeAllListeners();
    }

    // constructor
    constructor(keystore, askForPassword) {
        this.keystore = keystore;
        this.askForPassword = askForPassword;
        this.mineBlocks();
    }

    mineBlocks() {
        this.tonInterval = setInterval(() => {
            TON.notifyAboutNewBlock({});
        }, 5000); // Call each 5 seconds
    }
}
