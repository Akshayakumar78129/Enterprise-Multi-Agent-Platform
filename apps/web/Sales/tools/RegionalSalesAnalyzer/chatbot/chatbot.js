/**
 * Regional Sales Chatbot Module - Main orchestrator for intent detection and response generation
 * Integrates RAG retrieval and database queries with Gemini API for regional sales analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Retriever from './retriever.js';
import DatabaseManager from './db.js';

class RegionalSalesChatbot {
  constructor(apiKey, dbPath = null) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
    
    this.retriever = new Retriever(apiKey);
    this.db = new DatabaseManager(dbPath);
    this.conversationHistory = [];
  }

  /**
   * Initialize the chatbot by connecting to database and loading embeddings
   */
  async initialize() {
    try {
      console.log('🌍 Initializing Regional Sales Chatbot...');
      
      // Connect to database
      await this.db.connect();
      
      // Load embeddings data
      await this.retriever.loadEmbeddingsData();
      
      console.log('✅ Regional Sales Chatbot initialized successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize regional sales chatbot:', error);
      throw error;
    }
  }

  /**
   * Process user query and generate intelligent response
   */
  async processQuery(userQuery, context = {}) {
    try {
      console.log(`🔍 Processing query: "${userQuery}"`);
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userQuery,
        timestamp: new Date(),
        context
      });

      // Detect intent and extract entities
      const intent = await this.detectIntent(userQuery);
      console.log(`🎯 Detected intent: ${intent.type}`);

      // Get relevant context from knowledge base
      const relevantContext = await this.retriever.retrieveRelevantContext(userQuery);
      
      // Get database insights based on intent
      const dbInsights = await this.getDatabaseInsights(intent, context);
      
      // Generate response using Gemini
      const response = await this.generateResponse(userQuery, intent, relevantContext, dbInsights, context);
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        intent: intent.type
      });

      return {
        response,
        intent: intent.type,
        confidence: intent.confidence,
        context: relevantContext,
        dbInsights
      };

    } catch (error) {
      console.error('❌ Error processing query:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Could you please rephrase your question about regional sales performance?",
        intent: 'error',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Detect user intent from query
   */
  async detectIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Regional performance intents
    if (lowerQuery.includes('top region') || lowerQuery.includes('best perform') || lowerQuery.includes('highest sales')) {
      return { type: 'top_regions', confidence: 0.9 };
    }
    
    if (lowerQuery.includes('growth') || lowerQuery.includes('opportunit') || lowerQuery.includes('expand')) {
      return { type: 'growth_opportunities', confidence: 0.9 };
    }
    
    if (lowerQuery.includes('kpi') || lowerQuery.includes('metrics') || lowerQuery.includes('performance')) {
      return { type: 'kpi_analysis', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('concentration') || lowerQuery.includes('market share') || lowerQuery.includes('distribution')) {
      return { type: 'market_concentration', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('time series') || lowerQuery.includes('seasonal')) {
      return { type: 'trend_analysis', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('coverage') || lowerQuery.includes('geographic') || lowerQuery.includes('countries')) {
      return { type: 'geographic_coverage', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('compare') || lowerQuery.includes('benchmark') || lowerQuery.includes('vs')) {
      return { type: 'regional_comparison', confidence: 0.8 };
    }
    
    if (lowerQuery.includes('strategy') || lowerQuery.includes('recommend') || lowerQuery.includes('should')) {
      return { type: 'strategic_advice', confidence: 0.7 };
    }
    
    // Default to general analysis
    return { type: 'general_analysis', confidence: 0.5 };
  }

  /**
   * Get database insights based on detected intent
   */
  async getDatabaseInsights(intent, context) {
    try {
      const insights = {};
      
      switch (intent.type) {
        case 'top_regions':
          insights.topRegions = await this.db.getTopRegions(5);
          insights.regionalRankings = await this.db.getRegionalRankings();
          break;
          
        case 'growth_opportunities':
          insights.opportunities = await this.db.getGrowthOpportunities();
          insights.underperformingRegions = await this.db.getUnderperformingRegions();
          break;
          
        case 'kpi_analysis':
          insights.kpis = await this.db.getRegionalKPIs();
          insights.summary = await this.db.getRegionalSummary();
          break;
          
        case 'market_concentration':
          insights.concentration = await this.db.getMarketConcentration();
          insights.distribution = await this.db.getRegionalDistribution();
          break;
          
        case 'trend_analysis':
          insights.trends = await this.db.getRegionalTrends();
          insights.seasonality = await this.db.getSeasonalPatterns();
          break;
          
        case 'geographic_coverage':
          insights.coverage = await this.db.getGeographicCoverage();
          insights.expansion = await this.db.getExpansionOpportunities();
          break;
          
        case 'regional_comparison':
          insights.comparison = await this.db.getRegionalComparison();
          insights.benchmarks = await this.db.getPerformanceBenchmarks();
          break;
          
        default:
          insights.overview = await this.db.getRegionalOverview();
          insights.highlights = await this.db.getKeyHighlights();
      }
      
      return insights;
      
    } catch (error) {
      console.error('❌ Error getting database insights:', error);
      return {};
    }
  }

  /**
   * Generate response using Gemini AI
   */
  async generateResponse(userQuery, intent, relevantContext, dbInsights, context) {
    const mode = (context && context.responseMode) || 'detailed';

    const modeGuidance =
      mode === 'talk'
        ? `Format: 6-7 lines, each line a concise sentence on a new line. Keep it conversational.`
        : mode === 'insights'
          ? `Format: bullet list with clear, actionable points (prefix each with "• ").`
          : `Format: 12-15 lines, each line a focused point on a new line. Provide specifics and brief rationale.`;

    const systemPrompt = `You are an expert Regional Sales Analyst AI assistant. You help users understand their regional sales performance, identify growth opportunities, and provide strategic recommendations.

CONTEXT:
- User Query: ${userQuery}
- Intent: ${intent.type}
- Dashboard Context: ${JSON.stringify(context, null, 2)}
- Database Insights: ${JSON.stringify(dbInsights, null, 2)}
- Knowledge Base Context: ${relevantContext}

CONVERSATION HISTORY:
${this.conversationHistory.slice(-4).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

RESPONSE GUIDELINES:
1. Be conversational and professional
2. Use specific data from database insights when available
3. Provide actionable recommendations
4. Use emojis appropriately (🌍 📊 🚀 💡 🏆)
5. Keep responses concise but informative (max 300 words)
6. Reference specific regions, numbers, and metrics
7. Suggest follow-up questions or actions
8. ${modeGuidance}

REGIONAL SALES EXPERTISE:
- Analyze sales performance across geographic regions
- Identify top-performing and underperforming markets
- Spot growth opportunities and expansion potential
- Understand seasonal trends and regional patterns
- Provide strategic recommendations for market development
- Compare regional metrics and benchmarks
- Assess market concentration and diversification needs

Generate a helpful, data-driven response:`;

    const clampLines = (text, min, max) => {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= min && lines.length <= max) return lines.join('\n');
      // If too long, trim
      if (lines.length > max) return lines.slice(0, max).join('\n');
      // If too short, try splitting sentences to increase lines
      const sentences = text
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
      const out = [];
      for (let s of sentences) {
        if (out.length >= max) break;
        out.push(s);
      }
      while (out.length < min) out.push('');
      return out.slice(0, max).join('\n').trim();
    };

    try {
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      let text = await response.text();

      if (mode === 'talk') {
        text = clampLines(text, 6, 7);
      } else if (mode === 'detailed') {
        text = clampLines(text, 12, 15);
      } else if (mode === 'insights') {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        text = lines.map(l => (l.startsWith('•') ? l : `• ${l}`)).join('\n');
      }

      return text;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      return this.getFallbackResponse(intent.type, dbInsights);
    }
  }

  /**
   * Fallback response when Gemini API fails
   */
  getFallbackResponse(intentType, dbInsights) {
    switch (intentType) {
      case 'top_regions':
        return `🏆 Based on your regional sales data, I can help you identify your top-performing regions. ${dbInsights.topRegions ? `Your leading regions are showing strong performance.` : 'Let me analyze your regional performance data.'} Would you like me to dive deeper into specific regional metrics?`;
        
      case 'growth_opportunities':
        return `🚀 I can help you identify growth opportunities across your regions. ${dbInsights.opportunities ? `There are several regions with expansion potential.` : 'Let me analyze your market expansion possibilities.'} Would you like to explore specific opportunity regions?`;
        
      case 'kpi_analysis':
        return `📊 Your regional KPIs provide valuable insights into sales performance. ${dbInsights.kpis ? `I can break down the key metrics for you.` : 'Let me analyze your regional performance indicators.'} Which specific KPI would you like to explore?`;
        
      default:
        return `🌍 I'm here to help you analyze your regional sales performance. I can provide insights on top regions, growth opportunities, market trends, and strategic recommendations. What specific aspect of your regional sales would you like to explore?`;
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

export default RegionalSalesChatbot;