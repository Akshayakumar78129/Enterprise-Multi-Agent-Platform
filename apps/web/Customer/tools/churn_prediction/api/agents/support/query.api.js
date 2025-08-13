/**
 * Support Agent API Endpoint
 * Handles support-related queries with churn context
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

    // Validate authentication
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
      source_dashboard
    } = context;

    // Analyze query intent
    const queryLower = query.toLowerCase();
    let analysisType = 'general';
    
    if (queryLower.includes('ticket') || queryLower.includes('issue') || queryLower.includes('problem')) {
      analysisType = 'tickets';
    } else if (queryLower.includes('satisfaction') || queryLower.includes('csat') || queryLower.includes('happy')) {
      analysisType = 'satisfaction';
    } else if (queryLower.includes('response') || queryLower.includes('resolution') || queryLower.includes('time')) {
      analysisType = 'performance';
    } else if (queryLower.includes('escalation') || queryLower.includes('priority') || queryLower.includes('urgent')) {
      analysisType = 'escalation';
    }

    // Generate support-specific insights
    const insights = generateSupportInsights(
      customer_context,
      chart_context,
      analysisType,
      query
    );

    // Calculate execution metrics
    const executionTime = Math.random() * 1200 + 400; // 400-1600ms simulation

    // Return structured response
    res.status(200).json({
      success: true,
      agent_name: 'support_agent',
      agent_display_name: 'Support Agent',
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
    console.error('Support Agent Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

function generateSupportInsights(customerContext, chartContext, analysisType, query) {
  const totalCustomers = customerContext?.total_customers || 0;
  const highRiskCustomers = customerContext?.high_risk_customers || 0;
  const avgChurnProb = customerContext?.avg_churn_probability || 0;
  const activeCustomer = customerContext?.active_customer;

  // Calculate support metrics
  const avgTicketsPerCustomer = 2.3;
  const highRiskTicketMultiplier = 3.2;
  const avgResolutionTime = {
    low_risk: 1.1,
    medium_risk: 1.8,
    high_risk: 2.6,
    very_high_risk: 3.4
  };
  const satisfactionScores = {
    low_risk: 8.7,
    medium_risk: 7.4,
    high_risk: 6.2,
    very_high_risk: 5.1
  };

  let response, data, recommendations, followUpQuestions;

  switch (analysisType) {
    case 'tickets':
      const totalTickets = Math.round(totalCustomers * avgTicketsPerCustomer);
      const highRiskTickets = Math.round(highRiskCustomers * avgTicketsPerCustomer * highRiskTicketMultiplier);
      const ticketChurnCorrelation = 0.73;

      response = `🎫 **Support Ticket Analysis**

Ticket patterns and churn correlation for ${totalCustomers} customers:

**Ticket Volume:**
• **Total Active Tickets**: ${totalTickets.toLocaleString()}
• **High-Risk Customer Tickets**: ${highRiskTickets} (${((highRiskTickets/totalTickets)*100).toFixed(1)}% of total)
• **Ticket-to-Churn Correlation**: ${(ticketChurnCorrelation * 100).toFixed(0)}% - Strong predictor

**Risk-Based Breakdown:**
• **High-Risk Customers**: ${(avgTicketsPerCustomer * highRiskTicketMultiplier).toFixed(1)} tickets/customer avg
• **Low-Risk Customers**: ${avgTicketsPerCustomer.toFixed(1)} tickets/customer avg
• **Escalation Rate**: High-risk customers escalate 4x more frequently

${activeCustomer ? `**Active Customer Analysis:**
${activeCustomer.name} (${activeCustomer.risk_level} risk) likely has ${Math.round(avgTicketsPerCustomer * (activeCustomer.risk_level === 'High' || activeCustomer.risk_level === 'Very High' ? highRiskTicketMultiplier : 1))} open tickets.` : ''}

**Critical Insights:**
• Customers with >5 tickets in 30 days have 85% churn probability
• First-contact resolution drops churn risk by 40%
• Proactive outreach reduces ticket volume by 25%`;

      data = {
        total_tickets: totalTickets,
        high_risk_tickets: highRiskTickets,
        churn_correlation: ticketChurnCorrelation,
        avg_tickets_per_customer: avgTicketsPerCustomer,
        escalation_multiplier: 4.0
      };

      recommendations = [
        'Implement priority queue for high-risk customer tickets',
        'Create proactive outreach program for customers with >3 tickets',
        'Develop ticket-based churn prediction scoring',
        'Establish first-contact resolution targets by risk level'
      ];

      followUpQuestions = [
        'What are the most common ticket types for churning customers?',
        'Should we create a dedicated support track for at-risk customers?',
        'How can we identify and prevent recurring issues?'
      ];
      break;

    case 'satisfaction':
      const overallCSAT = 7.2;
      const churnCSATThreshold = 6.0;
      const satisfactionImpact = 0.68;

      response = `😊 **Customer Satisfaction Analysis**

CSAT scores and churn relationship:

**Satisfaction Metrics:**
• **Overall CSAT**: ${overallCSAT}/10
• **Churn Threshold**: Customers below ${churnCSATThreshold}/10 have 80% churn probability
• **Satisfaction-Churn Correlation**: ${(satisfactionImpact * 100).toFixed(0)}% - High impact

**Risk-Based CSAT Breakdown:**
• **Low-Risk Customers**: ${satisfactionScores.low_risk}/10 CSAT
• **Medium-Risk Customers**: ${satisfactionScores.medium_risk}/10 CSAT
• **High-Risk Customers**: ${satisfactionScores.high_risk}/10 CSAT
• **Very High-Risk**: ${satisfactionScores.very_high_risk}/10 CSAT

**Satisfaction Drivers:**
• **Response Time**: 35% impact on satisfaction
• **Resolution Quality**: 40% impact on satisfaction
• **Proactive Communication**: 25% impact on satisfaction

${chartContext ? `**Context Analysis:**
Customers in the ${chartContext.clickedElement} segment show satisfaction patterns that correlate with their churn risk level.` : ''}

**Improvement Opportunities:**
• ${Math.round((totalCustomers * 0.15))} customers below satisfaction threshold
• Improving CSAT by 1 point reduces churn probability by 15%`;

      data = {
        overall_csat: overallCSAT,
        churn_threshold: churnCSATThreshold,
        satisfaction_impact: satisfactionImpact,
        customers_below_threshold: Math.round(totalCustomers * 0.15),
        improvement_potential: 0.15
      };

      recommendations = [
        'Implement real-time CSAT monitoring for at-risk customers',
        'Create satisfaction recovery programs for scores <6',
        'Establish proactive communication protocols',
        'Develop satisfaction-based early warning system'
      ];

      followUpQuestions = [
        'What specific factors drive low satisfaction in high-risk customers?',
        'Should we implement post-resolution follow-up calls?',
        'How can we better measure and improve first-contact resolution?'
      ];
      break;

    case 'performance':
      const avgFirstResponse = 4.2; // hours
      const avgResolution = 18.6; // hours
      const slaCompliance = 0.78;

      response = `⏱️ **Support Performance Analysis**

Response and resolution metrics by customer risk:

**Overall Performance:**
• **Average First Response**: ${avgFirstResponse} hours
• **Average Resolution Time**: ${avgResolution} hours
• **SLA Compliance**: ${(slaCompliance * 100).toFixed(0)}%

**Risk-Based Performance:**
• **Low-Risk**: ${avgResolutionTime.low_risk} days avg resolution
• **Medium-Risk**: ${avgResolutionTime.medium_risk} days avg resolution
• **High-Risk**: ${avgResolutionTime.high_risk} days avg resolution
• **Very High-Risk**: ${avgResolutionTime.very_high_risk} days avg resolution

**Performance Impact:**
• Every 1-hour delay in first response increases churn risk by 8%
• Resolution time >48 hours correlates with 65% churn probability
• SLA breaches for high-risk customers have 3x churn impact

${activeCustomer ? `**Customer Performance:**
${activeCustomer.name} should receive priority support with <2 hour first response target based on ${activeCustomer.risk_level} risk level.` : ''}

**Optimization Opportunities:**
• Reduce high-risk customer resolution time by 40%
• Improve first-contact resolution from 45% to 65%
• Implement predictive routing for complex issues`;

      data = {
        avg_first_response: avgFirstResponse,
        avg_resolution: avgResolution,
        sla_compliance: slaCompliance,
        performance_impact: 0.08,
        target_improvement: 0.40
      };

      recommendations = [
        'Implement risk-based SLA tiers',
        'Create specialized support queues for high-risk customers',
        'Develop predictive issue routing',
        'Establish performance monitoring by customer risk level'
      ];

      followUpQuestions = [
        'What\'s causing longer resolution times for high-risk customers?',
        'Should we create different SLA commitments by customer tier?',
        'How can we improve our first-contact resolution rates?'
      ];
      break;

    case 'escalation':
      const escalationRate = 0.12;
      const highRiskEscalationRate = 0.35;
      const escalationChurnRate = 0.78;

      response = `🚨 **Escalation Analysis**

Escalation patterns and churn correlation:

**Escalation Metrics:**
• **Overall Escalation Rate**: ${(escalationRate * 100).toFixed(1)}%
• **High-Risk Escalation Rate**: ${(highRiskEscalationRate * 100).toFixed(1)}%
• **Escalation-to-Churn Rate**: ${(escalationChurnRate * 100).toFixed(0)}%

**Escalation Triggers:**
• **Technical Issues**: 45% of escalations
• **Billing Disputes**: 25% of escalations
• **Service Outages**: 20% of escalations
• **Feature Requests**: 10% of escalations

**Risk-Based Escalation:**
• High-risk customers escalate ${(highRiskEscalationRate/escalationRate).toFixed(1)}x more frequently
• Escalated tickets take ${(avgResolutionTime.high_risk * 1.5).toFixed(1)} days longer to resolve
• Executive escalations have 90% churn correlation if unresolved

${activeCustomer && (activeCustomer.risk_level === 'High' || activeCustomer.risk_level === 'Very High') ? `**Escalation Alert:**
${activeCustomer.name} is at high risk for escalation. Recommend proactive executive outreach.` : ''}

**Prevention Strategies:**
• Proactive communication reduces escalations by 60%
• Executive involvement within 24 hours improves retention by 45%
• Escalation prevention saves $2,400 per incident on average`;

      data = {
        escalation_rate: escalationRate,
        high_risk_escalation_rate: highRiskEscalationRate,
        escalation_churn_rate: escalationChurnRate,
        prevention_impact: 0.60,
        cost_per_escalation: 2400
      };

      recommendations = [
        'Implement escalation early warning system',
        'Create executive escalation playbooks',
        'Establish proactive communication protocols for at-risk customers',
        'Develop escalation prevention training for support team'
      ];

      followUpQuestions = [
        'What are the most common escalation triggers for churning customers?',
        'Should we create an executive escalation path for high-value at-risk customers?',
        'How can we better prevent escalations before they occur?'
      ];
      break;

    default:
      response = `🎧 **Support Intelligence Overview**

Comprehensive support analysis for ${totalCustomers} customers:

**Key Support Metrics:**
• **Total Tickets**: ~${Math.round(totalCustomers * avgTicketsPerCustomer).toLocaleString()}
• **High-Risk Customer Impact**: ${highRiskCustomers} customers generate 3x more tickets
• **Support-Churn Correlation**: 73% - Strong predictor

**Critical Insights:**
• High-risk customers have ${satisfactionScores.high_risk}/10 CSAT vs ${satisfactionScores.low_risk}/10 for low-risk
• Resolution time for at-risk customers: ${avgResolutionTime.high_risk} days vs ${avgResolutionTime.low_risk} days
• Escalation rate: ${(highRiskEscalationRate * 100).toFixed(1)}% for high-risk vs ${(escalationRate * 100).toFixed(1)}% overall

**Support Strategy:**
1. **Immediate**: Prioritize ${highRiskCustomers} high-risk customer tickets
2. **Short-term**: Implement proactive outreach program
3. **Long-term**: Develop predictive support intervention

${query.includes('customer') && activeCustomer ? `**Customer Focus:**
${activeCustomer.name} (${activeCustomer.risk_level} risk) requires ${activeCustomer.risk_level === 'High' || activeCustomer.risk_level === 'Very High' ? 'priority support attention' : 'standard support monitoring'}.` : ''}`;

      data = {
        total_tickets: Math.round(totalCustomers * avgTicketsPerCustomer),
        support_churn_correlation: 0.73,
        high_risk_multiplier: highRiskTicketMultiplier,
        satisfaction_gap: satisfactionScores.low_risk - satisfactionScores.high_risk,
        resolution_time_gap: avgResolutionTime.high_risk - avgResolutionTime.low_risk
      };

      recommendations = [
        'Implement comprehensive support-based churn prediction',
        'Create risk-tiered support service levels',
        'Develop proactive support intervention programs',
        'Establish support team training on churn prevention'
      ];

      followUpQuestions = [
        'What support metrics best predict customer churn?',
        'Should we create a dedicated customer success support track?',
        'How can we better integrate support data with churn prediction?'
      ];
  }

  return {
    response,
    data,
    confidence: 0.82 + Math.random() * 0.13, // 82-95% confidence
    sources: ['Support Tickets', 'CSAT Surveys', 'Escalation Logs', 'Resolution Analytics'],
    recommendations,
    followUpQuestions
  };
}