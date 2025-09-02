/**
 * Customer Insight Agent Router
 * Handles AI responses for customer engagement insights
 */

import { getCustomerInsightMode } from './globals';

// Session interface
export interface CustomerInsightSession {
  session_id: string;
  user_id: string;
  app_name: 'customer_insight_agent';
}

// Response formatting based on mode
const formatResponseByMode = (content: string, mode: 'talk' | 'insights' | 'detailed'): string => {
  switch (mode) {
    case 'talk':
      // Limit to 6 lines for conversational mode
      const talkLines = content.split('\n').slice(0, 6);
      return talkLines.join('\n');
      
    case 'insights':
      // Format as bullet points, limit to 15
      const insights = content.split('\n')
        .filter(line => line.trim())
        .slice(0, 15)
        .map(line => line.startsWith('•') ? line : `• ${line}`);
      return insights.join('\n');
      
    case 'detailed':
      // Return full text
      return content;
      
    default:
      return content;
  }
};

// Generate customer insight content based on query
const generateInsightContent = (query: string, session: CustomerInsightSession): string => {
  // This would typically call an AI service, but for now we'll provide structured responses
  const baseContent = `
Customer Engagement Analysis for: ${query}

Key Insights:
• High-value customers show 85% engagement rate in Q4
• Mobile app usage increased by 32% among engaged users
• Email campaigns have 24% higher open rates for engaged segments
• Social media interactions correlate with 67% purchase likelihood
• Customer support touchpoints reduce churn by 45%
• Personalized recommendations drive 58% more conversions
• Loyalty program members have 3x higher lifetime value
• Cross-selling success rate is 78% for engaged customers
• Seasonal patterns show peak engagement in December
• Geographic analysis reveals urban customers are 40% more engaged
• Age demographics: 25-34 segment shows highest engagement
• Product categories: Electronics and Fashion drive most engagement
• Customer journey: Awareness to purchase takes average 14 days
• Retention strategies: Proactive outreach increases retention by 62%
• Revenue impact: Engaged customers generate 2.3x more revenue

Detailed Analysis:
The customer engagement data reveals significant opportunities for optimization. 
High-engagement customers demonstrate consistent patterns across multiple touchpoints, 
with mobile interactions serving as a primary driver of conversion. The correlation 
between engagement scores and customer lifetime value suggests that investment in 
engagement initiatives yields substantial ROI. Seasonal trends indicate optimal 
timing for campaigns, while demographic insights enable precise targeting strategies.

Recommendations:
1. Implement mobile-first engagement strategies
2. Develop personalized content based on engagement history
3. Create targeted campaigns for high-value segments
4. Optimize customer support touchpoints
5. Leverage seasonal patterns for campaign timing
6. Focus on cross-selling to engaged customer base
7. Expand loyalty program benefits
8. Implement proactive retention strategies
9. Develop geographic-specific engagement tactics
10. Create age-targeted content and offers
  `.trim();

  return baseContent;
};

/**
 * Main AI Response Dashboard function
 * Processes queries and returns streaming text output
 */
export async function* AIResponseDashboard(
  query: string, 
  session: CustomerInsightSession
): AsyncGenerator<string, void, unknown> {
  try {
    // Validate session
    if (!session || session.app_name !== 'customer_insight_agent') {
      throw new Error('Invalid session for customer insight agent');
    }

    // Get current mode for response formatting
    const mode = getCustomerInsightMode();
    
    // Generate content
    const content = generateInsightContent(query, session);
    const formattedContent = formatResponseByMode(content, mode);
    
    // Split content into chunks for streaming
    const chunks = formattedContent.split(' ');
    const chunkSize = mode === 'talk' ? 3 : mode === 'insights' ? 5 : 8;
    
    // Stream chunks with realistic delays
    for (let i = 0; i < chunks.length; i += chunkSize) {
      const chunk = chunks.slice(i, i + chunkSize).join(' ');
      
      // Add appropriate spacing
      const streamChunk = i === 0 ? chunk : ` ${chunk}`;
      
      yield streamChunk;
      
      // Simulate realistic streaming delay
      await new Promise(resolve => setTimeout(resolve, 
        mode === 'talk' ? 150 : mode === 'insights' ? 100 : 80
      ));
    }
    
    // Final newline for clean formatting
    yield '\n';
    
  } catch (error) {
    console.error('Customer Insight Agent Error:', error);
    yield `Error generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Helper function to create a session
 */
export const createCustomerInsightSession = (
  userId: string, 
  sessionId?: string
): CustomerInsightSession => {
  return {
    session_id: sessionId || `ci_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    app_name: 'customer_insight_agent'
  };
};

/**
 * Helper function to validate query
 */
export const validateQuery = (query: string): boolean => {
  return typeof query === 'string' && query.trim().length > 0 && query.length <= 1000;
};

/**
 * Get response preview (first few words) without streaming
 */
export const getResponsePreview = (query: string, session: CustomerInsightSession): string => {
  try {
    const content = generateInsightContent(query, session);
    const mode = getCustomerInsightMode();
    const formatted = formatResponseByMode(content, mode);
    
    // Return first 50 characters as preview
    return formatted.substring(0, 50) + (formatted.length > 50 ? '...' : '');
  } catch (error) {
    return 'Error generating preview';
  }
};