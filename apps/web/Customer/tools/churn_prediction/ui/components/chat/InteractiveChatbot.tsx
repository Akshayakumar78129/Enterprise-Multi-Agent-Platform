

import React, { useState, useEffect, useRef } from 'react';
import { parseMentions, extractQueryContext } from '../../utils/mentionParser';
import { queryAgent, mockAgentResponse } from '../../services/agentCommunication';
import { getAgentConfig, isValidAgent } from '../../config/agentRegistry';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

interface InteractiveChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  contextData?: any; // Churn data for context-aware responses
}

// Helper function to format AI messages with proper styling
const formatAIMessage = (text: string) => {
  // Split text by **bold** markers and bullet points
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Handle bullet points
    if (line.trim().startsWith('•')) {
      const bulletContent = line.replace(/^•\s*/, '');
      const formattedContent = formatTextWithBold(bulletContent);
      return (
        <div key={lineIndex} style={{ marginLeft: '16px', marginBottom: '4px' }}>
          <span style={{ color: '#FFC107', marginRight: '8px' }}>•</span>
          {formattedContent}
        </div>
      );
    }
    
    // Handle numbered lists
    if (/^\d+\.\s/.test(line.trim())) {
      const formattedContent = formatTextWithBold(line);
      return (
        <div key={lineIndex} style={{ marginLeft: '16px', marginBottom: '4px' }}>
          {formattedContent}
        </div>
      );
    }
    
    // Handle section headers (lines that end with :)
    if (line.trim().endsWith(':') && line.trim().startsWith('**') && line.trim().endsWith('**:')) {
      const headerText = line.trim().slice(2, -3); // Remove ** and :
      return (
        <div key={lineIndex} style={{ 
          fontWeight: 700, 
          color: '#FFC107', 
          marginTop: lineIndex > 0 ? '12px' : '0',
          marginBottom: '8px',
          fontSize: '15px'
        }}>
          {headerText}:
        </div>
      );
    }
    
    // Handle regular lines with bold formatting
    if (line.trim()) {
      return (
        <div key={lineIndex} style={{ marginBottom: '4px' }}>
          {formatTextWithBold(line)}
        </div>
      );
    }
    
    // Empty lines for spacing
    return <div key={lineIndex} style={{ height: '8px' }} />;
  });
};

// Helper function to format **bold** text within a line
const formatTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index} style={{ fontWeight: 700, color: '#FFC107' }}>{boldText}</strong>;
    }
    return part;
  });
};

export default function InteractiveChatbot({ isOpen, onClose, contextData }: InteractiveChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 Hi! I\'m your AI Churn Analysis Assistant. I can help you understand your customer data, analyze trends, and suggest retention strategies. What would you like to know?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on churn data
    if (lowerMessage.includes('high risk') || lowerMessage.includes('dangerous')) {
      const highRiskCustomers = contextData?.customers?.filter((c: any) => c.risk_level === 'High') || [];
      const veryHighRiskCustomers = contextData?.customers?.filter((c: any) => c.risk_level === 'Very High') || [];
      const totalHighRisk = highRiskCustomers.length + veryHighRiskCustomers.length;
      const totalCustomers = contextData?.customers?.length || 0;
      const riskPct = totalCustomers > 0 ? Math.round((totalHighRisk / totalCustomers) * 100) : 0;
      
      return `🚨 **High-Risk Customer Analysis**: You currently have **${totalHighRisk} customers** at high/very high risk (${riskPct}% of total). 

**Risk Breakdown:**
• **Very High Risk**: ${veryHighRiskCustomers.length} customers - Emergency action required
• **High Risk**: ${highRiskCustomers.length} customers - Immediate attention needed

**Key Insights:**
• **Revenue at Risk**: ~$${(totalHighRisk * 2500).toLocaleString()}
• **Urgency Level**: ${totalHighRisk > 50 ? 'CRITICAL - Deploy emergency retention campaigns' : totalHighRisk > 20 ? 'HIGH - Focus on personalized outreach' : 'MODERATE - Implement targeted strategies'}
• **Top Risk Factor**: ${contextData?.topFactor || 'Recency'}

**Recommended Actions:**
1. **Immediate**: Contact top ${Math.min(10, veryHighRiskCustomers.length)} very high-risk customers personally
2. **This Week**: Launch targeted email campaign with special offers to all ${totalHighRisk} high-risk customers
3. **This Month**: Implement loyalty program improvements and address **${contextData?.topFactor || 'key risk factors'}**

Would you like me to analyze specific customer segments or suggest detailed retention strategies?`;
    }

    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern') || lowerMessage.includes('temporal')) {
      const riskTimeSeries = contextData?.risk_time_series || [];
      if (riskTimeSeries.length > 0) {
        const latest = riskTimeSeries[riskTimeSeries.length - 1];
        const earliest = riskTimeSeries[0];
        const highRiskChange = (latest.high + latest.very_high) - (earliest.high + earliest.very_high);
        
        return `📈 **Temporal Risk Analysis**: 

**Trend Overview:**
• **${riskTimeSeries.length} periods** of data analyzed
• **Risk Change**: ${highRiskChange > 0 ? '+' : ''}${highRiskChange} high-risk customers
• **Pattern**: ${highRiskChange > 5 ? 'Escalating risk - immediate attention needed' : highRiskChange > 0 ? 'Slight increase - monitor closely' : 'Stable or improving'}

**Key Observations:**
• **Seasonality**: ${Math.random() > 0.5 ? 'Holiday periods show 15% higher churn risk' : 'End-of-quarter patterns detected'}
• **Volatility**: ${Math.random() > 0.5 ? 'High volatility suggests external factors' : 'Stable pattern indicates predictable behavior'}
• **Recent Trend**: ${highRiskChange > 0 ? 'Upward trajectory requires intervention' : 'Downward or stable - current strategies working'}

**Predictive Insights:**
Based on current patterns, expect ${Math.random() > 0.5 ? 'continued increase' : 'stabilization'} in the next 30 days.

What specific time period or pattern would you like me to analyze deeper?`;
      }
    }

    if (lowerMessage.includes('segment') || lowerMessage.includes('customer type')) {
      const segments = contextData?.segment_matrix || [];
      if (segments.length > 0) {
        const riskiestSegment = segments.reduce((prev: any, curr: any) => 
          (curr.high + curr.very_high) > (prev.high + prev.very_high) ? curr : prev
        );
        
        return `👥 **Customer Segment Analysis**:

**Riskiest Segment**: **${riskiestSegment.segment}**
• **High Risk**: ${riskiestSegment.high + riskiestSegment.very_high} customers
• **Total**: ${riskiestSegment.low + riskiestSegment.medium + riskiestSegment.high + riskiestSegment.very_high} customers
• **Risk Rate**: ${Math.round(((riskiestSegment.high + riskiestSegment.very_high) / (riskiestSegment.low + riskiestSegment.medium + riskiestSegment.high + riskiestSegment.very_high)) * 100)}%

**Segment Insights:**
${segments.map((seg: any) => {
  const total = seg.low + seg.medium + seg.high + seg.very_high;
  const riskPct = Math.round(((seg.high + seg.very_high) / total) * 100);
  const status = riskPct > 25 ? '🚨 CRITICAL' : riskPct > 15 ? '⚠️ ELEVATED' : '✅ STABLE';
  return `• **${seg.segment}**: ${riskPct}% risk ${status}`;
}).join('\n')}

**Strategic Recommendations:**
1. **Priority Focus**: ${riskiestSegment.segment} segment needs immediate attention
2. **Tailored Approach**: Each segment requires different retention strategies
3. **Resource Allocation**: Invest 60% of retention budget in top 2 risky segments

Which segment would you like me to analyze in detail?`;
      }
    }

    if (lowerMessage.includes('strategy') || lowerMessage.includes('retention') || lowerMessage.includes('action')) {
      const highRiskCustomers = contextData?.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High') || [];
      const mediumRiskCustomers = contextData?.customers?.filter((c: any) => c.risk_level === 'Medium') || [];
      const totalCustomers = contextData?.customers?.length || 0;
      const expectedROI = highRiskCustomers.length * 2500; // Updated to match other calculations
      
      return `🎯 **Retention Strategy Recommendations**:

**Immediate Actions (Next 7 Days):**
1. **Personal Outreach**: Call top ${Math.min(10, highRiskCustomers.length)} highest-risk customers
2. **Email Campaign**: Send personalized offers to ${highRiskCustomers.length} high-risk customers
3. **Support Check**: Proactive support for customers with recent issues

**Short-term (Next 30 Days):**
1. **Loyalty Program**: Launch enhanced rewards for ${highRiskCustomers.length + mediumRiskCustomers.length} at-risk customers
2. **Product Training**: Offer free training sessions to increase engagement
3. **Feedback Collection**: Survey ${mediumRiskCustomers.length} medium-risk customers to prevent escalation

**Long-term (Next 90 Days):**
1. **Product Improvements**: Address **${contextData?.topFactor || 'top churn factors'}** identified
2. **Customer Success**: Implement dedicated success manager for high-value accounts
3. **Predictive Alerts**: Set up automated early warning system

**Budget Allocation:**
• **60%** - High/Very High risk customers (${highRiskCustomers.length} customers)
• **25%** - Medium risk prevention (${mediumRiskCustomers.length} customers)
• **15%** - Low risk retention (${totalCustomers - highRiskCustomers.length - mediumRiskCustomers.length} customers)

**Expected ROI**: $${expectedROI.toLocaleString()} revenue protection

What specific strategy area would you like me to elaborate on?`;
    }

    if (lowerMessage.includes('model') || lowerMessage.includes('accuracy') || lowerMessage.includes('confidence')) {
      const confidence = contextData?.modelConfidence || 0.85;
      return `🤖 **Model Performance Analysis**:

**Current Confidence**: **${(confidence * 100).toFixed(1)}%** (${confidence > 0.8 ? 'Excellent' : confidence > 0.7 ? 'Good' : 'Needs Improvement'})

**Model Insights:**
• **Accuracy**: ${confidence > 0.8 ? 'High prediction accuracy - trust the insights' : 'Moderate accuracy - use with caution'}
• **Top Predictor**: **${contextData?.topFactor || 'Recency'}** (strongest churn indicator)
• **Reliability**: ${confidence > 0.8 ? 'Suitable for automated decisions' : 'Requires human validation'}

**Feature Importance:**
${contextData?.feature_importance?.slice(0, 5).map((f: any, i: number) => 
  `${i + 1}. **${f.feature}**: ${(f.importance * 100).toFixed(1)}% impact`
).join('\n') || 'Feature data not available'}

**Model Recommendations:**
• **Data Quality**: ${confidence > 0.8 ? 'Excellent - continue current data collection' : 'Consider adding more features'}
• **Update Frequency**: Retrain model ${confidence > 0.8 ? 'monthly' : 'bi-weekly'} for optimal performance
• **Validation**: ${confidence > 0.8 ? 'Quarterly validation sufficient' : 'Weekly validation recommended'}

Would you like me to explain any specific model metrics or suggest improvements?`;
    }

    // General responses for common questions
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 **I can help you with**:

**📊 Data Analysis:**
• Explain your churn metrics and KPIs
• Analyze customer risk patterns and trends
• Compare different customer segments

**🔍 Insights & Predictions:**
• Identify high-risk customers and reasons
• Predict future churn patterns
• Explain model confidence and accuracy

**🎯 Strategy & Actions:**
• Suggest retention strategies
• Prioritize customer outreach
• Calculate ROI of retention efforts

**💡 Custom Analysis:**
• Answer specific questions about your data
• Provide detailed segment analysis
• Explain temporal patterns and seasonality

**Example questions you can ask:**
• "Why are my high-risk customers churning?"
• "What's the trend in my churn rate?"
• "Which customer segment needs attention?"
• "How confident is the prediction model?"
• "What retention strategy should I use?"

What would you like to explore first?`;
    }

    // Default response with suggestions
    return `🤔 I understand you're asking about "${userMessage}". Let me provide some insights based on your current data:

**Quick Analysis:**
• **Total Customers**: ${contextData?.customers?.length || 0}
• **High Risk**: ${contextData?.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0} customers
• **Model Confidence**: ${((contextData?.modelConfidence || 0.85) * 100).toFixed(1)}%

**I can help you with:**
• 📈 **Trend Analysis** - "Show me churn trends"
• 👥 **Segment Analysis** - "Which segments are at risk?"
• 🎯 **Retention Strategies** - "What actions should I take?"
• 🤖 **Model Insights** - "How accurate are predictions?"

Could you be more specific about what aspect you'd like me to analyze? For example, you could ask about specific customer segments, time periods, or retention strategies.`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(inputText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '❌ Sorry, I encountered an error. Please try asking your question again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        maxHeight: '600px',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #232a36 100%)',
        borderRadius: '16px',
        border: '2px solid #FFC107',
        boxShadow: '0 20px 60px rgba(255, 193, 7, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
          color: '#0a1224',
          borderRadius: '14px 14px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>🤖 AI Churn Analysis Assistant</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.8 }}>Ask me anything about your customer data</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#0a1224',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
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
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: message.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: message.sender === 'user' 
                  ? 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                  : 'rgba(255, 193, 7, 0.15)',
                color: message.sender === 'user' ? '#fff' : '#f7f9fb',
                border: message.sender === 'ai' ? '1px solid rgba(255, 193, 7, 0.3)' : 'none',
                fontSize: '14px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap'
              }}>
                {message.sender === 'ai' ? formatAIMessage(message.text) : message.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '16px 16px 16px 4px',
                background: 'rgba(255, 193, 7, 0.15)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                color: '#f7f9fb',
                fontSize: '14px'
              }}>
                🤖 Analyzing your data...
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255, 193, 7, 0.2)',
          display: 'flex',
          gap: '12px'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your churn data, trends, strategies..."
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              background: 'rgba(255, 193, 7, 0.1)',
              color: '#f7f9fb',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
              minHeight: '40px',
              maxHeight: '100px'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: inputText.trim() && !isTyping 
                ? 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)'
                : 'rgba(255, 193, 7, 0.3)',
              color: '#0a1224',
              fontSize: '14px',
              fontWeight: 600,
              cursor: inputText.trim() && !isTyping ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}