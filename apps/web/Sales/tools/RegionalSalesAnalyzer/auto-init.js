/**
 * Auto-initialization script for Regional Sales Analyzer Chatbot
 * Starts the Regional Sales chatbot server in the background during `npm run dev`.
 * Self-contained within the RegionalSalesAnalyzer folder.
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// Load env from local files if possible (non-fatal if dotenv missing)
(function ensureEnvLoaded() {
  let loaded = false;
  try {
    const dotenv = require('dotenv');
    // Prefer a local .env beside the chatbot folder if present
    dotenv.config({ path: path.join(__dirname, 'chatbot', '.env') });
    dotenv.config({ path: path.join(process.cwd(), '.env.local') });
    loaded = true;
  } catch (_) {}

  function loadEnvFrom(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      const content = fs.readFileSync(filePath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    } catch (_) {}
  }

  if (!loaded) {
    loadEnvFrom(path.join(__dirname, 'chatbot', '.env'));
    loadEnvFrom(path.join(process.cwd(), '.env.local'));
  }
})();

// Quiet logging toggle (default verbose)
if (process.env.RSA_QUIET === undefined) {
  process.env.RSA_QUIET = '0';
}

// Avoid multiple initializations
global.__RSA_CHATBOT_INITIALIZED__ = global.__RSA_CHATBOT_INITIALIZED__ || false;

async function isServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: 'localhost', port, path: '/health', timeout: 1000 }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(buf);
          resolve(!!json && (json.service === 'Regional Sales Chatbot API' || json.status));
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function autoInitializeRegionalSalesChatbot() {
  if (global.__RSA_CHATBOT_INITIALIZED__) return;

  try {
    if (!(process.env.RSA_QUIET === '1' || process.env.RSA_QUIET === 'true')) {
      console.log('🚀 [RSA Auto-Init] Initializing Regional Sales Chatbot...');
    }

    // Ensure fixed port 3005 unless overridden explicitly
    const preferredPort = parseInt(process.env.SALES_CHATBOT_PORT || process.env.PORT || '3005', 10);

    // Persist env for the ESM server module
    process.env.SALES_CHATBOT_PORT = String(preferredPort);
    process.env.PORT = String(preferredPort);

    const reuse = await isServerRunning(preferredPort);

    if (reuse) {
      if (!(process.env.RSA_QUIET === '1' || process.env.RSA_QUIET === 'true')) {
        console.log(`[RSA Auto-Init] Server already running on :${preferredPort}`);
      }
    } else {
      if (!(process.env.RSA_QUIET === '1' || process.env.RSA_QUIET === 'true')) {
        console.log(`[RSA Auto-Init] Starting server on :${preferredPort} ...`);
      }
      // Dynamically import the ESM server which starts itself (api-server.js)
      await import('./chatbot/api-server.js');
      if (!(process.env.RSA_QUIET === '1' || process.env.RSA_QUIET === 'true')) {
        console.log(`[RSA Auto-Init] Server boot requested on :${preferredPort}`);
      }
    }

    // Expose to frontend if needed
    process.env.NEXT_PUBLIC_RSA_CHATBOT_PORT = String(preferredPort);
    process.env.NEXT_PUBLIC_RSA_CHATBOT_API_URL = process.env.NEXT_PUBLIC_RSA_CHATBOT_API_URL || `http://localhost:${preferredPort}`;

    global.__RSA_CHATBOT_INITIALIZED__ = true;
  } catch (err) {
    console.error('❌ [RSA Auto-Init] Error:', err && err.message ? err.message : err);
    global.__RSA_CHATBOT_INITIALIZED__ = true; // Prevent loops
  }
}

if (typeof window === 'undefined') {
  autoInitializeRegionalSalesChatbot().catch((e) => {
    console.error('❌ [RSA Auto-Init] Failed:', e);
  });
}

module.exports = {
  autoInitializeRegionalSalesChatbot,
  isInitialized: () => global.__RSA_CHATBOT_INITIALIZED__ || false,
};