/* eslint-disable class-methods-use-this */
// @flow
import TONAsync from '../TONAsync';
import TONLimitedFetcher from '../TONLimitedFetcher';

class TestFetcher extends TONLimitedFetcher<*, *> {
    async fetchData(params: *): Promise<*> {
        await TONAsync.timeout(1);
        return params;
    }
}

test('Data Fetcher', async () => {
    const fetched = [];
    const fetcher = new TestFetcher();
    fetcher.loadingLimit = 5;
    const open = (params: any) => {
        const listener = fetcher.createListener((data) => {
            fetched.push(data);
        });
        listener.open(params);
        return listener;
    };

    let listener = open(0);
    expect(fetcher.getCounters()).toEqual({
        loading: 1,
        waiting: 0,
        loaded: 0,
    });
    listener.close();
    expect(fetcher.getCounters()).toEqual({
        loading: 1,
        waiting: 0,
        loaded: 0,
    });
    expect(fetched).toEqual([]);

    await TONAsync.timeout(2);
    expect(fetcher.getCounters()).toEqual({
        loading: 0,
        waiting: 0,
        loaded: 1,
    });
    expect(fetched).toEqual([]);

    listener = open(1);
    await TONAsync.timeout(2);
    listener.close();
    expect(fetcher.getCounters()).toEqual({
        loading: 0,
        waiting: 0,
        loaded: 2,
    });
    expect(fetched).toEqual([1]);

    for (let i = 0; i < 10; i += 1) {
        open(i);
    }
    expect(fetcher.getCounters()).toEqual({
        loading: 5,
        waiting: 3,
        loaded: 2,
    });
    expect(fetched).toEqual([1, 0, 1]);

    await TONAsync.timeout(10);
    expect(fetcher.getCounters()).toEqual({
        loading: 0,
        waiting: 0,
        loaded: 10,
    });
    const sorted = [...fetched].sort();
    expect(sorted).toEqual([0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    fetcher.reset();
    expect(fetcher.getCounters()).toEqual({
        loading: 0,
        waiting: 0,
        loaded: 0,
    });
});
