module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [], // <--- ASEGÚRATE DE QUE ESTO ESTÉ VACÍO
  };
};
