/**
 * Agent Communication Service
 * Handles cross-agent queries and responses via API Gateway
 */

import { AgentConfig, getAgentConfig } from '../config/agentRegistry';
import { AgentQueryPayload, DashboardContext } from '../utils/contextPacker';

export interface AgentResponse {
  success: boolean;
  agent_name: string;
  agent_display_name: string;
  response_text: string;
  response_data?: any;
  execution_time_ms: number;
  request_id: string;
  timestamp: string;
  metadata?: {
    confidence_score?: number;
    data_sources?: string[];
    recommendations?: string[];
    follow_up_questions?: string[];
  };
}

export interface AgentError {
  success: false;
  agent_name: string;
  error_type: 'timeout' | 'auth_failed' | 'not_found' | 'server_error' | 'network_error';
  error_message: string;
  request_id: string;
  timestamp: string;
}

export type AgentResult = AgentResponse | AgentError;

/**
 * Send query to a specific agent via API Gateway
 */
export const queryAgent = async (
  agentName: string,
  payload: AgentQueryPayload,
  timeoutMs: number = 30000
): Promise<AgentResult> => {
  const startTime = Date.now();
  const agentConfig = getAgentConfig(agentName);
  
  console.log('🚀 queryAgent called:', {
    agentName,
    payload: {
      ...payload,
      context: {
        ...payload.context,
        customer_context: payload.context.customer_context ? {
          ...payload.context.customer_context,
          customer_list: payload.context.customer_context.customer_list ? 
            `[${payload.context.customer_context.customer_list.length} customers]` : undefined
        } : undefined
      }
    },
    agentConfig: agentConfig ? {
      name: agentConfig.name,
      displayName: agentConfig.displayName,
      endpoint: agentConfig.endpoint,
      isActive: agentConfig.isActive
    } : null
  });
  
  if (!agentConfig) {
    console.error('❌ Agent not found:', agentName);
    return {
      success: false,
      agent_name: agentName,
      error_type: 'not_found',
      error_message: `Agent '${agentName}' not found in registry`,
      request_id: payload.request_id,
      timestamp: new Date().toISOString()
    };
  }

  if (!agentConfig.isActive) {
    console.warn('⚠️ Agent is not active:', agentName);
    return {
      success: false,
      agent_name: agentName,
      error_type: 'not_found',
      error_message: `Agent '${agentName}' is currently not available. Please try another agent.`,
      request_id: payload.request_id,
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    // Use backend AI service endpoint with /run_sse - fallback to port 5000 for simpler backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
    const endpoint = `${backendUrl}/run_sse`;
    
    console.log('🌐 Making API call to backend AI:', {
      endpoint,
      method: 'POST',
      agentName,
      requestId: payload.request_id,
      priority: payload.priority,
      queryLength: payload.query.length,
      hasContext: !!payload.context
    });
    
    // Format request for simpler backend service (port 5000 style)
    const formattedQuery = `@${agentName} ${payload.query}`;
    const backendPayload = {
      user_query: formattedQuery,
      session_id: payload.request_id,
      user_id: payload.context.user_id || 'dashboard_user',
      app_name: 'churn_dashboard',
      is_canvas: false,
      context: {
        dashboard: payload.context.source_dashboard,
        customer_context: payload.context.customer_context,
        filters: payload.context.filters_applied,
        timestamp: payload.context.timestamp
      }
    };
    
    // Create fetch promise with format matching backend expectations
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(backendPayload)
    };

    const fetchPromise = fetch(endpoint, fetchOptions);

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    console.log('📡 API Response received:', {
      agentName,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      executionTime: Date.now() - startTime
    });
    
    if (!response.ok) {
      let errorText: string;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `Failed to read error response: ${e}`;
      }
      
      console.error('❌ API Error Response:', {
        agentName,
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return {
        success: false,
        agent_name: agentName,
        error_type: response.status === 401 ? 'auth_failed' : 
                   response.status === 404 ? 'not_found' :
                   response.status >= 500 ? 'server_error' : 'network_error',
        error_message: `HTTP ${response.status}: ${errorText || response.statusText}`,
        request_id: payload.request_id,
        timestamp: new Date().toISOString()
      };
    }

    let responseData: any = {};
    try {
      // Handle SSE response format
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      
      // Read the SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            
            if (data === '[DONE]' || data === '') continue;
            
            try {
              const jsonData = JSON.parse(data);
              console.log('📦 SSE chunk received:', jsonData);
              
              // Accumulate response data
              if (jsonData.agent_name) responseData.agent_name = jsonData.agent_name;
              if (jsonData.response) fullResponse += jsonData.response;
              if (jsonData.text) fullResponse += jsonData.text;
              if (jsonData.output) fullResponse += jsonData.output; // Handle output field
              if (jsonData.data) responseData.data = jsonData.data;
              if (jsonData.confidence) responseData.confidence = jsonData.confidence;
              if (jsonData.sources) responseData.sources = jsonData.sources;
              if (jsonData.is_visualisation !== undefined) responseData.is_visualisation = jsonData.is_visualisation;
              
            } catch (parseErr) {
              console.warn('Failed to parse SSE chunk:', data);
            }
          }
        }
      }
      
      // Format and clean the response text
      let formattedResponse = fullResponse || 'No response text provided';
      
      // Clean up any duplicate content or formatting issues
      formattedResponse = formattedResponse
        .replace(/<output>/g, '\n')  // Remove output tags
        .replace(/<\/output>/g, '\n')
        .replace(/<is_visualisation>.*?<\/is_visualisation>/g, '') // Remove visualization tags
        .trim();
      
      // Ensure proper markdown formatting for better display
      formattedResponse = formattedResponse
        .replace(/([A-Z][a-z]+ \d+:)/g, '\n**$1**')  // Bold headers like "Segment 1:"
        .replace(/I have analyzed/g, '\n## 📊 Analysis Results\n\nI have analyzed')
        .replace(/I am analyzing/g, '\n## 🔍 Analysis in Progress\n\nI am analyzing')
        .replace(/To leverage/g, '\n## 💡 Recommendations\n\nTo leverage')
        .replace(/Would you like/g, '\n\n❓ **Next Steps:** Would you like')
        .replace(/\n\n\n+/g, '\n\n');  // Remove excessive line breaks
      
      // Set the formatted response
      responseData.response = formattedResponse;
      responseData.success = true;
      
      console.log('📦 Final aggregated response:', responseData);
      
    } catch (e) {
      console.error('❌ Failed to parse SSE response:', e);
      return {
        success: false,
        agent_name: agentName,
        error_type: 'server_error',
        error_message: 'Failed to parse SSE response from agent',
        request_id: payload.request_id,
        timestamp: new Date().toISOString()
      };
    }
    
    const executionTime = Date.now() - startTime;

    console.log('✅ Successful API Response:', {
      agentName,
      success: responseData.success,
      hasResponse: !!responseData.response,
      hasData: !!responseData.data,
      executionTime
    });

    // Handle API Gateway response format
    if (responseData.success === false) {
      return {
        success: false,
        agent_name: agentName,
        error_type: 'server_error',
        error_message: responseData.error?.message || responseData.message || 'Unknown error from agent',
        request_id: payload.request_id,
        timestamp: new Date().toISOString()
      };
    }

    // Check if we got an empty or mock-like response from backend
    const hasValidResponse = responseData.response || responseData.response_text || responseData.message;
    
    // If backend returns empty/invalid, log warning and use what we have
    if (!hasValidResponse) {
      console.warn('⚠️ Backend returned empty response, check server implementation for agent:', agentName);
    }

    return {
      success: true,
      agent_name: agentName,
      agent_display_name: agentConfig.displayName,
      response_text: responseData.response || responseData.response_text || responseData.message || 'No response text provided',
      response_data: responseData.data,
      execution_time_ms: executionTime,
      request_id: payload.request_id,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence_score: responseData.confidence || responseData.confidence_score || 0.85,
        data_sources: responseData.sources || responseData.data_sources || ['Backend AI Service'],
        recommendations: responseData.recommendations || [],
        follow_up_questions: responseData.follow_up_questions || []
      }
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Agent query error:', {
      agentName,
      error: error.message,
      stack: error.stack,
      executionTime
    });
    
    let errorType: AgentError['error_type'] = 'network_error';
    let errorMessage = error.message;

    if (error.message === 'Request timeout') {
      errorType = 'timeout';
      errorMessage = `Agent did not respond within ${timeoutMs}ms. Please try again or contact support.`;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorType = 'network_error';
      errorMessage = 'Network error - agent endpoint unreachable. Please check your connection.';
    } else if (error.message.includes('Failed to fetch')) {
      errorType = 'network_error';
      errorMessage = 'Unable to connect to agent service. Please try again later.';
    }

    return {
      success: false,
      agent_name: agentName,
      error_type: errorType,
      error_message: errorMessage,
      request_id: payload.request_id,
      timestamp: new Date().toISOString()
    };
  }
};



/**
 * Send query to multiple agents in parallel
 */
export const queryMultipleAgents = async (
  agentNames: string[],
  payload: AgentQueryPayload,
  timeoutMs: number = 30000
): Promise<AgentResult[]> => {
  const promises = agentNames.map(agentName => {
    const agentPayload = {
      ...payload,
      mentioned_agent: agentName,
      request_id: `${payload.request_id}_${agentName}`
    };
    return queryAgent(agentName, agentPayload, timeoutMs);
  });

  return Promise.all(promises);
};

/**
 * Mock agent response for development/testing
 */
export const mockAgentResponse = (
  agentName: string,
  query: string,
  context: DashboardContext,
  requestId: string
): AgentResponse => {
  const agentConfig = getAgentConfig(agentName);
  const responses = generateMockResponses(agentName, query, context);
  
  return {
    success: true,
    agent_name: agentName,
    agent_display_name: agentConfig?.displayName || agentName,
    response_text: responses.text,
    response_data: responses.data,
    execution_time_ms: Math.random() * 2000 + 500, // 500-2500ms
    request_id: requestId,
    timestamp: new Date().toISOString(),
    metadata: {
      confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      data_sources: responses.sources,
      recommendations: responses.recommendations,
      follow_up_questions: responses.followUp
    }
  };
};

/**
 * Generate mock responses based on agent type and query
 */
const generateMockResponses = (agentName: string, query: string, context: DashboardContext) => {
  const customerCount = context.customer_context?.total_customers || 100;
  const highRiskCount = context.customer_context?.high_risk_customers || 22;
  const activeCustomer = context.customer_context?.active_customer;
  const avgChurnProb = context.customer_context?.avg_churn_probability || 0.35;

  switch (agentName) {
    case 'sales':
      // Sales department specific data
      const totalRevenue = 2457800;
      const avgDealSize = 24578;
      const topProducts = ['Enterprise Suite', 'Pro Analytics', 'Data Platform'];
      const quarterlyGrowth = 12.5;
      
      return {
        text: `💼 **Sales Intelligence Report**\n\n📊 **Current Sales Performance:**\n• **Total Revenue (YTD)**: $${totalRevenue.toLocaleString()}\n• **Average Deal Size**: $${avgDealSize.toLocaleString()}\n• **Quarterly Growth**: ${quarterlyGrowth}%\n• **Active Deals**: 147 in pipeline\n\n🎯 **Churn Impact on Sales:**\n• **Revenue at Risk**: $${(highRiskCount * avgDealSize * 0.3).toLocaleString()} from ${highRiskCount} high-risk customers\n• **Potential Lost Deals**: ${Math.floor(highRiskCount * 0.6)} renewal opportunities\n• **Upsell Impact**: ${(highRiskCount * 2.5).toLocaleString()} potential upsells at risk\n\n📈 **Top Performing Products:**\n${topProducts.map((p, i) => `${i + 1}. ${p} - ${(totalRevenue * (0.4 - i * 0.1) / totalRevenue * 100).toFixed(1)}% of revenue`).join('\n')}\n\n**Regional Performance:**\n• North America: 45% of revenue (+8% YoY)\n• Europe: 32% of revenue (+15% YoY)\n• APAC: 23% of revenue (+22% YoY)\n\n💡 **Sales Recommendations:**\n• Focus retention efforts on Enterprise Suite customers (highest CLV)\n• Launch "Win-Back" campaign for ${highRiskCount} at-risk accounts\n• Prioritize upsell opportunities with low-risk customers`,
        data: { 
          total_revenue: totalRevenue,
          avg_deal_size: avgDealSize,
          quarterly_growth: quarterlyGrowth,
          revenue_at_risk: highRiskCount * avgDealSize * 0.3,
          top_products: topProducts
        },
        sources: ['Salesforce CRM', 'Revenue Analytics', 'Sales Pipeline Dashboard', 'Regional Reports'],
        recommendations: [
          'Implement account-based retention strategy for Enterprise customers',
          'Create specialized renewal team for high-risk accounts',
          'Develop product-specific retention playbooks',
          'Increase sales-customer success collaboration'
        ],
        followUp: [
          'Which products have the highest churn rates?',
          'What\'s the revenue impact by customer segment?',
          'How can we improve our renewal rates?'
        ]
      };

    case 'customer':
      // Customer department specific data
      const totalCustomers = customerCount || 100;
      const segments = {
        enterprise: Math.floor(totalCustomers * 0.2),
        midmarket: Math.floor(totalCustomers * 0.35),
        smb: Math.floor(totalCustomers * 0.45)
      };
      const avgSatisfaction = 7.8;
      const npsScore = 42;
      
      return {
        text: `👥 **Customer Intelligence Analysis**\n\n📊 **Customer Base Overview:**\n• **Total Active Customers**: ${totalCustomers}\n• **High-Risk Customers**: ${highRiskCount} (${(highRiskCount/totalCustomers*100).toFixed(1)}%)\n• **Average Churn Probability**: ${(avgChurnProb * 100).toFixed(1)}%\n• **NPS Score**: ${npsScore} (Industry avg: 32)\n\n🎯 **Customer Segmentation:**\n• **Enterprise**: ${segments.enterprise} customers (20% of base, 45% of revenue)\n• **Mid-Market**: ${segments.midmarket} customers (35% of base, 35% of revenue)\n• **SMB**: ${segments.smb} customers (45% of base, 20% of revenue)\n\n📈 **Behavioral Insights:**\n• **Avg Customer Satisfaction**: ${avgSatisfaction}/10\n• **Feature Adoption Rate**: 68% using 3+ features\n• **Engagement Score**: 6.2/10 average\n• **Support Tickets**: 3.2 avg per high-risk customer\n\n🔍 **Risk Analysis by Segment:**\n• Enterprise: ${Math.floor(highRiskCount * 0.15)} at risk (Critical revenue impact)\n• Mid-Market: ${Math.floor(highRiskCount * 0.35)} at risk (Moderate impact)\n• SMB: ${Math.floor(highRiskCount * 0.5)} at risk (Volume concern)\n\n**Top Churn Indicators:**\n1. Low feature adoption (<2 features used)\n2. Support ticket volume >5 in 30 days\n3. Login frequency <1x per week\n4. Payment delays or disputes\n\n💡 **Customer Success Actions:**\n• Launch proactive health checks for ${highRiskCount} at-risk accounts\n• Implement segment-specific retention programs\n• Increase onboarding quality for new customers`,
        data: {
          total_customers: totalCustomers,
          high_risk_count: highRiskCount,
          segments: segments,
          nps_score: npsScore,
          avg_satisfaction: avgSatisfaction,
          churn_probability: avgChurnProb
        },
        sources: ['Customer Database', 'Segmentation Engine', 'NPS Surveys', 'Usage Analytics'],
        recommendations: [
          'Create dedicated success manager for Enterprise accounts',
          'Implement automated engagement scoring',
          'Develop risk-based intervention playbooks',
          'Enhance onboarding program to improve adoption'
        ],
        followUp: [
          'Which customer segment has the highest churn rate?',
          'What are the common traits of our most loyal customers?',
          'How can we improve feature adoption rates?'
        ]
      };

    case 'finance':
      // Finance department specific data
      const mrr = 425000;
      const arr = mrr * 12;
      const cac = 8500;
      const ltv = 45000;
      const grossMargin = 72;
      
      return {
        text: `💰 **Financial Intelligence Report**\n\n📊 **Key Financial Metrics:**\n• **Monthly Recurring Revenue**: $${mrr.toLocaleString()}\n• **Annual Recurring Revenue**: $${arr.toLocaleString()}\n• **Gross Margin**: ${grossMargin}%\n• **LTV:CAC Ratio**: ${(ltv/cac).toFixed(1)}:1\n\n💸 **Churn Financial Impact:**\n• **MRR at Risk**: $${(mrr * (highRiskCount/100)).toLocaleString()} from high-risk customers\n• **Annual Revenue Impact**: $${(arr * (highRiskCount/100)).toLocaleString()}\n• **Customer Lifetime Value Loss**: $${(highRiskCount * ltv).toLocaleString()}\n• **Replacement Cost**: $${(highRiskCount * cac).toLocaleString()} to acquire new customers\n\n📈 **Financial Performance:**\n• **Revenue Growth Rate**: 28% YoY\n• **Customer Acquisition Cost**: $${cac.toLocaleString()}\n• **Average Customer LTV**: $${ltv.toLocaleString()}\n• **Payback Period**: ${(cac/(mrr/customerCount)).toFixed(1)} months\n\n💡 **ROI Analysis:**\n• **Retention Investment Needed**: $${(highRiskCount * 1500).toLocaleString()}\n• **Expected Save Rate**: 65% of at-risk customers\n• **Net Financial Benefit**: $${((highRiskCount * 0.65 * ltv) - (highRiskCount * 1500)).toLocaleString()}\n• **ROI on Retention**: ${(((highRiskCount * 0.65 * ltv) - (highRiskCount * 1500))/(highRiskCount * 1500) * 100).toFixed(0)}%\n\n**Budget Allocation Recommendations:**\n• Customer Success: +$${(mrr * 0.08).toLocaleString()}/month\n• Retention Programs: $${(highRiskCount * 1500).toLocaleString()} one-time\n• Product Improvements: $${(mrr * 0.15).toLocaleString()}/month\n\n⚠️ **Financial Risks:**\n• Churn trend could reduce valuation by ${((highRiskCount/customerCount) * 15).toFixed(1)}%\n• Cash flow impact: -$${(mrr * (highRiskCount/100)).toLocaleString()}/month if not addressed`,
        data: {
          mrr: mrr,
          arr: arr,
          cac: cac,
          ltv: ltv,
          gross_margin: grossMargin,
          mrr_at_risk: mrr * (highRiskCount/100),
          retention_roi: ((highRiskCount * 0.65 * ltv) - (highRiskCount * 1500))/(highRiskCount * 1500)
        },
        sources: ['Financial Systems', 'Revenue Reports', 'P&L Statements', 'Budget Analytics'],
        recommendations: [
          'Increase retention budget by 25% for next quarter',
          'Implement value-based pricing for at-risk segments',
          'Create financial incentives for customer success team',
          'Develop unit economics dashboard for real-time monitoring'
        ],
        followUp: [
          'What\'s the break-even point for our retention investments?',
          'How does churn impact our unit economics?',
          'Should we adjust pricing for different risk segments?'
        ]
      };

    case 'inventory':
      // Inventory department specific data
      const totalSKUs = 3450;
      const inventoryValue = 1.8e6;
      const stockoutRate = 3.2;
      const holdingCost = 125000;
      
      return {
        text: `📦 **Inventory Intelligence Report**\n\n📊 **Inventory Overview:**\n• **Total SKUs**: ${totalSKUs.toLocaleString()}\n• **Total Inventory Value**: $${(inventoryValue/1e6).toFixed(1)}M\n• **Avg Holding Cost**: $${holdingCost.toLocaleString()}/month\n• **Stockout Rate**: ${stockoutRate}%\n\n🎯 **Churn Impact on Inventory:**\n• **Demand Reduction Risk**: ${(highRiskCount/customerCount*100).toFixed(1)}% potential decrease\n• **Excess Inventory Risk**: $${(inventoryValue * highRiskCount/customerCount * 0.3).toLocaleString()}\n• **SKUs at Risk**: ${Math.floor(totalSKUs * highRiskCount/customerCount)} items\n• **Holding Cost Impact**: +$${(holdingCost * 0.15).toLocaleString()}/month if demand drops\n\n📈 **Inventory Performance:**\n• **Inventory Turnover**: 8.2x per year\n• **Days Sales of Inventory**: 44.5 days\n• **Fill Rate**: ${100 - stockoutRate}%\n• **Dead Stock**: $${(inventoryValue * 0.05).toLocaleString()} (5% of total)\n\n🔍 **Category Analysis:**\n• **Fast-Moving**: 450 SKUs (70% of revenue)\n• **Medium-Moving**: 1,200 SKUs (25% of revenue)\n• **Slow-Moving**: 1,800 SKUs (5% of revenue)\n\n**Customer Segment Inventory Patterns:**\n• High-risk customers order 35% less frequently\n• Average order size: 40% smaller for at-risk customers\n• Product mix: High-risk prefer low-margin items\n\n💡 **Inventory Optimization Actions:**\n• Adjust safety stock based on customer retention probability\n• Reduce orders for SKUs preferred by high-risk customers\n• Implement dynamic reorder points based on churn predictions\n• Focus on fast-moving items for stable customers\n\n⚠️ **Risk Mitigation:**\n• Create contingency plan for ${(highRiskCount/customerCount*100).toFixed(1)}% demand drop\n• Identify alternative channels for excess inventory\n• Negotiate flexible supplier terms for at-risk SKUs`,
        data: {
          total_skus: totalSKUs,
          inventory_value: inventoryValue,
          holding_cost: holdingCost,
          stockout_rate: stockoutRate,
          excess_risk: inventoryValue * highRiskCount/customerCount * 0.3,
          turnover_rate: 8.2
        },
        sources: ['Inventory Management System', 'Demand Planning Tools', 'Warehouse Analytics', 'Supply Chain Dashboard'],
        recommendations: [
          'Implement AI-based demand forecasting with churn inputs',
          'Create flexible inventory model for volatile customer base',
          'Develop liquidation strategy for at-risk inventory',
          'Optimize warehouse space based on stable customer demand'
        ],
        followUp: [
          'Which products are most affected by customer churn?',
          'How can we optimize inventory for retained customers?',
          'What\'s the cost of holding excess inventory from churned customers?'
        ]
      };

    default:
      return {
        text: `🤖 **${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent Analysis**\n\nI'm analyzing your request about "${query}".\n\nBased on the current dashboard context:\n• Total Customers: ${customerCount}\n• High-Risk Customers: ${highRiskCount}\n• Average Churn Risk: ${(avgChurnProb * 100).toFixed(1)}%\n\nHow can I provide more specific insights for your needs?`,
        data: {
          customers: customerCount,
          high_risk: highRiskCount,
          avg_churn: avgChurnProb
        },
        sources: ['Dashboard Analytics'],
        recommendations: ['Request specific analysis from specialized agents'],
        followUp: ['What specific metrics would you like to explore?']
      };
  }
};

/**
 * Generate sales agent response from API data
 */
async function generateSalesResponse(apiResponse: any, query: string, context: DashboardContext): Promise<string> {
  const customerCount = context.customer_context?.total_customers || 0;
  const highRiskCount = context.customer_context?.high_risk_customers || 0;
  
  if (apiResponse.data?.products) {
    const products = apiResponse.data.products;
    const summary = apiResponse.data.summary;
    
    return `💼 **Sales Performance Analysis**

Based on your churn context with ${customerCount} customers (${highRiskCount} high-risk):

**Product Performance Insights:**
• **Top Performer**: ${products[0]?.productId || 'N/A'} with ${products[0]?.totalRevenue || '$0'} revenue
• **Total Products Analyzed**: ${summary?.totalProducts || 0}
• **Total Revenue**: ${summary?.totalRevenue || '$0'}
• **Average Revenue per Product**: ${summary?.avgRevenuePerProduct || '$0'}

**Churn Impact Analysis:**
• High-risk customers likely contribute to ${Math.round((highRiskCount / customerCount) * 100)}% of potential revenue loss
• Focus retention efforts on customers purchasing top-performing products
• Consider bundling strategies for underperforming products

**Strategic Recommendations:**
• Prioritize retention campaigns for high-value product customers
• Analyze purchase patterns of churning vs. retained customers
• Implement product-specific retention strategies

Would you like me to dive deeper into specific product performance or customer segments?`;
  }

  if (apiResponse.data?.trends) {
    const trends = apiResponse.data.trends;
    const summary = apiResponse.data.summary;
    
    return `💼 **Sales Trends Analysis**

Sales performance trends in context of your ${customerCount} customers:

**Trend Overview:**
• **Total Periods**: ${summary?.totalPeriods || 0}
• **Overall Revenue**: ${summary?.overallRevenue || '$0'}
• **Growth Rate**: ${summary?.overallGrowth || 0}%
• **Total Transactions**: ${summary?.totalTransactions || 0}

**Churn Correlation:**
• Monitor if sales decline correlates with increased churn risk
• ${highRiskCount} high-risk customers may impact future trends
• Consider seasonal patterns in both sales and churn

**Action Items:**
• Implement predictive analytics to forecast churn impact on sales
• Create targeted campaigns during low-performance periods
• Focus on customer retention during peak sales periods

What specific time period or trend would you like me to analyze further?`;
  }

  return `💼 **Sales Agent Analysis**

I've analyzed your sales data in the context of your churn prediction dashboard:

**Key Insights:**
• Your ${customerCount} customers include ${highRiskCount} at high churn risk
• Sales performance directly correlates with customer retention
• Revenue optimization requires both acquisition and retention focus

**Recommendations:**
• Implement customer lifetime value analysis
• Focus on high-value customer retention
• Develop churn-aware sales strategies

How can I help you optimize your sales approach for better customer retention?`;
}

/**
 * Generate customer agent response from API data
 */
async function generateCustomerResponse(apiResponse: any, query: string, context: DashboardContext): Promise<string> {
  const customerCount = context.customer_context?.total_customers || 0;
  const highRiskCount = context.customer_context?.high_risk_customers || 0;
  const activeCustomer = context.customer_context?.active_customer;
  
  return `👥 **Customer Intelligence Analysis**

Deep customer insights for your ${customerCount} customer base:

**Current Customer Health:**
• **Total Customers**: ${customerCount}
• **High-Risk Customers**: ${highRiskCount} (${((highRiskCount/customerCount)*100).toFixed(1)}%)
• **Average Churn Probability**: ${((context.customer_context?.avg_churn_probability || 0) * 100).toFixed(1)}%

${activeCustomer ? `**Active Customer Focus:**
• **Customer**: ${activeCustomer.name} (ID: ${activeCustomer.customer_id})
• **Risk Level**: ${activeCustomer.risk_level}
• **Churn Probability**: ${(activeCustomer.churn_probability * 100).toFixed(1)}%
• **Average Order Value**: $${activeCustomer.avg_order_value}
• **Purchase Frequency**: ${activeCustomer.frequency} transactions` : ''}

**Behavioral Insights:**
• Customer engagement patterns show correlation with churn risk
• High-risk customers typically have lower purchase frequency
• Proactive intervention can reduce churn probability by 25-40%

**Segmentation Strategy:**
• **Immediate Action**: Focus on ${highRiskCount} high-risk customers
• **Preventive Care**: Monitor medium-risk customers closely  
• **Growth Opportunity**: Expand relationships with low-risk customers

**Next Steps:**
• Implement personalized retention campaigns
• Develop customer health scoring
• Create predictive intervention triggers

Which customer segment or specific customer would you like me to analyze in detail?`;
}

/**
 * Generate inventory agent response from API data
 */
async function generateInventoryResponse(apiResponse: any, query: string, context: DashboardContext): Promise<string> {
  const customerCount = context.customer_context?.total_customers || 0;
  const highRiskCount = context.customer_context?.high_risk_customers || 0;
  
  return `📦 **Inventory Intelligence Analysis**

Inventory insights considering your customer churn context:

**Inventory-Churn Correlation:**
• ${customerCount} customers with ${highRiskCount} at high churn risk
• Customer churn directly impacts inventory turnover rates
• High-risk customers may affect demand forecasting accuracy

**Strategic Inventory Considerations:**
• **Demand Impact**: Potential ${((highRiskCount/customerCount)*100).toFixed(1)}% reduction in demand if high-risk customers churn
• **Stock Optimization**: Adjust inventory levels based on customer retention probability
• **Product Mix**: Focus on products preferred by loyal, low-risk customers

**Recommendations:**
• Implement churn-aware demand forecasting
• Optimize inventory for customer retention campaigns
• Monitor inventory turnover by customer risk segments
• Adjust safety stock levels based on customer stability

**Action Items:**
• Analyze purchase patterns of churning vs. retained customers
• Optimize inventory allocation for retention campaigns
• Implement dynamic inventory management based on customer health

Would you like me to analyze specific product categories or inventory optimization strategies?`;
}

/**
 * Generate finance agent response from API data
 */
async function generateFinanceResponse(apiResponse: any, query: string, context: DashboardContext): Promise<string> {
  const customerCount = context.customer_context?.total_customers || 0;
  const highRiskCount = context.customer_context?.high_risk_customers || 0;
  const avgChurnProb = context.customer_context?.avg_churn_probability || 0;
  
  // Calculate financial impact estimates
  const avgCustomerValue = 2500; // Estimated annual customer value
  const revenueAtRisk = highRiskCount * avgCustomerValue;
  const retentionCost = highRiskCount * 150; // Estimated retention cost per customer
  const retentionROI = (revenueAtRisk * 0.7) / retentionCost; // 70% retention success rate
  
  return `💰 **Financial Impact Analysis**

Financial implications of your customer churn predictions:

**Revenue Risk Assessment:**
• **Total Customers**: ${customerCount}
• **High-Risk Customers**: ${highRiskCount}
• **Average Churn Probability**: ${(avgChurnProb * 100).toFixed(1)}%

**Financial Metrics:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()} annually
• **Estimated Retention Cost**: $${retentionCost.toLocaleString()}
• **Potential ROI**: ${retentionROI.toFixed(1)}x return on retention investment
• **Break-even Retention Rate**: ${(1/retentionROI*100).toFixed(1)}%

**Cost-Benefit Analysis:**
• **Customer Acquisition Cost**: ~$300-500 per customer
• **Retention Cost**: ~$150 per at-risk customer
• **Customer Lifetime Value**: ~$2,500 annually
• **Retention Savings**: ${((avgCustomerValue - 150) * highRiskCount).toLocaleString()} vs. replacement costs

**Budget Recommendations:**
• Allocate $${retentionCost.toLocaleString()} for retention campaigns
• Expected revenue protection: $${(revenueAtRisk * 0.7).toLocaleString()}
• Net financial benefit: $${((revenueAtRisk * 0.7) - retentionCost).toLocaleString()}

**Strategic Financial Actions:**
• Implement value-based customer segmentation
• Develop retention budget allocation model
• Create churn impact financial dashboards
• Monitor customer profitability trends

Would you like me to analyze specific financial scenarios or ROI calculations for different retention strategies?`;
}

/**
 * Check agent health/availability via API Gateway
 */
export const checkAgentHealth = async (agentName: string): Promise<{
  available: boolean;
  response_time_ms?: number;
  error?: string;
}> => {
  const agentConfig = getAgentConfig(agentName);
  
  if (!agentConfig) {
    return { available: false, error: 'Agent not found' };
  }

  try {
    const startTime = Date.now();
    // Use API Gateway health endpoint
    const healthEndpoint = agentConfig.endpoint.replace('/api/v1/', '/health/');
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${agentConfig.authToken}`
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      available: response.ok,
      response_time_ms: responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      available: false,
      error: error.message
    };
  }
};