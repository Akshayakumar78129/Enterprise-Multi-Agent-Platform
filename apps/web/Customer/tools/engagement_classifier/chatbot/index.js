/**
 * Main Entry Point - Interactive CLI for the Intelligent Chatbot
 * Provides a command-line interface to test and interact with the chatbot
 */

import dotenv from 'dotenv';
import promptSync from 'prompt-sync';
import IntelligentChatbot from './chatbot.js';
import Embedder from './embedder.js';

// Load environment variables
dotenv.config();

const prompt = promptSync({ sigint: true });

class ChatbotCLI {
  constructor() {
    this.chatbot = null;
    this.isRunning = false;
  }

  /**
   * Display welcome message and instructions
   */
  displayWelcome() {
    console.log('\n' + '='.repeat(80));
    console.log('🤖 INTELLIGENT CUSTOMER ENGAGEMENT CHATBOT');
    console.log('='.repeat(80));
    console.log('Welcome! This chatbot can answer two types of questions:');
    console.log('');
    console.log('📊 DATA QUERIES (queries your customer database):');
    console.log('   • "How many customers do we have?"');
    console.log('   • "How many high engagement customers are there?"');
    console.log('   • "What\'s the average engagement score?"');
    console.log('   • "Show me the top 10 customers"');
    console.log('   • "Which customers are at risk?"');
    console.log('');
    console.log('🎨 DASHBOARD QUESTIONS (explains UI and features):');
    console.log('   • "What are KPI tiles?"');
    console.log('   • "How is engagement score calculated?"');
    console.log('   • "What is the engagement pyramid?"');
    console.log('   • "How do I use filters?"');
    console.log('   • "Explain the dashboard features"');
    console.log('');
    console.log('💡 COMMANDS:');
    console.log('   • Type "help" for this message');
    console.log('   • Type "stats" to see chatbot statistics');
    console.log('   • Type "test" to run automated tests');
    console.log('   • Type "history" to see conversation history');
    console.log('   • Type "clear" to clear conversation history');
    console.log('   • Type "quit" or "exit" to end the session');
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Initialize the chatbot system
   */
  async initialize() {
    try {
      console.log('🚀 Starting Intelligent Chatbot System...\n');
      
      // Check for API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.error('❌ Error: GEMINI_API_KEY not found in .env file');
        console.log('Please add your Gemini API key to the .env file:');
        console.log('GEMINI_API_KEY=your_actual_api_key_here');
        return false;
      }

      // Check if embeddings exist, create if needed
      const embedder = new Embedder(apiKey);
      const embeddingsExist = await embedder.checkEmbeddingsIndex();
      
      if (!embeddingsExist) {
        console.log('📚 Embeddings not found or outdated. Creating new embeddings...');
        await embedder.createEmbeddingsIndex();
        console.log('');
      }

      // Initialize chatbot
      this.chatbot = new IntelligentChatbot(apiKey, process.env.DATABASE_PATH);
      await this.chatbot.initialize();
      
      console.log('✅ Chatbot system ready!\n');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize chatbot:', error.message);
      console.log('\nTroubleshooting tips:');
      console.log('1. Make sure your Gemini API key is correct in .env');
      console.log('2. Ensure the customer database exists');
      console.log('3. Check your internet connection');
      console.log('4. Verify all dependencies are installed (npm install)');
      return false;
    }
  }

  /**
   * Handle special commands
   */
  async handleCommand(input) {
    const command = input.toLowerCase().trim();
    
    switch (command) {
      case 'help':
        this.displayWelcome();
        return true;
        
      case 'stats':
        console.log('📊 Getting chatbot statistics...\n');
        const stats = await this.chatbot.getStats();
        if (stats) {
          console.log('DATABASE STATISTICS:');
          console.log(`  Total Customers: ${stats.database.totalCustomers?.toLocaleString()}`);
          console.log(`  Average Engagement Score: ${stats.database.avgEngagementScore}/10`);
          console.log(`  Average Days Since Activity: ${stats.database.avgDaysSinceActivity} days`);
          console.log(`  Re-engagement Opportunities: ${stats.database.reengagementOpportunities?.toLocaleString()}`);
          console.log('\nENGAGEMENT DISTRIBUTION:');
          stats.database.engagementDistribution?.forEach(d => {
            console.log(`  ${d.engagement_level}: ${d.customer_count} customers`);
          });
          console.log('\nEMBEDDINGS STATISTICS:');
          console.log(`  Total Chunks: ${stats.embeddings.totalChunks}`);
          console.log(`  Average Chunk Size: ${stats.embeddings.avgChunkSize} characters`);
          console.log(`  Embedding Dimension: ${stats.embeddings.embeddingDimension}`);
          console.log('\nCONVERSATION STATISTICS:');
          console.log(`  Total Messages: ${stats.conversation.totalMessages}`);
          console.log(`  User Messages: ${stats.conversation.userMessages}`);
          console.log(`  Bot Messages: ${stats.conversation.botMessages}`);
        }
        console.log('');
        return true;
        
      case 'test':
        console.log('🧪 Running automated tests...\n');
        await this.chatbot.testChatbot();
        console.log('\n✅ Automated tests completed!\n');
        return true;
        
      case 'history':
        const history = this.chatbot.getConversationHistory();
        if (history.length === 0) {
          console.log('📝 No conversation history yet.\n');
        } else {
          console.log('📝 CONVERSATION HISTORY:\n');
          history.forEach((msg, index) => {
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();
            const prefix = msg.type === 'user' ? '👤 You' : '🤖 Bot';
            console.log(`${index + 1}. [${timestamp}] ${prefix}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
          });
          console.log('');
        }
        return true;
        
      case 'clear':
        this.chatbot.clearHistory();
        console.log('🗑️  Conversation history cleared.\n');
        return true;
        
      case 'quit':
      case 'exit':
        console.log('👋 Goodbye! Thanks for using the Intelligent Chatbot!');
        this.isRunning = false;
        return true;
        
      default:
        return false; // Not a command, process as regular question
    }
  }

  /**
   * Main chat loop
   */
  async startChat() {
    this.isRunning = true;
    this.displayWelcome();
    
    while (this.isRunning) {
      try {
        // Get user input
        const input = prompt('💬 Ask me anything: ').trim();
        
        if (!input) {
          continue;
        }
        
        // Check if it's a command
        const isCommand = await this.handleCommand(input);
        if (isCommand) {
          continue;
        }
        
        // Process as regular question
        console.log('\n🤔 Thinking...\n');
        const startTime = Date.now();
        
        const result = await this.chatbot.processQuestion(input);
        
        const endTime = Date.now();
        const responseTime = ((endTime - startTime) / 1000).toFixed(2);
        
        // Display response
        console.log('🤖 RESPONSE:');
        console.log('-'.repeat(60));
        console.log(result.response);
        console.log('-'.repeat(60));
        console.log(`⏱️  Response time: ${responseTime}s | Type: ${result.type}\n`);
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Please try again or type "help" for assistance.\n');
      }
    }
  }

  /**
   * Cleanup and exit
   */
  async cleanup() {
    if (this.chatbot) {
      await this.chatbot.cleanup();
    }
  }
}

// Main execution
async function main() {
  const cli = new ChatbotCLI();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await cli.cleanup();
    process.exit(0);
  });
  
  // Initialize and start
  const initialized = await cli.initialize();
  if (initialized) {
    await cli.startChat();
  }
  
  await cli.cleanup();
}

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ChatbotCLI;