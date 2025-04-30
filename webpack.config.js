const path = require('path');

module.exports = {
  entry: {
    'sipjs-card': './src/sip-core.ts',
    'sip-call-dialog': './src/sip-call-dialog.ts',
    'sip-call-card': './src/sip-call-card.ts',
    'sip-contacts-card': './src/sip-contacts-card.ts',
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
