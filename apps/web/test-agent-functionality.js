// Test script to verify agent functionality
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🤖 Testing Agent Functionality\n');
console.log('=' .repeat(50));

// Test 1: Check if databases exist
console.log('\n📊 Test 1: Checking database connections...');

const databases = {
  'Customer': path.join(__dirname, 'Customer', 'database', 'customers.db'),
  'Sales': path.join(__dirname, 'Sales', 'database', 'sales_agent.db'),
  'Finance': path.join(__dirname, 'Finance', 'database', 'financial_agent.db'),
  'Inventory': path.join(__dirname, 'Inventory', 'database', 'inventory_agent.db')
};

const fs = require('fs');

Object.entries(databases).forEach(([name, dbPath]) => {
  if (fs.existsSync(dbPath)) {
    console.log(`✅ ${name} database found: ${dbPath}`);
    
    // Try to connect and query
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.log(`  ❌ Failed to connect: ${err.message}`);
      } else {
        console.log(`  ✅ Successfully connected to ${name} database`);
        
        // Get table count
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (!err && tables) {
            console.log(`  📋 Tables found: ${tables.length}`);
          }
          db.close();
        });
      }
    });
  } else {
    console.log(`❌ ${name} database NOT found: ${dbPath}`);
  }
});

// Test 2: Check API endpoints
console.log('\n🌐 Test 2: Testing API endpoints...');

const testEndpoints = [
  { name: 'Sales Performance', url: 'http://localhost:3000/api/sales-performance' },
  { name: 'Customer Segmentation', url: 'http://localhost:3000/api/customer-segmentation/data' },
  { name: 'Churn Prediction', url: 'http://localhost:3000/api/churn-prediction/data' },
  { name: 'Inventory Analysis', url: 'http://localhost:3000/api/inventory-level-analyzer/data' }
];

const http = require('http');

testEndpoints.forEach(endpoint => {
  const url = new URL(endpoint.url);
  
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname,
    method: 'GET',
    timeout: 5000
  };
  
  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log(`✅ ${endpoint.name} API is responding (Status: ${res.statusCode})`);
    } else {
      console.log(`⚠️ ${endpoint.name} API returned status: ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.log(`❌ ${endpoint.name} API is not accessible: ${error.message}`);
  });
  
  req.on('timeout', () => {
    console.log(`⏱️ ${endpoint.name} API request timed out`);
    req.destroy();
  });
  
  req.end();
});

// Test 3: Check agent registry configuration
console.log('\n🔧 Test 3: Agent Registry Configuration...');

const agents = ['sales', 'customer', 'finance', 'inventory'];
console.log(`📋 Configured agents: ${agents.join(', ')}`);

// Test 4: Simulate agent query
console.log('\n🚀 Test 4: Testing agent query simulation...');

function simulateAgentQuery(agentName, query) {
  console.log(`\n📨 Querying @${agentName}: "${query}"`);
  
  // Simulate response based on agent type
  const mockResponses = {
    sales: {
      success: true,
      response: 'Sales data: Total revenue $2.5M, 147 active deals, 12.5% quarterly growth',
      data: { revenue: 2500000, deals: 147, growth: 12.5 }
    },
    customer: {
      success: true,
      response: 'Customer analysis: 100 total customers, 22 high-risk, NPS score 42',
      data: { total: 100, high_risk: 22, nps: 42 }
    },
    finance: {
      success: true,
      response: 'Financial metrics: MRR $425K, ARR $5.1M, LTV:CAC ratio 5.3:1',
      data: { mrr: 425000, arr: 5100000, ltv_cac: 5.3 }
    },
    inventory: {
      success: true,
      response: 'Inventory status: 3,450 SKUs, $1.8M value, 8.2x turnover rate',
      data: { skus: 3450, value: 1800000, turnover: 8.2 }
    }
  };
  
  const response = mockResponses[agentName];
  if (response) {
    console.log(`✅ Response received from @${agentName}:`);
    console.log(`   "${response.response}"`);
    console.log(`   Data:`, JSON.stringify(response.data));
  } else {
    console.log(`❌ No response configured for @${agentName}`);
  }
}

// Test each agent
agents.forEach(agent => {
  simulateAgentQuery(agent, 'What are the key metrics?');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 AGENT FUNCTIONALITY TEST SUMMARY:');
console.log('=' .repeat(50));

console.log(`
🔍 Key Findings:
1. Database Connections: Check the output above
2. API Endpoints: Verify which endpoints are accessible
3. Agent Configuration: 4 agents configured (sales, customer, finance, inventory)
4. Agent Queries: Currently using mock responses

⚠️ ISSUES TO FIX:
1. Missing /api/agents/query endpoint - needs to be created
2. Agents are configured but not connected to real data sources
3. Need to implement actual data fetching from department databases

💡 RECOMMENDATIONS:
1. Create /api/agents/query endpoint to handle agent requests
2. Connect each agent to its respective database
3. Implement real data fetching logic for each agent
4. Add error handling and fallback mechanisms
`);

console.log('\n✅ Test completed!');