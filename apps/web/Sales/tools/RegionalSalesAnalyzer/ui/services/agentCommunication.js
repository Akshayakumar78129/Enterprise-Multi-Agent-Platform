/**
 * Agent Communication Service for Regional Sales
 * Handles agent queries via backend orchestrator (port 5000)
 * Matches functionality with churn dashboard
 */

/**
 * Query a specific agent through the backend orchestrator
 * @param {string} agentName - Name of the agent to query
 * @param {string} query - The user's query
 * @param {object} context - Dashboard context
 * @param {string} sessionId - Session identifier
 * @returns {Promise} - Agent response via SSE
 */
export const queryAgent = async (agentName, query, context, sessionId) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
  const endpoint = `${backendUrl}/run_sse`;
  
  console.log('🌐 QueryAgent called:', {
    endpoint,
    agentName,
    query: query.substring(0, 100),
    hasContext: !!context
  });

  // Format query with @mention prefix (same as churn)
  const formattedQuery = `@${agentName} ${query}`;
  
  // Create payload matching backend expectations
  const payload = {
    user_query: formattedQuery,
    session_id: sessionId || 'regional-sales-session',
    user_id: context?.user_id || 'regional_analyst',
    app_name: 'regional_sales_analyzer',
    is_canvas: false,
    context: {
      dashboard: 'regional-sales',
      regions: context?.regions,
      metric: context?.metric,
      dateRange: context?.dateRange,
      filters: context?.filters,
      contextTags: context?.contextTags,
      timestamp: new Date().toISOString()
    }
  };

  console.log('📤 Sending to backend:', {
    formattedQuery,
    sessionId: payload.session_id,
    context: payload.context
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Return the response for SSE processing
    return response;
  } catch (error) {
    console.error('❌ QueryAgent error:', error);
    throw error;
  }
};

/**
 * Process SSE stream from agent response
 * @param {Response} response - Fetch response with SSE stream
 * @returns {AsyncGenerator} - Yields parsed chunks
 */
export async function* processSSEStream(response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.replace('data: ', '').trim();
          
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          
          if (data === '') continue;
          
          try {
            const jsonData = JSON.parse(data);
            yield jsonData;
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
            // Yield as plain text if not JSON
            yield { text: data };
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Mock agent response for testing when backend is unavailable
 */
export const mockAgentResponse = (agentName, query) => {
  const responses = {
    sales: `📊 **Sales Intelligence Report**\n\nBased on your query about "${query}":\n• Total Sales: $2.5M this quarter\n• Top Products: Product A (45%), Product B (30%)\n• Growth Rate: +15% YoY\n• Regional Performance: California leads with 35% of total sales\n\nWould you like more detailed analysis?`,
    
    customer: `👥 **Customer Intelligence Report**\n\nAnalyzing "${query}":\n• Customer Segments: 5 distinct groups identified\n• Retention Rate: 85% overall\n• Top Segment: Enterprise (40% of revenue)\n• Behavior Patterns: Peak activity on weekdays\n\nNeed specific segment details?`,
    
    finance: `💰 **Financial Intelligence Report**\n\nFinancial metrics for "${query}":\n• Revenue: $5.1M ARR\n• Gross Margin: 72%\n• Cash Flow: Positive $425K/month\n• Burn Rate: Controlled at $150K/month\n\nWant to dive into specific metrics?`,
    
    inventory: `📦 **Inventory Intelligence Report**\n\nInventory analysis for "${query}":\n• Stock Levels: Optimal for 85% of SKUs\n• Turnover Rate: 12x annually\n• Holding Costs: $50K/month\n• Reorder Points: Automated for top products\n\nNeed optimization recommendations?`
  };

  return responses[agentName] || `I'm analyzing your query about "${query}". Please ensure you're using a valid agent (@sales, @customer, @finance, or @inventory).`;
};

/**
 * Extract agent mentions from text
 */
export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  // Remove mentions from query text
  const cleanQuery = text.replace(mentionRegex, '').trim();
  
  return { mentions, cleanQuery };
};

/**
 * Check if agent name is valid
 */
export const isValidAgent = (agentName) => {
  const validAgents = ['sales', 'customer', 'finance', 'inventory'];
  return validAgents.includes(agentName.toLowerCase());
};