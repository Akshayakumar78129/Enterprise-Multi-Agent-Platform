/**
 * Auto-initialization script for Engagement Classifier Chatbot
 * This file automatically initializes the chatbot when Next.js starts
 * Place this in engagement_classifier folder - it will auto-run on app startup
 */

const path = require('path');
const fs = require('fs');

// Try to load with dotenv if available, otherwise do a minimal parser
(function ensureEnvLoaded() {
  let loaded = false;
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(__dirname, 'chatbot', '.env') });
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
    loaded = true;
  } catch (_) {
    // dotenv not installed; fall back to manual loader
  }

  function loadEnvFrom(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      });
    } catch (_) {}
  }

  if (!loaded) {
    loadEnvFrom(path.join(__dirname, 'chatbot', '.env'));
    loadEnvFrom(path.join(process.cwd(), '.env.local'));
  }
})();

// Force-enable logs unless explicitly silenced via env
if (process.env.EC_QUIET === undefined) {
  process.env.EC_QUIET = '0';
}

// Global flag to prevent multiple initializations
global.__ENGAGEMENT_CHATBOT_INITIALIZED__ = global.__ENGAGEMENT_CHATBOT_INITIALIZED__ || false;

async function autoInitializeChatbot() {
  if (global.__ENGAGEMENT_CHATBOT_INITIALIZED__) {
    return;
  }

  try {
    if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('🚀 [Auto-Init] Starting Engagement Classifier Chatbot initialization...');
    
    // Check environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const dbPath = process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('⚠️ [Auto-Init] GEMINI_API_KEY not configured - chatbot will use fallback responses');
      // Do NOT early return; still start the server so it can pick up env at runtime
    }
    
    if (!dbPath) {
      console.log('⚠️ [Auto-Init] DATABASE_PATH not configured - chatbot will use fallback responses');
      // Do NOT early return; still start the server
    }

    // Pre-load the chatbot module to check for issues
    try {
      const chatbotModule = await import('./chatbot/chatbot.js');
      const IntelligentChatbot = chatbotModule.default;
      
      // Create a test instance to validate everything works
      const testChatbot = new IntelligentChatbot(apiKey, dbPath);
      await testChatbot.initialize();
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) {
        console.log('✅ [Auto-Init] Engagement Classifier Chatbot pre-initialized successfully!');
        console.log('📡 [Auto-Init] Chatbot API will be available at /api/engagement-chatbot');
      }
      
      // Store the initialized instance globally for reuse
      global.__ENGAGEMENT_CHATBOT_INSTANCE__ = testChatbot;
      
    } catch (chatbotError) {
      console.log('⚠️ [Auto-Init] Chatbot initialization failed, will use fallback responses:', chatbotError.message);
    }
    
    global.__ENGAGEMENT_CHATBOT_INITIALIZED__ = true;
    
  } catch (error) {
    console.error('❌ [Auto-Init] Auto-initialization error:', error.message);
    global.__ENGAGEMENT_CHATBOT_INITIALIZED__ = true; // Prevent retry loops
  }
}

// Auto-run when this module is imported
if (typeof window === 'undefined') { // Only run on server-side
  
  autoInitializeChatbot().then(async () => {
    // After chatbot is initialized, start the standalone server
    try {
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('[Auto-Init] Starting chatbot server...');
      const http = require('http');

      // Fixed port policy: use 3001 unless explicitly overridden
      const preferPort = parseInt(process.env.CHATBOT_PORT || process.env.NEXT_PUBLIC_CHATBOT_PORT || '3001', 10);

      async function isOurServerRunning(port) {
        return new Promise((resolve) => {
          const req = http.get({ host: 'localhost', port, path: '/api/chatbot/status', timeout: 1000 }, (res) => {
            let data = '';
            res.on('data', (c) => (data += c));
            res.on('end', () => {
              try {
                const json = JSON.parse(data);
                // Consider it ours if endpoint responds and initialized field exists (true/false)
                resolve(typeof json.initialized === 'boolean');
              } catch {
                resolve(false);
              }
            });
          });
          req.on('error', () => resolve(false));
          req.on('timeout', () => {
            req.destroy();
            resolve(false);
          });
        });
      }

      const port = preferPort;
      const reuse = await isOurServerRunning(port);

      const EmbeddedChatbotServer = (await import('./chatbot/embedded-server.js')).default;

      if (reuse) {
        if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log(`[Auto-Init] Chatbot server already running on :${port}`);
      } else {
        const server = new EmbeddedChatbotServer({
          port,
          apiKey: process.env.GEMINI_API_KEY,
          dbPath: process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH
        });
        await server.start();
        console.log(`[Auto-Init] Chatbot server running on :${port}`);
        global.__ENGAGEMENT_CHATBOT_SERVER__ = server;
      }

      // Persist the selected port so the UI can infer it if env is missing
      process.env.NEXT_PUBLIC_CHATBOT_PORT = String(port);
      process.env.NEXT_PUBLIC_CHATBOT_API_URL = process.env.NEXT_PUBLIC_CHATBOT_API_URL || `http://localhost:${port}`;
      
    } catch (serverError) {
      console.error('❌ [Auto-Init] Failed to start server:', serverError);
    }
  }).catch(err => {
    console.error('❌ [Auto-Init] Failed to auto-initialize:', err);
  });
}

module.exports = {
  autoInitializeChatbot,
  getChatbotInstance: () => global.__ENGAGEMENT_CHATBOT_INSTANCE__ || null,
  isInitialized: () => global.__ENGAGEMENT_CHATBOT_INITIALIZED__ || false
};