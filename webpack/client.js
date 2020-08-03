const path = require("path");
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const FixStyleOnlyEntriesPlugin = require("webpack-fix-style-only-entries");
const OptimizeCSSPlugin = require("optimize-css-assets-webpack-plugin");
const CssoWebpackPlugin = require("csso-webpack-plugin").default;

module.exports = (moduleDirs, markoPlugin, argv) => ({
    name: "Client Part",
    context: path.resolve(`${__dirname}/../${argv.type === "update" ? "update" : "src"}/shared/marko`),
    resolve: {
        extensions: [".js", ".json", ".marko"]
    },
    module: {
        rules: [{
                test: /\.marko$/,
                use: ["babel-loader", "@marko/webpack/loader"],
            },
            {
                test: /\.s?css$/,
                use: [{
                        loader: ExtractCssChunks.loader
                    }, {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg|otf|png|jpg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [{
                    loader: "file-loader",
                    options: {
                        name: "[name]_[contenthash:8].[ext]",
                    }
                }]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader"
            }
        ]
    },
    devtool: argv.maps ? "source-map" : false,
    optimization: argv.mode === "production" ? {
        splitChunks: {
            chunks: "all",
            automaticNameDelimiter: "_",
            cacheGroups: {
                styles: {
                    name: "styles",
                    test: /\.(s?css|sass)$/,
                    chunks: "all",
                    minChunks: moduleDirs.length,
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
    } : {},
    output: {
        filename: "[name].[contenthash:8].js",
        path: path.resolve(`${__dirname}/../build/public/${argv.type === "update" ? "update" : "zoia"}`),
        publicPath: `/zoia/`,
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.browser": true
        }),
        new FixStyleOnlyEntriesPlugin(),
        new ExtractCssChunks({
            filename: "[name]_[contenthash:8].css",
            chunkFilename: "[name]_[contenthash:8].css",
            ignoreOrder: true
        }),
        argv.mode === "production" ? new OptimizeCSSPlugin() : () => {},
        argv.mode === "production" ? new CssoWebpackPlugin() : () => {},
        markoPlugin.browser,
    ]
});
