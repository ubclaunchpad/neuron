/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "postgres",
    "drizzle-orm",
    "nodemailer",
    "minio",
    "redis",
    "awilix",
  ],
  outputFileTracingIncludes: {
    "/*": ["src/server/db/migrations/**/*", "drizzle.config.*"],
  },

  webpack(config, { isServer, dev }) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg"),
    );

    // Server-side sourcemaps for production Node stack traces
    if (!dev) {
      config.devtool = isServer ? "source-map" : "hidden-source-map";
    }

    // Exclude svg from the default loader
    fileLoaderRule.exclude = /\.svg$/;

    // Add SVGR loader
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            icon: true,
            dimensions: false,
            expandProps: "start",
          },
        },
      ],
    });

    return config;
  },
  typedRoutes: true,
  sassOptions: {
    includePaths: ["./src/styles"],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
