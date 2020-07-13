/* eslint-disable no-console */
const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const MarkoPlugin = require('@marko/webpack/plugin').default;
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin');

const templates = require(`${__dirname}/../../../dist/etc/templates.json`);
const markoPlugin = new MarkoPlugin();

const config = require('../../../dist/static/etc/config.json');

const distDirectory = process.argv.indexOf('--build:update') > -1 ? 'update' : 'dist';

const configTools = {
    name: 'Tools',
    entry: {
        app: `${__dirname}/../api/tools.js`
    },
    output: {
        path: `${__dirname}/../../../${distDirectory}/bin`,
        filename: 'tools.js'
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: [nodeExternals()],
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
            test: /\.js?$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
                presets: [
                    '@babel/preset-env',
                    {
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-syntax-dynamic-import',
                            'macros',
                            ['@babel/transform-runtime', {
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

const configAdmin = {
    name: 'Admin Panel (React)',
    entry: {
        app: path.resolve(__dirname, '..', 'react', 'entrypoint.jsx')
    },
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, '..', '..', '..', distDirectory, 'static', '_admin'),
        publicPath: '/_admin/',
        filename: '[name]_[contenthash:8].js'
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                styles: {
                    name: 'styles',
                    test: /\.s?css$/,
                    chunks: 'all',
                    minChunks: 2,
                    enforce: true
                },
                vendor: {
                    test: /[\\/](node_modules)[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `npm.${packageName.replace('@', '')}`;
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
                terserOptions: {
                    output: {
                        comments: /@license/i
                    }
                }
            }),
            new OptimizeCSSAssetsPlugin({
                cssProcessorPluginOptions: {
                    preset: ['default', {
                        discardComments: {
                            removeAll: true
                        }
                    }]
                }
            })
        ]
    },
    module: {
        rules: [{
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        '@babel/preset-react',
                        {
                            plugins: [
                                '@babel/plugin-proposal-class-properties',
                                '@babel/plugin-syntax-dynamic-import',
                                'macros',
                                ['@babel/transform-runtime', {
                                    regenerator: true
                                }]
                            ]
                        }
                    ]
                }
            },
            {
                test: /\.s?css$/,
                use: [{
                        loader: ExtractCssChunks.loader
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    plugins: [
        new FixStyleOnlyEntriesPlugin(),
        new ExtractCssChunks({
            filename: '[name]_[contenthash:8].css',
            chunkFilename: '[name]_[contenthash:8].css',
            orderWarning: true
        }),
        new HtmlWebpackPlugin({
            chunksSortMode: 'none',
            filename: path.resolve(__dirname, '..', '..', '..', distDirectory, 'static', '_admin', 'admin.html'),
            template: path.resolve(__dirname, '..', 'react', 'templates', 'admin.html'),
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
            }
        })
    ]
};

const configAPI = {
    name: 'API Server',
    entry: {
        app: `${__dirname}/../api/api.js`
    },
    output: {
        path: `${__dirname}/../../../${distDirectory}/bin`,
        filename: 'api.js'
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: [nodeExternals()],
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
            loader: '@marko/webpack/loader'
        }, {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
                presets: [
                    '@babel/preset-env',
                    {
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            '@babel/plugin-syntax-dynamic-import',
                            'macros',
                            ['@babel/transform-runtime', {
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
    name: 'Web Server - Client Part',
    context: path.resolve(__dirname, '../marko'),
    resolve: {
        extensions: ['.js', '.json', '.marko']
    },
    module: {
        rules: [{
                test: /\.marko$/,
                loader: '@marko/webpack/loader'
            },
            {
                test: /\.s?css$/,
                use: [{
                        loader: ExtractCssChunks.loader
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    devtool: 'source-map',
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                styles: {
                    name: 'styles',
                    test: /\.s?css$/,
                    chunks: 'all',
                    minChunks: 2,
                    enforce: true
                },
                vendor: {
                    test: /[\\/](node_modules)[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `npm.${packageName.replace('@', '')}`;
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
        filename: '[name].[contenthash:8].js',
        path: path.join(__dirname, `../../../${distDirectory}/static/_user`),
        publicPath: '/_user/',
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.browser': true
        }),
        new FixStyleOnlyEntriesPlugin(),
        new ExtractCssChunks({
            filename: '[name]_[contenthash:8].css',
            chunkFilename: '[name]_[contenthash:8].css',
            orderWarning: true
        }),
        new OptimizeCssAssetsPlugin(),
        markoPlugin.browser
    ]
};

const configWebServer = {
    name: 'Web Server - Server Part',
    context: path.resolve(__dirname, '../marko'),
    resolve: {
        extensions: ['.js', '.json', '.marko']
    },
    module: {
        rules: [{
                test: /\.marko$/,
                loader: '@marko/webpack/loader'
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            }
        ]
    },
    target: 'node',
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
        libraryTarget: 'commonjs2',
        path: path.join(__dirname, `../../../${distDirectory}/bin`),
        filename: 'web.js',
        publicPath: '/_user/',
    },
    node: {
        __dirname: false
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.browser': undefined,
            'process.env.BUNDLE': true
        }),
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
        }),
        markoPlugin.server
    ]
};

const webpackConfig = [];

const cleanUpAdmin = () => {
    console.log('Cleaning up dist/static/_admin...');
    fs.removeSync(path.join(__dirname, '..', '..', '..', 'dist', 'static', '_admin'));
    fs.ensureDirSync(path.join(__dirname, '..', '..', '..', 'dist', 'static', '_admin'));
};

const cleanUpWeb = () => {
    console.log('Cleaning up static/_user...');
    fs.removeSync(path.join(__dirname, '..', '..', '..', 'dist', 'static', '_user'));
    fs.ensureDirSync(path.join(__dirname, '..', '..', '..', 'dist', 'static', '_user'));
};

const rebuildMarkoTemplates = () => {
    console.log('Re-building Marko templates...');
    const root = `<!-- This file is auto-generated, do not modify -->\n${config.useUIkitOnFrontend ? 'style.scss { @import "../../styles/uikit.scss"; }\n' : ''}${templates.available.map(t => `<if(out.global.template === "${t}")><${t}><\${input.renderBody}/></${t}></if>\n`).join('')}`;
    fs.writeFileSync(path.resolve(`${__dirname}/../marko/templates/index.marko`), root);
};

console.log(`This tool will build Zoia for you.`);

console.log('Ensuring directories and copying statics...');
fs.ensureDirSync(`${__dirname}/../../../${distDirectory}/bin`);
fs.ensureDirSync(`${__dirname}/../../../${distDirectory}/etc`);
fs.ensureDirSync(`${__dirname}/../../../${distDirectory}/static/etc`);
fs.ensureDirSync(`${__dirname}/../../../${distDirectory}/logs`);
fs.ensureDirSync(`${__dirname}/../../../static`);
fs.copySync(`${__dirname}/../../static/zoia`, `${__dirname}/../../../${distDirectory}/static/zoia`);

if (process.argv.indexOf('--build:admin') > -1) {
    console.log('Building Admin Panel (React) only.');
    cleanUpAdmin();
    webpackConfig.push(configAdmin);
} else if (process.argv.indexOf('--build:api') > -1) {
    console.log('Building API Server only.');
    webpackConfig.push(configAPI);
} else if (process.argv.indexOf('--build:web') > -1) {
    console.log('Building Web Server only.');
    cleanUpWeb();
    rebuildMarkoTemplates();
    webpackConfig.push(configWebServer, configWebClient);
} else if (process.argv.indexOf('--build:tools') > -1) {
    console.log('Building Tools only.');
    webpackConfig.push(configTools);
} else if (process.argv.indexOf('--build:update') > -1) {
    console.log('Building Update package (production mode).');
    fs.removeSync(path.join(__dirname, '..', '..', '..', distDirectory));
    fs.copySync(path.join(__dirname, '..', '..', '..', 'dist', 'etc'), path.join(__dirname, '..', '..', '..', distDirectory, 'etc'));
    fs.copySync(path.join(__dirname, '..', '..', '..', 'dist', 'static', 'etc'), path.join(__dirname, '..', '..', '..', distDirectory, 'static', 'etc'));
    rebuildMarkoTemplates();
    webpackConfig.push(configAPI, configAdmin, configTools, configWebClient, configWebServer);
} else {
    console.log('Building everything.');
    if (process.argv.indexOf('--do:release') > -1) {
        console.log('Incrementing build version as we are building a release.');
        const packageJSON = require(`${__dirname}/../../../package.json`);
        const [v1, v2, v3] = packageJSON.version.split(/\./);
        packageJSON.version = `${parseInt(v1, 10) || 0}.${parseInt(v2, 10) || 0}.${(parseInt(v3, 10) || 0) + 1}`;
        fs.writeJSONSync(`${__dirname}/../../../package.json`, packageJSON, {
            spaces: 2
        });
        console.log(`New version number for a release is: ${packageJSON.version}`);
    }
    cleanUpAdmin();
    cleanUpWeb();
    rebuildMarkoTemplates();
    webpackConfig.push(configAPI, configAdmin, configTools, configWebClient, configWebServer);
}

fs.ensureDirSync(path.join(__dirname, '..', '..', 'static', 'uploads'));
console.log('Getting modules info...');
const modules = fs.readdirSync(path.join(__dirname, '..', '..', 'modules'));
const modulesInfo = {};
modules.map(module => modulesInfo[module] = require(path.join(__dirname, '..', '..', 'modules', module, 'module.json')));
console.log('Writing modules.json...');
fs.writeJSONSync(path.join(__dirname, 'modules.json'), modulesInfo);
const linguiAdmin = {
    localeDir: 'src/shared/react/locales/admin',
    srcPathDirs: [],
    format: 'po'
};
const linguiPathsArrAdmin = modules.map(module => `src/modules/${module}/admin/components/`);
linguiAdmin.srcPathDirs = ['shared/react/', ...linguiPathsArrAdmin];
console.log('Writing linguirc.admin.json...');
fs.writeJSONSync(`${__dirname}/linguirc.admin.json`, linguiAdmin, {
    spaces: 2
});
console.log('Staring Webpack...');

module.exports = webpackConfig;
