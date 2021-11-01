const path = require("path");
const webpack = require("webpack");
const CSSExtractPlugin = require("mini-css-extract-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const babelConfig = require("./babel.config");

module.exports = (moduleDirs, markoPlugin, argv) => ({
    context: path.resolve(`${__dirname}/src/shared/marko`),
    name: "frontend",
    target: ["web", "es5"],
    devtool: argv.mode === "production" ? false : "inline-source-map",
    module: {
        rules: [{
                test: /\.(woff(2)?|ttf|eot|otf|png|jpg|svg)(\?v=\d+\.\d+\.\d+)?$/,
                type: "asset/resource",
                generator: {
                    filename: "[hash:8][ext][query]"
                  }
            }, {
                test: /\.s?css$/,
                use: [{
                        loader: MiniCssExtractPlugin.loader
                    }, {
                        loader: "css-loader",
                        options: {
                            importLoaders: 1,
                            sourceMap: false,
                            url: true,
                        }
                    },
                    argv.mode === "production" ? {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                config: path.resolve(`${__dirname}/postcss.config.js`),
                            },
                        },
                    } : null,
                    {
                        loader: "sass-loader"
                    },
                ].filter(i => i !== null)
            },
            {
                test: /\.marko$/,
                loader: "@marko/webpack/loader",
                options: {
                    babelConfig: {
                        presets: [
                            [
                                "@babel/preset-env"
                            ]
                        ]
                    }
                }
            },
            argv.mode === "production" ? {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /ace-builds/,
                options: {
                    cacheDirectory: true,
                    ...babelConfig()
                }
            } : {},
        ]
    },
    optimization: {
        splitChunks: {
            chunks: "all",
            maxInitialRequests: 3,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                    filename: "npm.[contenthash:8].js",
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            }
        },
        minimizer: argv.mode === "production" ? [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
            })
        ] : []
    },
    output: {
        hashFunction: "xxhash64",
        filename: "[contenthash:8].js",
        path: path.resolve(`${__dirname}/../build/public/${argv.update ? "update_" : "zoia_"}`),
        publicPath: `/zoia/`,
    },
    plugins: [
        new webpack.DefinePlugin({
            "typeof window": "'object'",
            "process.browser": true
        }),
        new CSSExtractPlugin({
            filename: "[contenthash:8].css",
        }),
        markoPlugin.browser
    ]
});
