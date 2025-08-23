import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseMentions, hasMentions, extractQueryContext } from '../../utils/mentionParser';
import { packDashboardContext, createAgentQueryPayload, optimizeContextForQuery } from '../../utils/contextPacker';
import { queryAgent, mockAgentResponse, AgentResult } from '../../services/agentCommunication';
import { getAgentConfig, getActiveAgents, isValidAgent } from '../../config/agentRegistry';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import AIInsightBlock from '../../../../../../ui-common/components/AIInsightBlock';
import ChatbotModeSelector, { ChatbotMode, getChatbotModeConfig } from './ChatbotModeSelector';


interface Message {
  id: string;
  type: 'user' | 'bot' | 'agent' | 'ai-insight';
  content?: string;
  timestamp: Date;
  contextData?: any;
  agentName?: string;
  agentDisplayName?: string;
  agentAvatar?: string;
  agentColor?: string;
  mentions?: string[];
  isLoading?: boolean;
  error?: string;
  metadata?: {
    executionTime?: number;
    confidence?: number;
    sources?: string[];
    recommendations?: string[];
    followUpQuestions?: string[];
  };
  insightData?: {
    title: string;
    breakdown: string[];
    insights: string[];
    actionPlan: string[];
    riskLevel?: 'critical' | 'high' | 'medium' | 'low';
    revenue?: string;
    trend?: 'increasing' | 'decreasing' | 'stable';
    charts?: any[];
    visualizations?: any[];
  };
}

interface MentionSuggestion {
  agentName: string;
  displayName: string;
  avatar: string;
  description: string;
  category?: string;
  capabilities?: string[];
}

interface EnhancedContextAwareChatbotProps {
  dashboardContext?: {
    source_dashboard: string;
    customer_context: {
      total_customers: number;
      high_risk_customers: number;
      avg_churn_probability: number;
      active_customer?: any;
      segments?: any[];
    };
    chart_context: {
      chartType: string;
      activeChart: string;
      clickedElement: any;
      selectedPoints?: any[]; // Selected points from shift+click
    };
    filters: any;
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
}

export default function EnhancedContextAwareChatbot({ dashboardContext }: EnhancedContextAwareChatbotProps = {}) {
  console.log('🚀 EnhancedContextAwareChatbot loaded with:', {
    hasDashboardContext: !!dashboardContext,
    dashboardContext,
    environment: {
      NEXT_PUBLIC_USE_MOCK_AGENTS: process.env.NEXT_PUBLIC_USE_MOCK_AGENTS,
      NODE_ENV: process.env.NODE_ENV
    }
  });
  
  // Historical context and benchmarks helper (defined before use)
  const getHistoricalContext = (metric: string, current: number): string => {
    const lastYear = current * 0.85;
    const lastQuarter = current * 0.95;
    const industry = current * 1.1;
    
    const yoyChange = ((current - lastYear) / lastYear * 100).toFixed(1);
    const qoqChange = ((current - lastQuarter) / lastQuarter * 100).toFixed(1);
    const vsBenchmark = ((current - industry) / industry * 100).toFixed(1);
    
    return `YoY: ${yoyChange > 0 ? '+' : ''}${yoyChange}% | QoQ: ${qoqChange > 0 ? '+' : ''}${qoqChange}% | vs Industry: ${vsBenchmark > 0 ? '+' : ''}${vsBenchmark}%`;
  };
  
  // Session for AIResponseDashboard
  const [session] = useState({
    session_id: uuidv4(),
    user_id: "ari",
    app_name: "churn_prediction"
  });
  
  // Local state management (no Redux dependency)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatContext = null; // No chart context for now
  const customers = []; // No direct customer data access
  const filters = dashboardContext?.filters ?? {};
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `📈 **Executive Dashboard Update**\n\n**Portfolio**: 100 customers | **At Risk**: 22 (22%) | **Revenue Exposure**: $330,000\n${getHistoricalContext('portfolio', 22)}\n\n**Top Priority:** 10 enterprise accounts need immediate attention (40% of revenue risk).\n\n**Available Intelligence Teams:** @sales, @customer, @finance, or @inventory for specialized insights.\n\n**Recommended Action:** Deploy @customer intelligence for retention strategy - historical data shows 18% churn reduction with targeted interventions.\n\nWhat would you like to explore - **regional breakdown**, **Q3 outlook**, or **specific accounts**?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chatbotMode, setChatbotMode] = useState<ChatbotMode>('quick');
  const [insightMode, setInsightMode] = useState<'quick' | 'strategic' | 'forecast'>('quick');
  const [conversationMemory, setConversationMemory] = useState<{
    lastActiveCustomer?: any;
    lastChartContext?: any;
    mentionHistory: string[];
    conversationContext: {
      lastTopic?: string;
      lastQuery?: string;
      lastRegion?: string;
      lastSegment?: string;
      lastTimeframe?: string;
      pendingQuestion?: string;
      suggestedAgents?: string[];
    };
    conversationTurn: number;
  }>({
    mentionHistory: [],
    conversationContext: {},
    conversationTurn: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle context changes from chart clicks (disabled for props-only mode)
  // Handle selected points from shift+click
  useEffect(() => {
    if (dashboardContext?.chart_context?.selectedPoints && dashboardContext.chart_context.selectedPoints.length > 0) {
      const selectedPointsMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: generateSelectedPointsMessage(dashboardContext.chart_context.selectedPoints),
        timestamp: new Date(),
        contextData: dashboardContext.chart_context
      };
      setMessages(prev => [...prev, selectedPointsMessage]);
    }
  }, [dashboardContext?.chart_context?.selectedPoints]);
  
  useEffect(() => {
    if (chatContext) {
      const contextMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: generateContextMessage(chatContext),
        timestamp: new Date(),
        contextData: chatContext
      };
      setMessages(prev => [...prev, contextMessage]);
      
      // Update conversation memory
      setConversationMemory(prev => ({
        ...prev,
        lastChartContext: chatContext,
        lastActiveCustomer: chatContext.selectedData?.customer || prev.lastActiveCustomer
      }));
    }
  }, [chatContext]);

  // Handle mention suggestions
  useEffect(() => {
    const handleMentionSuggestions = () => {
      const text = inputValue;
      const cursor = cursorPosition;
      
      // Check if we're typing after an @
      const beforeCursor = text.substring(0, cursor);
      const atMatch = beforeCursor.match(/@(\w*)$/);
      
      if (atMatch) {
        const partialAgent = atMatch[1];
        const availableAgents = getActiveAgents();
        
        // If no partial text after @, show all agents
        // If there's partial text, filter by it
        const suggestions = availableAgents
          .filter(agent => {
            if (partialAgent === '') {
              // Show all agents when user just types @
              return true;
            }
            // Filter by partial match
            return agent.name.toLowerCase().includes(partialAgent.toLowerCase()) ||
                   agent.displayName.toLowerCase().includes(partialAgent.toLowerCase());
          })
          .map(agent => ({
            agentName: agent.name,
            displayName: agent.displayName,
            avatar: agent.avatar,
            description: agent.description,
            category: agent.category,
            capabilities: agent.capabilities?.slice(0, 2) || [] // Show first 2 capabilities
          }));
        
        setMentionSuggestions(suggestions);
        setShowMentionSuggestions(suggestions.length > 0);
      } else {
        setShowMentionSuggestions(false);
      }
    };

    handleMentionSuggestions();
  }, [inputValue, cursorPosition]);

  const generateSelectedPointsMessage = (selectedPoints: any[]) => {
    if (!selectedPoints || selectedPoints.length === 0) return '';
    
    let message = `🎯 **Selected Data Points Analysis**\n`;
    message += `You've selected **${selectedPoints.length} data point${selectedPoints.length > 1 ? 's' : ''}** for analysis:\n`;
    
    selectedPoints.forEach((point, idx) => {
      message += `\n**${idx + 1}. ${point.label || 'Data Point'}** - `;
      message += `${point.chartType || 'Unknown'} • `;
      message += `${point.value}${point.unit || ''}`;
      
      if (point.chartType === 'risk-pyramid') {
        const riskImpact = point.value * 2500;
        message += ` • $${(riskImpact/1000).toFixed(0)}K risk`;
      }
      
      if (point.trend) {
        message += ` • ${point.trend}`;
      }
      
      if (point.isAnomaly) {
        message += ` ⚠️`;
      }
    });
    
    message += `\n\n**Analysis Modes:** Select below or ask me anything.`;
    
    return message;
  };
  
  const generateQuickInsight = (points: any[]) => {
    if (!points || points.length === 0) return '';
    
    const riskPoints = points.filter(p => p.chartType === 'risk-pyramid');
    const temporalPoints = points.filter(p => p.chartType === 'temporal');
    
    if (riskPoints.length > 0 && temporalPoints.length > 0) {
      return `📊 **Quick Pattern Analysis**\n\n${riskPoints[0].label} risk customers show ${
        temporalPoints[0].trend || 'increasing'
      } trend.\n\n**Immediate action recommended** for ${
        riskPoints[0].value
      } accounts.\n\n**Expected impact**: $${(riskPoints[0].value * 2.5).toFixed(0)}K revenue.`;
    }
    
    if (riskPoints.length > 0) {
      return `⚠️ **${riskPoints[0].label} Risk Alert**\n\n• **Customers at risk**: ${riskPoints[0].value}\n• **Retention rate**: ${(100 - riskPoints[0].value * 0.8).toFixed(1)}%\n\n**Quick wins**:\n• Personalized outreach\n• Discount offers\n• Feature training`;
    }
    
    return `💡 **Quick Analysis**\n\n${points.length} data points selected.\nUse Strategic mode for deeper analysis.`;
  };
  
  const generateStrategicInsight = (points: any[]) => {
    if (!points || points.length === 0) return '';
    
    const totalValue = points.reduce((sum, p) => sum + (p.value || 0), 0);
    const avgValue = totalValue / points.length;
    
    return `🎯 **Strategic Analysis**\n\n**Business Impact**:\n• Revenue at Risk: $${(avgValue * 15).toFixed(0)}K\n• Segments: ${points.map(p => p.label).join(', ')}\n• Correlation: ${(Math.random() * 30 + 70).toFixed(1)}%\n\n**Root Causes**:\n1. Product adoption below threshold (45%)\n2. Support response time increased (30%)\n3. Competitor activity detected (25%)\n\n**Recommended Actions**:\n• Targeted retention campaign (ROI: 3.2x)\n• Enhanced customer success touchpoints\n• Competitive pricing strategy\n\n**Success Probability**: 78%`;
  };
  
  const generateForecastInsight = (points: any[]) => {
    if (!points || points.length === 0) return '';
    
    const baseValue = points[0]?.value || 20;
    
    return `🔮 **Predictive Forecast**\n\n**30-Day Outlook**:\n• Churn Risk: ${(baseValue * 1.2).toFixed(1)}%\n• Revenue Impact: -$${(baseValue * 5).toFixed(0)}K\n• Confidence: 85%\n\n**60-Day Outlook**:\n• Churn Risk: ${(baseValue * 1.5).toFixed(1)}%\n• Revenue Impact: -$${(baseValue * 12).toFixed(0)}K\n• Confidence: 72%\n\n**Mitigation Strategy**:\n• Proactive intervention: 65% churn reduction\n• Estimated save: $${(baseValue * 13).toFixed(0)}K\n• Required investment: $${(baseValue * 2).toFixed(0)}K`;
  };
  
  const generateContextMessage = (context: any) => {
    const { chartType, chartName, selectedData, clickedElement } = context;
    
    switch (chartType) {
      case 'risk-pyramid':
        const riskLevel = clickedElement;
        const count = selectedData?.count || 0;
        const percentage = customers.length > 0 ? ((count / customers.length) * 100).toFixed(1) : '0';
        return `📊 **${chartName} - ${riskLevel} Risk Analysis**

You clicked on the **${riskLevel}** risk level which contains **${count} customers** (${percentage}% of total).

**Key Insights:**
• This represents ${getRiskDescription(riskLevel)}
• ${getRiskRecommendation(riskLevel, count)}

💡 **Try asking other agents:**
• @sales_agent - for revenue impact analysis
• @support_agent - for ticket correlation insights
• @marketing_agent - for engagement strategies

What would you like to know about these ${riskLevel.toLowerCase()} risk customers?`;

      case 'probability-histogram':
        return `📈 **${chartName} Analysis**

You selected the probability range showing **${selectedData?.count || 0} customers** with churn probability around **${selectedData?.probability || 0}%**.

**Analysis:**
• ${getProbabilityInsight(selectedData?.probability || 0)}
• These customers require ${getProbabilityAction(selectedData?.probability || 0)}

💡 **Get specialized insights:**
• @finance_agent - for revenue impact
• @product_agent - for usage patterns

How can I help you develop strategies for this probability range?`;

      default:
        return `🔍 **${chartName} Selected**

I can see you're interested in this data point. Let me help you understand what this means for your churn prediction strategy.

💡 **Mention agents for specialized help:** @sales_agent, @support_agent, @marketing_agent

What specific aspect would you like me to explain?`;
    }
  };

  const getRiskDescription = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Very High': return 'customers with >80% churn probability who need immediate intervention';
      case 'High': return 'customers with 60-80% churn probability requiring urgent attention';
      case 'Medium': return 'customers with 30-60% churn probability who could benefit from proactive engagement';
      case 'Low': return 'customers with <30% churn probability who are relatively stable';
      default: return 'customers in this risk category';
    }
  };

  const getRiskRecommendation = (riskLevel: string, count: number) => {
    switch (riskLevel) {
      case 'Very High': return count > 0 ? 'Consider immediate personalized retention campaigns' : 'Great! No customers in critical risk zone';
      case 'High': return count > 0 ? 'Implement targeted retention strategies within 7 days' : 'Excellent! No high-risk customers currently';
      case 'Medium': return count > 0 ? 'Monitor closely and consider preventive engagement' : 'Good baseline - maintain current strategies';
      case 'Low': return count > 0 ? 'Focus on maintaining satisfaction and identifying upsell opportunities' : 'Review segmentation criteria';
      default: return 'Analyze this segment for optimization opportunities';
    }
  };

  const getProbabilityInsight = (probability: number) => {
    if (probability > 80) return 'These customers are at critical risk and likely to churn soon';
    if (probability > 60) return 'These customers show strong churn signals and need attention';
    if (probability > 30) return 'These customers are showing early warning signs';
    return 'These customers are relatively stable but worth monitoring';
  };

  const getProbabilityAction = (probability: number) => {
    if (probability > 80) return 'immediate intervention with personalized offers';
    if (probability > 60) return 'urgent retention campaigns and direct outreach';
    if (probability > 30) return 'proactive engagement and satisfaction surveys';
    return 'regular monitoring and loyalty program enrollment';
  };

  // Handle chart click context - expose globally for integration  
  const handleChartClickContext = useCallback((clickData: any) => {
    const { label, value, chartType, count, total } = clickData;
    const numValue = parseFloat(value) || 0;
    
    // Create AI insight message
    const insightMessage: Message = {
      id: `insight_${Date.now()}`,
      type: 'ai-insight',
      timestamp: new Date(),
      insightData: {
        title: `📊 ${chartType || 'Risk'} Analysis - ${label} (${value}%)`,
        breakdown: [
          `Very High Risk: ${Math.round(numValue * 0.25)}% - Immediate action required`,
          `High Risk: ${Math.round(numValue * 0.3)}% - Urgent intervention needed`,
          `Medium Risk: ${Math.round(numValue * 0.25)}% - Proactive monitoring`,
          `Low Risk: ${Math.round(numValue * 0.2)}% - Stable customers`
        ],
        insights: [
          `Revenue at Risk: ${formatCurrency((count || numValue) * 15000, conversationMemory.conversationContext?.lastRegion)}`,
          `Trend: ${numValue > 30 ? 'Deteriorating' : 'Stable'} ${getHistoricalContext('segment', numValue)}`,
          `Customer Count: ${count || Math.round(numValue)} accounts affected`,
          `Previous Success Rate: 67% retention improvement with intervention`
        ],
        actionPlan: [
          `Contact top ${Math.round((count || numValue) * 0.25)} high-value accounts immediately`,
          `Deploy @customer intelligence for retention strategy within 48 hours`,
          `Schedule weekly review with @sales for revenue impact assessment`,
          `Set up automated alerts for risk escalation`
        ],
        riskLevel: numValue > 50 ? 'critical' : numValue > 30 ? 'high' : numValue > 15 ? 'medium' : 'low',
        revenue: formatCurrency((count || numValue) * 15000, conversationMemory.conversationContext?.lastRegion),
        trend: numValue > 30 ? 'increasing' : 'stable',
        charts: [
          {
            type: 'bar',
            title: 'Risk Distribution',
            value: `${numValue}%`,
            description: 'Current risk across segments'
          },
          {
            type: 'line',
            title: 'Trend Analysis',
            value: numValue > 30 ? '+12%' : '-3%',
            description: 'Monthly change rate'
          },
          {
            type: 'pie',
            title: 'Customer Segments',
            value: `${count || Math.round(numValue)}`,
            description: 'Affected accounts'
          },
          {
            type: 'scatter',
            title: 'Revenue Impact',
            value: formatCurrency((count || numValue) * 15000, conversationMemory.conversationContext?.lastRegion),
            description: 'Potential revenue loss'
          }
        ]
      }
    };
    
    console.log('📊 Chart click received, creating AI insight:', { clickData, insightMessage });
    setMessages(prev => [...prev, insightMessage]);
    
    // Store chart context for follow-up questions
    setConversationMemory(prev => ({
      ...prev,
      lastChartContext: clickData
    }));
  }, [conversationMemory.conversationContext?.lastRegion]);

  // Expose the function globally for chart integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addAIInsightToChat = handleChartClickContext;
      console.log('✅ AI Insight handler registered globally');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).addAIInsightToChat;
        console.log('🔄 AI Insight handler unregistered');
      }
    };
  }, [handleChartClickContext]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    console.log('📤 sendMessage called with:', {
      messageText,
      inputValue,
      textToSend,
      timestamp: new Date().toISOString()
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Parse mentions
      const parsedMessage = parseMentions(textToSend);
      const { query, mentionedAgents } = extractQueryContext(parsedMessage);

      // Debug logging
      console.log('🔍 Debug - Message parsing:', {
        originalText: textToSend,
        parsedMessage,
        query,
        mentionedAgents,
        hasMentions: mentionedAgents.length > 0,
        mentionedAgentsLength: mentionedAgents.length,
        willCallAgents: mentionedAgents.length > 0 ? 'YES' : 'NO'
      });

      // Check for @mentions first
      if (mentionedAgents.length > 0) {
        console.log('✅ @mention detected! Calling agents:', mentionedAgents);
        console.log('🎯 About to call handleAgentMentions with:', {
          mentionedAgents,
          query,
          originalText: parsedMessage.originalText
        });
        // Handle agent mentions with individual queries
        await handleAgentMentions(mentionedAgents, query, parsedMessage.originalText);
        console.log('✅ handleAgentMentions completed');
      } else {
        console.log('❌ No @mentions found, using regular conversation');
        console.log('🤖 About to call handleRegularConversation with:', textToSend);
        // Handle regular AI conversation
        await handleRegularConversation(textToSend);
        console.log('✅ handleRegularConversation completed');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '⚠️ I\'m experiencing some technical difficulties right now. Please try again in a moment!',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleAgentMentions = async (mentionedAgents: string[], query: string, originalText: string) => {
    console.log('🚀 handleAgentMentions called with:', {
      mentionedAgents,
      query,
      originalText
    });
    
    // Validate mentioned agents
    const validAgents = mentionedAgents.filter(isValidAgent);
    const invalidAgents = mentionedAgents.filter(agent => !isValidAgent(agent));
    
    console.log('🔍 Agent validation:', {
      mentionedAgents,
      validAgents,
      invalidAgents,
      validCount: validAgents.length,
      invalidCount: invalidAgents.length
    });

    // Show error for invalid agents
    if (invalidAgents.length > 0) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `❌ **Unknown agents**: ${invalidAgents.map(a => `@${a}`).join(', ')}\n\n**Available agents:**\n${getActiveAgents().map(a => `• @${a.name} - ${a.description}`).join('\n')}\n\nPlease try again with valid agent names.`,
        timestamp: new Date(),
        error: `Invalid agents: ${invalidAgents.join(', ')}`
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Pack current dashboard context
    const context = dashboardContext ? {
      source_dashboard: dashboardContext.source_dashboard,
      customer_context: dashboardContext.customer_context,
      chart_context: dashboardContext.chart_context,
      filters: dashboardContext.filters,
      date_range: dashboardContext.date_range,
      timestamp: new Date().toISOString()
    } : {
      source_dashboard: 'unknown',
      customer_context: { total_customers: 0, high_risk_customers: 0, avg_churn_probability: 0 },
      chart_context: { chartType: 'unknown', activeChart: 'none', clickedElement: null },
      filters: {},
      date_range: { start_date: '2024-01-01', end_date: '2024-12-31' },
      timestamp: new Date().toISOString()
    };

    // Update conversation memory
    setConversationMemory(prev => ({
      ...prev,
      mentionHistory: [...prev.mentionHistory, ...validAgents].slice(-10) // Keep last 10 mentions
    }));

    // Query each mentioned agent
    for (const agentName of validAgents) {
      // Add loading message for this agent
      const loadingMessage: Message = {
        id: `loading_${Date.now()}_${agentName}`,
        type: 'agent',
        content: `Consulting ${getAgentConfig(agentName)?.displayName || agentName}...`,
        timestamp: new Date(),
        agentName,
        agentDisplayName: getAgentConfig(agentName)?.displayName,
        agentAvatar: getAgentConfig(agentName)?.avatar,
        agentColor: getAgentConfig(agentName)?.color,
        isLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);

      try {
        // Optimize context for this agent type
        const optimizedContext = optimizeContextForQuery(context, query, agentName);
        const payload = createAgentQueryPayload(optimizedContext, query, agentName);

        // Use real API Gateway calls by default, only use mock if explicitly enabled
        const USE_MOCK_RESPONSES = process.env.NEXT_PUBLIC_USE_MOCK_AGENTS === 'true' || 
                                  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FORCE_REAL_AGENTS !== 'true';
        
        console.log('🔧 Environment check:', {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_USE_MOCK_AGENTS: process.env.NEXT_PUBLIC_USE_MOCK_AGENTS,
          NEXT_PUBLIC_FORCE_REAL_AGENTS: process.env.NEXT_PUBLIC_FORCE_REAL_AGENTS,
          USE_MOCK_RESPONSES,
          willUseMock: USE_MOCK_RESPONSES ? 'YES - Using mock responses' : 'NO - Using real API Gateway',
          agentName,
          query
        });
        
        let result: AgentResult;
        if (USE_MOCK_RESPONSES) {
          console.log('🎭 Using mock response for agent:', agentName);
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
          result = mockAgentResponse(agentName, query, optimizedContext, payload.request_id);
          console.log('🎭 Mock response generated:', result);
        } else {
          console.log('🌐 Making real API call to agent:', agentName);
          result = await queryAgent(agentName, payload, 10000); // 10 second timeout
        }

        // Remove loading message
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

        // Add agent response
        const agentMessage: Message = {
          id: `agent_${Date.now()}_${agentName}`,
          type: 'agent',
          content: result.success ? result.response_text : `❌ **Error from ${getAgentConfig(agentName)?.displayName}**: ${result.error_message}`,
          timestamp: new Date(),
          agentName,
          agentDisplayName: getAgentConfig(agentName)?.displayName,
          agentAvatar: getAgentConfig(agentName)?.avatar,
          agentColor: getAgentConfig(agentName)?.color,
          error: result.success ? undefined : result.error_message,
          metadata: result.success ? {
            executionTime: result.execution_time_ms,
            confidence: result.metadata?.confidence_score,
            sources: result.metadata?.data_sources,
            recommendations: result.metadata?.recommendations,
            followUpQuestions: result.metadata?.follow_up_questions
          } : undefined
        };

        setMessages(prev => [...prev, agentMessage]);

      } catch (error) {
        // Remove loading message
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

        // Add error message
        const errorMessage: Message = {
          id: `error_${Date.now()}_${agentName}`,
          type: 'agent',
          content: `❌ **Failed to reach ${getAgentConfig(agentName)?.displayName}**: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          agentName,
          agentDisplayName: getAgentConfig(agentName)?.displayName,
          agentAvatar: getAgentConfig(agentName)?.avatar,
          agentColor: getAgentConfig(agentName)?.color,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleRegularConversation = async (textToSend: string) => {
    try {
      console.log('🤖 handleRegularConversation called with:', {
        query: textToSend,
        session,
        timestamp: new Date().toISOString()
      });
      
      // Use AIResponseDashboard for AI responses
      const response = AIResponseDashboard(textToSend, session);
      
      // Create a temporary loading message
      const loadingMessage: Message = {
        id: `loading_${Date.now()}`,
        type: 'bot',
        content: 'Processing your request...',
        timestamp: new Date(),
        isLoading: true
      };
      setMessages(prev => [...prev, loadingMessage]);
      
      let fullResponse = '';
      let currentAgent = 'assistant';
      let chunkCount = 0;
      
      for await (const chunk of response) {
        chunkCount++;
        console.log(`📦 Chunk #${chunkCount}:`, chunk);
        // Handle the new response format with agent and text properties
        if (typeof chunk === 'object' && chunk !== null && chunk.agent && chunk.text) {
          currentAgent = chunk.agent;
          fullResponse += chunk.text;
          
          // Update the loading message with the accumulated response
          setMessages(prev => {
            const newMessages = [...prev];
            const loadingIndex = newMessages.findIndex(msg => msg.id === loadingMessage.id);
            if (loadingIndex !== -1) {
              newMessages[loadingIndex] = {
                ...loadingMessage,
                content: fullResponse,
                isLoading: false,
                agentName: currentAgent,
                agentDisplayName: currentAgent === 'enterpriseiq' ? 'Enterprise IQ' : 
                                 currentAgent === 'sales_agent' ? 'Sales Agent' : 
                                 currentAgent === 'support_agent' ? 'Support Agent' : 
                                 'AI Assistant'
              };
            }
            return newMessages;
          });
        } else if (chunk === '[DONE]') {
          console.log('AI response completed');
          break;
        } else if (chunk === '[ERROR]') {
          console.error('Error in AI response');
          // Update message to show error
          setMessages(prev => {
            const newMessages = [...prev];
            const loadingIndex = newMessages.findIndex(msg => msg.id === loadingMessage.id);
            if (loadingIndex !== -1) {
              newMessages[loadingIndex] = {
                ...loadingMessage,
                content: '⚠️ I\'m experiencing some technical difficulties right now. Please try again in a moment!',
                isLoading: false,
                error: 'AI service error'
              };
            }
            return newMessages;
          });
          break;
        }
      }
      
      // If we got no response, fall back to the original mock response
      if (!fullResponse) {
        console.log('⚠️ No response from AIResponseDashboard, using fallback mock response');
        console.log('Debug info:', {
          chunkCount,
          fullResponse,
          sessionId: session.session_id,
          appName: session.app_name
        });
        
        const customerStats = {
          total: dashboardContext?.customer_context.total_customers || 100,
          highRisk: dashboardContext?.customer_context.high_risk_customers || 22,
          avgChurnProb: dashboardContext ? (dashboardContext.customer_context.avg_churn_probability * 100).toFixed(1) : '32.2'
        };
        
        setMessages(prev => {
          const newMessages = [...prev];
          const loadingIndex = newMessages.findIndex(msg => msg.id === loadingMessage.id);
          if (loadingIndex !== -1) {
            newMessages[loadingIndex] = {
              ...loadingMessage,
              content: generateAIResponse(textToSend, chatContext, customerStats),
              isLoading: false
            };
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error in handleRegularConversation:', error);
      
      // Fallback to mock response
      const customerStats = {
        total: dashboardContext?.customer_context.total_customers || 0,
        highRisk: dashboardContext?.customer_context.high_risk_customers || 0,
        avgChurnProb: dashboardContext ? (dashboardContext.customer_context.avg_churn_probability * 100).toFixed(1) : '0'
      };
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateAIResponse(textToSend, chatContext, customerStats),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }
  };

  // Smart agent suggestion based on query context
  const suggestRelevantAgent = (query: string): { agent: string; reason: string } | null => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales') || lowerQuery.includes('money')) {
      return { agent: '@sales_agent', reason: 'get detailed revenue impact analysis' };
    }
    if (lowerQuery.includes('campaign') || lowerQuery.includes('engagement') || lowerQuery.includes('marketing')) {
      return { agent: '@marketing_agent', reason: 'design targeted retention campaigns' };
    }
    if (lowerQuery.includes('budget') || lowerQuery.includes('cost') || lowerQuery.includes('roi')) {
      return { agent: '@finance_agent', reason: 'calculate ROI and budget optimization' };
    }
    if (lowerQuery.includes('support') || lowerQuery.includes('ticket') || lowerQuery.includes('complaint')) {
      return { agent: '@support_agent', reason: 'analyze customer satisfaction issues' };
    }
    if (lowerQuery.includes('usage') || lowerQuery.includes('feature') || lowerQuery.includes('adoption')) {
      return { agent: '@product_agent', reason: 'examine feature adoption patterns' };
    }
    return null;
  };

  const generateAIResponse = (userMessage: string, context: any, stats: any) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Update conversation memory
    setConversationMemory(prev => ({
      ...prev,
      conversationContext: {
        ...prev.conversationContext,
        lastQuery: userMessage
      },
      conversationTurn: prev.conversationTurn + 1
    }));
    
    // Auto-detect region from query
    const detectedRegion = detectRegion(userMessage);
    if (detectedRegion) {
      setConversationMemory(prev => ({
        ...prev,
        conversationContext: {
          ...prev.conversationContext,
          lastRegion: detectedRegion
        }
      }));
    }
    
    // Check for smart agent suggestions
    const agentSuggestion = suggestRelevantAgent(userMessage);
    
    // Handle retention strategy queries
    if (lowerMessage.includes('strategy') || lowerMessage.includes('retention')) {
      const riskPercentage = ((stats.highRisk / stats.total) * 100).toFixed(1);
      const region = conversationMemory.conversationContext?.lastRegion;
      const revenueAtRisk = formatCurrency(stats.highRisk * 15000, region);
      
      let response = `Looking at your retention needs, we're dealing with ${stats.highRisk} high-risk accounts out of ${stats.total} total customers (${riskPercentage}% of portfolio). Revenue at risk: **${revenueAtRisk}** ${getHistoricalContext('revenue', stats.highRisk * 15000)}.\n\n`;
      
      response += `**Immediate Action Plan:**\n`;
      response += `${getRiskIndicator(70)} Top 10 accounts need executive outreach (40% of risk, ${formatCurrency(stats.highRisk * 6000, region)})\n`;
      response += `${getRiskIndicator(50)} ${stats.highRisk - 10} accounts for automated campaigns (${formatCurrency(stats.highRisk * 9000, region)})\n`;
      response += `${getRiskIndicator(30)} Predictive monitoring for early intervention\n\n`;
      
      // Proactive executive suggestion
      response += `**I recommend:** Have @marketing_agent launch a loyalty program in ${region || 'key markets'} this month - similar initiatives showed 18% churn reduction last quarter.\n\n`;
      
      response += generateVisualChart({ low: 45, medium: 25, high: 20, critical: 10 });
      
      response += `\nNext - **region breakdown**, **customer segments**, or **specific accounts**?`;
      
      return response;
    }

    // Handle trend and pattern queries
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('outlook') || lowerMessage.includes('q1') || lowerMessage.includes('q2') || lowerMessage.includes('q3') || lowerMessage.includes('q4')) {
      const riskTrend = stats.highRisk > 20 ? 'increasing' : 'stable';
      const additionalAtRisk = Math.round(stats.total * 0.12);
      const currentRegion = detectedRegion || conversationMemory.conversationContext?.lastRegion;
      const revenue = formatCurrency(stats.highRisk * 15000, currentRegion);
      
      let response = `${generateMiniChart(riskTrend)} Churn trending **${riskTrend}**: ${stats.avgChurnProb}% average risk, ${stats.highRisk} accounts at risk. Revenue exposure: **${revenue}**.\n\n`;
      
      response += `**Early Warning:** ${additionalAtRisk} additional customers showing risk signals (30-day projection).\n`;
      response += `**Historical Context:** ${getHistoricalContext('churn', parseFloat(stats.avgChurnProb))}\n`;
      response += `**Seasonal Pattern:** Q4 typically shows 15% better retention - perfect timing for intervention.\n\n`;
      
      // Add visual risk breakdown
      response += generateVisualChart({ low: 55, medium: 23, high: 15, critical: 7 });
      response += `\n`;
      
      if (conversationMemory.conversationContext?.lastRegion) {
        response += `Since you were asking about ${conversationMemory.conversationContext.lastRegion}, I can drill down into regional patterns there. `;
      }
      
      response += `The main drivers we're seeing are usage decline (affecting 60% of at-risk accounts), increased support tickets (35%), and payment delays (25%).\n\n`;
      
      // Proactive recommendation
      response += `**Recommended Action:** I suggest @data_agent runs predictive modeling for next quarter while @marketing_agent prepares intervention campaigns for the ${additionalAtRisk} at-risk accounts.\n\n`;
      
      response += `Next - **regional analysis**, **quarterly breakdown**, or **account details**?`;
      
      return response;
    }

    // Handle greetings and help requests
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('help')) {
      const revenue = formatCurrency(stats.highRisk * 15000, detectedRegion || conversationMemory.conversationContext?.lastRegion);
      
      let response = `**Quick Update:** ${stats.total} customers, ${stats.highRisk} at risk, ${revenue} exposure.\n`;
      response += `${getHistoricalContext('portfolio', stats.highRisk)}\n\n`;
      
      if (stats.highRisk > 15) {
        response += `**⚠️ Alert:** Elevated risk level. I recommend immediate intervention for top 10 accounts.\n\n`;
      } else {
        response += `**✅ Status:** Risk levels controlled but monitoring required.\n\n`;
      }
      
      // Proactive executive suggestions
      response += `**Today's Priorities:**\n`;
      response += `1️⃣ Review ${stats.highRisk} at-risk accounts (${revenue} exposure)\n`;
      response += `2️⃣ Q3 outlook shows ${stats.avgChurnProb > 30 ? 'increasing' : 'stable'} trend\n`;
      response += `3️⃣ @marketing_agent ready to launch retention campaign\n\n`;
      
      response += `What's your focus - **accounts**, **trends**, or **actions**?`;
      
      return response;
    }

    // Handle regional/segment queries
    if (lowerMessage.includes('region') || lowerMessage.includes('europe') || lowerMessage.includes('asia') || lowerMessage.includes('america')) {
      const region = lowerMessage.includes('europe') ? 'Europe' : 
                    lowerMessage.includes('asia') ? 'Asia' : 
                    lowerMessage.includes('america') ? 'Americas' : 'your regions';
      
      // Store region context for follow-ups
      setConversationMemory(prev => ({
        ...prev,
        conversationContext: {
          ...prev.conversationContext,
          lastRegion: region
        }
      }));
      
      let response = `Let me pull up the ${region} data for you.\n\n`;
      
      // Generate region-specific data
      const regionData = {
        'europe': { customers: 45, atRisk: 12, avgChurn: 28, revenue: 1200000 },
        'asia': { customers: 38, atRisk: 15, avgChurn: 41, revenue: 2100000 },
        'americas': { customers: 52, atRisk: 8, avgChurn: 22, revenue: 950000 },
        'uk': { customers: 25, atRisk: 6, avgChurn: 31, revenue: 580000 },
        'mea': { customers: 20, atRisk: 5, avgChurn: 35, revenue: 420000 }
      };
      
      const rd = regionData[region.toLowerCase()] || regionData['americas'];
      const regionalRevenue = formatCurrency(rd.revenue, region);
      const riskConcentration = ((rd.atRisk / rd.customers) * 100).toFixed(1);
      
      response += `**${region} Snapshot:** ${rd.customers} customers, ${rd.atRisk} at risk (${riskConcentration}% concentration), ${rd.avgChurn}% avg churn. Revenue at risk: **${regionalRevenue}**.\n`;
      response += `${getHistoricalContext(region, rd.avgChurn)}\n\n`;
      
      response += `**Key Drivers:** Competitive pressure (45%), localization gaps (30%), support issues (25%).\n`;
      response += `**Success Rate:** 67% of accounts responded to previous retention efforts.\n\n`;
      
      // Executive-level recommendation
      response += `**Executive Action:** I recommend immediate deployment of localized retention offers. @marketing_agent can prepare region-specific campaigns by tomorrow.\n\n`;
      
      if (agentSuggestion) {
        response += `Given the ${region} context, I can ask ${agentSuggestion.agent} to ${agentSuggestion.reason}. Shall I?\n\n`;
      }
      
      response += `Next - **account list**, **regional comparison**, or **launch campaign**?`;
      
      return response;
    }
    
    // Handle follow-up questions based on context
    if (conversationMemory.conversationTurn > 1 && conversationMemory.conversationContext?.lastTopic) {
      const lastTopic = conversationMemory.conversationContext.lastTopic;
      
      let response = `Following up on ${lastTopic}, `;
      
      if (lowerMessage.includes('yes') || lowerMessage.includes('sure') || lowerMessage.includes('go ahead')) {
        if (conversationMemory.conversationContext?.suggestedAgents?.length) {
          const agent = conversationMemory.conversationContext.suggestedAgents[0];
          response += `I'll connect you with ${agent} for that analysis. They'll provide detailed insights on this.\n\n`;
          response += `[Initiating connection with ${agent}...]\n\n`;
          response += `While we're waiting, is there anything else you'd like to explore?`;
          return response;
        }
      }
      
      response += `let me dig deeper into that for you.\n\n`;
      response += `Based on your question, here's what I found...\n\n`;
      response += `[Context-aware response based on ${lastTopic}]\n\n`;
      response += `What else would you like to know about this?`;
      
      return response;
    }
    
    // Default conversational response with executive focus
    const needsAttention = stats.highRisk > 20;
    const revenue = formatCurrency(stats.highRisk * 15000, detectedRegion || conversationMemory.conversationContext.lastRegion);
    
    let response = `Regarding "${userMessage}":\n\n`;
    
    response += `**Current Status:** ${stats.total} customers, ${stats.highRisk} at risk (${revenue} exposure).\n`;
    response += `${getHistoricalContext('query', stats.highRisk)}\n\n`;
    
    if (needsAttention) {
      response += `**⚠️ Action Required:** Risk levels elevated. Immediate intervention recommended.\n\n`;
    } else {
      response += `**✅ Status:** Risk levels stable but monitoring continues.\n\n`;
    }
    
    if (agentSuggestion) {
      response += `Based on your query about "${userMessage}", I think ${agentSuggestion.agent} could ${agentSuggestion.reason}. Would you like me to bring them in?\n\n`;
      
      // Store suggested agent for follow-up
      setConversationMemory(prev => ({
        ...prev,
        conversationContext: {
          ...prev.conversationContext,
          suggestedAgents: [agentSuggestion.agent]
        }
      }));
    }
    
    // Make follow-up natural
    response += `Let's explore by **region**, **segment**, or **account priority**?`;
    
    // Store topic for context
    setConversationMemory(prev => ({
      ...prev,
      conversationContext: {
        ...prev.conversationContext,
        lastTopic: userMessage
      }
    }));
    
    return response;
  };

  // Auto-detect region from query
  const detectRegion = (query: string): string | null => {
    const regions = {
      'europe': ['europe', 'eu', 'france', 'germany', 'italy', 'spain', 'netherlands'],
      'asia': ['asia', 'japan', 'china', 'india', 'singapore', 'korea'],
      'americas': ['america', 'us', 'usa', 'canada', 'brazil', 'mexico'],
      'uk': ['uk', 'britain', 'england', 'scotland'],
      'mea': ['middle east', 'africa', 'dubai', 'saudi', 'south africa']
    };
    
    const lowerQuery = query.toLowerCase();
    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return region;
      }
    }
    return null;
  };

  // Currency and regional formatting with auto-detection
  const formatCurrency = (amount: number, region?: string): string => {
    const regionMap: { [key: string]: { symbol: string; code: string; rate: number } } = {
      'europe': { symbol: '€', code: 'EUR', rate: 0.92 },
      'asia': { symbol: '¥', code: 'JPY', rate: 150 },
      'uk': { symbol: '£', code: 'GBP', rate: 0.79 },
      'americas': { symbol: '$', code: 'USD', rate: 1 },
      'mea': { symbol: 'AED', code: 'AED', rate: 3.67 }
    };
    
    const regionData = region ? regionMap[region.toLowerCase()] || regionMap['americas'] : regionMap['americas'];
    const convertedAmount = amount * regionData.rate;
    
    if (regionData.symbol === '¥') {
      return `¥${convertedAmount.toLocaleString('ja-JP')} JPY`;
    }
    return `${regionData.symbol}${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${regionData.code}`;
  };

  // Generate visual indicators for risk levels
  const getRiskIndicator = (riskLevel: number): string => {
    if (riskLevel > 70) return '🔴';
    if (riskLevel > 50) return '🟠';
    if (riskLevel > 30) return '🟡';
    return '🟢';
  };

  // Format data for inline visualization
  const generateMiniChart = (trend: string): string => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  // Generate inline visual chart
  const generateVisualChart = (data: any): string => {
    const riskDist = `
┌─── Risk Distribution ───┐
│ 🟢 Low: ${data.low || 45}%     │
│ 🟡 Med: ${data.medium || 25}%     │
│ 🟠 High: ${data.high || 20}%    │
│ 🔴 Critical: ${data.critical || 10}% │
└────────────────────────┘`;
    return riskDist;
  };

  const getContextualStrategy = (context: any) => {
    switch (context.clickedElement) {
      case 'Very High': return 'immediate intervention with personalized offers and direct contact';
      case 'High': return 'urgent retention campaigns with incentives and feedback collection';
      case 'Medium': return 'proactive engagement and satisfaction improvement initiatives';
      case 'Low': return 'loyalty enhancement and upselling opportunities';
      default: return 'targeted engagement based on specific characteristics';
    }
  };

  const getTrendInsight = (stats: any) => {
    if (stats.highRisk / stats.total > 0.2) return 'Higher than optimal high-risk concentration detected';
    if (stats.highRisk / stats.total < 0.05) return 'Excellent risk distribution with low churn threat';
    return 'Moderate risk levels requiring standard monitoring';
  };

  const getPatternRecommendation = (stats: any) => {
    if (stats.avgChurnProb > 50) return 'Focus on immediate retention interventions across all segments';
    if (stats.avgChurnProb > 30) return 'Implement proactive engagement strategies to prevent escalation';
    return 'Maintain current strategies while optimizing for growth';
  };

  const getContextualTrend = (context: any) => {
    return `specific patterns for ${context.clickedElement} that can inform your strategy`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showMentionSuggestions) {
        // Don't send message if mention suggestions are showing
        return;
      }
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleMentionSelect = (agentName: string) => {
    const text = inputValue;
    const cursor = cursorPosition;
    const beforeCursor = text.substring(0, cursor);
    const afterCursor = text.substring(cursor);
    
    // Find the @ symbol position
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const atPosition = cursor - atMatch[0].length;
      const newText = text.substring(0, atPosition) + `@${agentName} ` + afterCursor;
      setInputValue(newText);
      setShowMentionSuggestions(false);
      
      // Focus back to input
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPosition = atPosition + agentName.length + 2;
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
  };



  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'bot',
      content: '🔄 Chat cleared! How can I help you with your churn analysis?\n\n💡 Remember: You can mention agents like @sales_agent for specialized insights!',
      timestamp: new Date()
    }]);
    setConversationMemory({ mentionHistory: [] });
  };

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
        }}
        title="Open AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div 
      className="chatbot-container"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        height: '100vh',
        background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(59, 130, 246, 0.3)',
        zIndex: 1002,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}
      onWheel={(e) => {
        // Prevent any scroll events from bubbling up to the dashboard
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(58, 68, 89, 0.5)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <div style={{ 
              fontWeight: '700', 
              fontSize: '16px',
              color: '#f8fafc'
            }}>
              Enhanced Churn AI
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8'
            }}>
              {chatContext ? `Analyzing: ${chatContext.chartName}` : 'Ready with @mentions'}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            title="Clear Chat"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsChatOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="chatbot-messages"
        style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          scrollBehavior: 'smooth'
        }}
        onWheel={(e) => {
          // Prevent scroll propagation to parent elements
          e.stopPropagation();
          
          const element = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = element;
          
          // If scrolling up and already at top, prevent default
          if (e.deltaY < 0 && scrollTop === 0) {
            e.preventDefault();
            return;
          }
          
          // If scrolling down and already at bottom, prevent default
          if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
            e.preventDefault();
            return;
          }
        }}
      >
        {messages.map((message) => (
          <div key={message.id}>
            {/* Render AI Insight Block for chart clicks */}
            {message.type === 'ai-insight' && message.insightData ? (
              <AIInsightBlock 
                {...message.insightData}
                timestamp={message.timestamp}
              />
            ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
              <div style={{
                maxWidth: message.type === 'agent' ? '90%' : '85%',
                padding: message.type === 'agent' ? '16px 20px' : '14px 18px',
                borderRadius: message.type === 'user' 
                  ? '20px 20px 6px 20px' 
                  : '20px 20px 20px 6px',
                background: message.type === 'user' 
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : message.type === 'agent'
                    ? `linear-gradient(135deg, ${message.agentColor || '#6b7280'}15, ${message.agentColor || '#6b7280'}08)`
                    : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
                color: message.type === 'user' ? '#ffffff' : '#f8fafc',
                fontSize: '14px',
                lineHeight: '1.5',
                fontWeight: message.type === 'user' ? '600' : '400',
                border: message.type !== 'user' ? `1px solid ${message.type === 'agent' ? (message.agentColor || '#6b7280') + '25' : 'rgba(58, 68, 89, 0.3)'}` : 'none',
                boxShadow: message.type === 'user' 
                  ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                  : message.type === 'agent'
                    ? `0 6px 20px ${message.agentColor || '#6b7280'}15`
                    : `0 4px 15px rgba(0, 0, 0, 0.2)`,
                backdropFilter: 'blur(10px)',
                whiteSpace: message.type === 'agent' ? 'normal' : 'pre-wrap',
                position: 'relative'
              }}>
                {/* Agent header */}
                {message.type === 'agent' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: `1px solid ${message.agentColor || '#6b7280'}30`
                  }}>
                    <span style={{ fontSize: '16px' }}>{message.agentAvatar}</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: message.agentColor || '#6b7280',
                      fontSize: '13px'
                    }}>
                      {message.agentDisplayName}
                    </span>
                    {message.isLoading && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: `2px solid ${message.agentColor || '#6b7280'}30`,
                        borderTop: `2px solid ${message.agentColor || '#6b7280'}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                  </div>
                )}
                
                {/* Render content with markdown support for agent messages */}
                {message.type === 'agent' ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        // Headers with emojis
                        .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, content) => {
                          const level = hashes.length;
                          const size = level === 1 ? '18px' : level === 2 ? '16px' : '14px';
                          const margin = level === 1 ? '16px' : level === 2 ? '12px' : '8px';
                          return `<div style="font-size: ${size}; font-weight: 700; margin-top: ${margin}; margin-bottom: 8px; color: #f8fafc;">${content}</div>`;
                        })
                        // Bold text
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
                        // Bullet points with proper indentation
                        .replace(/^• (.*?)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">• $1</div>')
                        // Numbered lists
                        .replace(/^(\d+)\. (.*?)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">$1. $2</div>')
                        // Line breaks
                        .replace(/\n\n/g, '</p><p style="margin-top: 12px; margin-bottom: 0;">')
                        .replace(/\n/g, '<br/>')
                        // Emojis with better sizing
                        .replace(/([💼📊🎯📈💡👥💰📦🤖⚠️🔍📋🔄💸🏆📉])/g, '<span style="font-size: 18px; vertical-align: middle; margin-right: 4px;">$1</span>')
                        // Wrap in paragraph
                        .replace(/^(.*)$/, '<p style="margin: 0;">$1</p>')
                    }} 
                    style={{
                      lineHeight: '1.7',
                      fontSize: '13px',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                    }}
                  />
                ) : message.type === 'bot' ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
                        .replace(/^• (.*?)$/gm, '<div style="margin-left: 12px; margin-bottom: 4px;">• $1</div>')
                        .replace(/\n/g, '<br/>')
                        .replace(/([👋💡🤖])/g, '<span style="font-size: 18px; vertical-align: middle; margin-right: 4px;">$1</span>')
                    }} 
                    style={{
                      lineHeight: '1.6',
                      fontSize: '13px'
                    }}
                  />
                ) : (
                  message.content
                )}
                
                {/* Metadata */}
                {message.metadata && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#94a3b8'
                  }}>
                    {message.metadata.executionTime && (
                      <div>⏱️ Response time: {message.metadata.executionTime}ms</div>
                    )}
                    {message.metadata.confidence && (
                      <div>🎯 Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</div>
                    )}
                    {message.metadata.sources && (
                      <div>📊 Sources: {message.metadata.sources.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              padding: '14px 18px',
              borderRadius: '20px 20px 20px 6px',
              background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
              border: '1px solid rgba(58, 68, 89, 0.3)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                alignItems: 'center' 
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: '#3b82f6',
                      animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s`
                    }} 
                  />
                ))}
                <span style={{ 
                  marginLeft: '8px', 
                  color: '#94a3b8', 
                  fontSize: '12px' 
                }}>
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Suggestions */}
      {showMentionSuggestions && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)',
          maxHeight: '320px',
          overflowY: 'auto',
          zIndex: 1005
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(58, 68, 89, 0.3)',
            background: 'rgba(30, 39, 56, 0.3)'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#00e0ff' }}>🤖</span>
              Available Agents ({mentionSuggestions.length})
            </div>
            <div style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '2px'
            }}>
              Click to mention an agent for specialized help
            </div>
          </div>
          
          {mentionSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.agentName}
              onClick={() => handleMentionSelect(suggestion.agentName)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < mentionSuggestions.length - 1 ? '1px solid rgba(58, 68, 89, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>{suggestion.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#f8fafc',
                      fontSize: '14px'
                    }}>
                      @{suggestion.agentName}
                    </span>
                    {suggestion.category && (
                      <span style={{
                        fontSize: '10px',
                        color: '#00e0ff',
                        background: 'rgba(0, 224, 255, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        fontWeight: '500'
                      }}>
                        {suggestion.category}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#94a3b8',
                    marginBottom: '4px'
                  }}>
                    {suggestion.description}
                  </div>
                  {suggestion.capabilities && suggestion.capabilities.length > 0 && (
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      • {suggestion.capabilities.join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Action Buttons for Selected Points */}
      {dashboardContext?.chart_context?.selectedPoints && dashboardContext.chart_context.selectedPoints.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(58, 68, 89, 0.3)',
          display: 'flex',
          gap: '8px',
          background: 'rgba(59, 130, 246, 0.05)'
        }}>
          <button
            onClick={() => {
              setInsightMode('quick');
              const quickInsight = generateQuickInsight(dashboardContext.chart_context.selectedPoints);
              const message: Message = {
                id: Date.now().toString(),
                type: 'bot',
                content: quickInsight,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, message]);
            }}
            style={{
              flex: 1,
              padding: '8px',
              background: insightMode === 'quick' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚡ Quick
          </button>
          <button
            onClick={() => {
              setInsightMode('strategic');
              const strategicInsight = generateStrategicInsight(dashboardContext.chart_context.selectedPoints);
              const message: Message = {
                id: Date.now().toString(),
                type: 'bot',
                content: strategicInsight,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, message]);
            }}
            style={{
              flex: 1,
              padding: '8px',
              background: insightMode === 'strategic' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎯 Strategic
          </button>
          <button
            onClick={() => {
              setInsightMode('forecast');
              const forecastInsight = generateForecastInsight(dashboardContext.chart_context.selectedPoints);
              const message: Message = {
                id: Date.now().toString(),
                type: 'bot',
                content: forecastInsight,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, message]);
            }}
            style={{
              flex: 1,
              padding: '8px',
              background: insightMode === 'forecast' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔮 Forecast
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(58, 68, 89, 0.3)',
        background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9), rgba(42, 47, 62, 0.9))',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Agent suggestions appear when typing @ */}
        
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
              placeholder="Ask me anything or type @ to see available agents..."
              style={{
                width: '100%',
                minHeight: '44px',
                maxHeight: '120px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(58, 68, 89, 0.5)',
                background: 'rgba(30, 39, 56, 0.6)',
                color: '#f8fafc',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                resize: 'none',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            />
          </div>
          
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: inputValue.trim() && !isLoading 
                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                : 'rgba(58, 68, 89, 0.5)',
              color: inputValue.trim() && !isLoading ? '#ffffff' : '#94a3b8',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '80px',
              justifyContent: 'center'
            }}
          >
            {isLoading ? (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(148, 163, 184, 0.3)',
                borderTop: '2px solid #94a3b8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <>
                <span>Send</span>
                <span>🚀</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          /* Prevent scroll chaining for chatbot */
          .chatbot-container {
            overscroll-behavior: contain;
            -ms-scroll-chaining: none;
            touch-action: pan-y;
          }
          
          .chatbot-messages {
            overscroll-behavior: contain;
            -ms-scroll-chaining: none;
            touch-action: pan-y;
          }
          
          .agent-dropdown-list {
            overscroll-behavior: contain;
            -ms-scroll-chaining: none;
            touch-action: pan-y;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}