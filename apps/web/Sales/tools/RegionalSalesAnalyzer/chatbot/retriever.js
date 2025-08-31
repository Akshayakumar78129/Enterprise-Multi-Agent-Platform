/**
 * RAG Retriever for Regional Sales Knowledge Base
 * Handles embedding generation and similarity search for regional sales documentation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RegionalSalesRetriever {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddings = [];
    this.chunks = [];
    this.embeddingsFile = path.join(__dirname, 'embeddings_index.json');
  }

  /**
   * Load embeddings data from file or generate if not exists
   */
  async loadEmbeddingsData() {
    try {
      console.log('📚 Loading regional sales knowledge embeddings...');
      
      // Try to load existing embeddings
      try {
        const data = await fs.readFile(this.embeddingsFile, 'utf8');
        const embeddingsData = JSON.parse(data);
        this.embeddings = embeddingsData.embeddings;
        this.chunks = embeddingsData.chunks;
        console.log(`✅ Loaded ${this.embeddings.length} embeddings from cache`);
        return;
      } catch (error) {
        console.log('📝 No cached embeddings found, generating new ones...');
      }

      // Generate new embeddings
      await this.generateEmbeddings();
      
    } catch (error) {
      console.error('❌ Error loading embeddings data:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings from regional sales documentation
   */
  async generateEmbeddings() {
    try {
      console.log('🔄 Generating embeddings for regional sales knowledge base...');
      
      // Read the knowledge base file
      const knowledgeFile = path.join(__dirname, 'regional_sales_explanations.txt');
      const content = await fs.readFile(knowledgeFile, 'utf8');
      
      // Split content into chunks
      this.chunks = this.splitIntoChunks(content, 500, 50);
      console.log(`📄 Split knowledge base into ${this.chunks.length} chunks`);
      
      // Generate embeddings for each chunk
      const model = this.genAI.getGenerativeModel({ model: 'models/embedding-001' });
      this.embeddings = [];
      
      for (let i = 0; i < this.chunks.length; i++) {
        try {
          const result = await model.embedContent(this.chunks[i]);
          this.embeddings.push(result.embedding.values);
          
          if ((i + 1) % 10 === 0) {
            console.log(`⏳ Generated ${i + 1}/${this.chunks.length} embeddings`);
          }
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Error generating embedding for chunk ${i}:`, error);
          // Use zero vector as fallback
          this.embeddings.push(new Array(768).fill(0));
        }
      }
      
      // Save embeddings to file
      const embeddingsData = {
        embeddings: this.embeddings,
        chunks: this.chunks,
        generated: new Date().toISOString()
      };
      
      await fs.writeFile(this.embeddingsFile, JSON.stringify(embeddingsData, null, 2));
      console.log('💾 Saved embeddings to cache file');
      
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw error;
    }
  }

  /**
   * Split text into overlapping chunks
   */
  splitIntoChunks(text, chunkSize = 500, overlap = 50) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      if ((currentChunk + trimmedSentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Create overlap by keeping last part of current chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + trimmedSentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Retrieve relevant context for a user query
   */
  async retrieveRelevantContext(query, topK = 3) {
    try {
      if (this.embeddings.length === 0) {
        console.log('⚠️ No embeddings available, returning empty context');
        return '';
      }
      
      // Generate embedding for the query
      const model = this.genAI.getGenerativeModel({ model: 'models/embedding-001' });
      const queryResult = await model.embedContent(query);
      const queryEmbedding = queryResult.embedding.values;
      
      // Calculate similarities
      const similarities = this.embeddings.map((embedding, index) => ({
        index,
        similarity: this.cosineSimilarity(queryEmbedding, embedding),
        chunk: this.chunks[index]
      }));
      
      // Sort by similarity and get top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topResults = similarities.slice(0, topK);
      
      // Combine relevant chunks
      const relevantContext = topResults
        .filter(result => result.similarity > 0.3) // Filter out low similarity results
        .map(result => result.chunk)
        .join('\n\n');
      
      console.log(`🔍 Retrieved ${topResults.length} relevant context chunks`);
      return relevantContext;
      
    } catch (error) {
      console.error('❌ Error retrieving relevant context:', error);
      return '';
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get embedding statistics
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      totalEmbeddings: this.embeddings.length,
      avgChunkLength: this.chunks.reduce((sum, chunk) => sum + chunk.length, 0) / this.chunks.length
    };
  }
}

export default RegionalSalesRetriever;