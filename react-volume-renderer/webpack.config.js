var webpack = require('webpack');
var path = require('path');

module.exports = {
	devtool: 'source-map',
	cache: true,
	mode: 'development',
	entry: {
		example1: [
			//'babel-polyfill',
			//"@babel/polyfill",
			'webpack-dev-server/client?http://localhost:3333',
			'webpack/hot/dev-server', // 'webpack/hot/only-dev-server',
			//'react-hot-loader/patch',
			'./example/main.js',
		],
	},
	output: {
		path: __dirname+'/build/',
		filename: '[name].entry.js',
		publicPath: 'http://localhost:3333/',
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
	],
	/* resolve: {
		modules: [
			'node_modules',
			//path.resolve(__dirname, 'example'),
			//path.resolve(__dirname, 'src'),
		],
		//root: path.resolve('./'),
		extensions: ['.js', '.jsx', '.json', '.css'],
	}, */
	stats: {
		colors: true,
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				//include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'example')],
				exclude: [path.resolve(__dirname, 'node_modules')],
				use: {
					loader: 'babel-loader',
					options: {
						plugins: [
							"@babel/plugin-transform-runtime",
							"@babel/plugin-transform-flow-strip-types",
							
							// Stage 0
							//"@babel/plugin-proposal-function-bind",

							// Stage 1
							"@babel/plugin-proposal-export-default-from",
							/*"@babel/plugin-proposal-logical-assignment-operators",
							["@babel/plugin-proposal-optional-chaining", { "loose": false }],
							["@babel/plugin-proposal-pipeline-operator", { "proposal": "minimal" }],
							["@babel/plugin-proposal-nullish-coalescing-operator", { "loose": false }],
							"@babel/plugin-proposal-do-expressions",

							// Stage 2
							["@babel/plugin-proposal-decorators", { "legacy": true }],
							"@babel/plugin-proposal-function-sent",*/
							"@babel/plugin-proposal-export-namespace-from",
							/*"@babel/plugin-proposal-numeric-separator",
							"@babel/plugin-proposal-throw-expressions",

							// Stage 3
							"@babel/plugin-syntax-dynamic-import",
							"@babel/plugin-syntax-import-meta",*/
							["@babel/plugin-proposal-class-properties", { "loose": true }],
							//"@babel/plugin-proposal-json-strings",
							
							"@babel/plugin-proposal-object-rest-spread",
							
							//? "@babel/plugin-transform-arrow-functions"
						],
						presets: [
							'@babel/preset-env', '@babel/preset-react', '@babel/preset-flow',
						],
					},
				},
			},
			{
				test: /\.css$/,
				include: [path.resolve(__dirname, 'src')],
				use: [
					{ loader: 'style-loader' },
					{
						loader: 'css-loader',
						options: {
							modules: true,
							importLoaders: 1,
							localIdentName: '[name]__[local]___[hash:base64:5]',
						},
					},
				],
			},
			/* {
				test: /\.tsv$/,
				include: [path.resolve(__dirname, 'data')],
				loader: 'dsv-loader',
			}, */
			{
				test: /\.glsl$/,
				include: [path.resolve(__dirname, 'src/shaders')],
				loader: 'webpack-glsl-loader',
			},
			{
				test: /(\.png$)|(\.jpg$)|(\.gif$)|(\.svg$)/,
				//include: [path.resolve(__dirname, 'src')],
				exclude: [path.resolve(__dirname, 'node_modules')],
				loader: 'url-loader?limit=100000',
			},
		],
	},
};
