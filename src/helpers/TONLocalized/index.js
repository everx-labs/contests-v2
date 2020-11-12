// @flow
import Moment from 'moment';
import 'moment/locale/ru';
import LocalizedStrings from 'react-native-localization';

import en from './en';
import ru from './ru';
import ko from './ko';
import type { TONLocalization } from './TONLocalizedTypes';

class TONLocalized extends LocalizedStrings {
    getLocale() {
        return this.getLanguage(); // this.getInterfaceLanguage().substring(0, 2); // en_US
    }

    localizedStringForValue(value, base) {
        let localizedString = '';
        if (value === 1) {
            localizedString = this[`${base}01`];
        } else {
            let remainder = value % 100;
            if (remainder < 11 || remainder > 14) {
                remainder %= 10;
                if (remainder === 1) {
                    const key = `${base}11`;
                    localizedString = this[key];
                } else if (remainder >= 2 && remainder <= 4) {
                    const key = `${base}24`;
                    localizedString = this[key];
                }
            }
            if (!localizedString) {
                const key = `${base}50`;
                localizedString = this[key];
            }
        }
        return `${value} ${localizedString}`;
    }

    setLocalizedStrings(
        localizedStrings,
        defaultLang = 'en',
        preferredLanguage = this.getInterfaceLanguage(),
    ) {
        const localizedStringsWithDefaultLang = {
            [defaultLang]: localizedStrings[defaultLang],
        };
        Object.keys(localizedStrings).forEach((lang) => {
            if (lang === defaultLang) {
                return;
            }
            localizedStringsWithDefaultLang[lang] = localizedStrings[lang];
        });
        this.setContent(localizedStringsWithDefaultLang);
        this.setLanguage(preferredLanguage);
    }

    checkConsistency(localizedStrings = this.getContent()) {
        const values = {};
        const languages = Object.keys(localizedStrings);
        languages.forEach((lang) => {
            const strings = localizedStrings[lang];
            Object.keys(strings).forEach((key) => {
                let value = values[key];
                if (!value) {
                    value = {};
                    values[key] = value;
                }
                value[lang] = strings[key];
            });
        });
        Object.keys(values).forEach((key) => {
            const value = values[key];
            if (Object.keys(value).length !== languages.length) {
                console.log('[TONLocalized] Failed to find all translations for key:', key, value);
            }
        });
    }
}

type LocalizedStringsMethods = {
    setLanguage(language?: string): void,
    getInterfaceLanguage(): string,
    getAvailableLanguages(): string[],
    formatString(str: string, ...values: any[]): string,
    getString(key: string, language: string): string | null,
}

// For debug purposes
// delete localizedStrings.ru;
const localized: TONLocalization & TONLocalized & LocalizedStringsMethods =
    new TONLocalized({
        en,
        ru,
        ko,
    });

if (window.location.origin.includes('korea')) localized.setLanguage('ko');
Moment.locale(localized.getLocale());

export default localized;
