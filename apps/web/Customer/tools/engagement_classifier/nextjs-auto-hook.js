/**
 * Next.js Auto-Hook for Engagement Classifier
 * This file automatically creates the API route and starts the chatbot
 * when Next.js starts - NO external files needed!
 */

const fs = require('fs');
const path = require('path');

// Auto-initialize when this module loads
require('./auto-init.js');

// Global flag to prevent multiple API route creations
global.__ENGAGEMENT_API_ROUTE_CREATED__ = global.__ENGAGEMENT_API_ROUTE_CREATED__ || false;

/**
 * Automatically create the API route file when Next.js starts
 */
function createAPIRouteAutomatically() {
  if (global.__ENGAGEMENT_API_ROUTE_CREATED__) {
    return;
  }

  try {
    // Find the Next.js pages/api directory
    const possiblePaths = [
      path.join(process.cwd(), 'pages', 'api'),
      path.join(process.cwd(), 'apps', 'web', 'pages', 'api'),
      path.join(process.cwd(), '..', '..', 'pages', 'api'),
    ];

    let apiDir = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        apiDir = possiblePath;
        break;
      }
    }

    if (!apiDir) {
      console.log('⚠️ [Auto-Hook] Could not find pages/api directory - will run standalone server');
      startStandaloneServer();
      return;
    }

    const apiFilePath = path.join(apiDir, 'engagement-chatbot.js');
    
    // Check if API route already exists
    if (fs.existsSync(apiFilePath)) {
      console.log('✅ [Auto-Hook] API route already exists at /api/engagement-chatbot');
      global.__ENGAGEMENT_API_ROUTE_CREATED__ = true;
      return;
    }

    // Create the API route file automatically
    const apiRouteContent = `/**
 * Auto-generated API Route for Engagement Classifier Chatbot
 * Generated automatically by engagement_classifier/nextjs-auto-hook.js
 */

const { handleChatbotRequest } = require('../Customer/tools/engagement_classifier/api/chatbot.js');

export default handleChatbotRequest;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
`;

    fs.writeFileSync(apiFilePath, apiRouteContent);
    console.log('✅ [Auto-Hook] Created API route automatically at /api/engagement-chatbot');
    console.log('🎯 [Auto-Hook] Chatbot will be available when Next.js starts');
    
    global.__ENGAGEMENT_API_ROUTE_CREATED__ = true;

  } catch (error) {
    console.log('⚠️ [Auto-Hook] Could not create API route automatically:', error.message);
    console.log('🔄 [Auto-Hook] Falling back to standalone server...');
    startStandaloneServer();
  }
}

/**
 * Start standalone server as fallback
 */
function startStandaloneServer() {
  try {
    const { startChatbotServer } = require('./start-chatbot.js');
    console.log('🚀 [Auto-Hook] Starting standalone chatbot server on port 3001...');
    startChatbotServer();
  } catch (error) {
    console.error('❌ [Auto-Hook] Failed to start standalone server:', error);
  }
}

// Auto-run when this module is imported (server-side only)
if (typeof window === 'undefined') {
  // Delay execution to ensure Next.js is ready
  process.nextTick(() => {
    createAPIRouteAutomatically();
  });
}

module.exports = {
  createAPIRouteAutomatically,
  startStandaloneServer
};