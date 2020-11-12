// @flow
import { action, computed, observable } from 'mobx';

import TONAsync from './TONAsync';
import TONLog from './TONLog';

export class TONCommonStore {
    log = new TONLog(this.constructor.name);

    @observable initialized: boolean = false;
    @observable loading: boolean = false;
    @observable errors: string[] = [];

    // Loading
    @action
    load = async () => {
        this.startLoading();
        try {
            await this.onLoad();
            this.initializeEnd();
        } catch (error) {
            this.log.error('Loading error:', error);
        } finally {
            this.stopLoading();
        }
    }

    // eslint-disable-next-line
    @action
    onLoad = async () => {
        throw new Error('TONCommonStore: onLoad method must be overridden');
    }

    // Unloading
    @action
    unload = async () => {
        try {
            await this.onUnload();
            this.initializeReset();
        } catch (error) {
            this.log.error('Unloading error:', error);
        }
    }

    // eslint-disable-next-line
    @action
    onUnload = async () => {
        throw new Error('TONCommonStore: onUnload method must be overridden');
    }

    // Initialized flag
    @action
    initializeEnd = () => {
        this.initialized = true;
    }

    @action
    initializeReset = () => {
        this.initialized = false;
    }

    // Loading flag
    @action
    startLoading = () => {
        this.loading = true;
    }

    @action
    stopLoading = () => {
        this.loading = false;
    }

    // Error handling
    @action
    createError = (error: string) => {
        this.log.error(error);
        this.errors.push(error);
    }

    @action
    clearErrors = () => {
        this.errors = [];
    }

    @computed get isLoading() {
        return this.loading;
    }

    waitUntilInitialized = async () => {
        return TONAsync.withInterval(100, () => {
            return this.initialized || undefined;
        });
    }
}
