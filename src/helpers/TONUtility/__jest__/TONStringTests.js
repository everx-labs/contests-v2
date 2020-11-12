// @flow
import TONUtility from '../index';
import TONNativeUtilityNodeJs from '../TONNativeUtilityNodeJs';
import TONString from '../TONString';

beforeAll(async () => {
    await TONUtility.setup(TONNativeUtilityNodeJs);
});

test('Text Processing', () => {
    expect(TONString.extractWords('a%%b4   cad.Info  AAA 56'))
        .toEqual(['a', 'b4', 'cad', 'info', 'aaa', '56']);
    expect(TONString.normalizeWords('b6.+B33  теСт Альфа4 альфа1 INFO on+Phone-info 56 42ABC'))
        .toEqual('42abc 56 b33 b6 info info on phone альфа1 альфа4 тест');
    expect(TONString.findHighlights(
        'WOR',
        'Words worth saying to a worm dying by the sword named Wor-Worm-ТОН, Повелитель Червей 🐛',
    )).toEqual([
        { string: 'Wor', selected: true, index: 0 },
        { string: 'ds', selected: false, index: 3 },
        { string: ' wor', selected: true, index: 5 },
        { string: 'th saying to a', selected: false, index: 9 },
        { string: ' wor', selected: true, index: 23 },
        { string: 'm dying by the sword named', selected: false, index: 27 },
        { string: ' Wor', selected: true, index: 53 },
        { string: '-Worm-ТОН, Повелитель Червей 🐛', selected: false, index: 57 },
    ]);
    expect(TONString.lookupInPhrase(
        'Повелитель Че 🐛 WOR worth dy THE wor-',
        'Words worth saying to a worm dying by the sword named Wor-Worm-ТОН, Повелитель Червей 🐛',
    )).toEqual(true);
    expect(TONString.lookupInPhrase(
        'Повелитель Мух',
        'Words worth saying to a worm dying by the sword named Wor-Worm-ТОН, Повелитель Червей 🐛',
    )).toEqual(false);
    expect(TONString.getAvatarInitials('aaa бб ccc')).toEqual('AБ');
    expect(TONString.getAvatarInitials('aaa 34+')).toEqual('A');
    expect(TONString.getAvatarInitials('34+')).toEqual('#');
    expect(TONString.getAvatarInitials('34+ A')).toEqual('A');
    expect(TONString.getAvatarInitials('')).toEqual('');
    expect(TONString.getAvatarInitials('$$ a')).toEqual('A');
    expect(TONString.getAvatarInitials('$$')).toEqual('');
});

test('Address', () => {
    expect(TONString.isSameAddress(
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97b',
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97b',
    )).toBe(true);
    expect(TONString.isSameAddress(
        '2BEC3C5AECE6D17DF9B523305BC7F0B32C5C4F3917E73021B08D57503380A97B',
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97b',
    )).toBe(true);
    expect(TONString.isSameAddress(
        '2BEC3C5AECE6D17DF9B523305BC7F0B32C5C4F3917E73021B08D57503380A97B',
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97',
    )).toBe(false);
    expect(TONString.isSameAddress('', null)).toBe(true);
    expect(TONString.isSameAddress('', undefined)).toBe(true);
    expect(TONString.isSameAddress(null, undefined)).toBe(true);
    expect(TONString.isSameAddress(
        null,
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97b',
    )).toBe(false);
    expect(TONString.isSameAddress(
        undefined,
        '2bec3c5aece6d17df9b523305bc7f0b32c5c4f3917e73021b08d57503380a97b',
    )).toBe(false);
});

test('Whitespaces', () => {
    expect(TONString.reduceWhitespaces('1234')).toEqual('1234');
    expect(TONString.reduceWhitespaces('')).toEqual('');
    expect(TONString.reduceWhitespaces(' \t\r\n')).toEqual('');
    expect(TONString.reduceWhitespaces(' \ta  \r \n b  ')).toEqual('a b');
    expect(TONString.reduceWhitespaces('a\nb')).toEqual('a b');
    expect(TONString.reduceWhitespaces('\n\n\n\t a')).toEqual('a');
    expect(TONString.reduceWhitespaces('a \n\r\t\t')).toEqual('a');
});

test('numbers', () => {
    expect(TONString.removeTrailingZeros('1.12000', 2))
        .toEqual('1.12');
    expect(TONString.removeTrailingZeros('1.12000', 1))
        .toEqual('1.12');
    expect(TONString.removeTrailingZeros('1.12000', 3))
        .toEqual('1.120');
    expect(TONString.removeTrailingZeros('1.12', 3))
        .toEqual('1.12');
    expect(TONString.removeTrailingZeros('1.12', 0))
        .toEqual('1.12');
    expect(TONString.removeTrailingZeros('1.0', 0))
        .toEqual('1');
    expect(TONString.removeTrailingZeros('1.0', 2))
        .toEqual('1.0');
    expect(TONString.removeTrailingZeros('1', 2))
        .toEqual('1');
    expect(TONString.removeTrailingZeros('12', 3))
        .toEqual('12');
});

test('reduceLength', () => {
    expect(TONString.reduceLength(
        '90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a',
        50,
        5,
        5,
    ))
        .toEqual('90cb8···4f32a');
    expect(TONString.reduceLength(
        '90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a',
        50,
        5,
        0,
    ))
        .toEqual('90cb8···');
    expect(TONString.reduceLength(
        '90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a',
        50,
        0,
        5,
    ))
        .toEqual('···4f32a');
    expect(TONString.reduceLength(
        '90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a',
        100,
        0,
        5,
    ))
        .toEqual('90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a');
    expect(TONString.reduceWordsLength(
        ':90cb87880d7bcf17e19ef6eecd400bd2d2b0be0091ce2c02713048913554f32a.',
        50,
        5,
        5,
    ))
        .toEqual(':90cb8···4f32a.');
});

test('digits', () => {
    expect(TONString.getNumberOfDigits('11-22+33:44/55')).toEqual(10);
    expect(TONString.getNumberOfDigits('0123456789ABCDEF')).toEqual(10);
    expect(TONString.getNumberOfIntegerDigits('1000000000')).toEqual(10);
    expect(TONString.getNumberOfIntegerDigits('0.0000000001')).toEqual(1);
    expect(TONString.getNumberOfIntegerDigits('12345678901234567890')).toEqual(20);
    expect(TONString.getNumberOfIntegerDigits('0.000000000000000001')).toEqual(1);
});
