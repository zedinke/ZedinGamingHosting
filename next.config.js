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
};

module.exports = nextConfig;

