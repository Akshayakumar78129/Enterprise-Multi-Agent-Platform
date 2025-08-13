import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from 'store';
import { toggleChat, clearChatContext } from '../../state/churnPredictionSlice';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  contextData?: any;
}

export default function ContextAwareChatbot() {
  const dispatch = useDispatch();
  const { isChatOpen, chatContext, customers } = useSelector((state: RootState) => state.churnPrediction);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '👋 Hi! I\'m your AI Churn Analysis Assistant. I can help you understand your customer data, analyze trends, and suggest retention strategies. Click on any chart element to get specific insights!',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle context changes from chart clicks
  useEffect(() => {
    if (chatContext) {
      // Directly open chat with context
      dispatch(toggleChat(true));
      
      // Add context message to chat
      const contextMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: generateContextMessage(chatContext),
        timestamp: new Date(),
        contextData: chatContext
      };
      setMessages(prev => [...prev, contextMessage]);
    }
  }, [chatContext]);

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

What would you like to know about these ${riskLevel.toLowerCase()} risk customers?`;

      case 'probability-histogram':
        return `📈 **${chartName} Analysis**

You selected the probability range showing **${selectedData?.count || 0} customers** with churn probability around **${selectedData?.probability || 0}%**.

**Analysis:**
• ${getProbabilityInsight(selectedData?.probability || 0)}
• These customers require ${getProbabilityAction(selectedData?.probability || 0)}

How can I help you develop strategies for this probability range?`;

      case 'feature-importance':
        const feature = clickedElement;
        const importance = selectedData?.importance || 0;
        return `🎯 **${chartName} - ${feature} Analysis**

You selected **${feature}** which has an importance score of **${(importance * 100).toFixed(1)}%** in predicting churn.

**Feature Insights:**
• ${getFeatureDescription(feature)}
• ${getFeatureImpact(feature, importance)}

What strategies would you like to explore for improving this factor?`;

      case 'temporal-pattern':
        return `📅 **${chartName} Analysis**

You selected data from **${selectedData?.period || 'this time period'}** showing risk pattern changes.

**Temporal Insights:**
• ${getTemporalInsight(selectedData)}
• Trend indicates ${getTemporalTrend(selectedData)}

Would you like me to analyze specific time periods or predict future trends?`;

      default:
        return `🔍 **${chartName} Selected**

I can see you're interested in this data point. Let me help you understand what this means for your churn prediction strategy.

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

  const getFeatureDescription = (feature: string) => {
    const descriptions: { [key: string]: string } = {
      'recency': 'How recently customers made their last purchase',
      'frequency': 'How often customers make purchases',
      'monetary': 'The total value of customer purchases',
      'rfm_score': 'Combined recency, frequency, and monetary score',
      'avg_order_value': 'Average amount spent per transaction',
      'days_since_last_purchase': 'Time elapsed since last transaction'
    };
    return descriptions[feature.toLowerCase()] || 'This factor influences customer churn probability';
  };

  const getFeatureImpact = (feature: string, importance: number) => {
    if (importance > 0.3) return 'This is a critical factor - small changes can significantly impact churn risk';
    if (importance > 0.15) return 'This is an important factor that should be monitored and optimized';
    if (importance > 0.05) return 'This factor has moderate influence on churn prediction';
    return 'This factor has minor influence but may be important for specific customer segments';
  };

  const getTemporalInsight = (data: any) => {
    return 'Risk patterns show seasonal variations and trend changes over time';
  };

  const getTemporalTrend = (data: any) => {
    return 'an evolving customer behavior pattern that requires adaptive strategies';
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend) return;

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
      // Enhanced prompt with context awareness
      let contextInfo = '';
      if (chatContext) {
        contextInfo = `\n\nCurrent Context: User is analyzing ${chatContext.chartName} and clicked on ${chatContext.clickedElement}. Chart data: ${JSON.stringify(chatContext.selectedData)}`;
      }

      const customerStats = {
        total: customers.length,
        highRisk: customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High').length,
        avgChurnProb: customers.length > 0 ? (customers.reduce((sum, c) => sum + c.churn_probability, 0) / customers.length * 100).toFixed(1) : 0
      };

      const prompt = `You are an advanced AI assistant for a churn prediction dashboard. The user asked: "${textToSend}".

Current Customer Data:
- Total customers: ${customerStats.total}
- High/Very High risk: ${customerStats.highRisk}
- Average churn probability: ${customerStats.avgChurnProb}%

${contextInfo}

Provide a helpful, professional, and insightful response about churn prediction, customer analytics, or retention strategies.

Guidelines:
- Be conversational but professional
- Use relevant emojis sparingly
- Provide actionable insights when possible
- If discussing metrics, explain their business impact
- Keep responses concise but informative
- End with a follow-up question when appropriate
- If context is provided, reference the specific chart element they clicked on`;

      // Note: In a real implementation, you would call your AI service here
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateAIResponse(textToSend, chatContext, customerStats),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '⚠️ I\'m experiencing some technical difficulties right now. Please try again in a moment!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userMessage: string, context: any, stats: any) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('retention')) {
      return `🎯 **Retention Strategy Recommendations**

Based on your current data (${stats.highRisk} high-risk customers out of ${stats.total}):

**Immediate Actions:**
• **High-Risk Customers**: Implement personalized win-back campaigns
• **Medium-Risk Customers**: Proactive engagement with satisfaction surveys
• **Low-Risk Customers**: Focus on loyalty programs and upselling

**Long-term Strategies:**
• Improve customer onboarding to reduce early churn
• Implement predictive alerts for risk escalation
• Develop segment-specific retention playbooks

${context ? `For the ${context.clickedElement} segment you selected, I recommend focusing on ${getContextualStrategy(context)}.` : ''}

Which risk segment would you like me to create a detailed action plan for?`;
    }

    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      return `📈 **Churn Trend Analysis**

Your current churn patterns show:

**Key Observations:**
• Average churn probability: ${stats.avgChurnProb}%
• High-risk concentration: ${((stats.highRisk / stats.total) * 100).toFixed(1)}%
• ${getTrendInsight(stats)}

**Pattern Insights:**
• ${getPatternRecommendation(stats)}
• Consider seasonal adjustments to your retention strategies
• Monitor feature importance changes over time

${context ? `The ${context.chartName} data you're viewing shows ${getContextualTrend(context)}.` : ''}

Would you like me to dive deeper into any specific trend or time period?`;
    }

    return `💡 **Churn Analysis Insights**

I can help you understand your churn data better! Here's what I can assist with:

**Available Analysis:**
• Risk level breakdowns and recommendations
• Feature importance explanations
• Retention strategy development
• Trend analysis and predictions
• Customer segment comparisons

**Current Overview:**
• You have ${stats.total} customers analyzed
• ${stats.highRisk} customers need immediate attention
• Average churn risk is ${stats.avgChurnProb}%

${context ? `I see you're looking at ${context.chartName}. ` : ''}What specific aspect would you like to explore?`;
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
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'bot',
      content: '🔄 Chat cleared! How can I help you with your churn analysis?',
      timestamp: new Date()
    }]);
    dispatch(clearChatContext());
  };





  if (!isChatOpen) return null;

  return (
    <div style={{
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
      boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)'
    }}>
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
              Churn AI Assistant
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94a3b8'
            }}>
              {chatContext ? `Analyzing: ${chatContext.chartName}` : 'Ready to help'}
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
            onClick={() => dispatch(toggleChat(false))}
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
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div key={message.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
              }}
            >
              <div style={{
                maxWidth: '85%',
                padding: '14px 18px',
                borderRadius: message.type === 'user' 
                  ? '20px 20px 6px 20px' 
                  : '20px 20px 20px 6px',
                background: message.type === 'user' 
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
                color: message.type === 'user' ? '#ffffff' : '#f8fafc',
                fontSize: '14px',
                lineHeight: '1.5',
                fontWeight: message.type === 'user' ? '600' : '400',
                border: message.type === 'bot' ? '1px solid rgba(58, 68, 89, 0.3)' : 'none',
                boxShadow: message.type === 'user' 
                  ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                  : '0 4px 15px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                whiteSpace: 'pre-wrap'
              }}>
                {message.content}
              </div>
            </div>
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

      {/* Input */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(58, 68, 89, 0.3)',
        background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9), rgba(42, 47, 62, 0.9))',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={chatContext ? `Ask about ${chatContext.chartName}...` : "Ask me anything about churn analysis..."}
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
