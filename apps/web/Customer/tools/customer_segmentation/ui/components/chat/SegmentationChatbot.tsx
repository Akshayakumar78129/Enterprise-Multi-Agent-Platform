import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { parseMentions, hasMentions, extractQueryContext } from '../../../../churn_prediction/ui/utils/mentionParser';
import { packDashboardContext, createAgentQueryPayload, optimizeContextForQuery } from '../../../../churn_prediction/ui/utils/contextPacker';
import { queryAgent, mockAgentResponse, AgentResult } from '../../../../churn_prediction/ui/services/agentCommunication';
import { getAgentConfig, getActiveAgents, isValidAgent } from '../../../../churn_prediction/ui/config/agentRegistry';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import AIInsightBlock from '../../../../../../ui-common/components/AIInsightBlock';
import MessageFormatterFixed from './MessageFormatterFixed';
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

interface SegmentationChatbotProps {
  dashboardContext?: {
    source_dashboard: string;
    customer_context?: any;
    segment_context?: any;
  };
}

export default function SegmentationChatbot({ dashboardContext }: SegmentationChatbotProps) {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [chatbotMode, setChatbotMode] = useState<ChatbotMode>('quick');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Session state for AIResponseDashboard
  const [session] = useState({
    session_id: uuidv4(),
    user_id: "ari",
    app_name: "customer_segmentation"
  });

  // Conversation memory for context
  const [conversationMemory, setConversationMemory] = useState({
    lastChartContext: null as any,
    conversationContext: {
      lastSegment: null as string | null,
      lastMetric: null as string | null,
      lastTimeframe: '30d',
      lastRegion: 'all'
    }
  });

  const getHistoricalContext = (contextType: string, value: any) => {
    const contexts = {
      segment: `YoY: ${value > 30 ? '+' : '-'}${Math.abs(15 - Math.random() * 30).toFixed(1)}% | QoQ: ${value > 30 ? '+' : '-'}${Math.abs(5 - Math.random() * 10).toFixed(1)}%`,
      portfolio: `YoY: +${(10 + Math.random() * 20).toFixed(1)}% | QoQ: +${(3 + Math.random() * 7).toFixed(1)}% | vs Industry: ${value > 20 ? '+' : '-'}${Math.abs(5 - Math.random() * 15).toFixed(1)}%`,
      default: ''
    };
    return contexts[contextType] || contexts.default;
  };

  const formatCurrency = (amount: number, region: string = 'all') => {
    const multiplier = region === 'EMEA' ? 0.85 : region === 'APAC' ? 0.9 : 1;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * multiplier);
  };

  const getInitialMessage = (mode: ChatbotMode): Message => {
    const modeConfig = getChatbotModeConfig(mode);
    let content = '';
    
    if (mode === 'quick') {
      content = `⚡ **Quick Insights Mode**\n\n📊 **5,000** customers | **8** segments | **$2.5M** revenue\n\n**Top Actions:**\n• Focus on Champions (32%) - highest ROI\n• At Risk segment needs immediate attention\n• New customers (25%) - nurture opportunity\n\n💡 Mention @customer for instant segment insights.`;
    } else if (mode === 'strategic') {
      content = `🎯 **Strategic Planning Mode**\n\n📊 **Portfolio Overview:** 5,000 customers | 8 segments | $2.5M revenue\n${getHistoricalContext('portfolio', 5000)}\n\n**Segment Distribution:**\n• Champions: 32% - Drive 45% of revenue\n• Loyal: 28% - Consistent performers\n• At Risk: 15% - Retention priority\n• New: 25% - Growth potential\n\n**Strategic Opportunities:**\n• Segment optimization can yield 23% revenue increase\n• Cross-selling potential in Loyal segment\n• Retention focus on At Risk segment\n\n**Intelligence Teams:** @sales, @customer, @finance, @inventory\n\nWhat strategic initiative would you like to explore?`;
    } else if (mode === 'deep-dive') {
      content = `🔍 **Deep Dive Analysis Mode**\n\n📊 **Comprehensive Portfolio Analysis**\n5,000 customers | 8 segments | $2.5M revenue\n${getHistoricalContext('portfolio', 5000)}\n\n**Behavioral Insights:**\n• Segment migration patterns show 12% quarterly movement\n• Purchase frequency variance: σ = 2.3 across segments\n• Customer lifetime value distribution follows power law\n\n**Segment Correlations:**\n• Engagement ↔ Retention: r = 0.78\n• Frequency ↔ Value: r = 0.65\n• Recency ↔ Churn Risk: r = -0.82\n\n**Hidden Patterns:**\n• Sub-segment clustering reveals micro-behaviors\n• Seasonal effects vary by 35% across segments\n• Cross-product affinity strongest in Champions\n\n**Available Intelligence:** @sales, @customer, @finance, @inventory\n\nWhat aspect would you like to explore in depth?`;
    }
    
    return {
      id: '1',
      type: 'bot',
      content,
      timestamp: new Date()
    };
  };

  const [messages, setMessages] = useState<Message[]>([getInitialMessage('quick')]);

  // Update welcome message when mode changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === '1') {
      // Only update if we still have just the initial message
      setMessages([getInitialMessage(chatbotMode)]);
    }
  }, [chatbotMode]);

  // Handle chart click context
  const handleChartClickContext = useCallback((clickData: any) => {
    const { label, value, chartType, count, total } = clickData;
    const numValue = parseFloat(value) || 0;
    
    // Create AI insight message
    const insightMessage: Message = {
      id: `insight_${Date.now()}`,
      type: 'ai-insight',
      timestamp: new Date(),
      insightData: {
        title: `📊 ${chartType || 'Segment'} Analysis - ${label} (${value}%)`,
        breakdown: [
          `Champions: ${Math.round(numValue * 0.32)}% - High value, frequent buyers`,
          `Loyal: ${Math.round(numValue * 0.28)}% - Consistent purchasers`,
          `At Risk: ${Math.round(numValue * 0.15)}% - Need immediate attention`,
          `New: ${Math.round(numValue * 0.25)}% - Recent acquisitions`
        ],
        insights: [
          `Revenue Contribution: ${formatCurrency((count || numValue) * 25000, conversationMemory.conversationContext.lastRegion)}`,
          `Growth Trend: ${numValue > 30 ? 'Expanding' : 'Stable'} ${getHistoricalContext('segment', numValue)}`,
          `Customer Count: ${count || Math.round(numValue * 50)} accounts`,
          `Average Order Value: ${formatCurrency(2500 + Math.random() * 1500)}`
        ],
        actionPlan: [
          `Focus on top ${Math.round((count || numValue) * 0.32)} Champions for upselling`,
          `Deploy @customer intelligence for retention of At Risk segment`,
          `Engage @sales for cross-selling to Loyal customers`,
          `Implement nurture campaign for New customers`
        ],
        riskLevel: numValue < 20 ? 'low' : numValue < 40 ? 'medium' : numValue < 60 ? 'high' : 'critical',
        revenue: formatCurrency((count || numValue) * 25000, conversationMemory.conversationContext.lastRegion),
        trend: numValue > 30 ? 'increasing' : 'stable',
        charts: [
          {
            type: 'bar',
            title: 'Segment Distribution',
            value: `${numValue}%`,
            description: 'Current segment size'
          },
          {
            type: 'line',
            title: 'Growth Trend',
            value: numValue > 30 ? '+18%' : '+5%',
            description: 'Monthly growth rate'
          },
          {
            type: 'pie',
            title: 'Revenue Share',
            value: `${Math.round(numValue * 1.2)}%`,
            description: 'Revenue contribution'
          },
          {
            type: 'scatter',
            title: 'Customer Value',
            value: formatCurrency((count || numValue) * 25000, conversationMemory.conversationContext.lastRegion),
            description: 'Total segment value'
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
  }, [conversationMemory.conversationContext.lastRegion]);

  // Listen for custom events from AI insights
  useEffect(() => {
    const handleOpenChatbot = (event: CustomEvent) => {
      const { selectedPoints: points, context, message } = event.detail || {};
      
      // Open chatbot
      setIsOpen(true);
      
      // Store selected points
      if (points && points.length > 0) {
        setSelectedPoints(points);
        
        // Format message exactly like churn dashboard
        let formattedMessage = `## 📊 Selected Data Points Analysis\n\nYou've selected **${points.length} data point${points.length > 1 ? 's' : ''}** for analysis:\n`;
        
        points.forEach((point: any, idx: number) => {
          formattedMessage += `\n**${idx + 1}. ${point.label || 'Data Point'}** - `;
          formattedMessage += `${point.chartType || 'Unknown'} • `;
          formattedMessage += `${point.value}${point.unit || ''}`;
          
          // Add segment-specific details
          if (point.chartType === 'segment-profile' && point.metadata) {
            const meta = point.metadata;
            if (meta.avgSpend) formattedMessage += ` • $${meta.avgSpend} avg spend`;
            if (meta.loyaltyScore) formattedMessage += ` • ${meta.loyaltyScore}% loyalty`;
          } else if (point.chartType === 'kpi-tile') {
            if (point.metadata?.trend) formattedMessage += ` • ${point.metadata.trend}`;
          } else if (point.chartType === 'scatter' && point.metadata) {
            if (point.metadata.y) formattedMessage += ` • Y: ${point.metadata.y}`;
            if (point.metadata.segment) formattedMessage += ` • ${point.metadata.segment}`;
          }
          
          if (point.trend) {
            formattedMessage += ` • ${point.trend}`;
          }
        });
        
        formattedMessage += `\n\n**Analysis Modes:** Select below or ask me anything.`;
        
        const selectionMessage: Message = {
          id: `selection_${Date.now()}`,
          type: 'bot',
          content: formattedMessage,
          timestamp: new Date(),
          contextData: { points, context }
        };
        setMessages(prev => [...prev, selectionMessage]);
      }
      
      // If there's a specific message/question, add it to input
      if (message) {
        setInputValue(message);
        // The user can then press enter or click send
      }
    };
    
    const handleChatbotMessage = (event: CustomEvent) => {
      const { message, context } = event.detail || {};
      
      if (message) {
        setIsOpen(true);
        setInputValue(message);
        // The user can then press enter or click send
      }
    };
    
    const handleMultiSelect = (event: CustomEvent) => {
      const { selectedPoints: points, message } = event.detail || {};
      
      if (points && points.length > 0) {
        setSelectedPoints(points);
        
        // Always open chatbot on multi-select
        setIsOpen(true);
        
        // Format the points exactly like churn dashboard
        let formattedMessage = `## 📊 Selected Data Points Analysis\n\nYou've selected **${points.length} data points** for analysis:\n`;
        
        points.forEach((point: any, idx: number) => {
          formattedMessage += `\n**${idx + 1}. ${point.label || 'Data Point'}** - `;
          formattedMessage += `${point.chartType || 'Unknown'} • `;
          formattedMessage += `${point.value}${point.unit || ''}`;
          
          // Add segment-specific details
          if (point.chartType === 'segment-profile' && point.metadata) {
            const meta = point.metadata;
            if (meta.avgSpend) formattedMessage += ` • $${meta.avgSpend} avg spend`;
            if (meta.loyaltyScore) formattedMessage += ` • ${meta.loyaltyScore}% loyalty`;
          } else if (point.chartType === 'kpi-tile') {
            if (point.metadata?.trend) formattedMessage += ` • ${point.metadata.trend}`;
          } else if (point.chartType === 'scatter' && point.metadata) {
            if (point.metadata.y) formattedMessage += ` • Y: ${point.metadata.y}`;
            if (point.metadata.segment) formattedMessage += ` • ${point.metadata.segment}`;
          }
          
          if (point.trend) {
            formattedMessage += ` • ${point.trend}`;
          }
        });
        
        formattedMessage += `\n\n**Analysis Modes:** Select below or ask me anything.`;
        
        const notificationMessage: Message = {
          id: `notify_${Date.now()}`,
          type: 'bot',
          content: formattedMessage,
          timestamp: new Date(),
          contextData: { points }
        };
        setMessages(prev => [...prev, notificationMessage]);
      }
    };
    
    // Register event listeners
    window.addEventListener('openSegmentationChatbot', handleOpenChatbot as any);
    window.addEventListener('segmentationChatbotMessage', handleChatbotMessage as any);
    window.addEventListener('segmentationMultiSelect', handleMultiSelect as any);
    
    // Also expose function globally
    if (typeof window !== 'undefined') {
      (window as any).addSegmentationInsightToChat = handleChartClickContext;
      console.log('✅ Segmentation AI Insight handler registered');
    }
    
    return () => {
      window.removeEventListener('openSegmentationChatbot', handleOpenChatbot as any);
      window.removeEventListener('segmentationChatbotMessage', handleChatbotMessage as any);
      window.removeEventListener('segmentationMultiSelect', handleMultiSelect as any);
      
      if (typeof window !== 'undefined') {
        delete (window as any).addSegmentationInsightToChat;
      }
    };
  }, [handleChartClickContext, isOpen]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

    // Get current mode configuration
    const modeConfig = getChatbotModeConfig(chatbotMode);

    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Check for mentions
    if (hasMentions(textToSend)) {
      const mentions = parseMentions(textToSend);
      for (const agentName of mentions) {
        if (isValidAgent(agentName)) {
          const agentConfig = getAgentConfig(agentName);
          if (agentConfig) {
            // Create loading message
            const loadingMessage: Message = {
              id: uuidv4(),
              type: 'agent',
              agentName: agentConfig.name,
              agentDisplayName: agentConfig.displayName,
              agentAvatar: agentConfig.avatar,
              agentColor: agentConfig.color,
              isLoading: true,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, loadingMessage]);

            try {
              const context = packDashboardContext(dashboardContext || {});
              const queryPayload = createAgentQueryPayload(textToSend, context, agentConfig);
              
              // Simulate agent response
              const response = await mockAgentResponse(agentConfig, textToSend);
              
              // Update with actual response
              setMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, content: response.answer, isLoading: false, metadata: response.metadata }
                  : msg
              ));
            } catch (error) {
              setMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, content: 'Sorry, I encountered an error processing your request.', isLoading: false, error: error.message }
                  : msg
              ));
            }
          }
        }
      }
    } else {
      // Use AIResponseDashboard for regular bot responses
      const botMessageId = uuidv4();
      const loadingMessage: Message = {
        id: botMessageId,
        type: 'bot',
        content: 'Thinking...',
        isLoading: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMessage]);
      
      try {
        // Construct query based on chatbot mode
        let query = textToSend;
        if (chatbotMode === 'quick') {
          query = `Provide a quick insight for: ${textToSend}. Include key metrics and immediate actions.`;
        } else if (chatbotMode === 'strategic') {
          query = `Provide strategic analysis for: ${textToSend}. Include trend analysis, strategic focus areas, and recommendations.`;
        } else if (chatbotMode === 'deep-dive') {
          query = `Provide deep-dive analysis for: ${textToSend}. Include behavioral patterns, correlations, hidden insights, and detailed metrics.`;
        }
        
        const response = AIResponseDashboard(query, session);
        let fullResponse = '';
        
        for await (const chunk of response) {
          if (chunk === '[DONE]') {
            break;
          }
          if (chunk === '[ERROR]') {
            console.error('Error in AI response');
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId
                ? { ...msg, content: 'Sorry, I encountered an error processing your request.', isLoading: false, error: 'AI Response Error' }
                : msg
            ));
            return;
          }
          
          if (typeof chunk === 'object' && chunk !== null && chunk.text) {
            fullResponse += chunk.text;
            // Update message with streaming response
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId
                ? { ...msg, content: fullResponse, isLoading: false }
                : msg
            ));
          }
        }
      } catch (error) {
        console.error('Error calling AIResponseDashboard:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId
            ? { ...msg, content: 'Sorry, I encountered an error processing your request.', isLoading: false, error: error.message }
            : msg
        ));
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredAgents = getActiveAgents().filter(agent => 
    agent.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
    agent.displayName.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        data-segmentation-chatbot="true"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: 28 }}>{isOpen ? '✕' : '💬'}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          width: 450,
          height: 600,
          background: 'rgba(17, 24, 39, 0.98)',
          borderRadius: 20,
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 998,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Header */}
          <div style={{
            padding: 24,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  color: 'white', 
                  fontSize: 20, 
                  fontWeight: 700,
                  letterSpacing: '-0.3px'
                }}>
                  Segmentation AI Assistant
                </h3>
                <p style={{ 
                  margin: '6px 0 0', 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontSize: 14,
                  fontWeight: 500
                }}>
                  Mention @agents for specialized insights
                </p>
              </div>
              
              {/* Selected Points Indicator */}
              {selectedPoints.length > 0 && (
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 16 }}>📊</span>
                  <span style={{
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600
                  }}>
                    {selectedPoints.length} selected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mode Selector */}
          <div style={{
            padding: '12px 16px',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <ChatbotModeSelector
              currentMode={chatbotMode}
              onModeChange={setChatbotMode}
              selectedPointsCount={selectedPoints.length}
            />
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.95)'
          }}>
            {messages.map(message => (
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
                    marginBottom: 8
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: message.type === 'user' 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                      : message.type === 'agent'
                      ? 'rgba(15, 23, 42, 0.95)'
                      : 'rgba(15, 23, 42, 0.9)',
                    color: '#ffffff',
                    border: message.type === 'agent' 
                      ? `1px solid ${message.agentColor}40` 
                      : message.type === 'user'
                      ? 'none'
                      : '1px solid rgba(59, 130, 246, 0.1)',
                    boxShadow: message.type === 'user' 
                      ? '0 4px 15px rgba(59, 130, 246, 0.3)'
                      : '0 2px 10px rgba(0, 0, 0, 0.08)',
                    fontWeight: 500
                  }}>
                    {message.type === 'agent' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        color: message.agentColor,
                        fontWeight: 600
                      }}>
                        <span>{message.agentAvatar}</span>
                        <span>{message.agentDisplayName}</span>
                      </div>
                    )}
                    {message.isLoading ? (
                      <div style={{ color: '#ffffff', opacity: 0.7 }}>Thinking...</div>
                    ) : (
                      <MessageFormatterFixed content={message.content || ''} type={message.type} />
                    )}
                  </div>
                </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: 20,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            {showMentionDropdown && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 20,
                right: 20,
                background: 'rgba(30, 41, 59, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                marginBottom: 8,
                maxHeight: 200,
                overflowY: 'auto',
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)'
              }}>
                {filteredAgents.map((agent, index) => (
                  <div
                    key={agent.name}
                    onClick={() => {
                      const beforeMention = inputValue.substring(0, inputValue.lastIndexOf('@'));
                      setInputValue(beforeMention + '@' + agent.name + ' ');
                      setShowMentionDropdown(false);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: index === selectedMentionIndex ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = index === selectedMentionIndex ? 'rgba(102, 126, 234, 0.2)' : 'transparent'}
                  >
                    <span style={{ fontSize: 20 }}>{agent.avatar}</span>
                    <div>
                      <div style={{ color: agent.color, fontWeight: 600 }}>@{agent.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{agent.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const lastAtIndex = e.target.value.lastIndexOf('@');
                  if (lastAtIndex !== -1 && lastAtIndex === e.target.value.length - 1 || 
                      (lastAtIndex !== -1 && e.target.value.substring(lastAtIndex + 1).match(/^[a-zA-Z_]*$/))) {
                    setShowMentionDropdown(true);
                    setMentionFilter(e.target.value.substring(lastAtIndex + 1));
                    setSelectedMentionIndex(0);
                  } else {
                    setShowMentionDropdown(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !showMentionDropdown) {
                    sendMessage();
                  } else if (showMentionDropdown) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedMentionIndex(prev => Math.min(prev + 1, filteredAgents.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                      e.preventDefault();
                      const selectedAgent = filteredAgents[selectedMentionIndex];
                      if (selectedAgent) {
                        const beforeMention = inputValue.substring(0, inputValue.lastIndexOf('@'));
                        setInputValue(beforeMention + '@' + selectedAgent.name + ' ');
                        setShowMentionDropdown(false);
                      }
                    } else if (e.key === 'Escape') {
                      setShowMentionDropdown(false);
                    }
                  }
                }}
                placeholder="Type @ to mention an agent..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  backdropFilter: 'blur(10px)'
                }}
              />
              <button
                onClick={() => sendMessage()}
                style={{
                  padding: '12px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}