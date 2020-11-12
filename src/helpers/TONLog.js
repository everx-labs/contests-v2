// @flow
// import { FBLog } from '../services/FBKit/FBKit'; // Circular dependency!!!
// TODO: remove TONLog from FBKit!

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

    debugs: TONLogLevelSettings;
    infos: TONLogLevelSettings;
    warnings: TONLogLevelSettings;
    errors: TONLogLevelSettings;

    // Constructor
    constructor() {
        this.debugs = new TONLogLevelSettings();
        this.infos = new TONLogLevelSettings();
        this.warnings = new TONLogLevelSettings();
        this.errors = new TONLogLevelSettings();
    }

    // Actions
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
            console.log(this.prefix(), ...args);
        }
    }

    info(...args: any[]) {
        if (this.settings.infos.isEnabledFor(this)) {
            console.log(this.prefix(), ...args);
            // FBLog.message(this.prefix(), ...args);
        }
    }

    warning(...args: any[]) {
        if (this.settings.warnings.isEnabledFor(this)) {
            console.warn(this.prefix(), ...args);
            // FBLog.message(this.prefix(), ...args);
        }
    }

    error(...args: any[]) {
        if (this.settings.errors.isEnabledFor(this)) {
            console.error(this.prefix(), ...args);
            // FBLog.error(this.prefix(), ...args);
        }
    }

    // Internals

    prefix() {
        return `[${this.source}] `;
    }
}
