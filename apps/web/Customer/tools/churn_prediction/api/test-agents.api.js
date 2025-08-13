/**
 * Test Agent Connectivity API Endpoint
 * Quick test to verify agent system is working
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const API_GATEWAY_BASE = process.env.API_GATEWAY_URL || 'http://localhost:3002';
    const API_GATEWAY_TOKEN = process.env.API_GATEWAY_TOKEN || 'your_api_gateway_token';

    // Test API Gateway connectivity
    const healthResponse = await fetch(`${API_GATEWAY_BASE}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_GATEWAY_TOKEN}`
      }
    });

    const healthData = await healthResponse.json();

    // Test each agent endpoint
    const agentTests = [];
    const agents = ['sales', 'customer', 'inventory', 'finance'];

    for (const agent of agents) {
      try {
        const agentResponse = await fetch(`${API_GATEWAY_BASE}/api/v1/${agent}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_GATEWAY_TOKEN}`
          }
        });
        
        agentTests.push({
          agent,
          status: agentResponse.ok ? 'healthy' : 'error',
          statusCode: agentResponse.status,
          endpoint: `${API_GATEWAY_BASE}/api/v1/${agent}`
        });
      } catch (error) {
        agentTests.push({
          agent,
          status: 'error',
          error: error.message,
          endpoint: `${API_GATEWAY_BASE}/api/v1/${agent}`
        });
      }
    }

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      apiGateway: {
        url: API_GATEWAY_BASE,
        status: healthResponse.ok ? 'healthy' : 'error',
        statusCode: healthResponse.status,
        data: healthData
      },
      agents: agentTests,
      mentionSystem: {
        status: 'configured',
        availableAgents: ['@sales_agent', '@customer_agent', '@inventory_agent', '@finance_agent'],
        endpoint: '/api/agents/query'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        useMockAgents: process.env.NEXT_PUBLIC_USE_MOCK_AGENTS,
        apiGatewayConfigured: !!process.env.API_GATEWAY_URL
      }
    });

  } catch (error) {
    console.error('Agent connectivity test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Agent connectivity test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      troubleshooting: {
        checkApiGateway: 'Ensure API Gateway is running on localhost:3002',
        checkEnvironment: 'Verify API_GATEWAY_URL and API_GATEWAY_TOKEN are set',
        checkNetwork: 'Test: curl http://localhost:3002/health'
      }
    });
  }
}