/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Production deployment-hez szükséges
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
      {
        protocol: 'https',
        hostname: 'zedgaminghosting.hu',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'zedgaminghosting.hu',
        port: '',
        pathname: '/**',
      },
    ],
    domains: ['localhost', 'zedgaminghosting.hu'],
    unoptimized: false,
  },
  // Server Actions are available by default in Next.js 14+
  webpack: (config, { isServer }) => {
    // Exclude optional dependencies from build
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'basic-ftp': 'commonjs basic-ftp',
        '@aws-sdk/client-s3': 'commonjs @aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner': 'commonjs @aws-sdk/s3-request-presigner',
        'puppeteer': 'commonjs puppeteer',
        'firebase-admin': 'commonjs firebase-admin',
      });
    }

    // Handle dynamic imports to avoid critical dependency warnings
    config.module.exprContextCritical = false;

    return config;
  },
};

module.exports = nextConfig;

