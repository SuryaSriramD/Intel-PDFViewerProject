/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["localhost"],
  },
  // Copy PDF.js assets to public directory during build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Only copy on client builds
      const path = require('path');
      const fs = require('fs');
      const CopyPlugin = require('copy-webpack-plugin');

      // Directory paths
      const nodeModulesPath = path.join(__dirname, 'node_modules', 'pdfjs-dist');
      const publicPdfJsPath = path.join(__dirname, 'public', 'pdfjs');

      // Ensure public/pdfjs directory exists
      if (!fs.existsSync(publicPdfJsPath)) {
        fs.mkdirSync(publicPdfJsPath, { recursive: true });
      }

      // Copy assets - fixing the source path to ensure it exists
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            // Copy worker - try standard location for pdf.worker.js
            {
              from: path.join(nodeModulesPath, 'build', 'pdf.worker.js'),
              to: path.join(publicPdfJsPath, 'pdf.worker.js'),
              noErrorOnMissing: true,
            },
            // Fallback to alternative locations if the main one doesn't exist
            {
              from: path.join(nodeModulesPath, 'legacy', 'build', 'pdf.worker.js'),
              to: path.join(publicPdfJsPath, 'pdf.worker.js'),
              noErrorOnMissing: true,
            },
            {
              from: path.join(nodeModulesPath, 'legacy', 'build', 'pdf.worker.min.js'),
              to: path.join(publicPdfJsPath, 'pdf.worker.js'),
              noErrorOnMissing: true,
            },
          ],
        })
      );
    }

    return config;
  },
  // Remove the problematic experimental option
  experimental: {},
};

module.exports = nextConfig;

