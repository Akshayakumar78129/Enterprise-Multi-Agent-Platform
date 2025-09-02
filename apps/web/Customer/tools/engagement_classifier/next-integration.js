/**
 * Next.js Integration Hook for Engagement Classifier
 * This file provides integration points for Next.js configuration
 * Import this in your next.config.js to auto-initialize the chatbot
 */

// Auto-initialize when this module is loaded
require('./auto-init.js');

/**
 * Next.js configuration wrapper
 * Use this to wrap your existing next.config.js
 */
function withEngagementClassifier(nextConfig = {}) {
  console.log('🔧 [Next.js] Engagement Classifier integration loaded');
  
  // Ensure the auto-init runs during Next.js startup
  if (typeof window === 'undefined') {
    // Server-side only
    const { autoInitializeChatbot } = require('./auto-init.js');
    
    // Initialize during Next.js build/startup
    process.nextTick(() => {
      autoInitializeChatbot().catch(err => {
        console.error('❌ [Next.js] Failed to auto-initialize chatbot:', err);
      });
    });
  }

  return {
    ...nextConfig,
    
    // Add any specific webpack config if needed
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Call existing webpack config if it exists
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, { buildId, dev, isServer, defaultLoaders, webpack });
      }
      
      // Add any engagement classifier specific webpack config here if needed
      
      return config;
    },

    // Ensure environment variables are available
    env: {
      ...nextConfig.env,
      // Add any default env vars if needed
    }
  };
}

/**
 * Simple API route creator
 * Creates the engagement-chatbot API route programmatically
 */
function createEngagementChatbotAPI() {
  const { handleChatbotRequest } = require('./api/chatbot.js');
  
  return {
    handler: handleChatbotRequest,
    config: {
      api: {
        bodyParser: {
          sizeLimit: '1mb',
        },
      },
    }
  };
}

module.exports = {
  withEngagementClassifier,
  createEngagementChatbotAPI
};