// Test agent responses to verify they return detailed data instead of intro messages

// Mock data context similar to what the database functions return
const mockSalesContext = {
  salesMetrics: {
    totalRevenue: 168214493.7966,
    avgMonthlyRevenue: 168214493.7966,
    totalTransactions: 81423,
    avgOrderValue: 2065.93,
    period: 'Full dataset'
  },
  analysisType: 'Transactional Sales Data',
  table: 'dbo_F_Sales_Transaction'
};

const mockCustomerContext = {
  topCustomers: [
    { customer_id: 2629, total_amount: 75000, transaction_count: 1 },
    { customer_id: 2623, total_amount: 75000, transaction_count: 1 },
    { customer_id: 2613, total_amount: 75000, transaction_count: 1 }
  ],
  table: 'dbo_D_Customer'
};

// Helper functions (copy from assistant API)
function fmtAmt(n) {
  if (typeof n !== 'number' || isNaN(n)) return '$0';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function num(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString();
}

// Enhanced LLM implementation (copy from assistant API)
const enhancedLLM = {
  generateResponse: async (prompt, agentType, dataContext = null) => {
    console.log(`Using enhanced LLM for ${agentType || 'general'} query with data context:`, !!dataContext);
    
    // Extract the main question from the prompt
    const questionMatch = prompt.match(/Question:\s*(.*?)(\n|$)/i);
    const question = questionMatch ? questionMatch[1].trim() : prompt.split('\n')[0];
    
    // Generate agent-specific responses with real data
    let response = "I'm your AI assistant. How can I help you today?";
    
    if (agentType === 'sales_agent' || question.includes('sales') || question.includes('revenue')) {
      console.log('Sales agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.salesMetrics) {
        const metrics = dataContext.salesMetrics;
        response = `## Sales Performance Analysis [CHART]\n\n• **Total Revenue**: ${fmtAmt(metrics.totalRevenue || 0)} across all transactions\n• **Total Transactions**: ${num(metrics.totalTransactions || 0)} completed\n• **Average Order Value**: ${fmtAmt(metrics.avgOrderValue || 0)}\n• **Monthly Average**: ${fmtAmt(metrics.avgMonthlyRevenue || 0)}\n• **Analysis Period**: ${metrics.period || 'Full dataset'}\n\n**Key Insights:**\n- Strong transaction volume with ${num(metrics.totalTransactions)} completed sales\n- Consistent average order value indicates stable customer spending\n- ${dataContext.analysisType || 'Comprehensive sales analysis'} shows healthy business performance`;
      } else if (dataContext && dataContext.byMonth) {
        const totalRevenue = dataContext.byMonth.reduce((sum, m) => sum + (m.total_amount || 0), 0);
        const totalTx = dataContext.byMonth.reduce((sum, m) => sum + (m.tx_count || 0), 0);
        response = `## Sales Performance Analysis [CHART]\n\n• **Total Revenue**: ${fmtAmt(totalRevenue)} from database\n• **Total Transactions**: ${num(totalTx)} completed\n• **Average Order Value**: ${fmtAmt(totalRevenue / Math.max(totalTx, 1))}\n• **Data Source**: ${dataContext.table || 'Sales database'}\n\nAnalysis shows strong sales performance with consistent transaction patterns.`;
      } else {
        response = "## Sales Performance Analysis\n\nI can analyze your sales data including revenue trends, product performance, and growth metrics. Please ensure your sales data is connected or ask about specific sales metrics you'd like to explore.";
      }
    } else if (agentType === 'customer_insights_agent' || question.includes('customer') || question.includes('client')) {
      console.log('Customer agent triggered, dataContext:', dataContext);
      if (dataContext && dataContext.topCustomers && dataContext.topCustomers.length > 0) {
        const customerCount = dataContext.topCustomers.length;
        const totalValue = dataContext.topCustomers.reduce((sum, c) => sum + (c.total_amount || 0), 0);
        const avgValue = totalValue / customerCount;
        const topCustomer = dataContext.topCustomers[0];
        response = `## Customer Insights Analysis [CHART]\n\n• **Active Customers**: ${num(customerCount)} customers analyzed\n• **Total Customer Value**: ${fmtAmt(totalValue)}\n• **Average Customer Value**: ${fmtAmt(avgValue)}\n• **Top Customer Value**: ${fmtAmt(topCustomer?.total_amount || 0)} (ID: ${topCustomer?.customer_id})\n• **Data Source**: ${dataContext.table || 'Customer database'}\n\n**Key Insights:**\n- Customer base shows ${customerCount > 50 ? 'strong' : 'growing'} engagement\n- Value distribution indicates ${avgValue > 50000 ? 'high-value' : 'diverse'} customer portfolio\n- Top customers represent significant business value`;
      } else {
        response = "## Customer Insights Analysis\n\nI can analyze customer segmentation, lifetime value, retention patterns, and behavior insights. Connect your customer data to get detailed analytics on your customer base.";
      }
    }
    
    return response;
  }
};

async function testAgentResponses() {
  console.log('🧪 TESTING AGENT RESPONSES\n');
  console.log('=' .repeat(60));

  // Test Sales Agent
  console.log('\n📈 TESTING SALES AGENT:');
  console.log('-' .repeat(40));
  const salesPrompt = 'Question: Show me sales performance';
  const salesResponse = await enhancedLLM.generateResponse(salesPrompt, 'sales_agent', mockSalesContext);
  console.log('Sales Agent Response:');
  console.log(salesResponse);
  console.log('\n✅ Sales Agent Test:', salesResponse.includes('$168,214,493.80') ? 'PASSED - Returns detailed data' : 'FAILED - Generic response');

  // Test Customer Agent
  console.log('\n👥 TESTING CUSTOMER AGENT:');
  console.log('-' .repeat(40));
  const customerPrompt = 'Question: Analyze customer data';
  const customerResponse = await enhancedLLM.generateResponse(customerPrompt, 'customer_insights_agent', mockCustomerContext);
  console.log('Customer Agent Response:');
  console.log(customerResponse);
  console.log('\n✅ Customer Agent Test:', customerResponse.includes('$225,000') ? 'PASSED - Returns detailed data' : 'FAILED - Generic response');

  // Test without data context
  console.log('\n🔍 TESTING WITHOUT DATA CONTEXT:');
  console.log('-' .repeat(40));
  const noDataResponse = await enhancedLLM.generateResponse('Question: Sales data', 'sales_agent', null);
  console.log('No Data Response:');
  console.log(noDataResponse);
  console.log('\n✅ No Data Test:', noDataResponse.includes('ensure your sales data is connected') ? 'PASSED - Fallback message' : 'FAILED - Wrong response');

  console.log('\n🎯 SUMMARY:');
  console.log('=' .repeat(60));
  console.log('The enhanced LLM should now return detailed, data-driven responses');
  console.log('instead of generic intro messages when proper data context is provided.');
}

testAgentResponses().catch(console.error);
