const path = require('path');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TemplateBannerPlugin = require('template-banner-webpack-plugin');

const babelConfig = {
    cacheDirectory: true,
    presets: [
        ['env', {
            'modules': false,
            'targets': {
                'browsers': ['> 2%'],
                uglify: true
            },
        }]
    ],
    plugins: [
        'transform-object-rest-spread',
        ['transform-runtime', {
            'polyfill': false,
            'helpers': false
        }]
    ]
};

let config = {
    output: {
        path: path.resolve(__dirname + '/dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname + '/src'),
                exclude: /node_modules/,
                use: [{loader: 'babel-loader', options: babelConfig}]
            },
            {
                test: /\.vue$/,
                exclude: /node_modules/,
                include: path.resolve(__dirname + '/src'),
                loader: 'vue-loader',
                options: {
                    loaders: {
                        js: {
                            loader: 'babel-loader', options: babelConfig
                        }
                    },
                    esModule: false
                }
            },
            {
                test: /\.css$/,
                loaders: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: [".js", ".json", ".vue", ".css"],
    },
    plugins: [
        new UglifyJsPlugin(),
        new TemplateBannerPlugin({
            banner: `{name} v{version}
(c) {year} Parsisolution
Released under the {license} License.`,
            default: {
                year: (new Date()).getFullYear(),
            },
        }),
    ]
};


module.exports = [
    merge(config, {
        entry: path.resolve(__dirname + '/src/plugin.js'),
        output: {
            filename: 'smart-area-vue.min.js',
            libraryTarget: 'window',
            library: 'SmartArea',
        }
    }),
    merge(config, {
        entry: path.resolve(__dirname + '/src/plugin.js'),
        output: {
            filename: 'smart-area-vue.js',
            libraryTarget: 'umd',
            library: 'smart-area',
            umdNamedDefine: true
        }
    }),
    merge(config, {
        entry: path.resolve(__dirname + '/src/SmartArea.vue'),
        output: {
            path: path.resolve(__dirname + '/'),
            filename: 'smart-area.js',
            libraryTarget: 'umd',
            library: 'SmartArea',
            umdNamedDefine: true
        }
    }),
    merge(config, {
        entry: path.resolve(__dirname + '/src/SmartInput.vue'),
        output: {
            path: path.resolve(__dirname + '/'),
            filename: 'smart-input.js',
            libraryTarget: 'umd',
            library: 'SmartInput',
            umdNamedDefine: true
        }
    })
];