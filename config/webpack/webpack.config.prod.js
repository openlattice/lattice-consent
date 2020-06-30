/* eslint-disable import/extensions */

const HtmlWebpackPlugin = require('html-webpack-plugin');

const APP_PATHS = require('../app/paths.config.js');
const baseWebpackConfig = require('./webpack.config.base.js');

module.exports = (env) => {

  const baseConfig = baseWebpackConfig(env);

  const output = {
    ...baseConfig.output,
    filename: `${APP_PATHS.REL.STATIC_JS}/app.[hash:8].js`,
    chunkFilename: `${APP_PATHS.REL.STATIC_JS}/app.chunk.[id].[chunkhash:8].js`,
  };

  const plugins = [
    new HtmlWebpackPlugin({
      favicon: `${APP_PATHS.ABS.SOURCE_ASSETS}/svg/icons/ol-icon.svg`,
      inject: true,
      template: `${APP_PATHS.ABS.SOURCE}/index.html`,
    }),
    ...baseConfig.plugins
  ];

  return {
    ...baseConfig,
    output,
    plugins,
    devtool: false,
  };
};
