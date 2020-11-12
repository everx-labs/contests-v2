// @flow
/* eslint-disable no-undef */
import Moment from 'moment';
import uniqBy from 'lodash/uniqBy';

import TONAsync from './TONAsync';

import TONLog from './TONLog';

const log = new TONLog('TONMultiLoader');

export type TONLoaderDataObject = { time: number, key: string, [string]: any };

export type TONLoaderData = TONLoaderDataObject[];

export type TONLoaderSections = { title: string, data: TONLoaderData }[];

export type TONLoaderDataCallback
    = (data: TONLoaderData | TONLoaderSections) => void | Promise<void>;

export interface TONLoader {
    reset(): void;

    loadData(callback: TONLoaderDataCallback): void;
    loadMoreData(): Promise<void>;
    stopLoadingData(): Promise<void>;

    canLoadMoreData(): boolean;
    isLoadingData(): boolean;

    data: TONLoaderData;
}

export default class TONMultiLoader implements TONLoader {
    static log = log;

    static mergeData = (
        dataA: TONLoaderData,
        dataB: TONLoaderData,
    ): { mergedData: TONLoaderData, lastTime: ?number } => {
        const array: TONLoaderData = [...dataA];
        let lastTime = null;
        dataB.forEach(objB => {
            const time = Number(objB.time);
            if (!lastTime || time < lastTime) {
                lastTime = time;
            }
            array.push(objB);
        });
        const mergedData = uniqBy(array, item => item.key); // remove duplicates
        return { mergedData, lastTime };
    }

    // This function supposed to be an arrow function,
    // because it's used as a parameter in other functions like sort.
    static compareByTime = (objA: TONLoaderDataObject, objB: TONLoaderDataObject) => {
        return Number(objB.time) - Number(objA.time);
    };

    // Constructor
    loaders: TONLoader[];
    data: TONLoaderData;
    lastObjTime: number;
    splitIntoSections: boolean;
    constructor(loaders: TONLoader[] = [], splitIntoSections: boolean = false) {
        if (!loaders.length) {
            throw new Error('No loaders have been passed to a multi loader');
        }
        this.loaders = loaders;
        this.splitIntoSections = splitIntoSections;
        this.reset();
    }

    reset() {
        this.data = [];
        this.lastObjTime = 0;
        this.loaders.forEach(loader => {
            loader.reset();
        });
    }

    // TONLoader protocol
    callback: ?TONLoaderDataCallback;
    loadData(callback: TONLoaderDataCallback) {
        this.callback = callback;
        this.loaders.forEach(loader => {
            loader.loadData(async () => {
                await TONAsync.timeout(0); // ensure ALL loaders started loading the data!
                this.appendData(loader);
                this.returnDataIfReady();
            });
        });
    }

    async loadMoreData(): Promise<void> {
        if (this.isLoadingData()) {
            return;
        }
        if (!this.canLoadMoreData()) {
            return;
        }
        await Promise.all(this.loaders.map(async loader => {
            await loader.loadMoreData();
            this.appendData(loader);
        }));
        this.returnDataIfReady();
    }

    async stopLoadingData() {
        await Promise.all(this.loaders.map(loader => loader.stopLoadingData()));
    }

    canLoadMoreData(): boolean {
        for (let i = 0; i < this.loaders.length; i += 1) {
            const loader = this.loaders[i];
            if (loader.canLoadMoreData()) {
                return true;
            }
        }
        return false;
    }

    isLoadingData(): boolean {
        for (let i = 0; i < this.loaders.length; i += 1) {
            const loader = this.loaders[i];
            if (loader.isLoadingData()) {
                return true;
            }
        }
        return false;
    }

    // Actions
    appendData(loader: TONLoader) {
        // Merge data
        const { mergedData, lastTime } = TONMultiLoader.mergeData(this.data, loader.data);
        // Sort data
        this.data = mergedData.sort(TONMultiLoader.compareByTime);
        // Find last obj time visible for pagination
        if (loader.canLoadMoreData()
            && lastTime && (!this.lastObjTime || lastTime < this.lastObjTime)) {
            this.lastObjTime = lastTime;
        }
    }

    returnDataIfReady() {
        if (this.isLoadingData()) {
            return;
        }
        const data = this.splitIntoSections ? this.getSections() : this.getList();
        if (this.callback) {
            this.callback(data);
        }
    }

    // Public getters
    getList(): TONLoaderData {
        if (this.canLoadMoreData()) {
            return this.data.filter(obj => this.lastObjTime <= obj.time);
        }
        return this.data;
    }

    getSections(): TONLoaderSections {
        const sections = {};
        const list = this.getList();
        list.forEach(obj => {
            const moment = Moment(Number(obj.time) * 1000).fromNow(); // TODO: if need to convert?
            if (!sections[moment]) {
                sections[moment] = [obj];
            } else {
                sections[moment].push(obj);
            }
        });
        return Object.keys(sections).map(moment => ({
            title: moment,
            data: sections[moment],
        }));
    }
}
