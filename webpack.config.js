/* eslint-disable no-console */
const fs = require("fs-extra");
const path = require("path");
const webpack = require("webpack");
const OptimizeCSSPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const MarkoPlugin = require("@marko/webpack/plugin").default;

const templates = require(`${__dirname}/etc/templates.json`);
const markoPlugin = new MarkoPlugin();
const webpackConfig = [];

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
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: "file-loader",
                    options: {
                        name: "[name].[ext]",
                    }
                }]
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
        filename: "server.js",
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
    console.log("Cleaning up dist/public/web...");
    const pathWeb = path.resolve(`${__dirname}/dist/public/web`);
    fs.removeSync(pathWeb);
    fs.ensureDirSync(pathWeb);
};

const rebuildMarkoTemplates = () => {
    console.log("Re-building Marko templates macro...");
    const root = `<!-- This file is auto-generated, do not modify -->\n<if(out.global.template === "admin")><admin><i18n/><bulma/><\${input.renderBody}/></admin></if>\n${templates.available.map(t => `<if(out.global.template === "${t}")><${t}><i18n/><bulma/><\${input.renderBody}/></${t}></if>\n`).join("")}`;
    fs.writeFileSync(path.resolve(`${__dirname}/shared/marko/templates/index.marko`), root);
};

const generateModulesConfig = () => {
    const moduleDirs = fs.readdirSync(path.resolve(`${__dirname}/modules`));
    const modules = {};
    moduleDirs.map(dir => modules[dir] = require(path.resolve(`${__dirname}/modules/${dir}/module.json`)));
    console.log("Writing modules.json...");
    fs.writeJSONSync(`${__dirname}/etc/modules.json`, modules);
};

const ensureDirectories = () => {
    console.log("Ensuring directories and copying statics...");
    fs.ensureDirSync(path.resolve(`${__dirname}/dist/bin`));
    fs.ensureDirSync(path.resolve(`${__dirname}/dist/public`));
};

cleanUpWeb();
ensureDirectories();
generateModulesConfig();
rebuildMarkoTemplates();

webpackConfig.push(configWebClient, configWebServer);

console.log("Staring Webpack...");

module.exports = webpackConfig;
