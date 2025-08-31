/**
 * Simple startup script for the chatbot server
 * Usage: node start-chatbot.js
 */

import EmbeddedChatbotServer from './chatbot/embedded-server.js';

async function startChatbot() {
  try {
    console.log('🚀 Starting Engagement Classifier Chatbot...');
    
    const preferPort = parseInt(process.env.CHATBOT_PORT || process.env.PORT || process.env.NEXT_PUBLIC_CHATBOT_PORT || '3001', 10);
    const server = new EmbeddedChatbotServer({
      port: preferPort,
      apiKey: process.env.GEMINI_API_KEY,
      dbPath: process.env.DATABASE_PATH || process.env.ENGAGEMENT_DB_PATH
    });
    
    await server.start();
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down chatbot...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down chatbot...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start chatbot:', error);
    process.exit(1);
  }
}

startChatbot();