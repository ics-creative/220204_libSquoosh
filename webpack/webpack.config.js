const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: ["./src/index.html"],
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
      },
      {
        test: /\.(jpe?g|png)/i,
        type: "asset/resource",
        generator: {
          filename: `./image/[name][ext]`,
        },
      },
    ],
  },

  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        generator: [
          {
            preset: "webp",
            implementation: ImageMinimizerPlugin.squooshGenerate,
            options: {
              encodeOptions: {
                webp: {
                  quality: 70,
                },
              },
            },
          },
        ],
        minimizer: {
          implementation: ImageMinimizerPlugin.squooshMinify,
          filename: "[name][ext]",
          options: {
            encodeOptions: {
              mozjpeg: {
                quality: 70,
              },
            },
          },
        },
      }),
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],
};
