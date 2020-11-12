// @flow

import TONLog from './TONLog';

export type TONListener<Notification> = (notification: Notification) => Promise<void> | void;
export type TONAsyncListener<Notification>
    = (notification: Notification) => Promise<void>;
export type TONSubscription = {};

type Subscription<Notification> = {
    listener: TONListener<Notification>;
}

type AsyncSubscription<Notification> = {
    listener: TONAsyncListener<Notification>;
}

const log = new TONLog('TONNotificationSource');
export default class TONSubscriptionCenter<Notification> {
    constructor() {
        this.subscriptions = [];
        this.asyncSubscriptions = [];
    }

    subscribe(listener: TONListener<Notification>): TONSubscription {
        const subscription = { listener };
        this.subscriptions.push(subscription);
        return subscription;
    }

    subscribeAsync(listener: TONAsyncListener<Notification>): TONSubscription {
        const subscription = { listener };
        this.asyncSubscriptions.push(subscription);
        return subscription;
    }

    unsubscribe(subscription: TONSubscription) {
        this.subscriptions = this.subscriptions.filter(x => x !== subscription);
        this.asyncSubscriptions = this.asyncSubscriptions.filter(x => x !== subscription);
    }

    async broadcast(notification: Notification): Promise<void> {
        const listeners = this.subscriptions.map(x => x.listener);
        const asyncListeners = this.asyncSubscriptions.map(x => x.listener);
        listeners.forEach((listener) => {
            try {
                listener(notification);
            } catch (error) {
                log.error('Subscriber handler failed: ', error);
            }
        });
        if (asyncListeners.length > 0) {
            await Promise.all(asyncListeners.map(listener => listener(notification)));
        }
    }

    // Internals
    subscriptions: Subscription<Notification>[];
    asyncSubscriptions: AsyncSubscription<Notification>[];
}

