/**
 * Embedder for Regional Sales Knowledge Base
 * Handles text processing and embedding generation for the knowledge base
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

class RegionalSalesEmbedder {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'models/embedding-001' });
  }

  /**
   * Process knowledge base file and generate embeddings
   */
  async processKnowledgeBase(filePath, outputPath) {
    try {
      console.log('📚 Processing Regional Sales knowledge base...');
      
      // Read the knowledge base file
      const content = await fs.readFile(filePath, 'utf8');
      console.log(`📄 Loaded knowledge base: ${Math.round(content.length / 1024)}KB`);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(content, 500, 50);
      console.log(`🔄 Split into ${chunks.length} chunks`);
      
      // Generate embeddings
      const embeddings = [];
      const batchSize = 5;
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(`⏳ Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
        
        const batchEmbeddings = await Promise.all(
          batch.map(async (chunk, index) => {
            try {
              const result = await this.model.embedContent(chunk);
              return result.embedding.values;
            } catch (error) {
              console.error(`❌ Error embedding chunk ${i + index}:`, error);
              return new Array(768).fill(0); // Fallback zero vector
            }
          })
        );
        
        embeddings.push(...batchEmbeddings);
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Save embeddings
      const embeddingsData = {
        chunks,
        embeddings,
        metadata: {
          totalChunks: chunks.length,
          totalEmbeddings: embeddings.length,
          avgChunkLength: chunks.reduce((sum, chunk) => sum + chunk.length, 0) / chunks.length,
          generated: new Date().toISOString(),
          model: 'models/embedding-001'
        }
      };
      
      await fs.writeFile(outputPath, JSON.stringify(embeddingsData, null, 2));
      console.log(`💾 Saved embeddings to: ${outputPath}`);
      
      return embeddingsData;
      
    } catch (error) {
      console.error('❌ Error processing knowledge base:', error);
      throw error;
    }
  }

  /**
   * Split text into overlapping chunks
   */
  splitIntoChunks(text, chunkSize = 500, overlap = 50) {
    // Split by sections first (double newlines)
    const sections = text.split(/\n\s*\n/).filter(s => s.trim().length > 0);
    const chunks = [];
    
    for (const section of sections) {
      // If section is small enough, use as single chunk
      if (section.length <= chunkSize) {
        chunks.push(section.trim());
        continue;
      }
      
      // Split large sections by sentences
      const sentences = section.split(/[.!?]+/).filter(s => s.trim().length > 0);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;
        
        // Check if adding this sentence would exceed chunk size
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
      
      // Add remaining chunk
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }
    
    return chunks;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text) {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      return new Array(768).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  cosineSimilarity(embedding1, embedding2) {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Find most similar chunks to a query
   */
  async findSimilarChunks(queryEmbedding, embeddingsData, topK = 3, threshold = 0.3) {
    const similarities = embeddingsData.embeddings.map((embedding, index) => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
      chunk: embeddingsData.chunks[index]
    }));
    
    // Sort by similarity and filter by threshold
    const results = similarities
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    return results;
  }
}

export default RegionalSalesEmbedder;