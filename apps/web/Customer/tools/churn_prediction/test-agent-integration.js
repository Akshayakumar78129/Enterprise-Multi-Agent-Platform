/**
 * Test Script for Agent Integration
 * Tests the churn dashboard's ability to communicate with real agents
 */

const fetch = require('node-fetch');

// Configuration
const API_GATEWAY_BASE = process.env.API_GATEWAY_URL || 'http://localhost:3002';
const API_GATEWAY_TOKEN = process.env.API_GATEWAY_TOKEN || 'your_api_gateway_token';
const CHURN_API_BASE = 'http://localhost:3000/api/agents';

// Test data
const testContext = {
  source_dashboard: 'churn_prediction',
  timestamp: new Date().toISOString(),
  customer_context: {
    total_customers: 1250,
    high_risk_customers: 89,
    avg_churn_probability: 0.23,
    active_customer: {
      customer_id: 'CUST_001',
      name: 'John Doe',
      risk_level: 'High',
      churn_probability: 0.78,
      avg_order_value: 450
    }
  },
  filters: {
    risk_level: 'High',
    applied_filters: ['Risk Level: High'],
    filter_count: 1
  },
  kpis: {
    total_customers: 1250,
    high_risk_count: 89,
    medium_risk_count: 234,
    low_risk_count: 927,
    avg_churn_probability: 0.23,
    retention_rate: 0.77,
    revenue_at_risk: 125000
  }
};

const testQueries = [
  {
    agent: 'sales_agent',
    query: 'What is the sales performance impact of high-risk customers?',
    expectedKeywords: ['sales', 'performance', 'revenue', 'impact']
  },
  {
    agent: 'customer_agent',
    query: 'Show me customer segmentation analysis for high-risk customers',
    expectedKeywords: ['customer', 'segmentation', 'analysis', 'risk']
  },
  {
    agent: 'inventory_agent',
    query: 'How does customer churn affect inventory levels?',
    expectedKeywords: ['inventory', 'levels', 'churn', 'impact']
  },
  {
    agent: 'finance_agent',
    query: 'What is the financial impact of customer churn?',
    expectedKeywords: ['financial', 'impact', 'revenue', 'churn']
  },
  {
    agent: 'product_performance_agent',
    query: 'Which products are preferred by loyal customers?',
    expectedKeywords: ['product', 'performance', 'loyal', 'customers']
  }
];

/**
 * Test API Gateway connectivity
 */
async function testAPIGatewayConnectivity() {
  console.log('🔍 Testing API Gateway connectivity...');
  
  try {
    const response = await fetch(`${API_GATEWAY_BASE}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ API Gateway is healthy:', {
        status: health.status,
        uptime: health.uptime,
        version: health.version
      });
      return true;
    } else {
      console.log('❌ API Gateway health check failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ API Gateway connectivity error:', error.message);
    return false;
  }
}

/**
 * Test individual agent query
 */
async function testAgentQuery(testCase) {
  console.log(`\n🤖 Testing ${testCase.agent}...`);
  console.log(`Query: "${testCase.query}"`);
  
  const payload = {
    context: testContext,
    query: testCase.query,
    mentioned_agent: testCase.agent,
    request_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    priority: 'medium'
  };
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${CHURN_API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const executionTime = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ Agent responded successfully:');
      console.log(`   - Execution time: ${executionTime}ms`);
      console.log(`   - Agent: ${result.agent_display_name || result.agent_name}`);
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Response length: ${result.response?.length || 0} characters`);
      
      if (result.response) {
        const responseText = result.response.toLowerCase();
        const foundKeywords = testCase.expectedKeywords.filter(keyword => 
          responseText.includes(keyword.toLowerCase())
        );
        
        console.log(`   - Keywords found: ${foundKeywords.length}/${testCase.expectedKeywords.length}`);
        console.log(`   - Found: [${foundKeywords.join(', ')}]`);
        
        if (foundKeywords.length >= testCase.expectedKeywords.length / 2) {
          console.log('✅ Response content appears relevant');
        } else {
          console.log('⚠️ Response content may not be fully relevant');
        }
      }
      
      if (result.metadata) {
        console.log(`   - Confidence: ${(result.metadata.confidence_score * 100).toFixed(1)}%`);
        console.log(`   - Data sources: ${result.metadata.data_sources?.length || 0}`);
      }
      
      return { success: true, executionTime, result };
    } else {
      const errorText = await response.text();
      console.log('❌ Agent query failed:');
      console.log(`   - Status: ${response.status} ${response.statusText}`);
      console.log(`   - Error: ${errorText}`);
      console.log(`   - Execution time: ${executionTime}ms`);
      
      return { success: false, executionTime, error: errorText };
    }
  } catch (error) {
    console.log('❌ Agent query error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test agent availability
 */
async function testAgentAvailability() {
  console.log('\n📋 Testing agent availability...');
  
  const agents = [
    'sales_agent',
    'customer_agent', 
    'inventory_agent',
    'finance_agent',
    'product_performance_agent',
    'regional_sales_agent',
    'sales_trends_agent',
    'customer_segmentation_agent',
    'customer_lifetime_value_agent',
    'engagement_classifier_agent',
    'inventory_holding_cost_agent',
    'inventory_level_agent'
  ];
  
  const availableAgents = [];
  const unavailableAgents = [];
  
  for (const agent of agents) {
    const testPayload = {
      context: testContext,
      query: 'Health check',
      mentioned_agent: agent,
      request_id: `health_${Date.now()}_${agent}`,
      priority: 'low'
    };
    
    try {
      const response = await fetch(`${CHURN_API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          availableAgents.push(agent);
          console.log(`✅ ${agent} - Available`);
        } else {
          unavailableAgents.push(agent);
          console.log(`❌ ${agent} - Error: ${result.error_message || 'Unknown error'}`);
        }
      } else {
        unavailableAgents.push(agent);
        console.log(`❌ ${agent} - HTTP ${response.status}`);
      }
    } catch (error) {
      unavailableAgents.push(agent);
      console.log(`❌ ${agent} - Network error: ${error.message}`);
    }
    
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n📊 Agent Availability Summary:`);
  console.log(`   - Available: ${availableAgents.length}/${agents.length}`);
  console.log(`   - Unavailable: ${unavailableAgents.length}/${agents.length}`);
  
  return { availableAgents, unavailableAgents };
}

/**
 * Run comprehensive test suite
 */
async function runTestSuite() {
  console.log('🚀 Starting Agent Integration Test Suite');
  console.log('=' .repeat(60));
  
  const results = {
    apiGatewayHealthy: false,
    agentTests: [],
    availableAgents: [],
    unavailableAgents: [],
    totalExecutionTime: 0
  };
  
  const suiteStartTime = Date.now();
  
  // Test 1: API Gateway connectivity
  results.apiGatewayHealthy = await testAPIGatewayConnectivity();
  
  if (!results.apiGatewayHealthy) {
    console.log('\n⚠️ API Gateway is not available. Some tests may fail.');
    console.log('Make sure the API Gateway is running on', API_GATEWAY_BASE);
  }
  
  // Test 2: Agent availability
  const availability = await testAgentAvailability();
  results.availableAgents = availability.availableAgents;
  results.unavailableAgents = availability.unavailableAgents;
  
  // Test 3: Individual agent queries
  console.log('\n🧪 Running individual agent tests...');
  
  for (const testCase of testQueries) {
    const testResult = await testAgentQuery(testCase);
    results.agentTests.push({
      agent: testCase.agent,
      query: testCase.query,
      ...testResult
    });
    
    if (testResult.executionTime) {
      results.totalExecutionTime += testResult.executionTime;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const suiteExecutionTime = Date.now() - suiteStartTime;
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUITE SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`🌐 API Gateway: ${results.apiGatewayHealthy ? '✅ Healthy' : '❌ Unavailable'}`);
  console.log(`🤖 Available Agents: ${results.availableAgents.length}`);
  console.log(`❌ Unavailable Agents: ${results.unavailableAgents.length}`);
  
  const successfulTests = results.agentTests.filter(t => t.success).length;
  const failedTests = results.agentTests.filter(t => !t.success).length;
  
  console.log(`✅ Successful Tests: ${successfulTests}/${results.agentTests.length}`);
  console.log(`❌ Failed Tests: ${failedTests}/${results.agentTests.length}`);
  console.log(`⏱️ Total Query Time: ${results.totalExecutionTime}ms`);
  console.log(`⏱️ Suite Execution Time: ${suiteExecutionTime}ms`);
  
  if (successfulTests === results.agentTests.length && results.apiGatewayHealthy) {
    console.log('\n🎉 ALL TESTS PASSED! Agent integration is working correctly.');
  } else if (successfulTests > 0) {
    console.log('\n⚠️ PARTIAL SUCCESS. Some agents are working, others need attention.');
  } else {
    console.log('\n❌ ALL TESTS FAILED. Check your configuration and API Gateway.');
  }
  
  console.log('\n💡 Next Steps:');
  if (!results.apiGatewayHealthy) {
    console.log('   1. Start the API Gateway server');
    console.log('   2. Verify API_GATEWAY_URL and API_GATEWAY_TOKEN');
  }
  if (results.unavailableAgents.length > 0) {
    console.log('   3. Check agent routing configuration');
    console.log('   4. Verify agent endpoints are implemented');
  }
  if (failedTests > 0) {
    console.log('   5. Review failed test logs above');
    console.log('   6. Test individual agents manually');
  }
  
  return results;
}

// Run the test suite
if (require.main === module) {
  runTestSuite().catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  testAPIGatewayConnectivity,
  testAgentQuery,
  testAgentAvailability,
  runTestSuite
};