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
  // Explicit build ID generation to fix "generate is not a function" error
  generateBuildId: async () => {
    // Use timestamp as build ID for consistency
    return `build-${Date.now()}`;
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

