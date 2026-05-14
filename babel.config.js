module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [], // Dejamos esto vacío para eliminar el error de Worklets
  };
};
