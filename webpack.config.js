/* eslint no-var: 0 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const LoadablePlugin = require('@loadable/webpack-plugin');

module.exports = (env, argv) => {
	
	const IS_PRODUCTION = argv.mode !== 'development';
	
	const babelLoaderConfiguration = {
		test: /\.(ts|tsx|m?js)?$/i,
		use: {
		  loader: 'babel-loader',
		  options: {
			cacheDirectory: true,
			presets: [
				[
					'@babel/preset-react',
					{
						development: !IS_PRODUCTION,
					},
				],
			],
			plugins: [
				'@babel/plugin-transform-runtime',
				'@babel/plugin-syntax-dynamic-import',
				'@babel/plugin-proposal-class-properties',
				'react-native-reanimated/plugin',
				'@loadable/babel-plugin',
			]
		  },
		}
	};
	
	const cssLoaderConfiguration = {
		test: /\.css$/i,
        use: [
			{ 
				loader: 'style-loader',
				options: {
					injectType: 'singletonStyleTag'
				}
			}, 
			'css-loader',
		],
	};
	
	const imageLoaderConfiguration = {
		test: /\.(gif|jpe?g|a?png|svg)$/i,
		use: {
			loader: 'file-loader',
			options: {
				name: '[name].[contenthash].[ext]',
				publicPath: '/images',
				outputPath: '../images',
			}
		}
	};
	
	const fontLoaderConfiguration = {
		test: /\.ttf$/i,
		use: {
			loader: 'file-loader',
			options: {
				name: '[name].[contenthash].[ext]',
				publicPath: '/fonts',
				outputPath: '../fonts',
			}
		}
	};
	
	const webpackConfiguration = {
		mode: IS_PRODUCTION ? 'production' : 'development',
		devtool: IS_PRODUCTION ? false : 'cheap-module-source-map',
		optimization: {
			minimize: IS_PRODUCTION,
			minimizer: [
				new TerserPlugin({
					parallel: true,
					extractComments: false,
					terserOptions: {
						sourceMap: false,
						compress: true,
					},
				}),
			],
		},
		plugins: [
			new LoadablePlugin({ outputAsset: false }),
			new NodePolyfillPlugin({
				excludeAliases: ['url']
			}),
		],
		resolve: {
			alias: {
				'react-native$': 'react-native-web',
				'url': 'whatwg-url',
			},
			extensions: ['.web.js', '.js']
		},
		output: {
			path: path.join(__dirname, 'Sources/Client/dist/public/js'),
			publicPath: '/js/',
			filename: '[name].js'
		}
	};
	
	return [
		{
			...webpackConfiguration,
			entry: {
				main: [
					'whatwg-fetch',
					'./Sources/Client/js/main.js',
				],
			},
			module: {
				rules: [
					babelLoaderConfiguration,
					cssLoaderConfiguration,
					imageLoaderConfiguration,
					fontLoaderConfiguration,
				]
			}
		},
		{
			...webpackConfiguration,
			entry: {
				'../../private/js/server': {
					import: './Sources/Client/js/server.js',
					library: {
						name: 'render',
						type: 'global',
						export: 'default'
					}
				}
			},
			module: {
				rules: [
					babelLoaderConfiguration,
					{
						test: /\.css$/i,
						use: 'css-loader',
					},
					imageLoaderConfiguration,
					fontLoaderConfiguration,
				]
			}
		}
	];
};
