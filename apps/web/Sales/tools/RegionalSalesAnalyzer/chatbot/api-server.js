/**
 * Regional Sales Chatbot API Server
 * Express server providing REST API for the regional sales chatbot
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatbotService from './index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Regional Sales Chatbot API',
    timestamp: new Date().toISOString(),
    initialized: chatbotService.isReady()
  });
});

// Initialize chatbot endpoint
app.post('/initialize', async (req, res) => {
  try {
    await chatbotService.initialize();
    res.json({
      success: true,
      message: 'Regional Sales Chatbot initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize chatbot',
      details: error.message
    });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, context, session, responseMode } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Ensure chatbot is initialized
    if (!chatbotService.isReady()) {
      console.log('🔄 Initializing chatbot for first request...');
      await chatbotService.initialize();
    }

    // Process the query
    const result = await chatbotService.processQuery(message, {
      ...context,
      session,
      responseMode,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      response: result.response,
      intent: result.intent,
      confidence: result.confidence,
      context: result.context,
      dbInsights: result.dbInsights,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    });
  }
});

// Get conversation history endpoint
app.get('/history', async (req, res) => {
  try {
    if (!chatbotService.isReady()) {
      return res.status(400).json({
        success: false,
        error: 'Chatbot not initialized'
      });
    }

    const chatbot = chatbotService.getChatbot();
    const history = chatbot.getConversationHistory();

    res.json({
      success: true,
      history,
      count: history.length
    });

  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history',
      details: error.message
    });
  }
});

// Clear conversation history endpoint
app.delete('/history', async (req, res) => {
  try {
    if (!chatbotService.isReady()) {
      return res.status(400).json({
        success: false,
        error: 'Chatbot not initialized'
      });
    }

    const chatbot = chatbotService.getChatbot();
    chatbot.clearHistory();

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });

  } catch (error) {
    console.error('❌ Clear history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation history',
      details: error.message
    });
  }
});

// Chatbot status endpoint
app.get('/status', async (req, res) => {
  try {
    const isReady = chatbotService.isReady();
    let stats = {};

    if (isReady) {
      const chatbot = chatbotService.getChatbot();
      const history = chatbot.getConversationHistory();
      stats = {
        conversationLength: history.length,
        lastInteraction: history.length > 0 ? history[history.length - 1].timestamp : null
      };
    }

    res.json({
      success: true,
      initialized: isReady,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chatbot status',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /initialize',
      'POST /chat',
      'GET /history',
      'DELETE /history',
      'GET /status'
    ]
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down Regional Sales Chatbot API Server...');
  
  try {
    await chatbotService.shutdown();
    console.log('✅ Chatbot service shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🌍 Regional Sales Chatbot API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
  
  try {
    console.log('🔄 Pre-initializing chatbot...');
    await chatbotService.initialize();
    console.log('✅ Chatbot pre-initialized and ready!');
  } catch (error) {
    console.error('⚠️ Failed to pre-initialize chatbot:', error.message);
    console.log('💡 Chatbot will initialize on first request');
  }
});

export default app;