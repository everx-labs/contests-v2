// @flow
const customEnv: { [string]: any } = {};

export default class TONEnvironment {
    static Keys = Object.freeze({
        NODE_ENV: 'NODE_ENV',
    });

    static setEnv(env: { [string]: any }) {
        Object.assign(customEnv, env);
    }

    static getEnv(key: string, defaultValue?: ?string): string {
        return `${customEnv[key] || defaultValue || ''}`.toLowerCase();
    }

    static isDevelopment(): boolean {
        return this.getEnv(this.Keys.NODE_ENV, process.env.NODE_ENV) === 'development';
    }

    static isProduction(): boolean {
        return this.getEnv(this.Keys.NODE_ENV, process.env.NODE_ENV) === 'production';
    }
}
