module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo']],

    // nativewind/babel (react-native-css import rewrite) must skip react-native-web's own files.
    // Its relative-import check (react-native-css 3.0.4–3.0.7, `path.resolve(filename, source)`)
    // matches POSIX paths only, so on Linux it rewrote RNW internals like
    // `exports/FlatList` → `react-native-css/components/FlatList` → `react-native-web` — a require
    // cycle that crashed the web build at start ("reading 'default'" in FlatList). Windows builds
    // never matched. Remove the exclude once react-native-css resolves relative imports correctly.
    overrides: [
      {
        // A function, not a RegExp: Metro first loads the config without a filename.
        exclude: (filename) => !!filename && /node_modules[\\/]react-native-web[\\/]/.test(filename),
        presets: ['nativewind/babel'],
      },
    ],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@/assets': './assets',
            '@': './src',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
