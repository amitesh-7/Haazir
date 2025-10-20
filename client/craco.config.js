module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and modify source-map-loader to ignore warnings from face-api.js and html5-qrcode
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
          /node_modules\/face-api\.js/,
          /node_modules\/html5-qrcode/,
        ];
      }

      // Suppress warnings for missing 'fs' module in face-api.js (browser environment)
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          ...webpackConfig.resolve.fallback,
          fs: false,
          path: false,
          crypto: false,
        },
      };

      // Filter out source-map-loader warnings
      webpackConfig.ignoreWarnings = [
        // Ignore all source map warnings from face-api.js
        /Failed to parse source map.*face-api\.js/,
        // Ignore all source map warnings from html5-qrcode
        /Failed to parse source map.*html5-qrcode/,
        // Ignore missing source files
        /ENOENT.*\.ts/,
        // Ignore can't resolve 'fs' warnings
        /Can't resolve 'fs'/,
      ];

      return webpackConfig;
    },
  },
};
