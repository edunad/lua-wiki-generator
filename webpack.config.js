import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let config = {
    devtool: 'source-map',
    entry: {
        index: './index.js',
        cli: './cli.js',
    },

    target: 'node',
    externals: [nodeExternals()],
    externalsPresets: { node: true },
    bail: true,

    output: {
        path: resolve(__dirname, './.bin'),
        filename: '[name].js',
        libraryTarget: 'umd',

        clean: true, // Clean the output directory before emit.
    },

    resolve: {
        extensions: ['.js'],
        modules: ['node_modules'],
        alias: {},
        plugins: [],
        symlinks: false,
        cacheWithContext: false,
    },

    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },

    stats: {
        warningsFilter: /export .* was not found in/,
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

export default (env, argv) => {
    const production = argv.mode === 'production';
    if (production) config.devtool = false;

    return new Promise(function (resolve, reject) {
        config.plugins.push(
            new webpack.DefinePlugin({
                __PRODUCTION__: production,
            }),
        );

        return resolve(config);
    });
};
