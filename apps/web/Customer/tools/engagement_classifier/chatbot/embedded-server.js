/**
 * Embedded Chatbot Server
 * Can be imported and started programmatically from your main application
 */

import express from 'express';
import cors from 'cors';
import IntelligentChatbot from './chatbot.js';
import dotenv from 'dotenv';
import { AIResponseDashboardNode } from './utils/adkStream.js';

class EmbeddedChatbotServer {
  constructor(options = {}) {
    // Fixed default port for Engagement Classifier chatbot (use 3001)
    this.port = options.port || 3001;
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    this.dbPath = options.dbPath || process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH;
    this.app = null;
    this.server = null;
    this.chatbot = null;
    this.isRunning = false;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Load environment variables from .env so GEMINI_API_KEY and DATABASE_PATH are available
      dotenv.config();

      // Initializing Embedded Chatbot Server (log minimized)
      
      // Initialize chatbot
      this.apiKey = this.apiKey || process.env.GEMINI_API_KEY;
      this.dbPath = this.dbPath || process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH;
      this.chatbot = new IntelligentChatbot(this.apiKey, this.dbPath);
      await this.chatbot.initialize();
      this.initialized = true;
      
      // Setup Express app
      this.app = express();
      this.app.use(cors());
      this.app.use(express.json({ limit: '10mb' }));
      
      // Health check endpoint
      this.app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          service: 'embedded-engagement-chatbot'
        });
      });
      
      // Chat endpoint: proxy to ADK only when a @tag is present; otherwise answer locally
      this.app.post('/api/chatbot/chat', async (req, res) => {
        try {
          const { message, sessionId, mode = 'detailed' } = req.body || {};
          if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string', success: false });
          }

          console.log('[Chatbot] Incoming chat request:', { preview: message.slice(0, 120), mode, sessionId });

          // Detect agent tags
          const tagMatch = message.match(/@([a-zA-Z0-9_\-]+)/);
          const tag = tagMatch ? tagMatch[1].toLowerCase() : null;
          const shouldProxy = tag && ['sales', 'inventory', 'sales_agent', 'inventory_agent'].includes(tag);
          console.log('[Chatbot] Tag detection:', { tag, shouldProxy });

          if (shouldProxy) {
            const upstreamBase = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';
            const wantsSSE = (req.headers['accept'] || '').includes('text/event-stream');

            // Identify session and user
            // Always talk to the orchestration agent; it will route to tools/child agents
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

            // Prepare upstream request payload expected by /run_sse (new schema + fallbacks)
            const body = {
              newMessage: { parts: [{ text: message }] },
              new_message: { parts: [{ text: message }] },
              user_query: message,
              app_name: appName,
              user_id: userId,
              session_id: sessId,
              streaming: true
            };

            console.log('🚀🚀🚀 [Chatbot] ABOUT TO CALL AIResponseDashboardNode');
            console.log('🚀🚀🚀 Message:', message);
            console.log('🚀🚀🚀 Session:', { appName, userId, sessId });
            console.log('[Chatbot] Proxy via AIResponseDashboardNode (adkStream logs enabled)', { appName, userId, sessId });

            // Use AIResponseDashboardNode generator to stream from ADK (restores detailed logs)
            const session = { app_name: appName, user_id: userId, session_id: sessId };
            console.log('🚀🚀🚀 CALLING AIResponseDashboardNode NOW...');
            const streamGen = AIResponseDashboardNode(message, session);
            console.log('🚀🚀🚀 AIResponseDashboardNode returned generator');

            if (wantsSSE) {
              console.log('[Chatbot] Streaming SSE to client via adkStream...');
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              try {
                for await (const chunk of streamGen) {
                  res.write(`data: ${typeof chunk === 'string' ? JSON.stringify(chunk) : JSON.stringify(chunk)}\n\n`);
                }
              } catch (e) {
                console.warn('[Chatbot] SSE proxy error:', e?.message);
                res.write(`data: ${JSON.stringify({ error: 'proxy_error', message: e?.message || 'unknown' })}\n\n`);
              }
              return res.end();
            }

            // Aggregate non-SSE response
            let aggregatedText = '';
            try {
              for await (const chunk of streamGen) {
                if (chunk === '[DONE]') break;
                if (chunk === '[ERROR]') {
                  return res.status(502).json({ error: 'Upstream error', details: 'AIResponseDashboardNode returned [ERROR]', success: false });
                }
                if (typeof chunk === 'object' && chunk) {
                  if (chunk.text) aggregatedText += chunk.text;
                } else if (typeof chunk === 'string') {
                  aggregatedText += chunk;
                }
              }
            } catch (e) {
              console.warn('[Chatbot] Proxy aggregation error:', e?.message);
              return res.status(502).json({ error: 'Upstream error', details: e?.message || 'aggregation failed', success: false });
            }

            console.log('[Chatbot] Aggregated text length (adkStream):', aggregatedText.length);
            return res.json({
              response: aggregatedText.trim(),
              type: 'text',
              metadata: {
                timestamp: new Date().toISOString(),
                service: 'embedded-engagement-chatbot',
                upstream: 'AIResponseDashboardNode'
              },
              success: true
            });
          }

          // No tag: answer locally using the embedded chatbot
          try {
            console.log('[Chatbot] Handling locally (no tag). Mode:', mode);
            const result = await this.chatbot.processQuestion(message, mode);
            if (result?.type === 'data_query') {
              console.log('[Chatbot] Local data_query → UI explanation');
              const uiResult = await this.chatbot.handleUIQuery(message, mode);
              return res.json({ success: true, response: uiResult.response, type: 'ui_explanation', metadata: { sessionId: sessionId || 'default', timestamp: new Date().toISOString(), intent: 'ui_explanation' } });
            }
            console.log('[Chatbot] Local response type:', result?.type);
            return res.json({ success: true, response: result.response, type: result.type, metadata: { ...(result.metadata || {}), sessionId: sessionId || 'default', timestamp: new Date().toISOString() } });
          } catch (localErr) {
            console.warn('[Chatbot] Local processing failed, returning deterministic fallback:', localErr?.message);
            // Minimal deterministic fallback text
            const bullets = [
              'This dashboard provides KPIs, engagement segments, and trends.',
              'Ask for definitions (e.g., what are KPI tiles?).',
              'Tag an agent like @sales or @inventory for data-backed answers.'
            ];
            return res.json({ success: true, response: bullets.map(b=>`• ${b}`).join('\n'), type: 'ui_explanation', metadata: { sessionId: sessionId || 'default', timestamp: new Date().toISOString(), intent: 'ui_explanation' } });
          }

        } catch (error) {
          console.error('Chat error:', error);
          return res.status(500).json({ error: 'Internal server error', message: error.message, success: false });
        }
      });
      
      // Status endpoint
      this.app.get('/api/chatbot/status', (req, res) => {
        res.json({
          status: this.isRunning ? 'running' : 'stopped',
          initialized: !!this.initialized,
          port: this.port,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        });
      });
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('✅ Embedded Chatbot Server initialized');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize embedded server:', error);
      throw error;
    }
  }

  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Server is already running');
        return;
      }
      
      if (!this.app) {
        await this.initialize();
      }
      
      return new Promise((resolve, reject) => {
        this.server = this.app.listen(this.port, (err) => {
          if (err) {
            console.error(`❌ Failed to start server on port ${this.port}:`, err);
            reject(err);
            return;
          }
          
          this.isRunning = true;
          console.log(`[Chatbot] Running on :${this.port}`);
          resolve();
        });
        
        this.server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${this.port} is already in use`);
          } else {
            console.error('❌ Server error:', error);
          }
          reject(error);
        });
      });
      
    } catch (error) {
      console.error('❌ Error starting embedded server:', error);
      throw error;
    }
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('🛑 Embedded Chatbot Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      hasApp: !!this.app,
      hasChatbot: !!this.chatbot
    };
  }
}

// Export for programmatic use
export default EmbeddedChatbotServer;

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new EmbeddedChatbotServer();
  
  server.start().catch(error => {
    console.error('Failed to start embedded server:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down embedded server...');
    await server.stop();
    process.exit(0);
  });
}