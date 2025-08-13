/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // API Gateway Proxy Configuration
  async rewrites() {
    const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3001';
    
    return [
      // Proxy API Gateway endpoints to the frontend
      {
        source: '/api/v1/:path*',
        destination: `${apiGatewayUrl}/api/v1/:path*`,
      },
      // Proxy health check endpoints
      {
        source: '/api/health/:path*',
        destination: `${apiGatewayUrl}/health/:path*`,
      },
      // Proxy metrics endpoint
      {
        source: '/api/metrics',
        destination: `${apiGatewayUrl}/metrics`,
      },
    ];
  },

  // CORS and API configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key' },
        ],
      },
    ];
  },

  // Environment variables for client-side
  env: {
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:3001',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },

  // Image domains configuration
  images: {
    domains: [],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Frontend-compatible SQLite with better-sqlite3
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    // Fix for Plotly.js/React-Plotly.js
    if (isServer) {
      // Don't load plotly on server
      config.externals = [...config.externals, 'plotly.js', 'react-plotly.js'];
    }
    
    return config;
  },

  // Experimental features for better API handling
  experimental: {
    // Experimental features can be added here
  },

  // Standalone server components packages
  serverExternalPackages: [],

  // Redirects for legacy API routes (if needed)
  async redirects() {
    return [
      // Redirect old direct database API calls to new API Gateway
      {
        source: '/api/direct/:path*',
        destination: '/api/v1/:path*',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig 