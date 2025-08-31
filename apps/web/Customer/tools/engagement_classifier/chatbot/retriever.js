/**
 * Retriever Module - Searches for relevant text chunks using cosine similarity
 * Handles query embedding and similarity matching for RAG system
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Embedder from './embedder.js';

class Retriever {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "embedding-001" });
    this.embedder = new Embedder(apiKey);
    this.embeddingsData = null;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Load embeddings data if not already loaded
   */
  async loadEmbeddingsData() {
    if (!this.embeddingsData) {
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('Loading embeddings data...');
      this.embeddingsData = await this.embedder.loadEmbeddings();
      
      if (!this.embeddingsData) {
        throw new Error('No embeddings data found. Please run embedder first.');
      }
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log(`✅ Loaded ${this.embeddingsData.embeddings.length} embeddings`);
    }
    
    return this.embeddingsData;
  }

  /**
   * Generate embedding for a query string
   */
  async embedQuery(query) {
    try {
      console.log(`Generating embedding for query: "${query.substring(0, 50)}..."`);
      
      const result = await this.model.embedContent(query);
      return result.embedding.values;
      
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw error;
    }
  }

  /**
   * Find the most similar text chunks to a query
   */
  async searchSimilar(query, topK = 3, minSimilarity = 0.1, options = {}) {
    try {
      const { tag = null } = options;
      // Load embeddings if not already loaded
      await this.loadEmbeddingsData();
      
      // Generate embedding for the query
      const queryEmbedding = await this.embedQuery(query);
      
      // Pre-filter by tag if provided
      const sourceEmbeddings = Array.isArray(this.embeddingsData.embeddings)
        ? (tag ? this.embeddingsData.embeddings.filter(item => (item.tag || 'general') === tag) : this.embeddingsData.embeddings)
        : [];

      // Calculate similarities with all (filtered) chunks
      const similarities = sourceEmbeddings.map(item => {
        const similarity = this.cosineSimilarity(queryEmbedding, item.embedding);
        return {
          ...item,
          similarity: similarity,
          relevanceScore: Math.round(similarity * 100) / 100
        };
      });
      
      // Sort by similarity (highest first) and filter by minimum similarity
      const results = similarities
        .filter(item => item.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) {
        console.log(`Found ${results.length} relevant chunks (min similarity: ${minSimilarity}) tag=${tag || 'any'}`);
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. Similarity: ${result.relevanceScore} [tag=${result.tag}] - "${result.text.substring(0, 80)}..."`);
        });
      }
      
      return results;
      
    } catch (error) {
      console.error('Error searching for similar chunks:', error);
      throw error;
    }
  }

  /**
   * Get context text from search results
   */
  formatSearchResults(searchResults, maxLength = 2000) {
    if (!searchResults || searchResults.length === 0) {
      console.warn("[Retriever] No relevant information found in the dashboard documentation. Passing empty context to Gemini.");
      return "";
    }

    let context = "Relevant information from the dashboard documentation:\n\n";
    let currentLength = context.length;

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      const chunk = `${i + 1}. ${result.text}\n\n`;
      
      if (currentLength + chunk.length > maxLength) {
        // If adding this chunk would exceed max length, truncate it
        const remainingLength = maxLength - currentLength - 20; // Leave some buffer
        if (remainingLength > 100) { // Only add if there's meaningful space left
          context += `${i + 1}. ${result.text.substring(0, remainingLength)}...\n\n`;
        }
        break;
      }
      
      context += chunk;
      currentLength += chunk.length;
    }

    return context.trim();
  }

  /**
   * Enhanced search with query preprocessing
   */
  async intelligentSearch(query, topK = 3, options = {}) {
    try {
      const { tag = null } = options;
      // Preprocess query to improve matching
      const processedQuery = this.preprocessQuery(query);
      
      // Search with original query
      const results = await this.searchSimilar(processedQuery, topK, 0.1, { tag });
      
      // If no good results, try with expanded query
      if (results.length === 0 || results[0].similarity < 0.3) {
        console.log('Low similarity results, trying expanded query...');
        const expandedQuery = this.expandQuery(query);
        const expandedResults = await this.searchSimilar(expandedQuery, topK, 0.05, { tag });
        
        if (expandedResults.length > 0) {
          return expandedResults;
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error in intelligent search:', error);
      return [];
    }
  }

  /**
   * Preprocess query to improve matching
   */
  preprocessQuery(query) {
    // Convert to lowercase and clean up
    let processed = query.toLowerCase().trim();
    
    // Expand common abbreviations
    const abbreviations = {
      'kpi': 'key performance indicator',
      'roi': 'return on investment',
      'rfm': 'recency frequency monetary',
      'crm': 'customer relationship management',
      'ltv': 'lifetime value',
      'cac': 'customer acquisition cost'
    };
    
    for (const [abbr, expansion] of Object.entries(abbreviations)) {
      processed = processed.replace(new RegExp(`\\b${abbr}\\b`, 'g'), expansion);
    }
    
    return processed;
  }

  /**
   * Expand query with related terms
   */
  expandQuery(query) {
    const lowerQuery = query.toLowerCase();
    let expanded = query;
    
    // Add related terms based on query content
    if (lowerQuery.includes('engagement')) {
      expanded += ' customer engagement score level high medium low';
    }
    
    if (lowerQuery.includes('dashboard')) {
      expanded += ' dashboard visualization chart table filter kpi metrics';
    }
    
    if (lowerQuery.includes('customer')) {
      expanded += ' customer segmentation analysis behavior';
    }
    
    if (lowerQuery.includes('score') || lowerQuery.includes('scoring')) {
      expanded += ' engagement score calculation rfm recency frequency monetary';
    }
    
    return expanded;
  }

  /**
   * Get statistics about the embeddings data
   */
  async getEmbeddingsStats() {
    await this.loadEmbeddingsData();
    
    const embeddings = this.embeddingsData.embeddings;
    const totalChunks = embeddings.length;
    const avgChunkSize = embeddings.reduce((sum, e) => sum + e.size, 0) / totalChunks;
    const embeddingDimension = embeddings[0]?.embedding?.length || 0;
    
    return {
      totalChunks,
      avgChunkSize: Math.round(avgChunkSize),
      embeddingDimension,
      createdAt: this.embeddingsData.metadata.created_at,
      model: this.embeddingsData.metadata.model
    };
  }

  /**
   * Test the retrieval system with sample queries
   */
  async testRetrieval() {
    const testQueries = [
      "What are KPI tiles?",
      "How is engagement score calculated?",
      "What is the engagement pyramid?",
      "How to filter customers?",
      "What are high engagement customers?",
      "Dashboard features and capabilities"
    ];

    console.log('🧪 Testing retrieval system...\n');

    for (const query of testQueries) {
      console.log(`Query: "${query}"`);
      const results = await this.searchSimilar(query, 2);
      
      if (results.length > 0) {
        console.log(`✅ Found ${results.length} results (best similarity: ${results[0].relevanceScore})`);
        console.log(`   Preview: "${results[0].text.substring(0, 100)}..."`);
      } else {
        console.log('❌ No results found');
      }
      console.log('');
    }
  }
}

export default Retriever;