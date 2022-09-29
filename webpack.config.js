const { resolve } = require('path');

const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const NodeExternals = require('webpack-node-externals');

let config = {
    devtool: 'source-map',
    entry: {
        index: './index.js',
        cli: './cli.js',
    },

    target: 'node',
    externals: [NodeExternals()],
    externalsPresets: { node: true },
    bail: true,

    output: {
        path: resolve(__dirname, './.bin'),
        filename: '[name].js',

        library: 'WikiExtract',
        libraryTarget: 'commonjs',

        clean: true, // Clean the output directory before emit.
    },

    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
        alias: {},
        plugins: [],
    },

    stats: {
        warningsFilter: /export .* was not found in/,
    },

    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all',
        },
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './package.json', to: './' },
                { from: './LICENSE', to: './' },
                { from: './README.md', to: './' },
            ],
        }),
    ],
};

module.exports = (env, argv) => {
    const production = argv.mode === 'production';

    return new Promise(function (resolve, reject) {
        config.plugins.push(
            new webpack.DefinePlugin({
                __PRODUCTION__: production,
            }),
        );

        return resolve(config);
    });
};
