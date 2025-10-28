module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify source-map-loader to ignore warnings from @vladmandic/face-api and html5-qrcode
      const sourceMapLoader = webpackConfig.module.rules.find(
        (rule) =>
          rule.enforce === "pre" &&
          rule.use &&
          rule.use.some(
            (loader) =>
              loader.loader && loader.loader.includes("source-map-loader")
          )
      );

      if (sourceMapLoader) {
        // Add exclude patterns to avoid source map warnings
        sourceMapLoader.exclude = [
          /node_modules\/@vladmandic\/face-api/,
          /node_modules\/html5-qrcode/,
        ];
      }

      // Suppress warnings for missing Node.js modules in @vladmandic/face-api (browser environment)
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve.fallback,
          fs: false,
          path: false,
          crypto: false,
          os: false,
          stream: false,
          util: false,
          buffer: false,
        },
      };

      // Filter out source-map-loader warnings and critical dependency warnings
      webpackConfig.ignoreWarnings = [
        // Ignore all source map warnings from @vladmandic/face-api
        /Failed to parse source map.*@vladmandic\/face-api/,
        // Ignore all source map warnings from html5-qrcode
        /Failed to parse source map.*html5-qrcode/,
        // Ignore missing source files
        /ENOENT.*\.ts/,
        // Ignore can't resolve Node.js modules warnings
        /Can't resolve 'fs'/,
        /Can't resolve 'path'/,
        /Can't resolve 'crypto'/,
        /Can't resolve 'os'/,
        /Can't resolve 'stream'/,
        /Can't resolve 'util'/,
        /Can't resolve 'buffer'/,
        // Ignore critical dependency warnings from @vladmandic/face-api
        /Critical dependency: require function is used in a way/,
        /Critical dependency.*@vladmandic\/face-api/,
      ];

      return webpackConfig;
    },
  },
};
