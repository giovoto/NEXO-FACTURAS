
require('dotenv').config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      'pdf-parse': 'commonjs pdf-parse',
    });
    return config;
  },
  serverExternalPackages: ['fast-xml-parser', 'pdf-parse'],
};

module.exports = nextConfig;
