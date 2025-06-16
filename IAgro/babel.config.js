module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Você pode ter outros plugins aqui, mas o do reanimated deve ser o último.
      
      // IMPORTANTE: Esta linha é obrigatória e DEVE ser a última da lista de plugins.
      'react-native-reanimated/plugin',
    ],
  };
};