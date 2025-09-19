/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['components', 'constants', 'data-client'],
  experimental: {
    externalDir: true,
    optimizeCss: true,
    optimizePackageImports: ['plotly.js', 'react-plotly.js', 'd3', 'chart.js'],
  },

  // API Proxy Configuration - Direct to ADK
  async rewrites() {
    const adkUrl = process.env.NEXT_PUBLIC_ADK_URL || 'http://localhost:8000';

    return [
      // Proxy to ADK endpoints
      {
        source: '/api/churn/:path*',
        destination: `${adkUrl}/api/churn/:path*`,
      },
      {
        source: '/api/customer/:path*',
        destination: `${adkUrl}/api/customer/:path*`,
      },
      {
        source: '/api/sales/:path*',
        destination: `${adkUrl}/api/sales/:path*`,
      },
      {
        source: '/api/inventory/:path*',
        destination: `${adkUrl}/api/inventory/:path*`,
      },
      // AI Agent endpoints
      {
        source: '/run_sse',
        destination: `${adkUrl}/run_sse`,
      },
      {
        source: '/apps/:path*',
        destination: `${adkUrl}/apps/:path*`,
      },
    ];
  },

  // CORS configuration
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Webpack optimization
  webpack: (config: any, { isServer, dev }: any) => {
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

    // Fix for Plotly.js
    if (isServer) {
      config.externals = [...(config.externals || []), 'plotly.js', 'react-plotly.js'];
    }

    return config;
  },
};

module.exports = nextConfig;
