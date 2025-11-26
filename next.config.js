/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    domains: ['localhost'],
  },
  // Server Actions are available by default in Next.js 14+
  output: 'standalone', // Docker optimalizáláshoz
  // Fix build ID generation issue
  generateBuildId: async () => {
    // Use git commit hash or timestamp as build ID
    try {
      const { execSync } = require('child_process');
      return execSync('git rev-parse HEAD').toString().trim();
    } catch {
      return `build-${Date.now()}`;
    }
  },
  webpack: (config, { isServer }) => {
    // Exclude optional dependencies from build
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'basic-ftp': 'commonjs basic-ftp',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
      });
    }
    return config;
  },
};

module.exports = nextConfig;

