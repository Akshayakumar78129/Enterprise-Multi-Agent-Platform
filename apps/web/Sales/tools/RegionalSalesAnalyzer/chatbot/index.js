/**
 * Regional Sales Chatbot Entry Point
 * Main interface for the regional sales analysis chatbot
 */

import dotenv from 'dotenv';
import RegionalSalesChatbot from './chatbot.js';
import path from 'path';

// Load environment variables
dotenv.config();

class RegionalSalesChatbotService {
  constructor() {
    this.chatbot = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the chatbot service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return this.chatbot;
      }

      console.log('🌍 Starting Regional Sales Chatbot Service...');
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }

      const dbPath = process.env.DATABASE_PATH || '../database/sales.db';
      
      this.chatbot = new RegionalSalesChatbot(apiKey, dbPath);
      await this.chatbot.initialize();
      
      this.isInitialized = true;
      console.log('✅ Regional Sales Chatbot Service initialized successfully!');
      
      return this.chatbot;
    } catch (error) {
      console.error('❌ Failed to initialize Regional Sales Chatbot Service:', error);
      throw error;
    }
  }

  /**
   * Process a user query
   */
  async processQuery(query, context = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      return await this.chatbot.processQuery(query, context);
    } catch (error) {
      console.error('❌ Error processing query:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Could you please try again?",
        intent: 'error',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Get chatbot instance
   */
  getChatbot() {
    return this.chatbot;
  }

  /**
   * Check if service is initialized
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Shutdown the service
   */
  async shutdown() {
    if (this.chatbot) {
      await this.chatbot.close();
      this.isInitialized = false;
      console.log('🔌 Regional Sales Chatbot Service shutdown complete');
    }
  }
}

// Create singleton instance
const chatbotService = new RegionalSalesChatbotService();

// Export both the service and individual functions
export default chatbotService;

export const initializeChatbot = () => chatbotService.initialize();
export const processQuery = (query, context) => chatbotService.processQuery(query, context);
export const getChatbot = () => chatbotService.getChatbot();
export const isReady = () => chatbotService.isReady();
export const shutdown = () => chatbotService.shutdown();

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🌍 Regional Sales Chatbot CLI');
  console.log('Initializing...');
  
  try {
    await chatbotService.initialize();
    console.log('\n✅ Chatbot ready! Type your questions about regional sales:');
    console.log('Examples:');
    console.log('- "What are my top performing regions?"');
    console.log('- "Show me growth opportunities"');
    console.log('- "What\'s my market concentration?"');
    console.log('- "Analyze regional trends"');
    console.log('\nType "exit" to quit.\n');

    // Simple CLI loop for testing
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = () => {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          console.log('\n👋 Goodbye!');
          await chatbotService.shutdown();
          rl.close();
          process.exit(0);
        }

        try {
          const result = await chatbotService.processQuery(input);
          console.log(`\n🤖 Regional Sales Assistant: ${result.response}\n`);
          console.log(`💡 Intent: ${result.intent} (confidence: ${result.confidence})\n`);
        } catch (error) {
          console.error('❌ Error:', error.message);
        }

        askQuestion();
      });
    };

    askQuestion();

  } catch (error) {
    console.error('❌ Failed to start chatbot:', error);
    process.exit(1);
  }
}