const path = require('path');

module.exports = {
  entry: {
    'sipjs-card': './src/v2/sip-core.ts'
  },
  devtool: 'inline-source-map',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js?$/,
        resolve: {
          fullySpecified: false
        },
        use: 'ts-loader'
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    runtimeChunk: {
      name: 'commons'
    }
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};
