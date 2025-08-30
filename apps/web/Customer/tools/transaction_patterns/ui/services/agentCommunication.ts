/**
 * Agent Communication Service for Transaction Patterns
 * Handles agent queries via backend orchestrator (port 5000)
 */

/**
 * Query a specific agent through the backend orchestrator
 * @param {string} agentName - Name of the agent to query
 * @param {string} query - The user's query
 * @param {object} context - Dashboard context
 * @param {string} sessionId - Session identifier
 * @returns {Promise} - Agent response via SSE
 */
export const queryAgent = async (
  agentName: string,
  query: string,
  context: any,
  sessionId: string
): Promise<Response> => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
  const endpoint = `${backendUrl}/run_sse`;
  
  console.log('🌐 QueryAgent called:', {
    endpoint,
    agentName,
    query: query.substring(0, 100),
    hasContext: !!context
  });

  // Format query with @mention prefix
  const formattedQuery = `@${agentName} ${query}`;
  
  // Create payload matching backend expectations
  const payload = {
    user_query: formattedQuery,
    session_id: sessionId || 'transaction-patterns-session',
    user_id: context?.user_id || 'transaction_analyst',
    app_name: 'transaction_patterns',
    is_canvas: false,
    context: {
      dashboard: 'transaction-patterns',
      transactionContext: context?.transaction_context,
      chartContext: context?.chart_context,
      filters: context?.filters,
      dateRange: context?.date_range,
      kpis: context?.kpis,
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
export async function* processSSEStream(response: Response): AsyncGenerator<any> {
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
export const mockAgentResponse = (agentName: string, query: string): string => {
  const responses: Record<string, string> = {
    customer: `👥 **Customer Transaction Analysis**\n\nAnalyzing "${query}":\n• Transaction Volume: 15,234 transactions\n• Customer Segments: 5 distinct spending patterns\n• High-Value Customers: 15% of total (45% of revenue)\n• Average Transaction: $245\n• Peak Hours: 2-4 PM (35% of volume)\n• Behavior Patterns: Regular customers show 3x higher frequency\n\nNeed specific segment analysis?`,
    
    sales: `📊 **Sales Performance Report**\n\nSales metrics for "${query}":\n• Total Revenue: $3.7M this period\n• Transaction Growth: +18% MoM\n• Average Order Value: $245 (up 12%)\n• Conversion Rate: 24%\n• Top Products: Premium services (45% of revenue)\n• Sales Velocity: 2.3x faster than last quarter\n\nWant product-specific metrics?`,
    
    finance: `💰 **Financial Analysis Report**\n\nFinancial insights for "${query}":\n• Payment Methods: Credit (65%), Debit (25%), Digital (10%)\n• Transaction Success Rate: 97.1%\n• Failed Transactions: $45K lost revenue\n• Processing Fees: $89K this period\n• Revenue per Transaction: $245 average\n• Cash Flow: Positive trend (+15% MoM)\n\nNeed payment optimization analysis?`,
    
    fraud: `🔍 **Fraud Detection Report**\n\nAnomaly analysis for "${query}":\n• Suspicious Transactions: 145 flagged (2.9%)\n• Risk Level: Medium (6.5/10)\n• Unusual Patterns: 15 in last 24h\n• High-Risk Categories: Electronics, Gift Cards\n• Fraud Prevention: $125K saved\n• False Positive Rate: 8%\n\nWant detailed investigation?`,
    
    inventory: `📦 **Inventory Intelligence Report**\n\nInventory metrics for "${query}":\n• Top Selling Items: Based on transaction frequency\n• Stock Velocity: 2.5x for high-transaction products\n• Demand Patterns: Peak at 2-4 PM\n• Category Performance: Electronics (35%), Clothing (25%)\n• Reorder Points: 12 items below threshold\n• Transaction-to-Stock Ratio: Optimal at 0.85\n\nNeed restock recommendations?`
  };

  return responses[agentName] || `I'm analyzing your query about "${query}". Please ensure you're using a valid agent (@customer, @sales, @finance, @fraud).`;
};

/**
 * Extract agent mentions from text
 */
export const extractMentions = (text: string): { mentions: string[], cleanQuery: string } => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  // Remove mentions from query text
  const cleanQuery = text.replace(mentionRegex, '').trim();
  
  return { mentions, cleanQuery };
};

/**
 * Check if agent name is valid for transaction patterns
 */
export const isValidAgent = (agentName: string): boolean => {
  const validAgents = ['customer', 'sales', 'finance', 'fraud', 'inventory'];
  return validAgents.includes(agentName.toLowerCase());
};

/**
 * Get agent configuration for transaction patterns
 */
export const getAgentConfig = (agentName: string) => {
  const agents = {
    customer: {
      name: 'customer',
      displayName: 'Customer Intelligence',
      avatar: '👥',
      color: '#00e0ff',
      description: 'Transaction behavior and spending patterns'
    },
    sales: {
      name: 'sales',
      displayName: 'Sales Intelligence',
      avatar: '📊',
      color: '#e930ff',
      description: 'Sales trends and revenue analysis'
    },
    finance: {
      name: 'finance',
      displayName: 'Finance Intelligence',
      avatar: '💰',
      color: '#fbbf24',
      description: 'Payment methods and financial metrics'
    },
    fraud: {
      name: 'fraud',
      displayName: 'Fraud Detection',
      avatar: '🔍',
      color: '#ef4444',
      description: 'Anomaly detection and risk assessment'
    },
    inventory: {
      name: 'inventory',
      displayName: 'Inventory Intelligence',
      avatar: '📦',
      color: '#34d399',
      description: 'Product performance and stock analysis'
    }
  };
  
  return agents[agentName] || null;
};

/**
 * Create a test query for backend verification
 */
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://127.0.0.1:5000/run_sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        user_query: '@customer test connection',
        session_id: 'test-session',
        user_id: 'test_user',
        app_name: 'transaction_patterns',
        is_canvas: false
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout for test
    });
    
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};