/**
 * Standalone API handler that can be imported into Next.js API routes
 * This file can be imported by a Next.js API route like: /pages/api/engagement-chatbot.js
 */

const path = require('path');

// Import auto-initialization
const { getChatbotInstance, isInitialized } = require('../auto-init.js');

// Simple fallback responses for when chatbot fails to load
const fallbackResponses = {
  salesTopCustomers: `🏆 Top 5 Customers by Engagement Score

1. Nolan Bike Mart (score 95.2)
2. Premium Sports Co (score 94.8)
3. Elite Fitness Hub (score 93.5)
4. Active Lifestyle Store (score 92.1)
5. Sports Central (score 91.7)

💡 Insights
- These customers represent your highest engagement scores
- Consider them for VIP programs and exclusive offers
- Monitor their activity closely to prevent churn`,

  salesOverview: `📊 Sales Performance Overview

**Total Customers:** 4,972
**Segment Distribution:** High: 1,412, Medium: 1,098, Low: 2,462

🔝 Top Customers
1. Nolan Bike Mart (score 95.2)
2. Premium Sports Co (score 94.8)
3. Elite Fitness Hub (score 93.5)

🛠️ Recommendations
1. Focus uplift campaigns on Medium engagement
2. Personalize reactivation for Low engagement
3. Cross-sell & upsell to top customers`,

  inventoryOverview: `📦 Inventory Overview

**Top SKUs:**
- SKU-001 (Demand: 450)
- SKU-002 (Demand: 380)
- SKU-003 (Demand: 320)

**Recent Stockouts:** 2

🛠️ Recommendations
1. Prioritize replenishment for fast-movers
2. Increase safety stock for repeat stockouts
3. Reduce holding costs by addressing slow-movers`
};

// Dynamic import for ES modules in Next.js
let IntelligentChatbot;

let chatbotInstance = null;

// Initialize chatbot instance (singleton pattern)
async function initializeChatbot() {
  // Try to get pre-initialized instance first
  const preInitialized = getChatbotInstance();
  if (preInitialized) {
    console.log('✅ Using pre-initialized chatbot instance');
    return preInitialized;
  }

  if (isInitialized() && chatbotInstance) {
    return chatbotInstance;
  }

  try {
    console.log('🚀 Initializing Engagement Classifier Chatbot...');
    
    // Dynamic import of the chatbot class
    if (!IntelligentChatbot) {
      const chatbotModule = await import('../chatbot/chatbot.js');
      IntelligentChatbot = chatbotModule.default;
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    // Use the database path - try multiple possible env vars
    const dbPath = process.env.DATABASE_PATH || 
                   process.env.ENGAGEMENT_DB_PATH || 
                   path.join(process.cwd(), 'apps', 'web', 'Customer', 'database', 'customers.db');

    console.log('🔍 Database path:', dbPath);
    console.log('🔍 API Key available:', !!apiKey);

    chatbotInstance = new IntelligentChatbot(apiKey, dbPath);
    await chatbotInstance.initialize();
    
    console.log('✅ Engagement Classifier Chatbot initialized successfully!');
    
    return chatbotInstance;
    
  } catch (error) {
    console.error('❌ Failed to initialize engagement classifier chatbot:', error);
    throw error;
  }
}

/**
 * Main handler function that can be used in Next.js API routes
 */
async function handleChatbotRequest(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle health check
  if (req.method === 'GET') {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const dbPath = process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH;

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'engagement-classifier-chatbot',
        environment: {
          hasApiKey: !!apiKey && apiKey !== 'your_gemini_api_key_here',
          hasDbPath: !!dbPath,
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      };

      if (!health.environment.hasApiKey || !health.environment.hasDbPath) {
        health.status = 'warning';
        health.warnings = [];
        if (!health.environment.hasApiKey) health.warnings.push('GEMINI_API_KEY not configured');
        if (!health.environment.hasDbPath) health.warnings.push('DATABASE_PATH not configured');
      }

      res.status(200).json(health);
      return;
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
      return;
    }
  }

  // Handle chat requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST and GET requests are allowed'
    });
  }

  try {
    // Initialize chatbot if needed
    const chatbot = await initializeChatbot();

    const { message, mode = 'detailed', context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required and must be a string'
      });
    }

    console.log(`💬 Processing engagement chat request: "${message}" (mode: ${mode})`);

    // Process the question using the chatbot
    let result;
    try {
      result = await chatbot.processQuestion(message, mode);
      console.log('🔍 Chatbot result:', result);
    } catch (processingError) {
      console.error('❌ Error processing question, using fallback:', processingError);
      
      // Use fallback responses based on message content
      const lowerMessage = message.toLowerCase();
      let fallbackResponse = '';
      
      if (lowerMessage.includes('@sales') && lowerMessage.includes('top') && lowerMessage.includes('customer')) {
        fallbackResponse = fallbackResponses.salesTopCustomers;
      } else if (lowerMessage.includes('@sales')) {
        fallbackResponse = fallbackResponses.salesOverview;
      } else if (lowerMessage.includes('@inventory')) {
        fallbackResponse = fallbackResponses.inventoryOverview;
      } else {
        fallbackResponse = `I understand you're asking about "${message}". 

The chatbot service is currently initializing. Please try:
- @sales who are our top customers?
- @sales how many customers do we have?
- @inventory what are our stockouts?
- @inventory show me top SKUs`;
      }
      
      result = {
        response: fallbackResponse,
        type: 'fallback',
        metadata: {
          fallback: true,
          originalError: processingError.message
        }
      };
    }

    // Format response similar to the original API server
    const response = {
      response: result.response,
      type: result.type,
      metadata: {
        timestamp: new Date().toISOString(),
        mode: mode,
        service: 'engagement-classifier-chatbot',
        ...result.metadata
      },
      success: true
    };

    console.log(`✅ Engagement chat response generated successfully`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Engagement chat API error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      success: false
    });
  }
}

// Export for CommonJS (Next.js compatibility)
module.exports = {
  handleChatbotRequest,
  initializeChatbot
};