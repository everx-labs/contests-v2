const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const webpackModules = require('./webpack.js');

module.exports = (env) => {
    const ASSET_PATH = (env && env.ASSET_PATH);
    return {
        devServer: {
            contentBase: path.join(__dirname, './web'),
            compress: true,
            port: 4000,
            disableHostCheck: true,
            historyApiFallback: true,
            // hot: true,
        },
        entry: path.join(__dirname, './index.web.js'),
        output: {
            path: path.join(__dirname, './web/assets'),
            publicPath: ASSET_PATH,
            filename: '[name].bundle.js',
            // sourceMapFilename: '[name].map'
        },
        // devtool: 'cheap-module-source-map',
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('production'),
                __DEV__: false,
            }),
            new CopyPlugin([
                { from: './node_modules/ton-client-web-js/tonclient.wasm' },
            ]),
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false,
            }),
            // new webpack.ContextReplacementPlugin(/\.\/locale\/$/, './locale/'),
            new webpack.NoEmitOnErrorsPlugin(),
        ],
        ...webpackModules,
    };
};
