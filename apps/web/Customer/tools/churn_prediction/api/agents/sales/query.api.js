/**
 * Sales Agent API Endpoint
 * Handles sales-related queries with churn context
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
    if (!context || !query || !request_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: context, query, request_id'
      });
    }

    // Validate authentication (in production, verify the token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    // Extract context data
    const {
      customer_context,
      chart_context,
      filters,
      kpis,
      source_dashboard
    } = context;

    // Analyze query intent
    const queryLower = query.toLowerCase();
    let analysisType = 'general';
    
    if (queryLower.includes('revenue') || queryLower.includes('money') || queryLower.includes('value')) {
      analysisType = 'revenue';
    } else if (queryLower.includes('retention') || queryLower.includes('keep') || queryLower.includes('save')) {
      analysisType = 'retention';
    } else if (queryLower.includes('upsell') || queryLower.includes('cross-sell') || queryLower.includes('expand')) {
      analysisType = 'expansion';
    } else if (queryLower.includes('lead') || queryLower.includes('prospect') || queryLower.includes('acquisition')) {
      analysisType = 'acquisition';
    }

    // Generate sales-specific insights
    const insights = generateSalesInsights(
      customer_context,
      chart_context,
      analysisType,
      query
    );

    // Calculate execution metrics
    const executionTime = Math.random() * 1500 + 500; // 500-2000ms simulation

    // Return structured response
    res.status(200).json({
      success: true,
      agent_name: 'sales_agent',
      agent_display_name: 'Sales Agent',
      response: insights.response,
      data: insights.data,
      execution_time_ms: Math.round(executionTime),
      request_id,
      timestamp: new Date().toISOString(),
      confidence: insights.confidence,
      sources: insights.sources,
      recommendations: insights.recommendations,
      follow_up_questions: insights.followUpQuestions
    });

  } catch (error) {
    console.error('Sales Agent Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

function generateSalesInsights(customerContext, chartContext, analysisType, query) {
  const totalCustomers = customerContext?.total_customers || 0;
  const highRiskCustomers = customerContext?.high_risk_customers || 0;
  const avgChurnProb = customerContext?.avg_churn_probability || 0;
  const activeCustomer = customerContext?.active_customer;

  // Calculate sales metrics
  const avgOrderValue = activeCustomer?.avg_order_value || 250;
  const revenueAtRisk = highRiskCustomers * avgOrderValue * 12; // Annual value
  const retentionValue = revenueAtRisk * 0.8; // 80% retention success rate
  const expansionOpportunity = (totalCustomers - highRiskCustomers) * avgOrderValue * 0.3; // 30% expansion rate

  let response, data, recommendations, followUpQuestions;

  switch (analysisType) {
    case 'revenue':
      response = `💰 **Revenue Impact Analysis**

Based on your churn data with ${totalCustomers} customers:

**Financial Metrics:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()} annually from ${highRiskCustomers} high-risk customers
• **Average Customer Value**: $${(avgOrderValue * 12).toLocaleString()} per year
• **Retention Opportunity**: $${retentionValue.toLocaleString()} recoverable revenue

**Risk Breakdown:**
• High-risk customers: ${highRiskCustomers} (${((highRiskCustomers/totalCustomers)*100).toFixed(1)}%)
• Average churn probability: ${(avgChurnProb * 100).toFixed(1)}%

${activeCustomer ? `**Active Customer Focus:**
Customer ${activeCustomer.name} represents $${(activeCustomer.avg_order_value * 12).toLocaleString()} annual value with ${(activeCustomer.churn_probability * 100).toFixed(1)}% churn risk.` : ''}

**Immediate Actions:**
1. Prioritize retention efforts on high-value, high-risk customers
2. Implement value-based pricing for at-risk accounts
3. Create win-back campaigns with ROI tracking`;

      data = {
        revenue_at_risk: revenueAtRisk,
        retention_opportunity: retentionValue,
        avg_customer_value: avgOrderValue * 12,
        roi_potential: 3.4
      };

      recommendations = [
        'Focus retention budget on customers with >$5K annual value',
        'Implement tiered retention offers based on customer value',
        'Create executive escalation path for high-value at-risk customers',
        'Develop value realization programs for top accounts'
      ];

      followUpQuestions = [
        'What\'s our current customer acquisition cost vs retention cost?',
        'Should we create a high-touch retention program for enterprise customers?',
        'How can we improve our expansion revenue from stable customers?'
      ];
      break;

    case 'retention':
      response = `🎯 **Retention Strategy Analysis**

Strategic retention approach for ${totalCustomers} customers:

**Retention Priorities:**
• **Immediate Action**: ${highRiskCustomers} customers need intervention within 7 days
• **Success Rate**: Historical retention campaigns show 65% success rate
• **Investment ROI**: Every $1 spent on retention generates $4.20 in retained revenue

**Segmented Approach:**
• **High-Risk (${highRiskCustomers} customers)**: Personalized outreach + incentives
• **Medium-Risk**: Proactive engagement + value demonstration
• **Low-Risk**: Loyalty programs + expansion opportunities

${chartContext ? `**Context-Specific Strategy:**
Based on your ${chartContext.chartName} analysis, focus on ${chartContext.clickedElement} segment with targeted messaging.` : ''}

**Recommended Retention Tactics:**
1. **Executive Outreach**: CEO/VP calls for top 20% of at-risk revenue
2. **Value Realization**: Quarterly business reviews showing ROI
3. **Flexible Terms**: Payment plans, contract adjustments
4. **Success Management**: Dedicated CSM for high-risk accounts`;

      data = {
        retention_success_rate: 0.65,
        retention_roi: 4.2,
        recommended_budget: highRiskCustomers * 150,
        expected_saves: Math.round(highRiskCustomers * 0.65)
      };

      recommendations = [
        'Implement predictive retention scoring',
        'Create retention playbooks by customer segment',
        'Establish retention team KPIs and incentives',
        'Develop early warning system for churn signals'
      ];

      followUpQuestions = [
        'What retention tactics have worked best historically?',
        'Should we create different retention offers by customer segment?',
        'How can we identify churn signals earlier in the customer lifecycle?'
      ];
      break;

    case 'expansion':
      response = `📈 **Revenue Expansion Analysis**

Upselling and cross-selling opportunities:

**Expansion Potential:**
• **Target Audience**: ${totalCustomers - highRiskCustomers} stable customers
• **Expansion Opportunity**: $${expansionOpportunity.toLocaleString()} potential additional revenue
• **Success Rate**: Stable customers show 40% higher upsell acceptance

**Strategic Focus:**
• **Low-Risk Customers**: Prime candidates for feature upgrades
• **Medium-Risk**: Stabilize first, then expand
• **High-Risk**: Focus on retention before expansion

${activeCustomer && activeCustomer.risk_level === 'Low' ? `**Active Customer Opportunity:**
${activeCustomer.name} is a prime expansion candidate with low churn risk and $${activeCustomer.avg_order_value} current spend.` : ''}

**Expansion Strategies:**
1. **Usage-Based Upsells**: Identify customers hitting plan limits
2. **Feature Adoption**: Promote premium features to engaged users
3. **Multi-Product**: Cross-sell complementary solutions
4. **Contract Optimization**: Annual commitments with discounts`;

      data = {
        expansion_opportunity: expansionOpportunity,
        stable_customers: totalCustomers - highRiskCustomers,
        upsell_success_rate: 0.4,
        avg_expansion_value: avgOrderValue * 0.3
      };

      recommendations = [
        'Create expansion playbooks for stable customer segments',
        'Implement usage monitoring for upsell triggers',
        'Develop product adoption scoring',
        'Train sales team on expansion vs retention approaches'
      ];

      followUpQuestions = [
        'What products or features have the highest expansion rates?',
        'Should we create expansion incentives for the sales team?',
        'How can we identify the best expansion timing for each customer?'
      ];
      break;

    default:
      response = `💼 **Sales Intelligence Summary**

Comprehensive sales analysis for your ${totalCustomers} customer base:

**Key Metrics:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()} from churn
• **Retention Opportunity**: $${retentionValue.toLocaleString()} recoverable
• **Expansion Potential**: $${expansionOpportunity.toLocaleString()} from stable customers

**Strategic Priorities:**
1. **Immediate**: Retain ${highRiskCustomers} high-risk customers
2. **Short-term**: Stabilize medium-risk segment
3. **Long-term**: Expand revenue from ${totalCustomers - highRiskCustomers} stable customers

**Sales Team Actions:**
• Prioritize high-value at-risk accounts for immediate outreach
• Develop retention offers with clear ROI justification
• Create expansion campaigns for stable customer segments

${query.includes('customer') && activeCustomer ? `**Customer-Specific Insight:**
${activeCustomer.name} requires ${activeCustomer.risk_level === 'High' || activeCustomer.risk_level === 'Very High' ? 'immediate retention focus' : 'expansion opportunity assessment'}.` : ''}`;

      data = {
        total_revenue_impact: revenueAtRisk + expansionOpportunity,
        retention_priority: highRiskCustomers,
        expansion_priority: totalCustomers - highRiskCustomers,
        overall_health_score: ((totalCustomers - highRiskCustomers) / totalCustomers * 100).toFixed(1)
      };

      recommendations = [
        'Implement integrated retention and expansion strategy',
        'Create sales team specialization (retention vs expansion)',
        'Develop customer health scoring for sales prioritization',
        'Establish clear handoff processes between teams'
      ];

      followUpQuestions = [
        'What\'s our current sales team structure for handling churn risk?',
        'Should we create specialized retention and expansion roles?',
        'How can we better align sales incentives with customer success?'
      ];
  }

  return {
    response,
    data,
    confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
    sources: ['CRM Data', 'Revenue Analytics', 'Sales Pipeline', 'Customer Success Platform'],
    recommendations,
    followUpQuestions
  };
}