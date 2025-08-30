/**
 * Chatbot Module - Main orchestrator for intent detection and response generation
 * Integrates RAG retrieval and database queries with Gemini API
 */

console.log('🔥 CHATBOT.JS FILE LOADED - DEBUG VERSION');

import { GoogleGenerativeAI } from '@google/generative-ai';
import Retriever from './retriever.js';
import DatabaseManager from './db.js';

class IntelligentChatbot {
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
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('🤖 Initializing Intelligent Chatbot...');
      
      // Connect to database
      await this.db.connect();
      
      // Load embeddings data
      await this.retriever.loadEmbeddingsData();
      
      if (!(process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true')) console.log('✅ Chatbot initialized successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize chatbot:', error);
      throw error;
    }
  }

  /**
   * Detect if a question requires database query or UI explanation
   */
  detectIntent(question) {
    const lowerQuestion = question.toLowerCase();

    // Special handling for KPI tile queries: definition vs status/value
    const isKpiMention = (lowerQuestion.includes('kpi') && lowerQuestion.includes('tile')) || lowerQuestion.includes('kpi tiles');
    const wantsStatus = /(status|current|value|how many|count|number|show|current value|what's the value|what is the value)/.test(lowerQuestion);
    const wantsDefinition = /(what is|explain|meaning|purpose|describe|definition)/.test(lowerQuestion);
    if (isKpiMention) {
      if (wantsDefinition && !wantsStatus) return 'ui_explanation';
      if (wantsStatus) return 'data_query';
    }
    
    // Data query indicators
    const dataKeywords = [
      'how many', 'count', 'total', 'average', 'sum', 'maximum', 'minimum',
      'list customers', 'show customers', 'find customers', 'search customers',
      'customers with', 'customers who', 'customers that',
      'top customers', 'best customers', 'worst customers',
      'high engagement customers', 'medium engagement customers', 'low engagement customers',
      'at risk', 'churning', 'inactive customers',
      'revenue', 'sales', 'transactions', 'purchases',
      'frequency', 'recency', 'monetary', 'rfm',
      'last activity', 'days since', 'recent activity'
    ];
    
    // UI/Dashboard explanation indicators
    const uiKeywords = [
      'what is', 'what are', 'explain', 'describe', 'define',
      'how does', 'how do', 'what does', 'what do',
      'dashboard', 'interface', 'ui', 'user interface',
      'kpi', 'metrics', 'tiles', 'charts', 'graphs',
      'engagement pyramid', 'scoring system', 'calculation',
      'filters', 'search', 'features', 'functionality',
      'help', 'guide', 'tutorial', 'instructions'
    ];
    
    // Check for data query intent
    const hasDataKeywords = dataKeywords.some(keyword => lowerQuestion.includes(keyword));
    const hasUIKeywords = uiKeywords.some(keyword => lowerQuestion.includes(keyword));
    
    // Specific patterns for data queries
    const dataPatterns = [
      /how many.*customers/,
      /count.*customers/,
      /total.*customers/,
      /average.*score/,
      /customers.*engagement.*level/,
      /list.*customers/,
      /show.*customers/,
      /find.*customers/
    ];
    
    const hasDataPattern = dataPatterns.some(pattern => pattern.test(lowerQuestion));
    
    // Special handling for definition questions about engagement levels
    const isDefinitionQuestion = /^(what is|what are|explain|describe|define)\s+(low|medium|high)?\s*(engagement|customers)/i.test(question);
    if (isDefinitionQuestion) {
      return 'ui_explanation';
    }
    
    // Decision logic
    if (hasDataPattern || (hasDataKeywords && !hasUIKeywords)) {
      return 'data_query';
    } else if (hasUIKeywords || lowerQuestion.includes('dashboard')) {
      return 'ui_explanation';
    } else {
      // Default to UI explanation for ambiguous cases
      return 'ui_explanation';
    }
  }

  /**
   * Generate SQL query based on user question
   */
  generateSQLQuery(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Common query patterns
    if (lowerQuestion.includes('how many') && lowerQuestion.includes('customers')) {
      if (lowerQuestion.includes('high engagement')) {
        return "SELECT COUNT(*) as count FROM dbo_D_Customer WHERE engagement_level = 'High'";
      } else if (lowerQuestion.includes('medium engagement')) {
        return "SELECT COUNT(*) as count FROM dbo_D_Customer WHERE engagement_level = 'Medium'";
      } else if (lowerQuestion.includes('low engagement')) {
        return "SELECT COUNT(*) as count FROM dbo_D_Customer WHERE engagement_level = 'Low'";
      } else {
        return "SELECT COUNT(*) as total_customers FROM dbo_D_Customer";
      }
    }
    
    if (lowerQuestion.includes('average') && lowerQuestion.includes('engagement')) {
      return "SELECT AVG(engagement_score) as average_engagement_score FROM dbo_D_Customer";
    }
    
    if (lowerQuestion.includes('average') && lowerQuestion.includes('frequency')) {
      if (lowerQuestion.includes('high engagement')) {
        return "SELECT AVG(total_transactions) as avg_frequency FROM dbo_D_Customer WHERE engagement_level = 'High'";
      } else if (lowerQuestion.includes('medium engagement')) {
        return "SELECT AVG(total_transactions) as avg_frequency FROM dbo_D_Customer WHERE engagement_level = 'Medium'";
      } else if (lowerQuestion.includes('low engagement')) {
        return "SELECT AVG(total_transactions) as avg_frequency FROM dbo_D_Customer WHERE engagement_level = 'Low'";
      }
    }
    
    if (lowerQuestion.includes('top') && lowerQuestion.includes('customers')) {
      const limit = this.extractNumber(question) || 10;
      return `SELECT customer_name, engagement_score, engagement_level FROM dbo_D_Customer ORDER BY engagement_score DESC LIMIT ${limit}`;
    }
    
    if (lowerQuestion.includes('at risk') || lowerQuestion.includes('churning')) {
      return "SELECT customer_name, engagement_score, last_activity_date FROM dbo_D_Customer WHERE engagement_level = 'Low' ORDER BY engagement_score ASC LIMIT 10";
    }
    
    if (lowerQuestion.includes('inactive')) {
      return `
        SELECT customer_name, engagement_score, last_activity_date,
               julianday('now') - julianday(last_activity_date) as days_inactive
        FROM dbo_D_Customer 
        WHERE last_activity_date IS NOT NULL
        ORDER BY days_inactive DESC 
        LIMIT 10
      `;
    }
    
    if (lowerQuestion.includes('revenue') || lowerQuestion.includes('spent')) {
      if (lowerQuestion.includes('total')) {
        return "SELECT SUM(total_spent) as total_revenue FROM dbo_D_Customer";
      } else if (lowerQuestion.includes('average')) {
        return "SELECT AVG(total_spent) as average_revenue FROM dbo_D_Customer WHERE total_spent > 0";
      } else if (lowerQuestion.includes('high engagement')) {
        return "SELECT SUM(total_spent) as revenue FROM dbo_D_Customer WHERE engagement_level = 'High'";
      }
    }
    
    // Default query for customer data
    return "SELECT engagement_level, COUNT(*) as count FROM dbo_D_Customer GROUP BY engagement_level";
  }

  /**
   * Extract numbers from text (for LIMIT clauses, etc.)
   */
  extractNumber(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  /**
   * Handle data queries by executing SQL and formatting results
   */
  async handleDataQuery(question, mode = 'detailed') {
    try {
      console.log(`📊 Handling data query: "${question}"`);
      
      // Generate SQL query
      const sqlQuery = this.generateSQLQuery(question);
      console.log(`Generated SQL: ${sqlQuery}`);
      
      // Execute query
      const results = await this.db.query(sqlQuery);
      
      // Format results for AI
      const formattedResults = this.db.formatResultsForAI(results, 'stats');
      
      // Create prompt for Gemini based on mode
      const modeDirectives = {
        talk: `
Respond with a short conversational summary. 
- Maximum 6 lines total
- Be concise and direct
- Focus only on the most important information
- Use simple language
- Avoid detailed explanations
`,
        insights: `
CRITICAL: You MUST format your response as a proper bulleted or numbered list.
- Use bullet points (•) or numbers (1., 2., 3.) for each action item
- Each point should be on a separate line
- Maximum 15 lines total
- Focus on practical actions and outcomes
- Include metrics where relevant
- Prioritize retention and growth strategies
- Start each bullet point with an action verb (e.g., "Implement", "Create", "Monitor", "Analyze")
- Format example:
  • Action 1: Description with specific details
  • Action 2: Description with metrics or targets
  • Action 3: Implementation steps

FORMATTING REQUIREMENTS:
- Use bullet points (•) or numbered lists (1., 2., 3.)
- Each action item on a new line
- No paragraph text - only structured lists
`,
        detailed: `
Provide a comprehensive explanation with proper structure and formatting.
- Use clear headings with ** for emphasis
- Break information into logical sections
- Use bullet points (•) for lists within sections
- Include detailed context and background
- Explain metrics and calculations
- Provide examples where helpful
- Include implementation details
- Format with proper line breaks and structure
- Use numbered lists (1., 2., 3.) for sequential steps
- Use bullet points (•) for feature lists or characteristics
`
      };

      const prompt = `
You are an assistant for a Customer Engagement Classifier Dashboard. 
Always ground your answers in the retrieved data from the database.

CRITICAL FORMATTING INSTRUCTIONS:
- **Talk** → 3–6 concise lines only. No more than 6 lines.
- **Detailed** → 10–15 lines with headings (**Section**), lists (• or 1.), and context.
- **Insights** → MUST use bullet points (•) or numbered lists (1., 2., 3.) - NO paragraph text allowed!

A user asked: "${question}"
Selected Filter: ${mode}

Here are the query results from the customer database:
${formattedResults}

STRICT FORMATTING REQUIREMENTS FOR ${mode.toUpperCase()} MODE:
${modeDirectives[mode] || modeDirectives.detailed}

Remember: For TALK, cap at 6 lines. For DETAILED, produce 10–15 lines. For INSIGHTS, use only bullet or numbered lists.
`;

      // Get AI response with fallback for API key issues
      let response;
      try {
        const result = await this.model.generateContent(prompt);
        response = result.response.text();
      } catch (apiError) {
        console.warn('Gemini API error, using fallback response:', apiError.message);
        
        // Generate a fallback response based on the query results
        if (results && results.length > 0) {
          const count = results.length;
          const sample = results.slice(0, 3);
          response = `📊 Query Results (${count} records found)\n\n` +
                    sample.map((row, i) => `${i + 1}. ${Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(', ')}`).join('\n') +
                    (count > 3 ? `\n... and ${count - 3} more records` : '');
        } else {
          response = `📊 Database query completed successfully, but no matching records were found for your criteria.`;
        }
      }
      
      return {
        type: 'data_query',
        sqlQuery: sqlQuery,
        rawResults: results,
        response: response
      };
      
    } catch (error) {
      console.error('Error handling data query:', error);
      return {
        type: 'error',
        response: `I apologize, but I encountered an error while querying the database: ${error.message}. Please try rephrasing your question or ask about dashboard features instead.`
      };
    }
  }

  /**
   * Handle UI explanation queries using RAG
   */
  async handleUIQuery(question, mode = 'detailed', options = {}) {
    try {
      const { tag = null } = options;
      console.log(`🎨 Handling UI query: "${question}" tag=${tag || 'none'}`);
      
      // Search for relevant documentation with optional tag filter
      const searchResults = await this.retriever.intelligentSearch(question, 3, { tag });
      
      // Format context from search results
      const context = this.retriever.formatSearchResults(searchResults, 1500);
      
      // Deterministic definitions for common dashboard concepts & KPIs
      const lowerQ = question.toLowerCase();

      const enforceLineBounds = (text, mmode) => {
        if (!text) return text;
        const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
        if (mmode === 'talk') {
          if (lines.length > 6) return lines.slice(0, 6).join('\n');
          if (lines.length < 3) {
            // Try splitting sentences to reach at least 3
            const expanded = lines.join(' ').split(/(?<=[.!?])\s+/).filter(Boolean);
            return expanded.slice(0, Math.max(3, Math.min(6, expanded.length))).join('\n');
          }
          return lines.join('\n');
        }
        if (mmode === 'detailed') {
          let out = lines;
          if (out.length < 10) {
            // Expand by splitting sentences and preserving headings
            const headPreserve = out.filter(l => /^\*\*.+\*\*$|^#/.test(l));
            const rest = out.filter(l => !/^\*\*.+\*\*$|^#/.test(l)).join(' ');
            const expanded = rest.split(/(?<=[.!?])\s+/).filter(Boolean);
            out = [...headPreserve, ...expanded];
          }
          if (out.length > 15) out = out.slice(0, 15);
          if (out.length < 10) out = out.concat(Array(10 - out.length).fill(''));
          return out.slice(0, 15).join('\n');
        }
        // insights: keep as-is; UI formatter already enforces bullets
        return text;
      };

      const kpiNameMatch = (s) => {
        const names = [
          'total customers', 'avg engagement score', 'average engagement score',
          'avg days since activity', 'average days since activity',
          're-engagement opportunities', 'reengagement opportunities'
        ];
        return names.some(n => s.includes(n));
      };

      const buildKpiDefinition = (mmode) => {
        // Identify target KPI
        let k = 'Total Customers';
        if (lowerQ.includes('avg engagement')) k = 'Average Engagement Score';
        else if (lowerQ.includes('days since')) k = 'Average Days Since Activity';
        else if (lowerQ.includes('re-engagement') || lowerQ.includes('reengagement')) k = 'Re-engagement Opportunities';

        const talk = [
          `${k} shows a summary measure on the dashboard, not a raw list.`,
          k === 'Total Customers' ? 'It counts all customers in scope after filters.' : '',
          k === 'Average Engagement Score' ? 'It averages your customers’ engagement score (e.g., RFM-derived).' : '',
          k === 'Average Days Since Activity' ? 'It averages days since last activity to show recency.' : '',
          k === 'Re-engagement Opportunities' ? 'It estimates how many customers are close to returning with light nudges.' : '',
          'Use filters to focus the KPI on segments of interest.'
        ].filter(Boolean).slice(0, 6).join('\n');

        const detailed = [
          `**What ${k} Represents**`,
          k === 'Total Customers' ? '• Count of unique customers matching current filters.' : '',
          k === 'Average Engagement Score' ? '• Mean of engagement scores across filtered customers.' : '',
          k === 'Average Days Since Activity' ? '• Mean days since the last recorded activity for filtered customers.' : '',
          k === 'Re-engagement Opportunities' ? '• Estimated number of customers likely to re-engage with targeted outreach.' : '',
          '',
          '**How It’s Calculated**',
          k === 'Total Customers' ? '• Simple COUNT(*) of customers.' : '• Aggregated from per-customer values (e.g., AVG).',
          '• Applies current filters (segment, date ranges, cohorts).',
          '',
          '**How To Use It**',
          k === 'Total Customers' ? '1. Validate data scope after applying filters.' : '1. Track trend over time to gauge movement.',
          '2. Compare across segments (e.g., engagement levels).',
          '3. Drill down to cohorts for actions (win-back, upsell).'
        ].filter(Boolean).join('\n');

        return mmode === 'talk' ? enforceLineBounds(talk, 'talk') : enforceLineBounds(detailed, 'detailed');
      };

      const buildLowEngagementDefinition = (mmode) => {
        const talk = [
          'Low‑engagement customers show little recent activity and low response.',
          'They typically have low scores (≈1–4), few purchases, and 90+ days since activity.',
          'They’re at higher churn risk and need gentle, personalized nudges.'
        ].join('\n');

        const insights = [
          '• Who they are: minimal recent activity, weak interaction signals, lower scores (≈1–4)',
          '• Risk: higher churn likelihood if ignored; recoverable value with targeted offers',
          '• Actions:',
          '  - Win‑back campaigns with small, timely incentives',
          '  - Personalize content based on last known interest',
          '  - Reduce friction with clear quick‑win paths back'
        ].join('\n');

        const detailed = [
          '**Who Are Low‑Engagement Customers**',
          '• Minimal recent activity and weak interaction signals',
          '• Lower engagement scores (about 1–4 out of 10)',
          '• Longer inactivity windows (often 90+ days)',
          '• Fewer purchases and low purchase frequency',
          '• Lower response to campaigns compared to other segments',
          '',
          '**Why They Matter**',
          '• Higher likelihood of churn if ignored',
          '• Often contain recoverable value at lower CAC with the right offers',
          '',
          '**What To Do**',
          '1. Send win‑back campaigns with small, timely incentives',
          '2. Personalize content based on last known interest',
          '3. Reduce friction: highlight quick‑win actions and easy paths back'
        ].join('\n');

        if (mmode === 'talk') return enforceLineBounds(talk, 'talk');
        if (mmode === 'insights') return insights;
        return enforceLineBounds(detailed, 'detailed');
      };

      // If the user asks a definitional KPI question, return definition (not status)
      const isKpiDefAsk = (lowerQ.includes('kpi') || kpiNameMatch(lowerQ)) && /(what is|explain|meaning|purpose|describe|definition)/.test(lowerQ);
      const isLowEngDefAsk =
        /(who|what)\s+(are|is)\s+low\s*-?\s*engagement(?:\s+customers?)?/i.test(lowerQ) ||
        /(define|definition|meaning|explain|describe)\s+low\s*-?\s*engagement(?:\s+customers?)?/i.test(lowerQ);

      if (isKpiDefAsk) {
        const text = buildKpiDefinition(mode);
        return {
          type: 'ui_explanation',
          searchResults: searchResults,
          context: context,
          response: text
        };
      }

      if (isLowEngDefAsk) {
        const text = buildLowEngagementDefinition(mode);
        return {
          type: 'ui_explanation',
          searchResults: searchResults,
          context: context,
          response: text
        };
      }

      // Create prompt for Gemini based on mode
      const modeDirectives = {
        talk: `
Respond with a short conversational summary. 
- Maximum 6 lines total
- Be concise and direct
- Focus only on the most important information
- Use simple language
- Avoid detailed explanations
`,
        insights: `
CRITICAL: You MUST format your response as a proper bulleted or numbered list.
- Use bullet points (•) or numbers (1., 2., 3.) for each action item
- Each point should be on a separate line
- Maximum 15 lines total
- Focus on practical actions and outcomes
- Include metrics where relevant
- Prioritize retention and growth strategies
- Start each bullet point with an action verb (e.g., "Implement", "Create", "Monitor", "Analyze")
- Format example:
  • Action 1: Description with specific details
  • Action 2: Description with metrics or targets
  • Action 3: Implementation steps

FORMATTING REQUIREMENTS:
- Use bullet points (•) or numbered lists (1., 2., 3.)
- Each action item on a new line
- No paragraph text - only structured lists
`,
        detailed: `
Provide a comprehensive explanation with proper structure and formatting.
- Use clear headings with ** for emphasis
- Break information into logical sections
- Use bullet points (•) for lists within sections
- Include detailed context and background
- Explain metrics and calculations
- Provide examples where helpful
- Include implementation details
- Format with proper line breaks and structure
- Use numbered lists (1., 2., 3.) for sequential steps
- Use bullet points (•) for feature lists or characteristics
`
      };

      const prompt = `
You are an assistant for a Customer Engagement Classifier Dashboard. 
Always ground your answers in the retrieved context from the knowledge base.

CRITICAL FORMATTING INSTRUCTIONS:
- **Talk** → 3–6 concise lines only. No more than 6 lines.
- **Detailed** → 10–15 lines with headings (**Section**), lists (• or 1.), and context.
- **Insights** → MUST use bullet points (•) or numbered lists (1., 2., 3.) - NO paragraph text allowed!

A user asked: "${question}"
Selected Filter: ${mode}

Here is relevant information from the dashboard documentation:
${context}

STRICT FORMATTING REQUIREMENTS FOR ${mode.toUpperCase()} MODE:
${modeDirectives[mode] || modeDirectives.detailed}

Remember: For TALK, cap at 6 lines. For DETAILED, produce 10–15 lines. For INSIGHTS, use only bullet or numbered lists.
`;

      // Get AI response with fallback for API key issues
      let response;
      try {
        const result = await this.model.generateContent(prompt);
        response = result.response.text();
        response = enforceLineBounds(response, mode);
      } catch (apiError) {
        console.warn('Gemini API error, using fallback response:', apiError.message);
        
        // Generate intelligent response using actual database data (like frontend does)
        response = await this.generateDataBasedResponse(question, mode);
        response = enforceLineBounds(response, mode);
      }
      
      return {
        type: 'ui_explanation',
        searchResults: searchResults,
        context: context,
        response: response
      };
      
    } catch (error) {
      console.error('Error handling UI query:', error);
      return {
        type: 'error',
        response: `I apologize, but I encountered an error while searching the documentation: ${error.message}. Please try asking your question in a different way.`
      };
    }
  }

  /**
   * Generate intelligent response using actual database data (like frontend does)
   */
  async generateDataBasedResponse(question, mode = 'detailed') {
    try {
      const q = (question || '').toLowerCase();
      
      // Get actual dashboard data from database (safe: don't throw on failures)
      const kpisQuery = `
        SELECT 
          COUNT(*) as total_customers,
          ROUND(AVG(engagement_score), 1) as avg_engagement_score,
          ROUND(AVG(julianday('now') - julianday(last_activity_date)), 1) as avg_days_since_activity
        FROM dbo_D_Customer
      `;
      
      const distributionQuery = `
        SELECT 
          engagement_level,
          COUNT(*) as customer_count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo_D_Customer), 1) as percentage
        FROM dbo_D_Customer 
        GROUP BY engagement_level
      `;
      
      let kpisResult = [];
      let distributionResult = [];
      try {
        kpisResult = await this.db.query(kpisQuery);
      } catch (e) {
        console.warn('kpisQuery failed:', e?.message || e);
      }
      try {
        distributionResult = await this.db.query(distributionQuery);
      } catch (e) {
        console.warn('distributionQuery failed:', e?.message || e);
      }
      
      const kpis = kpisResult[0] || {};
      const distribution = Array.isArray(distributionResult) ? distributionResult : [];
      
      // Deterministic answers using data when available
      if (q.includes('kpi') || q.includes('metrics')) {
        return [
          `Total Customers: ${kpis.total_customers ?? 'N/A'}`,
          `Avg Engagement Score: ${kpis.avg_engagement_score ?? 'N/A'}`,
          `Avg Days Since Activity: ${kpis.avg_days_since_activity ?? 'N/A'}`,
        ].join('\n');
      }

      if (q.includes('high engagement')) {
        const high = distribution.find(d => d.engagement_level === 'High');
        if (high) return `High engagement customers: ${high.customer_count} (${high.percentage}%). Focus on loyalty perks and advocacy.`;
        return `High‑engagement customers show strong recent activity and response. Use loyalty perks and advocacy programs.`;
      }

      if (q.includes('medium engagement')) {
        const med = distribution.find(d => d.engagement_level === 'Medium');
        if (med) return `Medium engagement customers: ${med.customer_count} (${med.percentage}%). Target with personalized nudges to lift to High.`;
        return `Medium‑engagement customers are active but inconsistent. Personalize nudges to lift them to High.`;
      }

      if (q.includes('low engagement') || q.includes('churn')) {
        const low = distribution.find(d => d.engagement_level === 'Low');
        if (low) return `Low engagement customers: ${low.customer_count} (${low.percentage}%). Win‑back: offers, direct outreach, and feedback loops.`;
        return `Low‑engagement customers show little recent activity and are at higher churn risk. Prioritize win‑back.`;
      }

      if (q.includes('distribution') || q.includes('pyramid')) {
        const parts = distribution.map(d => `${d.engagement_level}: ${d.customer_count} (${d.percentage}%)`);
        return parts.length ? `Engagement distribution — ${parts.join(', ')}.` : `The engagement distribution pyramid segments customers into High, Medium, and Low based on recency (≤30, 31–90, >90 days).`;
      }

      if (q.includes('trend') || q.includes('timeline')) {
        return `Engagement timeline shows activity patterns over time. Watch for dips after campaigns and plan reactivation pushes.`;
      }

      // Default summary with whatever data we have
      return [
        `You have ${kpis.total_customers ?? 'N/A'} customers across high/medium/low engagement segments.`,
        `Use filters to focus segments; Opportunity Finder highlights high‑ROI actions.`,
        `Ask for KPIs, segment breakdowns, or trends for specifics.`,
      ].join('\n');
      
    } catch (error) {
      console.error('Error generating data-based response:', error);
      // Deterministic fallback instead of a generic sentence
      const q = (question || '').toLowerCase();
      if (q.includes('high engagement')) return 'High‑engagement customers have strong recent activity (≤30 days) and response; focus on loyalty perks and advocacy.';
      if (q.includes('low engagement') || q.includes('churn')) return 'Low‑engagement customers show little recent activity (>90 days) and higher churn risk; run win‑back campaigns.';
      if (q.includes('distribution') || q.includes('pyramid')) return 'Engagement distribution (pyramid) segments customers into High (≤30 days), Medium (31–90), and Low (>90) recency tiers.';
      return 'This dashboard segments customers by engagement (High/Medium/Low), provides KPIs, and highlights actions. Ask about KPIs, segments, or trends.';
    }
  }

  /**
   * Main method to process user questions
   */
  async processQuestion(question, mode = 'detailed') {
    try {
      console.log(`\n🤖 Processing question: "${question}"`);

      // Parse mentions via registry (non-destructive to existing .txt logic)
      let tag = null;
      let cleanedQuestion = question || '';
      try {
        const { parseMentions, isValidAgent } = await import('./config/agentRegistry.js');
        const parsed = parseMentions(cleanedQuestion);
        cleanedQuestion = parsed.cleaned;
        const first = parsed.mentions[0];
        if (first) {
          // map shorthand to canonical
          const lower = first.toLowerCase();
          if (lower === 'sales') tag = 'sales_agent';
          else if (lower === 'inventory') tag = 'inventory_agent';
          else if (isValidAgent(lower)) tag = lower;
          console.log(`🏷️ Detected tag: ${tag || 'invalid'} | Cleaned question: "${cleanedQuestion}"`);
        }
      } catch (e) {
        console.warn('Mention parsing unavailable, continuing:', e?.message);
      }

      // Validate mode parameter
      if (!mode || !['talk', 'insights', 'detailed'].includes(mode)) {
        console.warn(`⚠️ Invalid mode provided: "${mode}", defaulting to "detailed"`);
        mode = 'detailed';
      }

      console.log(`🔧 Using response mode: "${mode}"`);
      console.log(`🔍 DEBUG: tag value before routing:`, tag, typeof tag);

      // Add to conversation history
      this.conversationHistory.push({
        type: 'user',
        content: cleanedQuestion,
        timestamp: new Date().toISOString(),
        tag
      });

      // If a valid agent tag is present, route to queryAgent for dashboard answers
      if (tag) {
        console.log('🎯 CHATBOT: Attempting to route to queryAgent for tag:', tag);
        try {
          const { queryAgent } = await import('./agents/queryAgent.js');
          console.log('🎯 CHATBOT: Successfully imported queryAgent, calling it now...');
          // IMPORTANT: Send original question (with @tag) to orchestrator so router can delegate
          const agentResult = await queryAgent(tag, { db: this.db, mode, context: {}, query: question });
          // Persist and return
          this.conversationHistory.push({
            type: 'bot',
            content: agentResult.text,
            metadata: { intent: 'agent', type: 'agent', tag, ...agentResult.metadata },
            timestamp: new Date().toISOString()
          });
          return { type: 'agent', response: agentResult.text, metadata: agentResult.metadata };
        } catch (e) {
          console.error('Agent routing error, falling back:', e);
          // fall through to normal intent routing
        }
      }

      // Detect intent based on cleaned question
      let intent = this.detectIntent(cleanedQuestion);
      console.log(`🎯 Detected intent: ${intent}`);

      // IMPORTANT: If no agent tag, we never hit the DB. Force UI explanation.
      if (!tag && intent === 'data_query') {
        console.log('🛑 No agent tag present — forcing UI explanation to avoid DB.');
        intent = 'ui_explanation';
      }

      let result;

      // Route to appropriate handler with mode
      if (intent === 'data_query') {
        console.log(`📊 Routing to data query handler with mode: ${mode}`);
        result = await this.handleDataQuery(cleanedQuestion, mode);
      } else {
        console.log(`🎨 Routing to UI query handler with mode: ${mode} tag=${tag || 'none'}`);
        result = await this.handleUIQuery(cleanedQuestion, mode, { tag });
      }

      // Add response to conversation history
      this.conversationHistory.push({
        type: 'bot',
        content: result.response,
        metadata: {
          intent: intent,
          type: result.type,
          tag
        },
        timestamp: new Date().toISOString()
      });

      return result;
      
    } catch (error) {
      console.error('Error processing question:', error);
      return {
        type: 'error',
        response: 'I apologize, but I encountered an unexpected error. Please try asking your question again or contact support if the problem persists.'
      };
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
   * Get chatbot statistics
   */
  async getStats() {
    try {
      const dbStats = await this.db.getCustomerStats();
      const embeddingsStats = await this.retriever.getEmbeddingsStats();
      
      return {
        database: dbStats,
        embeddings: embeddingsStats,
        conversation: {
          totalMessages: this.conversationHistory.length,
          userMessages: this.conversationHistory.filter(m => m.type === 'user').length,
          botMessages: this.conversationHistory.filter(m => m.type === 'bot').length
        }
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.db.close();
      console.log('✅ Chatbot cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Test the chatbot with sample questions
   */
  async testChatbot() {
    const testQuestions = [
      // Data queries
      "How many customers do we have?",
      "How many high engagement customers are there?",
      "What's the average engagement score?",
      "Show me the top 5 customers",
      "Which customers are at risk of churning?",
      
      // UI queries
      "What are KPI tiles?",
      "How is engagement score calculated?",
      "What is the engagement pyramid?",
      "How do I use the dashboard filters?",
      "Explain the customer table columns"
    ];

    console.log('🧪 Testing chatbot with sample questions...\n');

    for (const question of testQuestions) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Question: "${question}"`);
      console.log(`${'='.repeat(60)}`);
      
      const result = await this.processQuestion(question);
      
      console.log(`Intent: ${result.type}`);
      console.log(`Response: ${result.response}`);
      
      // Small delay between questions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export default IntelligentChatbot;