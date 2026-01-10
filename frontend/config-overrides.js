const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    'process/browser': require.resolve('process/browser.js')
  });
  config.resolve.fallback = fallback;
  config.resolve.fullySpecified = false;
  
  // Add TypeScript extensions
  config.resolve.extensions = [
    ...(config.resolve.extensions || []),
    '.ts',
    '.tsx'
  ];
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js'
    })
  ]);
  return config;
};
