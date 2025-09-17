/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['components', 'constants', 'data-client'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
