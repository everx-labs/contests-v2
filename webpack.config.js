const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const webpackModules = require('./webpack.js');

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, './web'),
        compress: true,
        port: 4000,
        disableHostCheck: true,
        historyApiFallback: true,
        before: (app) => {
            app.post('/accounts', (req, res) => {
                res.redirect(req.originalUrl);
            });
        },
    },
    entry: path.join(__dirname, './index.web.js'),
    output: {
        path: path.join(__dirname, './web/assets'),
        publicPath: 'assets/',
        filename: '[name].bundle.js',
    },
    devtool: 'source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            __DEV__: true,
        }),
        new CopyPlugin([
            { from: './node_modules/ton-client-web-js/tonclient.wasm' },
        ]),
        new webpack.LoaderOptionsPlugin({
            minimize: false,
            debug: true,
        }),
    ],
    ...webpackModules,
};
