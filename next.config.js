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
  // Fix for Next.js 14.0.4 build ID generation bug
  generateBuildId: () => {
    // Return a simple build ID - Next.js will use this instead of trying to call generate()
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

