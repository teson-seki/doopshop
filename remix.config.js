/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  server: "./server.js",
  serverBuildPath: "dist/server/index.js",
  serverMainFields: ["module", "main"],
  serverModuleFormat: "esm",
  serverPlatform: "node",
  serverMinify: false,
  appDirectory: "app",
  assetsBuildDirectory: "dist/client/build",
  publicPath: "/build/",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
}; 