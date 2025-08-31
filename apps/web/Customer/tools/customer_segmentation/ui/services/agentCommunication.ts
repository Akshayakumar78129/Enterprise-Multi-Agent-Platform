/**
 * Agent Communication Service for Customer Segmentation
 * Handles cross-agent queries and AI insights for segmentation data
 */

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

export interface SegmentContext {
  segment_id?: number | string;
  segment_name?: string;
  customer_count?: number;
  segment_value?: number;
  selected_customers?: Array<{
    customer_id: string;
    name: string;
    segment: number | string;
  }>;
  total_segments?: number;
}

export interface DashboardContext {
  source_dashboard: string;
  segment_context?: SegmentContext;
  filters_applied?: Record<string, any>;
  timestamp: string;
  user_id?: string;
}

export interface AgentQueryPayload {
  query: string;
  context: DashboardContext;
  request_id: string;
  priority?: 'high' | 'normal' | 'low';
  mentioned_agent?: string;
}

/**
 * Send query to backend AI service for segment insights
 */
export const queryAgent = async (
  agentName: string,
  payload: AgentQueryPayload,
  timeoutMs: number = 30000
): Promise<AgentResponse> => {
  const startTime = Date.now();
  
  console.log('🚀 Segmentation queryAgent called:', {
    agentName,
    payload,
    timeoutMs
  });

  try {
    // First check if we should use the simpler backend (port 5000) or ADK (port 8000)
    // For now, fallback to port 5000 backend which doesn't require session management
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
    const endpoint = `${backendUrl}/run_sse`;
    
    // Format request for simpler backend service (port 5000 style)
    const formattedQuery = `@${agentName} ${payload.query}`;
    const backendPayload = {
      user_query: formattedQuery,
      session_id: payload.request_id,
      user_id: payload.context.user_id || 'segmentation_user',
      app_name: 'customer_segmentation',
      is_canvas: false,
      context: {
        dashboard: payload.context.source_dashboard,
        segment_context: payload.context.segment_context,
        filters: payload.context.filters_applied,
        timestamp: payload.context.timestamp
      }
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(backendPayload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle SSE response format
    let responseData: any = {};
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
            console.log('📦 Segmentation SSE chunk:', jsonData);
            
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
    
    // Ensure proper markdown formatting
    formattedResponse = formattedResponse
      .replace(/Segment (\d+)/g, '\n**Segment $1**')  // Bold segment headers
      .replace(/I have analyzed/g, '\n## 📊 Analysis Results\n\nI have analyzed')
      .replace(/To leverage these insights/g, '\n## 💡 Recommendations\n\nTo leverage these insights')
      .replace(/Would you like/g, '\n\n❓ **Next Steps:** Would you like');
    
    // Set the formatted response
    responseData.response = formattedResponse;
    responseData.success = true;
    
    console.log('📦 Final segmentation response:', responseData);
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      agent_name: agentName,
      agent_display_name: getAgentDisplayName(agentName),
      response_text: responseData.response || generateSegmentInsights(agentName, payload),
      response_data: responseData.data,
      execution_time_ms: executionTime,
      request_id: payload.request_id,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence_score: responseData.confidence || 0.85,
        data_sources: responseData.sources || ['Customer Database', 'Segmentation Engine'],
        recommendations: responseData.recommendations || [],
        follow_up_questions: responseData.follow_up_questions || []
      }
    };
  } catch (error: any) {
    console.error('❌ Segmentation agent query error:', error);
    
    // Return mock response as fallback
    return mockAgentResponse(agentName, payload);
  }
};

/**
 * Generate segment-specific insights based on context
 */
const generateSegmentInsights = (agentName: string, payload: AgentQueryPayload): string => {
  const context = payload.context.segment_context;
  
  if (!context) {
    return 'No segment context available. Please select a segment or customers to analyze.';
  }
  
  const insights = [];
  
  if (context.segment_id !== undefined) {
    insights.push(`**Segment ${context.segment_name || context.segment_id}:**`);
    insights.push(`• Customer Count: ${context.customer_count || 'N/A'}`);
    insights.push(`• Segment Value: ${context.segment_value ? `$${context.segment_value.toLocaleString()}` : 'N/A'}`);
  }
  
  if (context.selected_customers && context.selected_customers.length > 0) {
    insights.push(`\n**Selected Customers (${context.selected_customers.length}):**`);
    context.selected_customers.slice(0, 5).forEach(customer => {
      insights.push(`• ${customer.name} (ID: ${customer.customer_id}, Segment: ${customer.segment})`);
    });
    if (context.selected_customers.length > 5) {
      insights.push(`• ... and ${context.selected_customers.length - 5} more`);
    }
  }
  
  // Add agent-specific insights
  switch (agentName) {
    case 'sales':
      insights.push('\n**Sales Insights:**');
      insights.push('• This segment represents a key revenue opportunity');
      insights.push('• Consider targeted campaigns for cross-selling');
      insights.push('• Monitor purchase patterns for optimization');
      break;
    case 'customer':
      insights.push('\n**Customer Insights:**');
      insights.push('• Engagement levels vary across segments');
      insights.push('• Implement segment-specific retention strategies');
      insights.push('• Track satisfaction scores by segment');
      break;
    case 'finance':
      insights.push('\n**Financial Insights:**');
      insights.push('• Calculate customer lifetime value by segment');
      insights.push('• Optimize acquisition costs for high-value segments');
      insights.push('• Monitor profitability metrics');
      break;
    default:
      insights.push('\n**AI Analysis:**');
      insights.push('• Click on chart elements for detailed insights');
      insights.push('• Use selection to compare segments');
      insights.push('• AI recommendations will appear here');
  }
  
  return insights.join('\n');
};

/**
 * Mock agent response for development/fallback
 */
const mockAgentResponse = (agentName: string, payload: AgentQueryPayload): AgentResponse => {
  const context = payload.context.segment_context;
  
  return {
    success: true,
    agent_name: agentName,
    agent_display_name: getAgentDisplayName(agentName),
    response_text: generateSegmentInsights(agentName, payload),
    response_data: {
      segment_analysis: {
        segment_id: context?.segment_id,
        insights: ['High-value segment', 'Growth potential identified', 'Retention focus recommended']
      }
    },
    execution_time_ms: Math.random() * 2000 + 500,
    request_id: payload.request_id,
    timestamp: new Date().toISOString(),
    metadata: {
      confidence_score: 0.88,
      data_sources: ['Customer Database', 'Segmentation Engine', 'Analytics Platform'],
      recommendations: [
        'Focus on high-value segments',
        'Implement targeted campaigns',
        'Monitor segment migration'
      ],
      follow_up_questions: [
        'Which segment has the highest growth potential?',
        'What are the characteristics of top-performing segments?',
        'How can we improve segment engagement?'
      ]
    }
  };
};

/**
 * Get display name for agent
 */
const getAgentDisplayName = (agentName: string): string => {
  const displayNames: Record<string, string> = {
    sales: 'Sales Intelligence',
    customer: 'Customer Intelligence',
    finance: 'Financial Intelligence',
    inventory: 'Inventory Intelligence',
    marketing: 'Marketing Intelligence'
  };
  
  return displayNames[agentName] || `${agentName.charAt(0).toUpperCase()}${agentName.slice(1)} Agent`;
};

/**
 * Export the service
 */
export const agentCommunication = {
  queryAgent,
  mockAgentResponse
};