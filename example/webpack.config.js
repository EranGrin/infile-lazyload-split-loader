const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/main.js',
  output: {
    asyncChunks: true,
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: 'dist/',
  },
  module: {
    rules: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: path.resolve('../package')
                }
            ]
        }
    ]
  },
  devtool: 'source-map',
};