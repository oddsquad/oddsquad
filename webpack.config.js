var webpack = require('webpack');
module.exports = {
	entry: {
		index: "./app/index.js",
		game: "./app/game.js",
		jquery: "jquery"
	},
	output: {
		filename: "bundle-[name].js",
		path: "./dist"
	},
	plugins: [
		new webpack.optimize.CommonsChunkPlugin({
			name: "jquery",
			minChunks: Infinity
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: "common",
			minChunks: 2
		}),
		new webpack.ProvidePlugin({
			jQuery: "jquery"
		})
	],
	module: {
		loaders: [
			{
				test: /\.svg$/,
				use: [
					{
						loader: "file-loader"
					},
					{
						loader: "svgo-loader"
					}
				]
			}
		]
	}
};
