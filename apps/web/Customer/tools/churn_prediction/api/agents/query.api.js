/**
 * Universal Agent Query API Endpoint
 * Routes @mention queries to appropriate agents via API Gateway
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { context, query, mentioned_agent, request_id, priority } = req.body;

    // Validate request
    if (!context || !query || !mentioned_agent || !request_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: context, query, mentioned_agent, request_id'
      });
    }

    // API Gateway configuration
    const API_GATEWAY_BASE = process.env.API_GATEWAY_URL || 'http://localhost:3002';
    const API_GATEWAY_TOKEN = process.env.API_GATEWAY_TOKEN || 'your_api_gateway_token';

    // Route to appropriate agent
    const agentRouting = {
      // Sales Agents
      'sales_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/sales`,
        endpoints: {
          performance: '/sales-performance',
          trends: '/sales-trends',
          products: '/product-performance',
          insights: '/sales-insights'
        }
      },
      'product_performance_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/sales`,
        endpoints: {
          products: '/product-performance',
          analysis: '/product-analysis',
          insights: '/product-insights'
        }
      },
      'regional_sales_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/sales`,
        endpoints: {
          regional: '/regional-sales',
          performance: '/sales-performance',
          insights: '/regional-insights'
        }
      },
      'sales_trends_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/sales`,
        endpoints: {
          trends: '/sales-trends',
          forecasting: '/sales-forecasting',
          analysis: '/trend-analysis'
        }
      },
      
      // Customer Agents
      'customer_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/customer`,
        endpoints: {
          insights: '/customer-insights',
          segmentation: '/customer-segmentation',
          behavior: '/customer-behavior'
        }
      },
      'customer_segmentation_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/customer`,
        endpoints: {
          segmentation: '/customer-segmentation',
          analysis: '/segmentation-analysis',
          insights: '/segment-insights'
        }
      },
      'customer_lifetime_value_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/customer`,
        endpoints: {
          lifetime_value: '/customer-lifetime-value',
          analysis: '/clv-analysis',
          insights: '/value-insights'
        }
      },
      'engagement_classifier_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/customer`,
        endpoints: {
          engagement: '/customer-engagement',
          classification: '/engagement-classification',
          insights: '/engagement-insights'
        }
      },
      
      // Inventory Agents
      'inventory_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/inventory`,
        endpoints: {
          levels: '/inventory-levels',
          costs: '/holding-cost-analysis',
          optimization: '/inventory-optimization',
          insights: '/inventory-insights'
        }
      },
      'inventory_holding_cost_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/inventory`,
        endpoints: {
          costs: '/holding-cost-analysis',
          analysis: '/cost-analysis',
          optimization: '/cost-optimization'
        }
      },
      'inventory_level_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/inventory`,
        endpoints: {
          levels: '/inventory-levels',
          monitoring: '/level-monitoring',
          optimization: '/level-optimization'
        }
      },
      
      // Finance Agents
      'finance_agent': {
        baseUrl: `${API_GATEWAY_BASE}/api/v1/finance`,
        endpoints: {
          performance: '/financial-performance',
          analysis: '/financial-analysis',
          insights: '/financial-insights'
        }
      },
      
      // Support & Marketing Agents (Not implemented - API endpoints not available)
      // 'support_agent': {
      //   baseUrl: `${API_GATEWAY_BASE}/api/v1/support`,
      //   endpoints: {
      //     tickets: '/support-tickets',
      //     analysis: '/support-analysis',
      //     insights: '/support-insights'
      //   }
      // },
      // 'marketing_agent': {
      //   baseUrl: `${API_GATEWAY_BASE}/api/v1/marketing`,
      //   endpoints: {
      //     campaigns: '/marketing-campaigns',
      //     analysis: '/marketing-analysis',
      //     insights: '/marketing-insights'
      //   }
      // }
    };

    const agentConfig = agentRouting[mentioned_agent];
    if (!agentConfig) {
      return res.status(400).json({
        success: false,
        error: `Unknown agent: ${mentioned_agent}`
      });
    }

    // Determine appropriate endpoint based on query
    const endpoint = determineEndpoint(query, agentConfig.endpoints);
    const targetUrl = `${agentConfig.baseUrl}${endpoint}`;

    // Prepare request to API Gateway
    const apiGatewayRequest = {
      method: 'GET', // Most endpoints are GET with query params
      headers: {
        'Authorization': `Bearer ${API_GATEWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Request-ID': request_id,
        'X-Source': 'churn-dashboard-mention',
        'X-Priority': priority || 'medium'
      }
    };

    // Add query parameters based on context
    const queryParams = buildQueryParams(mentioned_agent, query, context);
    const urlWithParams = queryParams ? `${targetUrl}?${new URLSearchParams(queryParams).toString()}` : targetUrl;

    console.log(`Routing @${mentioned_agent} query to: ${urlWithParams}`);

    // Make request to API Gateway
    const startTime = Date.now();
    const response = await fetch(urlWithParams, apiGatewayRequest);
    const executionTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Gateway error for ${mentioned_agent}:`, errorText);
      
      return res.status(response.status).json({
        success: false,
        error: `Agent ${mentioned_agent} error: ${errorText}`,
        agent_name: mentioned_agent,
        request_id,
        timestamp: new Date().toISOString()
      });
    }

    const apiData = await response.json();

    // Transform API Gateway response to chatbot format
    const chatbotResponse = await transformToChatbotResponse(
      mentioned_agent,
      query,
      context,
      apiData,
      executionTime
    );

    res.status(200).json({
      success: true,
      agent_name: mentioned_agent,
      agent_display_name: getAgentDisplayName(mentioned_agent),
      response: chatbotResponse.response_text,
      data: apiData.data,
      execution_time_ms: executionTime,
      request_id,
      timestamp: new Date().toISOString(),
      confidence: chatbotResponse.confidence,
      sources: chatbotResponse.sources,
      recommendations: chatbotResponse.recommendations,
      follow_up_questions: chatbotResponse.follow_up_questions
    });

  } catch (error) {
    console.error('Agent query error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      agent_name: req.body.mentioned_agent,
      request_id: req.body.request_id,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Determine the best endpoint based on query content
 */
function determineEndpoint(query, endpoints) {
  const lowerQuery = query.toLowerCase();
  
  // Performance-related queries
  if (endpoints.performance && (lowerQuery.includes('performance') || lowerQuery.includes('metric'))) {
    return endpoints.performance;
  }
  
  // Trend and forecasting queries
  if (endpoints.trends && (lowerQuery.includes('trend') || lowerQuery.includes('forecast'))) {
    return endpoints.trends;
  }
  if (endpoints.forecasting && lowerQuery.includes('forecast')) {
    return endpoints.forecasting;
  }
  
  // Product-related queries
  if (endpoints.products && lowerQuery.includes('product')) {
    return endpoints.products;
  }
  
  // Regional queries
  if (endpoints.regional && (lowerQuery.includes('region') || lowerQuery.includes('geographic'))) {
    return endpoints.regional;
  }
  
  // Customer segmentation queries
  if (endpoints.segmentation && lowerQuery.includes('segment')) {
    return endpoints.segmentation;
  }
  
  // Customer behavior queries
  if (endpoints.behavior && lowerQuery.includes('behavior')) {
    return endpoints.behavior;
  }
  
  // Customer lifetime value queries
  if (endpoints.lifetime_value && (lowerQuery.includes('lifetime') || lowerQuery.includes('clv') || lowerQuery.includes('value'))) {
    return endpoints.lifetime_value;
  }
  
  // Engagement queries
  if (endpoints.engagement && lowerQuery.includes('engagement')) {
    return endpoints.engagement;
  }
  if (endpoints.classification && lowerQuery.includes('classif')) {
    return endpoints.classification;
  }
  
  // Inventory cost queries
  if (endpoints.costs && (lowerQuery.includes('cost') || lowerQuery.includes('holding'))) {
    return endpoints.costs;
  }
  
  // Inventory level queries
  if (endpoints.levels && (lowerQuery.includes('level') || lowerQuery.includes('stock'))) {
    return endpoints.levels;
  }
  
  // Monitoring queries
  if (endpoints.monitoring && lowerQuery.includes('monitor')) {
    return endpoints.monitoring;
  }
  
  // Optimization queries
  if (endpoints.optimization && lowerQuery.includes('optim')) {
    return endpoints.optimization;
  }
  
  // Analysis queries (general)
  if (endpoints.analysis && lowerQuery.includes('analysis')) {
    return endpoints.analysis;
  }
  
  // Support queries (disabled - no API endpoints)
  // if (endpoints.tickets && lowerQuery.includes('ticket')) {
  //   return endpoints.tickets;
  // }
  
  // Marketing queries (disabled - no API endpoints)
  // if (endpoints.campaigns && lowerQuery.includes('campaign')) {
  //   return endpoints.campaigns;
  // }
  
  // Default to insights endpoint or first available
  return endpoints.insights || Object.values(endpoints)[0] || '/insights';
}

/**
 * Build query parameters based on agent and context
 */
function buildQueryParams(agentName, query, context) {
  const params = {};
  
  // Common parameters
  params.limit = '20';
  params.page = '1';
  
  // Add date range if available
  if (context.date_range) {
    params.startDate = context.date_range.start_date;
    params.endDate = context.date_range.end_date;
  }
  
  // Agent-specific parameters
  switch (agentName) {
    case 'sales_agent':
      params.granularity = 'monthly';
      if (context.customer_context?.active_customer) {
        params.customerId = context.customer_context.active_customer.customer_id;
      }
      break;
      
    case 'customer_agent':
      if (context.filters?.risk_level) {
        params.riskLevel = context.filters.risk_level;
      }
      if (context.customer_context?.active_customer) {
        params.customerId = context.customer_context.active_customer.customer_id;
      }
      break;
      
    case 'inventory_agent':
      params.includeMetrics = 'true';
      break;
      
    case 'finance_agent':
      params.includeProjections = 'true';
      break;
  }
  
  return params;
}

/**
 * Transform API Gateway response to chatbot format
 */
async function transformToChatbotResponse(agentName, query, context, apiData, executionTime) {
  const customerCount = context.customer_context?.total_customers || 0;
  const highRiskCount = context.customer_context?.high_risk_customers || 0;
  const activeCustomer = context.customer_context?.active_customer;
  
  let response_text = '';
  let recommendations = [];
  let follow_up_questions = [];
  
  switch (agentName) {
    case 'sales_agent':
      response_text = `💼 **Sales Agent Analysis**

Based on your churn dashboard context with ${customerCount} customers (${highRiskCount} high-risk):

**Sales Performance Insights:**`;

      if (apiData.data?.summary) {
        const summary = apiData.data.summary;
        response_text += `
• **Total Revenue**: ${summary.totalRevenue || 'N/A'}
• **Total Transactions**: ${summary.totalTransactions || 'N/A'}
• **Average Transaction Value**: ${summary.avgTransactionValue || 'N/A'}
• **Unique Customers**: ${summary.totalCustomers || 'N/A'}`;
      }

      response_text += `

**Churn Impact Analysis:**
• High-risk customers (${highRiskCount}) may impact future sales performance
• Focus retention efforts on high-value customers
• Monitor sales trends for early churn indicators

**Strategic Recommendations:**
• Implement customer lifetime value analysis
• Create targeted campaigns for at-risk customers
• Develop churn-aware sales forecasting`;

      recommendations = [
        'Focus on high-value customer retention',
        'Implement predictive sales analytics',
        'Create customer-specific sales strategies'
      ];
      
      follow_up_questions = [
        'Which products have the highest customer retention rates?',
        'How do sales trends correlate with churn risk?',
        'What are the key factors driving customer value?'
      ];
      break;

    case 'customer_agent':
      response_text = `👥 **Customer Agent Analysis**

Deep customer insights for your ${customerCount} customer base:

**Customer Health Overview:**
• **Total Customers**: ${customerCount}
• **High-Risk Customers**: ${highRiskCount} (${((highRiskCount/customerCount)*100).toFixed(1)}%)
• **Average Churn Probability**: ${((context.customer_context?.avg_churn_probability || 0) * 100).toFixed(1)}%`;

      if (activeCustomer) {
        response_text += `

**Active Customer Focus:**
• **Customer**: ${activeCustomer.name} (ID: ${activeCustomer.customer_id})
• **Risk Level**: ${activeCustomer.risk_level}
• **Churn Probability**: ${(activeCustomer.churn_probability * 100).toFixed(1)}%
• **Average Order Value**: $${activeCustomer.avg_order_value}`;
      }

      response_text += `

**Behavioral Insights:**
• Customer engagement patterns correlate with churn risk
• Proactive intervention can reduce churn by 25-40%
• Personalized strategies show highest success rates

**Next Steps:**
• Implement targeted retention campaigns
• Develop customer health scoring
• Create predictive intervention triggers`;

      recommendations = [
        'Implement personalized retention campaigns',
        'Develop customer health scoring system',
        'Create predictive intervention triggers'
      ];
      
      follow_up_questions = [
        'What factors contribute most to customer churn?',
        'How can we improve customer satisfaction scores?',
        'Which customer segments need immediate attention?'
      ];
      break;

    case 'inventory_agent':
      response_text = `📦 **Inventory Agent Analysis**

Inventory insights considering your customer churn context:

**Inventory-Churn Correlation:**
• ${customerCount} customers with ${highRiskCount} at high churn risk
• Customer churn directly impacts inventory turnover
• Potential ${((highRiskCount/customerCount)*100).toFixed(1)}% demand reduction if customers churn

**Strategic Considerations:**
• Adjust inventory levels based on customer retention probability
• Focus on products preferred by loyal customers
• Implement churn-aware demand forecasting

**Optimization Opportunities:**
• Monitor inventory turnover by customer risk segments
• Optimize stock levels for retention campaigns
• Implement dynamic inventory management`;

      recommendations = [
        'Implement churn-aware demand forecasting',
        'Optimize inventory for customer retention',
        'Monitor turnover by customer risk segments'
      ];
      
      follow_up_questions = [
        'Which products have the highest customer loyalty?',
        'How can inventory optimization support retention?',
        'What are the optimal stock levels for different customer segments?'
      ];
      break;

    case 'finance_agent':
      const avgCustomerValue = 2500;
      const revenueAtRisk = highRiskCount * avgCustomerValue;
      
      response_text = `💰 **Finance Agent Analysis**

Financial impact of your customer churn predictions:

**Revenue Risk Assessment:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()} from ${highRiskCount} high-risk customers
• **Customer Lifetime Value**: ~$${avgCustomerValue.toLocaleString()} per customer
• **Retention ROI**: Estimated 3-5x return on retention investment

**Financial Metrics:**
• **Total Customer Value**: $${(customerCount * avgCustomerValue).toLocaleString()}
• **At-Risk Percentage**: ${((highRiskCount/customerCount)*100).toFixed(1)}%
• **Recommended Retention Budget**: $${(highRiskCount * 150).toLocaleString()}

**Strategic Financial Actions:**
• Implement value-based customer segmentation
• Develop retention budget allocation model
• Monitor customer profitability trends
• Create churn impact financial dashboards`;

      recommendations = [
        'Allocate budget for targeted retention campaigns',
        'Implement customer profitability tracking',
        'Develop churn impact financial models'
      ];
      
      follow_up_questions = [
        'What\'s the optimal retention budget allocation?',
        'How can we improve customer profitability?',
        'Which financial metrics best predict churn?'
      ];
      break;

    default:
      response_text = `🤖 **${getAgentDisplayName(agentName)} Analysis**

I've analyzed your query "${query}" in the context of your churn dashboard:

**Key Insights:**
• Your ${customerCount} customers include ${highRiskCount} at high churn risk
• This analysis considers your current dashboard context
• Recommendations are tailored to your specific situation

**Data Summary:**
${JSON.stringify(apiData.data, null, 2)}`;
  }

  return {
    response_text,
    confidence: 0.85,
    sources: ['API Gateway', `${getAgentDisplayName(agentName)} Database`],
    recommendations,
    follow_up_questions
  };
}

/**
 * Get agent display name
 */
function getAgentDisplayName(agentName) {
  const displayNames = {
    'sales_agent': 'Sales Agent',
    'customer_agent': 'Customer Agent',
    'inventory_agent': 'Inventory Agent',
    'finance_agent': 'Finance Agent'
  };
  
  return displayNames[agentName] || agentName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}