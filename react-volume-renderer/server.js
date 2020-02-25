var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config.js');

new WebpackDevServer(webpack(config), {
	publicPath: config.output.publicPath,
	hot: true,
	inline: true,
	quiet: false,
	noInfo: false,
	stats: { colors: true },
	historyApiFallback: true,
	disableHostCheck: true,
}).listen(3333, '0.0.0.0', function (err, result) {
	if (err) {
		console.log(err);
	}
	console.log('Listening at 0.0.0.0:3333');
});