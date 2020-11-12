// @flow
import TONEnvironment from './TONEnvironment';

export type TONLogWriter = {
    debug: (...args: any[]) => void,
    info: (...args: any[]) => void,
    warning: (...args: any[]) => void,
    error: (...args: any[]) => void,
};

const defaultWriter: TONLogWriter = Object.freeze({
    debug(...args: any[]) {
        console.log(...args);
    },
    info(...args: any[]) {
        console.log(...args);
    },
    warning(...args: any[]) {
        console.warn(...args);
    },
    error(...args: any[]) {
        console.error(...args);
    },
});

/**
 * Settings for particular log level (debugs, infos, warnings or errors).
 */
class TONLogLevelSettings {
    enabled: boolean;
    explicitlyEnabledSources: Set<string>;
    explicitlyDisabledSources: Set<string>;

    constructor() {
        this.enabled = true;
        this.explicitlyDisabledSources = new Set<string>();
        this.explicitlyEnabledSources = new Set<string>();
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    enableFor(logs: TONLog[]) {
        logs.forEach((log) => {
            this.explicitlyEnabledSources.add(log.source);
            this.explicitlyDisabledSources.delete(log.source);
        });
    }

    disableFor(logs: TONLog[]) {
        logs.forEach((log) => {
            this.explicitlyDisabledSources.add(log.source);
            this.explicitlyEnabledSources.delete(log.source);
        });
    }

    /**
     * Returns true if this level is enabled for specified log.
     */
    isEnabledFor(log: TONLog): boolean {
        if (this.explicitlyDisabledSources.has(log.source)) {
            return false;
        }
        if (this.explicitlyEnabledSources.has(log.source)) {
            return true;
        }
        return this.enabled;
    }
}

/**
 * Settings for logging.
 */
export class TONLogSettings {
    static shared = new TONLogSettings();
    static defaultWriter = defaultWriter;

    debugs: TONLogLevelSettings;
    infos: TONLogLevelSettings;
    warnings: TONLogLevelSettings;
    errors: TONLogLevelSettings;
    writer: TONLogWriter;

    // Constructor
    constructor() {
        this.writer = defaultWriter;
        this.debugs = new TONLogLevelSettings();
        this.infos = new TONLogLevelSettings();
        this.warnings = new TONLogLevelSettings();
        this.errors = new TONLogLevelSettings();
    }

    // Actions
    enableDebug() {
        this.debugs.setEnabled(true);
    }

    enableAll() {
        this.debugs.setEnabled(true);
        this.infos.setEnabled(true);
        this.warnings.setEnabled(true);
        this.errors.setEnabled(true);
    }

    disableDebug() {
        this.debugs.setEnabled(false);
    }

    disableAll() {
        this.debugs.setEnabled(false);
        this.infos.setEnabled(false);
        this.warnings.setEnabled(false);
        this.errors.setEnabled(false);
    }
}

/**
 * Log for specified source.
 */
export default class TONLog {
    source: string;
    settings: TONLogSettings;

    constructor(source: string) {
        this.source = source;
        this.settings = TONLogSettings.shared;
    }

    debug(...args: any[]) {
        if (this.settings.debugs.isEnabledFor(this)) {
            this.settings.writer.debug(this.prefix(), ...args);
        }
    }

    info(...args: any[]) {
        this.settings.writer.info(this.prefix(), ...args);
    }

    warning(...args: any[]) {
        this.settings.writer.warning(this.prefix(), ...args);
    }

    error(...args: any[]) {
        const production = TONEnvironment.isProduction();
        // Should ALWAYS log errors in production!
        if (production || this.settings.errors.isEnabledFor(this)) {
            this.settings.writer.error(this.prefix(), ...args);
        }
    }

    // Internals

    prefix() {
        return `[${this.source}] `;
    }
}
