/**
 * Test Embeddings - Helper script to test and validate the embedding system
 * Run this to verify embeddings are working correctly
 */

import dotenv from 'dotenv';
import Embedder from './embedder.js';
import Retriever from './retriever.js';

dotenv.config();

async function testEmbeddings() {
  try {
    console.log('🧪 TESTING EMBEDDINGS SYSTEM');
    console.log('='.repeat(50));
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.error('❌ Error: GEMINI_API_KEY not found in .env file');
      return;
    }

    // Test 1: Create embeddings
    console.log('\n1️⃣ Testing Embedder...');
    const embedder = new Embedder(apiKey);
    
    // Check if embeddings exist
    const embeddingsExist = await embedder.checkEmbeddingsIndex();
    console.log(`Embeddings exist: ${embeddingsExist}`);
    
    if (!embeddingsExist) {
      console.log('Creating new embeddings...');
      await embedder.createEmbeddingsIndex();
    }

    // Test 2: Test retrieval
    console.log('\n2️⃣ Testing Retriever...');
    const retriever = new Retriever(apiKey);
    await retriever.testRetrieval();

    // Test 3: Test specific queries
    console.log('\n3️⃣ Testing Specific Queries...');
    const testQueries = [
      "What are KPI tiles?",
      "How is engagement score calculated?",
      "What is the engagement pyramid?",
      "Dashboard features",
      "Customer segmentation"
    ];

    for (const query of testQueries) {
      console.log(`\nQuery: "${query}"`);
      const results = await retriever.intelligentSearch(query, 2);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results`);
        console.log(`   Best match (${results[0].relevanceScore}): "${results[0].text.substring(0, 100)}..."`);
      } else {
        console.log('❌ No results found');
      }
    }

    // Test 4: Get statistics
    console.log('\n4️⃣ Embeddings Statistics...');
    const stats = await retriever.getEmbeddingsStats();
    console.log(`Total chunks: ${stats.totalChunks}`);
    console.log(`Average chunk size: ${stats.avgChunkSize} characters`);
    console.log(`Embedding dimension: ${stats.embeddingDimension}`);
    console.log(`Created: ${stats.createdAt}`);
    console.log(`Model: ${stats.model}`);

    console.log('\n✅ All embedding tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testEmbeddings();