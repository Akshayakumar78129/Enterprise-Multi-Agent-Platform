/**
 * Setup script for Regional Sales Chatbot
 * Initializes embeddings and prepares the chatbot for use
 */

import dotenv from 'dotenv';
import RegionalSalesChatbot from './chatbot.js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

async function setup() {
  console.log('🌍 Regional Sales Chatbot Setup');
  console.log('================================\n');

  try {
    // Check environment variables
    console.log('1. Checking environment variables...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    console.log('   ✅ GEMINI_API_KEY found');

    const dbPath = process.env.DATABASE_PATH || '../database/sales.db';
    console.log(`   📁 Database path: ${dbPath}`);

    // Check if knowledge base file exists
    console.log('\n2. Checking knowledge base file...');
    const knowledgeFile = path.join(process.cwd(), 'regional_sales_explanations.txt');
    try {
      await fs.access(knowledgeFile);
      const stats = await fs.stat(knowledgeFile);
      console.log(`   ✅ Knowledge base found (${Math.round(stats.size / 1024)}KB)`);
    } catch (error) {
      throw new Error(`Knowledge base file not found: ${knowledgeFile}`);
    }

    // Initialize chatbot
    console.log('\n3. Initializing Regional Sales Chatbot...');
    const chatbot = new RegionalSalesChatbot(apiKey, dbPath);
    await chatbot.initialize();
    console.log('   ✅ Chatbot initialized successfully');

    // Test database connection
    console.log('\n4. Testing database queries...');
    try {
      const kpis = await chatbot.db.getRegionalKPIs();
      console.log(`   ✅ Database connected - Total revenue: $${(kpis.total_revenue || 0).toLocaleString()}`);
      
      const topRegions = await chatbot.db.getTopRegions(3);
      console.log(`   ✅ Found ${topRegions.length} top regions`);
      
      const opportunities = await chatbot.db.getGrowthOpportunities();
      console.log(`   ✅ Found ${opportunities.length} growth opportunities`);
    } catch (error) {
      console.warn(`   ⚠️ Database queries failed: ${error.message}`);
      console.log('   💡 Chatbot will work with limited functionality');
    }

    // Test embeddings
    console.log('\n5. Testing embeddings and retrieval...');
    const testQuery = "What are my top performing regions?";
    const context = await chatbot.retriever.retrieveRelevantContext(testQuery);
    console.log(`   ✅ Retrieved ${context.length} characters of relevant context`);

    // Test full query processing
    console.log('\n6. Testing query processing...');
    const result = await chatbot.processQuery(testQuery);
    console.log(`   ✅ Query processed successfully`);
    console.log(`   🎯 Intent: ${result.intent} (confidence: ${result.confidence})`);
    console.log(`   💬 Response preview: ${result.response.substring(0, 100)}...`);

    // Get retriever stats
    console.log('\n7. Embeddings statistics...');
    const stats = chatbot.retriever.getStats();
    console.log(`   📊 Total chunks: ${stats.totalChunks}`);
    console.log(`   📊 Total embeddings: ${stats.totalEmbeddings}`);
    console.log(`   📊 Average chunk length: ${Math.round(stats.avgChunkLength)} characters`);

    // Cleanup
    await chatbot.close();

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run "npm start" to start the CLI interface');
    console.log('2. Run "npm run server" to start the API server');
    console.log('3. Use the chatbot in your application');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure GEMINI_API_KEY is set in .env file');
    console.log('2. Check that the database file exists and is accessible');
    console.log('3. Ensure you have internet connection for API calls');
    console.log('4. Verify all dependencies are installed (npm install)');
    process.exit(1);
  }
}

// Run setup
setup();