// @flow
/* eslint-disable no-use-before-define, no-undef */
import TONFunction from './TONFunction';

/**
 * Cache management.
 *
 * TONCache – holds and manages cached value. Responsible for:
 * - fetching actual (remote) value;
 * - persistence of cached value.
 *
 * TONCacheObserver – reacts to cache events such as value changing or fetching error.
 */

/**
 * Cache observer.
 * Reacts to cache events such as value changed or fetch error.
 */
export interface TONCacheObserver {
    onCacheValueChanged(sender: Object): void;

    onCacheFetchFailed(sender: Object): void;
}

export interface TONCacheValueListener {
    open(): void;

    close(): void;
}

export interface TONStringEncryptor {
    encrypt(s: string): Promise<string>;

    decrypt(s: string): Promise<string>;
}

export interface TONCacheConfigurator {
    setScope(scope: ?string): void;

    setEncryptor(encryptor: ?TONStringEncryptor): void;
}

/** Internal – holds atomic updates for TONCache properties */
type TONCacheStateUpdates<Value> = {
    value?: ?Value,
    isReading?: boolean,
    isFetching?: boolean,
    fetchError?: ?Error,
};

/** Internal – holds information about observer and subscription options. */
type TONCacheSubscription = {
    observer: TONCacheObserver,
};

type TONCacheOptions<Value> = {
    key: string,
    defaultValue?: Value,
};

const FetchDoesNotSupported = new Error('Fetch does not supported');

type Updates = any;

type GetUpdates = (value: ?Updates) => Updates;

function upgradeValue<Value>(
    value: ?Value,
    updates: Updates | GetUpdates,
): Updates {
    let updatesObject: Updates;
    if (TONFunction.isFunction(updates)) {
        const getUpdates: GetUpdates = updates;
        updatesObject = getUpdates(value);
    } else {
        updatesObject = updates;
    }
    if (value === undefined || value === null) {
        return updatesObject;
    }
    return (TONFunction.isObject(value) && TONFunction.isObject(updatesObject)) ? {
        ...value,
        ...updatesObject,
    } : updatesObject;
}

/**
 * Cache – holds and manages cached value.
 */
export type TONAsyncStorage = {
    setItem: (key: string, value: string) => Promise<void>,
    getItem: (key: string) => Promise<string>,
    removeItem: (key: string) => Promise<void>,
};

export default class TONCache<Value> implements TONCacheConfigurator {
    static asyncStorage: TONAsyncStorage;

    static setAsyncStorage(asyncStorage: TONAsyncStorage) {
        this.asyncStorage = asyncStorage;
    }

    static getAsyncStorage(): ?TONAsyncStorage {
        return this.asyncStorage;
    }

    /**
     * Create cache with specified unique key (usually used to persist cache value).
     */
    constructor(options: TONCacheOptions<Value>) {
        this.options = options;
        this.subscriptions = [];

        this.value = null;
        this.fetchError = null;
        this.isReading = false;
        this.isFetching = false;
        this.key = this.makeKey(null);

        this.scope = null;
        this.encryptor = null;
    }

    setScope(scope: ?string) {
        this.scope = scope;
        const key = this.makeKey(scope);
        if (key === this.key) {
            return;
        }
        this.key = key;
        this.internalResetAfterReconfiguration();
    }

    setEncryptor(encryptor: ?TONStringEncryptor) {
        this.encryptor = encryptor;
        this.internalResetAfterReconfiguration();
    }

    /** Unique cache key */
    getKey(): string {
        return this.key;
    }

    /** Test if in memory value is present (loaded from local storage or remote provider) */
    hasValue(): boolean {
        return this.value !== null;
    }

    /** Get current in memory value if present. Otherwise throw error. */
    getValue(): Value {
        if (this.value !== undefined && this.value !== null) {
            return this.value;
        }
        throw new Error('TONCache has not a value.');
    }

    async waitForValue(): Promise<Value> {
        if (!this.hasValue()) {
            await this.startReadLocalValue();
        }
        return this.getValue();
    }

    /** Ensure if in memory value is present */
    async ensureValue(): Promise<void> {
        if (this.hasValue()) {
            return;
        }
        this.updateState({ isReading: true });
        const newState: TONCacheStateUpdates<Value> = {
            isReading: false,
        };
        newState.value = await this.readValueFromLocalStorageOrDefault();
        this.updateState(newState);
    }

    /**
     * Override current cached value with specified.
     */
    async setValue(updates: Updates | GetUpdates) {
        const oldValue: any = this.hasValue()
            ? this.value
            : await this.readValueFromLocalStorageOrDefault();
        const value = upgradeValue(oldValue, updates);
        await this.writeLocalValue(value);
        this.updateState({ value });
    }

    /** Test if last fetch have being failed */
    isFetchFailed(): boolean {
        return !!this.fetchError;
    }

    /** Get last fetch error if last fetch have being failed. Otherwise throw error. */
    getFetchError(): Error {
        if (this.fetchError) {
            return this.fetchError;
        }
        throw new Error('TONCache has not a fetchError.');
    }

    /** Test if cache is reading value from local (device) storage */
    isReadingLocalValue(): boolean {
        return this.isReading;
    }

    /** Test if cache is fetching actual value */
    isFetchingActualValue(): boolean {
        return this.isFetching;
    }

    /** Test if cache is reading or fetching value */
    isRetrievingValue(): boolean {
        return this.isFetching || this.isReading;
    }

    createListener(
        onValue: (value: Value) => void,
        options?: {
            onError?: (error: Error) => void,
        },
    ): TONCacheValueListener {
        const cache = this;
        const observer: TONCacheObserver = {
            onCacheValueChanged(): void {
                if (cache.hasValue()) {
                    onValue(cache.getValue());
                }
            },
            onCacheFetchFailed(): void {
                const onError = options && options.onError;
                if (onError) {
                    onError(cache.getFetchError());
                }
            },
        };
        let subscribed = false;
        return {
            open() {
                if (!subscribed) {
                    cache.subscribe(observer);
                    subscribed = true;
                }
            },
            close() {
                if (subscribed) {
                    cache.unsubscribe(observer);
                    subscribed = false;
                }
            },
        };
    }

    /**
     * Attach specified observer to cache.
     * If cache has value, observer will be notified immediately.
     * Start refreshing.
     * */
    subscribe(observer: TONCacheObserver) {
        this.subscriptions.push({
            observer,
        });
        if (this.hasValue()) {
            observer.onCacheValueChanged(this);
            this.refresh();
        } else if (!this.isRetrievingValue()) {
            (async () => {
                await this.startReadLocalValue();
            })();
        }
    }

    /** Unsubscribe specified observer from cache */
    unsubscribe(observer: TONCacheObserver) {
        this.subscriptions = this.subscriptions
            .filter(subscription => subscription.observer !== observer);
    }

    /** Starts fetching of actual value */
    refresh() {
        if (!this.isRetrievingValue()) {
            (async () => {
                await this.fetchValueFromRemoteProvider();
            })();
        }
    }

    // TONCache virtual methods

    /** Provide actual value. Usually fetch value from cloud API. */
    // eslint-disable-next-line class-methods-use-this
    async fetchActualValue(): Promise<Value> {
        throw FetchDoesNotSupported;
    }

    /** Read cached value from device local storage. Defaults read from AsyncStorage. */
    async readLocalValue(): Promise<?Value> {
        const asyncStorage = TONCache.getAsyncStorage();
        if (!asyncStorage) {
            throw new Error('No asyncStorage passed to TONUtility');
        }
        let stringValue = await asyncStorage.getItem(this.getKey());
        if (this.encryptor && stringValue) {
            stringValue = await this.encryptor.decrypt(stringValue);
        }
        if (!stringValue) {
            return null;
        }
        const plainValue = JSON.parse(stringValue);
        return this.deserializeValue(plainValue);
    }

    /** Write cached value to device local storage. Defaults write to AsyncStorage. */
    async writeLocalValue(value: Value): Promise<void> {
        const plainValue = this.serializeValue(value);
        let stringValue = JSON.stringify(plainValue);
        if (this.encryptor) {
            stringValue = await this.encryptor.encrypt(stringValue);
        }
        const asyncStorage = TONCache.getAsyncStorage();
        if (!asyncStorage) {
            throw new Error('No asyncStorage passed to TONUtility');
        }
        return asyncStorage.setItem(this.getKey(), stringValue);
    }

    /** Create serialized representation (plain JSON value), suitable for storing. */
    // eslint-disable-next-line class-methods-use-this
    serializeValue(value: Value): any {
        return value;
    }

    /** Restore value from serialized representation. */
    // eslint-disable-next-line class-methods-use-this
    deserializeValue(plain: any): Value {
        return plain;
    }

    // Internals

    makeKey(scope: ?string): string {
        return `${scope || ''}~${this.options.key}`;
    }

    async readValueFromLocalStorageOrDefault(): Promise<?Value> {
        let value: ?Value;
        try {
            value = await this.readLocalValue();
        } catch (error) {
            console.warn(
                `[TONCache] Failed to read value [${this.getKey()}] from local storage with error:`,
                error,
            );
        }
        const valueDoesNotRead = value === undefined || value === null;
        if (valueDoesNotRead && this.options.defaultValue !== undefined) {
            value = this.options.defaultValue;
        }
        return value;
    }

    async startReadLocalValue(): Promise<void> {
        await this.ensureValue();
        await this.fetchValueFromRemoteProvider();
    }

    async fetchValueFromRemoteProvider(): Promise<void> {
        this.updateState({ isFetching: true });
        try {
            const actualValue = await this.fetchActualValue();
            await this.writeLocalValue(actualValue);
            this.updateState({
                isFetching: false,
                value: actualValue,
                fetchError: null,
            });
        } catch (error) {
            if (error === FetchDoesNotSupported) {
                this.updateState({ isFetching: false });
            } else {
                this.updateState({
                    isFetching: false,
                    fetchError: error,
                });
            }
        }
    }

    updateState(updates: TONCacheStateUpdates<Value>) {
        let valueChanged = false;
        let fetchErrorChanged = false;
        if (updates.isReading !== undefined) {
            this.isReading = updates.isReading;
        }
        if (updates.isFetching !== undefined) {
            this.isFetching = updates.isFetching;
        }
        if (updates.value !== undefined) {
            this.value = updates.value;
            valueChanged = true;
        }
        if (updates.fetchError !== undefined) {
            this.fetchError = updates.fetchError;
            fetchErrorChanged = true;
        }
        if (valueChanged) {
            this.cacheUpdated();
        }
        if (fetchErrorChanged) {
            if (this.fetchError !== null) {
                this.subscriptions.forEach(subscription => {
                    subscription.observer.onCacheFetchFailed(this);
                });
            }
        }
    }

    cacheUpdated() {
        this.subscriptions.forEach(subscription => {
            subscription.observer.onCacheValueChanged(this);
        });
    }

    internalResetAfterReconfiguration() {
        this.updateState({
            value: null,
            fetchError: null,
            isReading: false,
            isFetching: false,
        });
        if (this.subscriptions.length > 0) {
            (async () => {
                await this.startReadLocalValue();
            })();
        }
    }

    options: TONCacheOptions<Value>;
    subscriptions: TONCacheSubscription[];
    scope: ?string;
    encryptor: ?TONStringEncryptor;

    value: ?Value;
    isReading: boolean;
    isFetching: boolean;
    fetchError: ?Error;
    key: string;
}

/**
 * Cache dictionary.
 */
export class TONCacheMap<Key, Value> implements TONCacheConfigurator {
    constructor() {
        this.cacheByStringKey = {};
        this.scope = null;
        this.encryptor = null;
    }

    setScope(scope: ?string) {
        this.scope = scope;
        Object.keys(this.cacheByStringKey).forEach(key => {
            this.cacheByStringKey[key].setScope(scope);
        });
    }

    setEncryptor(encryptor: ?TONStringEncryptor) {
        this.encryptor = encryptor;
        Object.keys(this.cacheByStringKey).forEach(key => {
            this.cacheByStringKey[key].setEncryptor(encryptor);
        });
    }

    /**
     * Get cache by key. If cache does not exists it will be created.
     * @param key
     * @return {TONCache<Value>}
     */
    getFor(key: Key): TONCache<Value> {
        const stringKey = this.getStringKey(key);
        return this.cacheByStringKey[stringKey] || (() => {
            const item = this.createCache(key);
            if (this.scope) {
                item.setScope(this.scope);
            }
            if (this.encryptor) {
                item.setEncryptor(this.encryptor);
            }
            this.cacheByStringKey[stringKey] = item;
            return item;
        })();
    }

    // Virtual
    // eslint-disable-next-line class-methods-use-this,no-unused-vars
    getStringKey(key: Key): string {
        throw Error('TONCacheMap.getStringKey not implemented');
    }

    // eslint-disable-next-line class-methods-use-this,no-unused-vars
    createCache(key: Key): TONCache<Value> {
        throw Error('TONCacheMap.createCache not implemented');
    }

    cacheByStringKey: {
        [string]: TONCache<Value>
    };
    scope: ?string;
    encryptor: ?TONStringEncryptor;
}
