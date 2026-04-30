/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sql.js is a server-only package; exclude it from client bundles
  serverExternalPackages: ['sql.js'],
  // Empty turbopack config to silence the webpack/turbopack mismatch warning
  turbopack: {},
};

module.exports = nextConfig;
