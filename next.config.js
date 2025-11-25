/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Server Actions are available by default in Next.js 14+
  output: 'standalone', // Docker optimalizáláshoz
};

module.exports = nextConfig;

