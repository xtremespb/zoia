/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const OptimizeCSSPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const NodeExternals = require("webpack-node-externals");
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const MarkoPlugin = require("@marko/webpack/plugin").default;

const markoPlugin = new MarkoPlugin();

const configAPI = {
    name: "API Server",
    entry: {
        app: `${__dirname}/shared/api/index.js`
    },
    output: {
        path: path.resolve(`${__dirname}/dist/bin`),
        filename: "api.js"
    },
    target: "node",
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: [NodeExternals()],
    optimization: {
        splitChunks: false,
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: false,
                extractComments: false,
            })
        ]
    },
    module: {
        rules: [{
            test: /\.marko$/,
            loader: "@marko/webpack/loader"
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            options: {
                presets: [
                    "@babel/preset-env",
                    {
                        plugins: [
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-syntax-dynamic-import",
                            "macros",
                            ["@babel/transform-runtime", {
                                regenerator: true
                            }]
                        ]
                    }
                ]
            }
        }]
    },
    plugins: [
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        })
    ]
};

const configWebClient = {
    name: "Web Server - Client Part",
    context: path.resolve(`${__dirname}/shared/marko`),
    resolve: {
        extensions: [".js", ".json", ".marko"]
    },
    module: {
        rules: [{
                test: /\.marko$/,
                loader: "@marko/webpack/loader"
            },
            {
                test: /\.s?css$/,
                use: [{
                        loader: ExtractCssChunks.loader
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            }
        ]
    },
    devtool: "source-map",
    optimization: {
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                styles: {
                    name: "styles",
                    test: /\.s?css$/,
                    chunks: "all",
                    minChunks: 2,
                    enforce: true
                },
                vendor: {
                    test: /[\\/](node_modules)[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `npm.${packageName.replace("@", "")}`;
                    },
                }
            }
        },
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: false,
                extractComments: false,
            })
        ]
    },
    output: {
        filename: "[name].[contenthash:8].js",
        path: path.resolve(`${__dirname}/dist/public/web`),
        publicPath: "/web/",
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.browser": true
        }),
        new FixStyleOnlyEntriesPlugin(),
        new ExtractCssChunks({
            filename: "[name]_[contenthash:8].css",
            chunkFilename: "[name]_[contenthash:8].css",
            orderWarning: true
        }),
        new OptimizeCSSPlugin(),
        markoPlugin.browser
    ]
};

const configWebServer = {
    name: "Web Server - Server Part",
    context: path.resolve(`${__dirname}/shared/marko`),
    resolve: {
        extensions: [".js", ".json", ".marko"]
    },
    module: {
        rules: [{
                test: /\.marko$/,
                loader: "@marko/webpack/loader"
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader",
                ],
            }
        ]
    },
    target: "node",
    externals: [/^[^./!]/],
    optimization: {
        splitChunks: false,
        minimizer: [
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: false,
                extractComments: false,
            })
        ]
    },
    output: {
        libraryTarget: "commonjs2",
        path: path.resolve(`${__dirname}/dist/bin`),
        filename: "web.js",
        publicPath: "/web/",
    },
    node: {
        __dirname: false
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.browser": undefined,
            "process.env.BUNDLE": true
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        }),
        markoPlugin.server
    ]
};

const cleanUpWeb = () => {
    console.log("Cleaning up public/web...");
    const pathWeb = path.resolve(`${__dirname}/dist/public/web`);
    fs.removeSync(pathWeb);
    fs.ensureDirSync(pathWeb);
};

const moduleDirs = fs.readdirSync(path.resolve(`${__dirname}/modules`));
const modules = {};
moduleDirs.map(dir => modules[dir] = require(path.resolve(`${__dirname}/modules/${dir}/module.json`)));
console.log("Writing modules.json...");
fs.writeJSONSync(`${__dirname}/etc/modules.json`, modules);

const webpackConfig = [];

console.log("Ensuring directories and copying statics...");
fs.ensureDirSync(path.resolve(`${__dirname}/dist/bin`));
fs.ensureDirSync(path.resolve(`${__dirname}/dist/public`));
cleanUpWeb();

webpackConfig.push(configAPI, configWebClient, configWebServer);

console.log("Staring Webpack...");

module.exports = webpackConfig;
