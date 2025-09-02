/**
 * API Server - Express server to integrate the intelligent chatbot with React frontend
 * Provides REST endpoints for the chatbot functionality
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import IntelligentChatbot from './chatbot.js';
import Embedder from './embedder.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
let PORT = parseInt(process.env.CHATBOT_PORT || '3001', 10); // base port; will auto-increment if in use

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Global chatbot instance
let chatbot = null;
let isInitialized = false;

/**
 * Initialize the chatbot system
 */
async function initializeChatbot() {
  try {
    console.log('🚀 Initializing Intelligent Chatbot API...');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not found in .env file');
    }

    // Check/create embeddings
    const embedder = new Embedder(apiKey);
    const embeddingsExist = await embedder.checkEmbeddingsIndex();
    
    if (!embeddingsExist) {
      console.log('📚 Creating embeddings index...');
      await embedder.createEmbeddingsIndex();
    }

    // Resolve DB path reliably
    const configuredDbPath = process.env.DATABASE_PATH || '../../../database/customers.db';
    const resolvedDbPath = path.resolve(__dirname, configuredDbPath);
    console.log('Using database:', resolvedDbPath);

    // Initialize chatbot
    chatbot = new IntelligentChatbot(apiKey, resolvedDbPath);
    await chatbot.initialize();
    
    isInitialized = true;
    console.log('✅ Chatbot API initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize chatbot:', error);
    isInitialized = false;
  }
}

/**
 * Middleware to check if chatbot is initialized
 */
function requireInitialized(req, res, next) {
  if (!isInitialized || !chatbot) {
    return res.status(503).json({
      error: 'Chatbot not initialized',
      message: 'The chatbot system is still starting up. Please try again in a moment.'
    });
  }
  next();
}

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: isInitialized ? 'healthy' : 'initializing',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Get chatbot status and statistics
 */
app.get('/api/chatbot/status', requireInitialized, async (req, res) => {
  try {
    const stats = await chatbot.getStats();
    res.json({
      status: 'ready',
      initialized: isInitialized,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * Process a chat message
 */
app.post('/api/chatbot/chat', async (req, res) => {
  try {
    const { message, sessionId, mode = 'detailed' } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message', message: 'Message is required and must be a string' });
    }

    // Detect agent tags; only proxy to ADK when tagged
    const tagMatch = message.match(/@([a-zA-Z0-9_\-]+)/);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : null;
    const shouldProxy = tag && ['sales', 'inventory', 'sales_agent', 'inventory_agent'].includes(tag);

    if (shouldProxy) {
      const upstreamBase = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8001';
      const wantsSSE = (req.headers['accept'] || '').includes('text/event-stream');

      // Identify session and user
      const appName = 'orchestration_agent';
      const userId = req.body?.userId || 'web_user';
      const sessId = sessionId || 's1';

      // Ensure ADK session exists before calling /run_sse (POST is idempotent)
      try {
        const sessionUrl = `${upstreamBase}/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessId)}`;
        await fetch(sessionUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        // Ignore; upstream call will surface errors
      }

      // ADK expects newMessage.parts[].text; include alternates for safety
      const body = {
        newMessage: { parts: [{ text: message }] },
        new_message: { parts: [{ text: message }] },
        user_query: message,
        app_name: appName,
        user_id: userId,
        session_id: sessId,
        streaming: true
      };

      const upstream = await fetch(`${upstreamBase}/run_sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify(body)
      });

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => '');
        return res.status(upstream.status).json({ error: `Upstream error ${upstream.status}`, details: text, success: false });
      }

      if (wantsSSE) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const reader = upstream.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) res.write(Buffer.from(value));
        }
        return res.end();
      }

      const decoder = new TextDecoder();
      const reader = upstream.body.getReader();
      let buffer = '';
      let aggregatedText = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const e of events) {
          const line = e.split('\n').find(l => l.startsWith('data: '));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload && typeof payload.text === 'string') aggregatedText += payload.text;
          } catch {}
        }
      }

      return res.json({ success: true, response: aggregatedText.trim(), type: 'text', metadata: { sessionId: sessionId || 'default', timestamp: new Date().toISOString(), upstream: `${upstreamBase}/run_sse` } });
    }

    // No tag: use local chatbot only (restores previous behavior)
    const result = await chatbot.processQuestion(message, mode);
    if (result?.type === 'data_query') {
      const uiResult = await chatbot.handleUIQuery(message, mode);
      return res.json({ success: true, response: uiResult.response, type: 'ui_explanation', metadata: { sessionId: sessionId || 'default', timestamp: new Date().toISOString(), intent: 'ui_explanation' } });
    }
    return res.json({ success: true, response: result.response, type: result.type, metadata: { ...(result.metadata || {}), sessionId: sessionId || 'default', timestamp: new Date().toISOString() } });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process message', message: 'I apologize, but I encountered an error processing your message. Please try again.', type: 'error' });
  }
});

/**
 * Get conversation history
 */
app.get('/api/chatbot/history', requireInitialized, (req, res) => {
  try {
    const history = chatbot.getConversationHistory();
    res.json({
      success: true,
      history: history,
      count: history.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
});

/**
 * Clear conversation history
 */
app.delete('/api/chatbot/history', requireInitialized, (req, res) => {
  try {
    chatbot.clearHistory();
    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear history',
      message: error.message
    });
  }
});

/**
 * Test the chatbot with predefined questions
 */
app.post('/api/chatbot/test', requireInitialized, async (req, res) => {
  try {
    console.log('🧪 Running chatbot tests...');
    
    const testQuestions = [
      "How many customers do we have?",
      "What are KPI tiles?",
      "How many high engagement customers are there?",
      "How is engagement score calculated?"
    ];
    
    const results = [];
    
    for (const question of testQuestions) {
      const startTime = Date.now();
      const result = await chatbot.processQuestion(question);
      const responseTime = Date.now() - startTime;
      
      results.push({
        question: question,
        response: result.response,
        type: result.type,
        responseTime: responseTime
      });
    }
    
    res.json({
      success: true,
      testResults: results,
      totalTests: results.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

/**
 * Get database statistics
 */
app.get('/api/chatbot/database/stats', requireInitialized, async (req, res) => {
  try {
    const stats = await chatbot.db.getCustomerStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get database stats',
      message: error.message
    });
  }
});

/**
 * Search customers (for testing database connectivity)
 */
app.get('/api/chatbot/database/search', requireInitialized, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Query parameter required',
        message: 'Please provide a search query with ?q=searchterm'
      });
    }
    
    const results = await chatbot.db.searchCustomers(q, parseInt(limit));
    
    res.json({
      success: true,
      results: results,
      count: results.length,
      query: q
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down API server...');
  
  if (chatbot) {
    await chatbot.cleanup();
  }
  
  process.exit(0);
});

// Probe a free port starting at base PORT
async function findFreePort(startPort, maxAttempts = 10) {
  const net = await import('node:net');
  let port = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    const isFree = await new Promise((resolve) => {
      const server = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => server.close(() => resolve(true)))
        .listen(port, '0.0.0.0');
    });
    if (isFree) return port;
    port += 1;
  }
  throw new Error(`No free port found starting at ${startPort}`);
}

// Robust listen with retry that catches EADDRINUSE emitted by the server
let __serverRef = null;
async function listenWithRetry(app, startPort, attempts = 20) {
  const http = await import('node:http');
  let port = startPort;
  for (let i = 0; i < attempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const server = http.createServer(app);
        const onListening = () => {
          server.off('error', onError);
          __serverRef = server; // keep a strong ref so it isn’t GC’d
          // If OS assigned a port (e.g., when startPort=0), read it back
          const addr = server.address();
          if (addr && typeof addr.port === 'number') port = addr.port;
          resolve();
        };
        const onError = (err) => {
          server.off('listening', onListening);
          reject(err);
        };
        server.once('listening', onListening);
        server.once('error', onError);
        server.listen(port, '0.0.0.0');
      });
      return port;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${port} in use. Trying ${port + 1}...`);
        port += 1;
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Could not acquire a free port starting at ${startPort}`);
}

// Start server
async function startServer() {
  // Initialize chatbot first
  await initializeChatbot();
  
  // Resolve a free port and start listening with robust retry
  const basePort = PORT;
  try {
    PORT = await listenWithRetry(app, basePort, 20);
    if (PORT !== basePort) {
      console.warn(`⚠️ Port ${basePort} in use. Switching to ${PORT}.`);
    }
  } catch (e) {
    console.error('❌ Failed to start server:', e.message);
    process.exit(1);
  }

  // Export effective port for other parts of the app to read if necessary
  process.env.NEXT_PUBLIC_CHATBOT_PORT = String(PORT);
  process.env.NEXT_PUBLIC_CHATBOT_API_URL = `http://localhost:${PORT}`;

  console.log(`🌐 Chatbot API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chatbot/chat`);
  console.log(`📈 Status endpoint: GET http://localhost:${PORT}/api/chatbot/status`);
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;