const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                // exclude: /node_modules/,
                include: [
                    path.resolve('index.web.js'),
                    path.resolve(__dirname, './src'),
                    path.resolve(__dirname, './node_modules/webpack-dev-server/'),
                    path.resolve(__dirname, './node_modules/react-native-image-picker'), // for mobile, isn't uncluded at the end
                    path.resolve(__dirname, './node_modules/react-native-lightbox'), // for mobile, isn't uncluded at the end
                    path.resolve(__dirname, './node_modules/react-native-web'),
                    path.resolve(__dirname, './node_modules/react-localization'),
                    path.resolve(__dirname, './node_modules/react-clone-referenced-element'),
                    path.resolve(__dirname, './node_modules/react-images'),
                    path.resolve(__dirname, './node_modules/react-native-tab-view'),
                    path.resolve(__dirname, './node_modules/react-native-localizatation'),
                    path.resolve(__dirname, './node_modules/react-native-popup-dialog'),
                    path.resolve(__dirname, './node_modules/react-navigation'),
                    path.resolve(__dirname, './node_modules/react-native-dropdownalert'),
                    path.resolve(__dirname, './node_modules/libphonenumber-js'),
                    path.resolve(__dirname, './node_modules/async'),
                    path.resolve(__dirname, './node_modules/util'),
                    path.resolve(__dirname, './node_modules/react-native-android-keyboard-adjust'),
                    path.resolve(__dirname, './node_modules/react-native-status-bar-height'),
                    path.resolve(__dirname, './node_modules/react-native-iphone-x-helper'),
                    path.resolve(__dirname, './node_modules/react-native-sentry'),
                    path.resolve(__dirname, './node_modules/raven-js'),
                    path.resolve(__dirname, './node_modules/fsevents'),
                    path.resolve(__dirname, './node_modules/graceful-fs'),
                    path.resolve(__dirname, './node_modules/react-native'),
                    path.resolve(__dirname, './node_modules/react-native-device-info'),
                    path.resolve(__dirname, './node_modules/react-native-flash-message'),
                    path.resolve(__dirname, './node_modules/query-string'),
                    path.resolve(__dirname, './node_modules/strict-uri-encode'),
                    path.resolve(__dirname, './node_modules/react-native-simple-popover'),
                    path.resolve(__dirname, './node_modules/validator'),
                    path.resolve(__dirname, './node_modules/web3'),
                    path.resolve(__dirname, './node_modules/web3-provider-engine'),
                    path.resolve(__dirname, './node_modules/react-native-keychain'),
                    path.resolve(__dirname, './node_modules/ton-client-js'),
                    path.resolve(__dirname, './node_modules/react-native-branch'),
                ],
                loader: 'babel-loader',
                query: {
                    cacheDirectory: true,
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-flow',
                        '@babel/preset-react',
                        'module:metro-react-native-babel-preset',
                    ],
                    babelrc: true,
                    plugins: [
                        'babel-plugin-react-native-web',
                        'babel-plugin-transform-react-remove-prop-types',
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        '@babel/plugin-proposal-class-properties',
                        '@babel/plugin-proposal-do-expressions',
                        '@babel/plugin-proposal-export-default-from',
                        '@babel/plugin-proposal-export-namespace-from',
                        '@babel/plugin-proposal-function-bind',
                        '@babel/plugin-proposal-function-sent',
                        '@babel/plugin-proposal-json-strings',
                        '@babel/plugin-proposal-logical-assignment-operators',
                        '@babel/plugin-proposal-nullish-coalescing-operator',
                        '@babel/plugin-proposal-numeric-separator',
                        '@babel/plugin-proposal-optional-chaining',
                        ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
                        '@babel/plugin-proposal-throw-expressions',
                        '@babel/plugin-syntax-bigint',
                        '@babel/plugin-syntax-dynamic-import',
                        '@babel/plugin-syntax-import-meta',
                        '@babel/plugin-transform-arrow-functions',
                        '@babel/plugin-transform-async-to-generator',
                        '@babel/plugin-transform-block-scoping',
                        '@babel/plugin-transform-classes',
                        '@babel/plugin-transform-runtime',
                    ],
                },
            },
            {
                test: /\.(gif|jpe?g|png|svg)$/,
                loader: 'react-native-web-image-loader', // 'url-loader',
                query: { name: '[name].[hash:16].[ext]' },
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            },
            {
                test: /\.(pdf|zip)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
            fs: 'brfs',
            '@react-native-community/async-storage': 'react-native-web/dist/exports/AsyncStorage',
            'react-native': 'react-native-web',
            'react-native-localization': 'react-localization',
            'react-native-branch': 'branch-sdk',
            'react-native-linear-gradient': 'react-native-web-linear-gradient',
            'react-native-parsed-text': 'react', // Hack in order not to load
            'react-native-android-keyboard-adjust': 'react', // Hack in order not to load
            'react-native-image-picker': 'react', // Hack in order not to load
            'react-native-firebase': 'react', // Hack in order not to load
            'rn-fetch-blob': 'react', // Hack in order not to load
            './NativeClient': 'react', // Hack for react-native-sentry
            './raven-plugin': 'raven-js/plugins/console.js', // Hack for react-native-sentry
            net: 'react', // Hack in order not to load
            'react-native-safe-area': 'react', // Hack in order not to load
            'bitcore-mnemonic': 'react', // Hack in order not to load
            'react-native-sentry': 'react', // Hack in order not to load
            'react-native-status-bar-height': 'react', // Hack in order not to load
            'react-native-device-info': 'react', // Hack in order not to load
            '@react-native-community/netinfo': 'react', // Hack in order not to load
            'react-style-proptype': 'react', // Hack in order not to load
            'react-native-lightbox': 'react', // Hack in order not to load
            'react-native-fast-image': 'react', // Hack in order not to load
            'react-native-dropdownalert': 'react', // Hack in order not to load
        },
    },
};
