const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    'process/browser': require.resolve('process/browser.js'),
    vm: require.resolve('vm-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url')
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
  
  // Ignore warnings in CI
  config.ignoreWarnings = [/Failed to parse source map/];
  
  // Disable treating warnings as errors
  if (config.module && config.module.rules) {
    config.module.rules.forEach(rule => {
      if (rule.use) {
        rule.use.forEach(loader => {
          if (loader.options && loader.options.eslintPath) {
            loader.options.failOnWarning = false;
          }
        });
      }
    });
  }
  
  return config;
};
