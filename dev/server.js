const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

module.exports = (markoPlugin, argv) => ({
    name: "Server Part",
    context: path.resolve(`${__dirname}/../${argv.update ? "update" : "src"}/shared/marko`),
    devtool: argv.mode === "production" ? false : "eval",
    resolve: {
        extensions: [".js", ".json", ".marko"]
    },
    module: {
        rules: [{
            test: /\.s?css$/,
            loader: "ignore-loader"
        }, {
            test: /\.marko$/,
            loader: "@marko/webpack/loader"
        }]
    },
    target: "async-node",
    externals: [/^[^./!]/],
    optimization: argv.mode === "production" ? {
        splitChunks: false,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
            })
        ]
    } : {},
    output: {
        libraryTarget: "commonjs2",
        path: path.resolve(`${__dirname}/../build/bin`),
        filename: argv.update ? "zoia_update.js" : "zoia.js",
        publicPath: `/zoia/`,
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.browser": undefined,
            "process.env.BUNDLE": true,
            "typeof window": "'undefined'"
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        }),
        markoPlugin.server,
    ]
});
