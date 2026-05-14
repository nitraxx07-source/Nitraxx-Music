module.exports = function(api) {
  api.cache(false); // Cambiamos esto a false temporalmente
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
  };
};
