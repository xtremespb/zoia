const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const babelConfig = require("./babel.config");

module.exports = (argv) => ({
    name: "CLI Part",
    context: path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/cli`),
    resolve: {
        extensions: [".js", ".json"]
    },
    module: {
        rules: [argv.mode === "production" ? {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            options: babelConfig()
        } : {}]
    },
    target: "node",
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
        filename: argv.type === "update" ? "cli_update.js" : "cli.js",
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
        })
    ]
});
