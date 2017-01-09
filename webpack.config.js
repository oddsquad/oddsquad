var webpack = require('webpack');
module.exports = {
	entry: "./app/index.js",
	output: {
		filename: "bundle.js",
		path: "./dist"
	},
	plugins: [
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
