var webpack = require('webpack');
module.exports = {
	entry: {
		index: "./app/index.js",
		game: "./app/game.js",
		jquery: "jquery-slim"
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
		new webpack.ProvidePlugin({
			jQuery: "jquery-slim"
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
			},
			{
				test: /\.(eot|ttf|woff|woff2)$/,
				use: "file-loader"
			}
		]
	}
};
