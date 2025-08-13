/**
 * Debug @mention system
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { message } = req.body;

    // Test mention parsing
    const MENTION_REGEX = /@(\w+)/g;
    const mentions = [];
    let match;
    
    MENTION_REGEX.lastIndex = 0;
    
    while ((match = MENTION_REGEX.exec(message)) !== null) {
      mentions.push({
        agentName: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        fullMatch: match[0]
      });
    }

    // Test agent registry
    const AGENT_REGISTRY = {
      sales_agent: { name: 'sales_agent', displayName: 'Sales Agent', endpoint: '/api/agents/query' },
      customer_agent: { name: 'customer_agent', displayName: 'Customer Agent', endpoint: '/api/agents/query' },
      inventory_agent: { name: 'inventory_agent', displayName: 'Inventory Agent', endpoint: '/api/agents/query' },
      finance_agent: { name: 'finance_agent', displayName: 'Finance Agent', endpoint: '/api/agents/query' }
    };

    const agentLookups = mentions.map(mention => ({
      agentName: mention.agentName,
      found: !!AGENT_REGISTRY[mention.agentName],
      config: AGENT_REGISTRY[mention.agentName] || null
    }));

    res.status(200).json({
      success: true,
      debug: {
        originalMessage: message,
        mentions: mentions,
        mentionCount: mentions.length,
        agentLookups: agentLookups,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          apiGatewayUrl: process.env.API_GATEWAY_URL,
          hasApiToken: !!process.env.API_GATEWAY_TOKEN,
          useMockAgents: process.env.NEXT_PUBLIC_USE_MOCK_AGENTS
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug mention error:', error);
    res.status(500).json({
      success: false,
      error: 'Debug failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}