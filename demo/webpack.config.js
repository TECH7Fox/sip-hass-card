const path = require("path");

module.exports = {
  entry: "./example-card.ts", // Entry point for the demo
  devtool: "inline-source-map",
  mode: "development",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "sip-example-card.js", // Output bundled file
    path: path.resolve(__dirname, "dist"), // Output directory
  },
};
