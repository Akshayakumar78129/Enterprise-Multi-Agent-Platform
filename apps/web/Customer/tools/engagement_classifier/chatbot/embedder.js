/**
 * Embedder Module - Generates and stores embeddings from dashboard_explanations.txt and agent knowledge
 * Uses Gemini Embedding API to create vector representations of text chunks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Embedder {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "embedding-001" });
    this.chunkSize = 500;
    this.chunkOverlap = 50;
  }

  /**
   * Split text into overlapping chunks for better context preservation
   */
  chunkText(text, chunkSize = this.chunkSize, overlap = this.chunkOverlap) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    let currentSize = 0;
    
    for (const sentence of sentences) {
      const sentenceLength = sentence.trim().length;
      
      // If adding this sentence would exceed chunk size, save current chunk
      if (currentSize + sentenceLength > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          size: currentSize
        });
        
        // Start new chunk with overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5)); // Approximate word overlap
        currentChunk = overlapWords.join(' ') + ' ' + sentence.trim();
        currentSize = currentChunk.length;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
        currentSize = currentChunk.length;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        size: currentSize
      });
    }
    
    return chunks;
  }

  /**
   * Helper to tag and source chunks
   */
  chunkTextWithMeta(text, tag, source) {
    return this.chunkText(text).map(c => ({ ...c, tag, source }));
  }

  /**
   * Generate embeddings for a batch of text chunks
   */
  async generateEmbeddings(textChunks) {
    const embeddings = [];
    
    console.log(`Generating embeddings for ${textChunks.length} chunks...`);
    
    for (let i = 0; i < textChunks.length; i++) {
      try {
        const chunk = textChunks[i];
        console.log(`Processing chunk ${i + 1}/${textChunks.length} (${chunk.size} chars) [tag=${chunk.tag || 'none'} source=${chunk.source || 'n/a'}]`);
        
        const result = await this.model.embedContent(chunk.text);
        const embedding = result.embedding;
        
        embeddings.push({
          id: i,
          text: chunk.text,
          embedding: embedding.values,
          size: chunk.size,
          created_at: new Date().toISOString(),
          tag: chunk.tag || 'general',
          source: chunk.source || 'unknown'
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    return embeddings;
  }

  /**
   * Load and process the dashboard explanations text file
   */
  async loadDashboardExplanations() {
    try {
      const filePath = path.join(__dirname, 'dashboard_explanations.txt');
      const text = await fs.readFile(filePath, 'utf-8');
      
      console.log(`Loaded dashboard explanations: ${text.length} characters`);
      return text;
    } catch (error) {
      console.error('Error loading dashboard explanations:', error);
      throw error;
    }
  }

  /**
   * Load agent knowledge (single file) and duplicate for both sales_agent and inventory_agent
   * For now, we apply the same knowledge to both tags as requested.
   */
  async loadAgentKnowledge() {
    try {
      const filePath = path.join(__dirname, 'agent.txt');
      const text = await fs.readFile(filePath, 'utf-8');
      console.log(`Loaded agent knowledge: ${text.length} characters`);
      return text;
    } catch (error) {
      console.warn('agent.txt not found or unreadable. Proceeding without agent knowledge.');
      return '';
    }
  }

  /**
   * Save embeddings to a JSON file for quick retrieval
   */
  async saveEmbeddings(embeddings, filename = 'embeddings_index.json') {
    try {
      const filePath = path.join(__dirname, filename);
      const data = {
        metadata: {
          total_chunks: embeddings.length,
          chunk_size: this.chunkSize,
          chunk_overlap: this.chunkOverlap,
          model: 'embedding-001',
          created_at: new Date().toISOString(),
          version: '1.1.0',
          notes: 'Includes tagged knowledge from agent.txt for sales_agent and inventory_agent'
        },
        embeddings: embeddings
      };
      
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`Saved ${embeddings.length} embeddings to ${filename}`);
      
      return filePath;
    } catch (error) {
      console.error('Error saving embeddings:', error);
      throw error;
    }
  }

  /**
   * Load existing embeddings from JSON file
   */
  async loadEmbeddings(filename = 'embeddings_index.json') {
    try {
      const filePath = path.join(__dirname, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) {
        console.log(`Loaded ${parsed.embeddings.length} embeddings from ${filename}`);
        console.log(`Created: ${parsed.metadata.created_at}`);
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading embeddings:', error);
      return null;
    }
  }

  /**
   * Main method to create embeddings index
   */
  async createEmbeddingsIndex() {
    try {
      console.log('Starting embeddings generation process...');
      
      // Load the dashboard explanations text
      const dashboardText = await this.loadDashboardExplanations();
      const dashboardChunks = this.chunkTextWithMeta(dashboardText, 'general', 'dashboard_explanations.txt');
      console.log(`Created ${dashboardChunks.length} dashboard text chunks`);
      
      // Load agent knowledge and duplicate for sales_agent and inventory_agent
      const agentText = await this.loadAgentKnowledge();
      let agentChunks = [];
      if (agentText && agentText.trim().length > 0) {
        const salesChunks = this.chunkTextWithMeta(agentText, 'sales_agent', 'agent.txt');
        const inventoryChunks = this.chunkTextWithMeta(agentText, 'inventory_agent', 'agent.txt');
        agentChunks = [...salesChunks, ...inventoryChunks];
        console.log(`Created ${agentChunks.length} agent knowledge chunks (sales + inventory)`);
      }
      
      const allChunks = [...dashboardChunks, ...agentChunks];
      
      // Generate embeddings
      const embeddings = await this.generateEmbeddings(allChunks);
      
      if (embeddings.length === 0) {
        throw new Error('No embeddings were generated successfully');
      }
      
      // Save to file
      const savedPath = await this.saveEmbeddings(embeddings);
      
      console.log('✅ Embeddings index created successfully!');
      console.log(`📁 Saved to: ${savedPath}`);
      console.log(`📊 Total chunks: ${embeddings.length}`);
      console.log(`🔤 Average chunk size: ${Math.round(embeddings.reduce((sum, e) => sum + e.size, 0) / embeddings.length)} characters`);
      
      return embeddings;
      
    } catch (error) {
      console.error('❌ Error creating embeddings index:', error);
      throw error;
    }
  }

  /**
   * Check if embeddings index exists and is recent
   */
  async checkEmbeddingsIndex(maxAgeHours = 24) {
    try {
      const data = await this.loadEmbeddings();
      if (!data) return false;
      
      const createdAt = new Date(data.metadata.created_at);
      const now = new Date();
      const ageHours = (now - createdAt) / (1000 * 60 * 60);
      
      if (ageHours > maxAgeHours) {
        console.log(`Embeddings index is ${Math.round(ageHours)} hours old, consider regenerating`);
        return false;
      }
      
      console.log(`✅ Embeddings index is up to date (${Math.round(ageHours)} hours old)`);
      return true;
      
    } catch (error) {
      return false;
    }
  }
}

export default Embedder;