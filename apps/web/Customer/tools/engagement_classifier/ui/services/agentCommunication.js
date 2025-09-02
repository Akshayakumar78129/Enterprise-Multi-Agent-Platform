/**
 * Agent Communication Service for Engagement Classifier
 * Handles agent queries via backend orchestrator (port 5000)
 * Matches functionality with Regional Sales Analyzer
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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';
  const agentToAppMap = {
    sales: 'sales_agent',
    customer: 'customer_agent',
    finance: 'financial_agent',
    inventory: 'inventory_agent',
  };
  const adkAppName = agentToAppMap[agentName?.toLowerCase()] || 'orchestration_agent';
  const endpoint = `${backendUrl}/run_sse_agent`;
  
  console.log('🌐 QueryAgent called:', {
    endpoint,
    agentName,
    adkAppName,
    query: query.substring(0, 100),
    hasContext: !!context
  });

  // Format query with @mention prefix (same as regional sales)
  const formattedQuery = query; // /run_sse_agent targets specific agent; no need to prefix mention

  // Build a concise inline suffix for selected points to aid the router/agent
  const selectedPointsSuffix = (context?.selectedPoints?.length)
    ? `\n\n[Selected Points: ${context.selectedPoints.map(p => `${p.label}:${p.value}${p.unit || ''}`).join(', ')}]`
    : '';
  const finalQuery = `${formattedQuery}${selectedPointsSuffix}`.trim();
  
  // Create payload matching ADK FastAPI expectations
  // main.py expects: app_name, user_id, session_id, new_message (google.genai.types.Content), streaming
  const payload = {
    app_name: adkAppName,
    user_id: context?.user_id || 'engagement_analyst',
    session_id: sessionId || 'engagement-classifier-session',
    streaming: true,
    new_message: {
      role: 'user',
      parts: [ { text: finalQuery } ]
    }
  };

  console.log('📤 Sending to backend:', {
    formattedQuery,
    sessionId: payload.session_id
  });

  try {
    // Ensure session exists before streaming
    const appName = payload.app_name;
    const userId = payload.user_id;
    const sessId = payload.session_id;
    const sessionEndpoint = `${backendUrl}/apps/${appName}/users/${userId}/sessions/${sessId}`;
    try {
      await fetch(sessionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
    } catch (e) {
      console.warn('Session creation warning (continuing):', e);
    }

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
    customer: `👥 **Customer Intelligence Report**\n\nAnalyzing "${query}":\n• Customer Segments: 5 distinct engagement groups identified\n• High Engagement: 25% of customers (Score 8-10)\n• Medium Engagement: 45% of customers (Score 5-7)\n• Low Engagement: 30% of customers (Score 1-4)\n• Re-engagement Opportunities: 180 customers identified\n• Behavior Patterns: Peak activity on weekdays, 2-4 PM\n\nNeed specific segment analysis?`,
    
    sales: `📊 **Sales Intelligence Report**\n\nBased on engagement data for "${query}":\n• High-engagement customers: 3.2x higher purchase rate\n• Average Order Value: $245 (high) vs $89 (low engagement)\n• Conversion Rate: 18% (engaged) vs 4% (disengaged)\n• Revenue Impact: $1.2M potential from re-engagement\n• Top Products: Premium services preferred by engaged customers\n\nWant detailed conversion analysis?`,
    
    finance: `💰 **Financial Intelligence Report**\n\nFinancial metrics for "${query}":\n• Customer Lifetime Value: $2,400 (high engagement) vs $450 (low)\n• Retention Cost: $45/customer for re-engagement campaigns\n• ROI on Engagement: 340% average return\n• Churn Prevention Value: $890K annually\n• Revenue per Engagement Point: $125\n\nNeed cost-benefit analysis?`,
    
    inventory: `📦 **Inventory Intelligence Report**\n\nInventory insights for "${query}":\n• High-engagement customers prefer premium SKUs\n• Stock Velocity: 2.5x faster for engaged customer products\n• Demand Forecasting: Engagement scores predict 85% of purchase intent\n• Seasonal Patterns: Engaged customers shop year-round\n• Product Affinity: Cross-sell success rate 65% higher\n\nWant product-specific recommendations?`
  };

  return responses[agentName] || `I'm analyzing your query about "${query}". Please ensure you're using a valid agent (@customer, @sales, @finance, or @inventory).`;
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
  const validAgents = ['customer', 'sales', 'finance', 'inventory'];
  return validAgents.includes(agentName.toLowerCase());
};