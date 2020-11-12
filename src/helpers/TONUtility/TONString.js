// @flow
import {
    parsePhoneNumberFromString,
    parseDigits,
} from 'libphonenumber-js';
import BigNumber from 'bignumber.js';

import isAlpha, { locales } from 'validator/lib/isAlpha';
import TONLog from './TONLog';

type NumberFormatInfo = {
    grouping: string,
    thousands: string,
    decimal: string,
};

// This stores the order of the date and the separator character
// for a locale configuration. i.e.  for the date: 07.06.1986
// the position for each part is: day = 0, month = 1, year = 2
// and the separator is: '.'
type DateFormatInfo = {
    separator: string,
    localePattern: string,
    components: string[],
};

export type TONNumberParts = {
    value: number,
    integer: string,
    decimal: string,
    valueString: string,
};

export type TONNumberPartsOptions = {
    minimumFractionDigits: number,
    maximumFractionDigits: number,
}

export type TONStringHighlight = {
    string: string,
    selected: boolean,
    index: number,
};

function getNumberFormatInfo(): NumberFormatInfo {
    const formatParser = /111(\D*)222(\D*)333(\D*)444/g;
    const parts = formatParser.exec(111222333.444.toLocaleString()) || ['', '', '', '.'];
    return {
        grouping: parts[1],
        thousands: parts[2],
        decimal: parts[3],
    };
}

function getDateFormatInfo(): DateFormatInfo {
    const date = new Date(1986, 5, 7);
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();

    // TODO: Uncomment once updated to RN0.59
    // const options = {
    //    year: 'numeric',
    //    month: '2-digit',
    //    day: 'numeric',
    // };
    // Not working for android due to RN using JavaScriptCore engine in non-debug mode
    // const localeDate = date.toLocaleDateString(undefined, options);
    const localeDate = '07/06/1986';
    const formatParser = /(\d{1,4})(\D{1})(\d{1,4})\D{1}(\d{1,4})/g;
    const parts = formatParser.exec(localeDate) || ['', '7', '.', '6', '1986'];

    const separator = parts[2] || '.';
    const components = ['year', 'month', 'day'];
    const symbols = {
        year: 'YYYY',
        month: 'MM',
        day: 'DD',
    };

    const shortDateNumbers = [];
    const splitDate = localeDate.split(separator);
    splitDate.forEach(component => shortDateNumbers.push(Number(component)));

    if (shortDateNumbers?.length === 3) {
        components[shortDateNumbers.indexOf(d)] = 'day';
        components[shortDateNumbers.indexOf(m)] = 'month';
        components[shortDateNumbers.indexOf(y)] = 'year';
    }

    // TODO: Need to find a better way to get the pattern.
    let localePattern = `${symbols[components[0]]}${separator}`;
    localePattern = `${localePattern}${symbols[components[1]]}`;
    localePattern = `${localePattern}${separator}${symbols[components[2]]}`;

    return {
        separator,
        localePattern,
        components,
    };
}

export type TONStringLocaleInfo = {
    name: string,
    numbers: NumberFormatInfo,
    dates: DateFormatInfo,
};

let localeInfo: TONStringLocaleInfo = {
    name: '',
    numbers: getNumberFormatInfo(),
    dates: getDateFormatInfo(),
};

/**
 * Utility functions for strings
 */
const log = new TONLog('TONString');
export default class TONString {
    static log = log;

    static setLocaleInfo(newLocaleInfo: TONStringLocaleInfo) {
        localeInfo = {
            ...localeInfo,
            ...newLocaleInfo,
        };
    }

    static getLocaleInfo(): TONStringLocaleInfo {
        return localeInfo;
    }

    /**
     * Returns first capitalized letter or empty string.
     * @param s
     * @return {string}
     */
    static getUpperCasedFirstLetter(s: string): string {
        if (!s) return '';

        for (let i = 0; i < s.length; i += 1) {
            const c = s[i].toUpperCase();
            if (c !== c.toLowerCase()) {
                return c;
            }
        }

        return '';
    }

    /**
     * Returns first capitalized letters from strings.
     * @param strings
     * @param maxLetters
     * @return {string}
     */
    static getInitials(strings: string[], maxLetters: number = 0): string {
        const initials = strings.map(TONString.getUpperCasedFirstLetter).join('');
        if (maxLetters) {
            return initials.slice(0, maxLetters);
        }
        return initials;
    }

    static isValidName(name: string) {
        if (name === '') {
            return true;
        }
        const availableSymbols = '—\'‘’- ';
        const symbols = name.split('');

        const wrongSymbol = symbols.find(symbol => {
            const symbolIsAlpha = locales.find(locale => {
                return isAlpha(symbol, locale);
            });

            return !symbolIsAlpha && !availableSymbols.includes(symbol);
        });

        return wrongSymbol === undefined;
    }

    static isDigit(c: string): boolean {
        return c.length === 1 && '0123456789'.includes(c);
    }

    static hasDigits(string: string): boolean {
        for (let i = 0; i < string.length; i += 1) {
            if (TONString.isDigit(string[i])) {
                return true;
            }
        }
        return false;
    }

    static getNumberOfDigits(string: string) {
        let n = 0;
        for (let i = 0; i < string.length; i += 1) {
            if (TONString.isDigit(string[i])) {
                n += 1;
            }
        }
        return n;
    }

    static getNumberOfIntegerDigits(number: string) {
        const string = this.getNumberString(Number(number));
        const defaultSeparator = '.';
        return this.getNumberOfDigits(string.split(defaultSeparator)[0]);
    }

    // Allows to print numbers without "-e" suffix
    static getNumberString(number: number): string {
        if (Math.abs(number) > 1) { // Apply BigNumber conversion only for non-small numbers!
            try {
                return new BigNumber(number).toString();
            } catch (error) {
                log.debug('Failed to convert the number to string with BigNumber instance:', error);
            }
        }
        return number.toFixed(10).replace(/\.?0+$/, ''); // not as precise as BigNumber conversion
    }

    static getAvatarInitials(string: string): string {
        const initials = TONString.getInitials(string.split(' '), 2);
        if (initials.length > 0) {
            return initials;
        }
        return TONString.hasDigits(string) ? '#' : '';
    }

    static getWalletAddressString(address: string): string {
        const start = address.substr(0, 4);
        const end = address.substr(address.length - 4, 4);
        return `${start} ···· ${end}`;
    }

    static replaceAll(s: string, search: string, replace: string): string {
        if (search === '') {
            return s;
        }
        return s.split(search).join(replace);
    }

    static normalizedAmount(s: ?string): ?string {
        if (s === undefined || s === null) {
            return null;
        }
        let normalized = TONString.replaceAll(`${s}`, ' ', '');
        const { grouping, thousands, decimal } = localeInfo.numbers;
        normalized = TONString.replaceAll(normalized, grouping, '');
        normalized = TONString.replaceAll(normalized, thousands, '');
        normalized = normalized.replace(decimal, '.');
        return normalized;
    }

    /**
     * Converts a user input into numeric value or null if conversion isn't possible.
     * Conversion designed for strings related to a money representation.
     * @param s
     * @return {null}
     */
    static parseAmount(s: ?string): ?number {
        const normalized = TONString.normalizedAmount(s);
        if (!normalized) {
            return null;
        }
        const n = Number(normalized);
        return !Number.isNaN(n) ? n : null;
    }

    static toFixedDown(number: string, fixed: number = 2) {
        const reg = new RegExp(`(^-?\\d+\\.\\d{${fixed}})`);
        const match = number.toString().match(reg);
        return match ? match[0] : Number(number).toFixed(fixed);
    }

    static removeTrailingZeros(numberString: string, minFractionalLength: number = 0): string {
        const decimalSeparator = TONString.getLocaleInfo().numbers.decimal;
        const parts = numberString.split(decimalSeparator);
        if (parts.length < 2) {
            return numberString;
        }
        const last = parts[parts.length - 1];
        let newLength = last.length;
        while (newLength > minFractionalLength && last[newLength - 1] === '0') {
            newLength -= 1;
        }
        if (newLength === last.length) {
            return numberString;
        }
        if (newLength === 0) {
            parts.splice(parts.length - 1, 1);
        } else {
            parts[parts.length - 1] = last.substr(0, newLength);
        }
        return parts.join(decimalSeparator);
    }

    static getNumberParts(
        value: string,
        options: TONNumberPartsOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 9,
        },
    ): ?TONNumberParts {
        // Normalize passed value
        const normalizedValue = TONString.normalizedAmount(value);
        if (normalizedValue === undefined || normalizedValue === null
            || Number.isNaN(Number(normalizedValue))) {
            log.error(`The string '${value}' can't be parsed as a number`);
            return null;
        }
        // If the string contains more than one decimal separator return null.
        const defaultSeparator = '.';
        const splitParts = normalizedValue.split(defaultSeparator);
        // Two is the max number of parts
        if (splitParts.length > 2) {
            log.error(`The string '${value}' can't be parsed as a number with more than one separator`);
            return null;
        }
        // Calculate and combine the result values into a single TONNumberParts object
        const result = {
            value: 0,
            integer: '0',
            decimal: '',
            valueString: '0',
        };
        // Fix value by rounding it from above
        const fixedValue = (splitParts[1]?.length || 0) > options.maximumFractionDigits
            ? TONString.toFixedDown(normalizedValue, options.maximumFractionDigits)
            : normalizedValue;
        // Remove unwanted leading zeros
        const trimmedValue = fixedValue.replace(/^0+/, '');
        const plainValue = !trimmedValue.length || trimmedValue.startsWith(defaultSeparator)
            ? `0${trimmedValue}`
            : trimmedValue;
        // Set resulted value
        result.value = Number(plainValue);
        // Find value components
        const components = plainValue.split(defaultSeparator);
        result.integer = components[0] || '0';
        result.decimal = components[1] || '';
        const trailingZerosToAdd = options.minimumFractionDigits - result.decimal.length;
        if (trailingZerosToAdd > 0) {
            result.decimal = `${result.decimal}${'0'.repeat(trailingZerosToAdd)}`;
        }
        // Localize value string
        const integerString
                = result.integer.replace(/\B(?=(\d{3})+(?!\d))/g, localeInfo.numbers.thousands);
        const separatorString = plainValue.indexOf(defaultSeparator) >= 0 || trailingZerosToAdd > 0
            ? localeInfo.numbers.decimal
            : '';
        const decimalString = result.decimal || '';
        result.valueString = `${integerString}${separatorString}${decimalString}`;
        // Return result
        return result;
    }

    static isWalletAddress(expression: string) {
        const split = expression.split(':');
        if (split.length === 2) {
            return !Number.isNaN(Number(split[0])) && split[1].length === 64;
        }
        return false;
    }

    static isEmailAddress(expression: string) {
        // eslint-disable-next-line
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(expression).toLowerCase());
    }

    static isPhoneValid(phone: ?string) {
        let valid = false;
        try {
            const parseResult = parsePhoneNumberFromString(`+${phone || ''}`);
            valid = parseResult && parseResult.isValid();
        } catch (exception) {
            log.debug(`Failed to parse phone code ${phone || ''} with exception`, exception);
        }
        return valid;
    }

    static isPhoneNumber(expression: string) {
        if (expression.length > 40) {
            // TODO: think how to remove this hack!!
            return false;
        }
        const normalizedPhone = TONString.normalizePhone(expression);
        return TONString.isPhoneValid(normalizedPhone);
    }

    static isTelegramUsername(expression: string) {
        return (expression.startsWith('@') && expression.length > 5);
    }

    static isSamePhone(phoneA: string, phoneB: string) {
        const normalizedPhoneA = TONString.normalizePhone(phoneA);
        const normalizedPhoneB = TONString.normalizePhone(phoneB);
        return TONString.isPhoneValid(normalizedPhoneA) && TONString.isPhoneValid(normalizedPhoneB)
            && normalizedPhoneA === normalizedPhoneB;
    }

    static numericText(text: string): string {
        return parseDigits(text);
    }

    static internationalPhone(phone: string): ?string {
        if (!phone) {
            return null;
        }
        const phoneNumber = TONString.numericText(phone);
        let parsedPhone = parsePhoneNumberFromString(`+${phoneNumber}`);
        if (!parsedPhone || !parsedPhone.isValid()) {
            parsedPhone = parsePhoneNumberFromString(phoneNumber, 'RU'); // parse 8 prefixed phones
        }
        if (!parsedPhone || !parsedPhone.isValid()) {
            parsedPhone = parsePhoneNumberFromString(phoneNumber, 'US'); // parse the rest
        }
        if (!parsedPhone) {
            return null;
        }
        return parsedPhone.formatInternational();
    }

    static normalizePhone(phone: string): string {
        const internationalPhone = TONString.internationalPhone(phone);
        if (!internationalPhone) {
            return TONString.numericText(phone);
        }
        return TONString.numericText(internationalPhone);
    }

    static normalizeEmail(email: string): string {
        return email.toLowerCase();
    }

    static extractWords(string: string): string[] {
        let result = '';
        let lastWasSeparator = true;
        for (let i = 0; i < string.length; i += 1) {
            const c = string[i].toLowerCase();
            const isLetterOrDigit = TONString.isDigit(c) || c !== c.toUpperCase();
            if (isLetterOrDigit) {
                if (lastWasSeparator && result.length > 0) {
                    result += ' ';
                }
                lastWasSeparator = false;
                result += c;
            } else {
                lastWasSeparator = true;
            }
        }
        return result.split(' ');
    }

    static normalizeWords(string: string): string {
        return TONString.extractWords(string).sort().join(' ');
    }

    static hasIntersections(a: any[], b: any[]): boolean {
        if (a.length === 0 || b.length === 0) {
            return false;
        }
        for (let i = 0; i < a.length; i += 1) {
            for (let j = 0; j < b.length; j += 1) {
                if (a[i] === b[j]) {
                    return true;
                }
            }
        }
        return false;
    }

    static generateUUID(): string {
        // TODO: The simplest implementation yet
        let d = new Date().getTime();
        // Use high-precision timer if available
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            d += performance.now();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            // eslint-disable-next-line no-bitwise
            const r = (d + (Math.random() * 16)) % 16 | 0;
            d = Math.floor(d / 16);
            // eslint-disable-next-line no-bitwise
            return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
        });
    }

    static findHighlights(expression: string, string: string): TONStringHighlight[] {
        if (!expression || !string) {
            return [];
        }
        try {
            const escapedExpression = expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regexp = new RegExp(`(^|\\s)${escapedExpression}`, 'gi');
            let result = regexp.exec(string);
            const highlights = [];
            let index = 0;
            while (result && result[0].length > 0) {
                // Add not selected part of the name
                if (result.index) {
                    highlights.push({
                        string: string.substring(index, result.index),
                        selected: false,
                        index,
                    });
                }
                // Add selected part of the name
                highlights.push({
                    string: result[0],
                    selected: true,
                    index: result.index,
                });
                index = result.index + result[0].length;
                result = regexp.exec(string);
            }
            // Add the rest of not selected part of the name
            highlights.push({
                string: string.substring(index),
                selected: false,
                index,
            });
            return highlights;
        } catch (error) {
            log.error('Failed to find highlights with error:', error);
        }
        return [];
    }

    static lookupInPhrase(string: string, phrase: string) {
        const searchWords: string[] = string.toLowerCase().split(' ');
        const words: string[] = phrase.toLowerCase().split(' ');
        for (let i = 0; i < searchWords.length; i += 1) {
            const searchWord = searchWords[i];
            let found = false;
            for (let j = 0; j < words.length; j += 1) {
                const word = words[j];
                // if (word.indexOf(searchWord) === 0) {
                if (word.includes(searchWord)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    static isSameAddress(a: ?string, b: ? string): boolean {
        return a && b ? a.toLowerCase() === b.toLowerCase() : !!a === !!b;
    }

    static isWhitespace(c: string): boolean {
        return (c.length === 1) && ' \r\n\t'.includes(c);
    }

    static reduceWhitespaces(s: string): string {
        let reduced = '';
        let whitespaceRequired = false;
        for (let i = 0; i < s.length; i += 1) {
            const c = s[i];
            if (TONString.isWhitespace(c)) {
                if (!whitespaceRequired && reduced.length > 0) {
                    whitespaceRequired = true;
                }
            } else {
                if (whitespaceRequired) {
                    reduced += ' ';
                    whitespaceRequired = false;
                }
                reduced += c;
            }
        }
        return reduced;
    }

    static reduceLength(s: string, maxLength: number, left: number, right: number): string {
        if (s.length <= maxLength) {
            return s;
        }
        return `${left ? s.substr(0, left) : ''}···${right ? s.substr(-right) : ''}`;
    }

    static reduceWordsLength(s: string, maxLength: number, left: number, right: number): string {
        let reduced = '';
        let start = 0;
        let isInsideWord = false;
        const appendPortion = (next: number) => {
            if (next > start) {
                const portion = s.substring(start, next);
                if (isInsideWord) {
                    reduced += TONString.reduceLength(portion, maxLength, left, right);
                } else {
                    reduced += portion;
                }
            }
        };

        for (let i = 0; i < s.length; i += 1) {
            const c = s[i];
            const isWordChar = c.toLowerCase() !== c.toUpperCase() || TONString.isDigit(c);
            if (isWordChar !== isInsideWord) {
                appendPortion(i);
                start = i;
                isInsideWord = isWordChar;
            }
        }
        appendPortion(s.length);
        return reduced;
    }

    static errorMessage(error: any): string {
        if (typeof error === 'string' || error instanceof String) {
            return error;
        }
        if (error instanceof Error) {
            return error.message ? JSON.stringify(error.message) : error.toString();
        }
        if (error instanceof Object) {
            return JSON.stringify(error);
        }
        return `${error}`;
    }

    // Internals
}
