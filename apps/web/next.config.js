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
  webpack: (config, { isServer, dev }) => {
    // Memory optimization
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          plotly: {
            name: 'plotly',
            test: /[\\/]node_modules[\\/](plotly\.js|react-plotly\.js)[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2|d3|recharts)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

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

    // Development memory optimizations
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      };
    }
    
    return config;
  },

  // Experimental features for better API handling
  experimental: {
    // Moved to serverExternalPackages as per Next.js 15 requirements
    optimizeCss: true,
    optimizePackageImports: ['plotly.js', 'react-plotly.js', 'd3', 'chart.js'],
  },

  // External packages for server components (Next.js 15+)
  serverExternalPackages: ['better-sqlite3', 'sqlite3', 'mysql2'],

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