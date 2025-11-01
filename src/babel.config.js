module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  // In production builds remove console.* calls to keep bundles clean.
  // This uses the `babel-plugin-transform-remove-console` package which
  // should be installed as a devDependency (see package.json changes).
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }

  return {
    presets: [
      'babel-preset-expo'
    ],
    plugins,
  };
};
