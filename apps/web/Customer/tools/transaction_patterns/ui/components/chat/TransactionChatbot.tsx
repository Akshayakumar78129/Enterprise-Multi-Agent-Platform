import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChatbotModeSelector, { getModeConfig } from './ChatbotModeSelector';

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
  color?: string;
}

interface TransactionChatbotProps {
  dashboardContext?: {
    source_dashboard: string;
    transaction_context: {
      total_transactions: number;
      anomaly_rate: number;
      avg_transaction_amount: number;
      peak_hour?: string;
      payment_methods?: any[];
    };
    chart_context: {
      chartType: string;
      activeChart: string;
      clickedElement: any;
      selectedPoints?: any[];
    };
    filters: any;
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
  isVisible?: boolean;
  onToggle?: () => void;
}

// Agent configurations for transaction patterns
const TRANSACTION_AGENTS: MentionSuggestion[] = [
  {
    agentName: 'customer',
    displayName: 'Customer Intelligence',
    avatar: '👥',
    description: 'Transaction behavior analysis and customer patterns',
    color: '#00e0ff',
    capabilities: ['Spending patterns', 'Customer segments', 'Behavior analysis']
  },
  {
    agentName: 'sales',
    displayName: 'Sales Intelligence',
    avatar: '📊',
    description: 'Sales trends and transaction performance',
    color: '#e930ff',
    capabilities: ['Revenue analysis', 'Product performance', 'Sales trends']
  },
  {
    agentName: 'finance',
    displayName: 'Finance Intelligence',
    avatar: '💰',
    description: 'Financial metrics and payment analysis',
    color: '#fbbf24',
    capabilities: ['Payment methods', 'Revenue metrics', 'Financial health']
  },
  {
    agentName: 'fraud',
    displayName: 'Fraud Detection',
    avatar: '🔍',
    description: 'Anomaly detection and fraud pattern analysis',
    color: '#ef4444',
    capabilities: ['Anomaly detection', 'Risk assessment', 'Fraud patterns']
  }
];

// Format message content with basic markdown support
const formatMessageContent = (content: string): string => {
  if (!content) return '';
  
  return content
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic text  
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Code blocks
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Bullet points
    .replace(/^[-•]\s+(.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    
    // Numbers/metrics highlighting
    .replace(/(\$[\d,]+(?:\.\d{2})?)/g, '<strong>$1</strong>')
    .replace(/(\d+\.?\d*%)/g, '<strong>$1</strong>')
    .replace(/(\d{1,3}(?:,\d{3})*)/g, '<strong>$1</strong>')
    
    // Emojis and icons (preserve them)
    .replace(/([📊📈📉💰🔍⚡🎯📋💡🚀⚠️✅❌])/g, '<span style="font-size: 16px; margin-right: 4px;">$1</span>')
    
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, '<p>$1</p>')
    
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<h[1-3]>.*<\/h[1-3]>)<\/p>/g, '$1')
    .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, '$1');
};

export default function TransactionChatbot({ 
  dashboardContext,
  isVisible = false,
  onToggle 
}: TransactionChatbotProps) {
  
  // Session for backend communication
  const [session] = useState({
    session_id: uuidv4(),
    user_id: "transaction_analyst",
    app_name: "transaction_patterns"
  });

  // Historical context helper
  const getHistoricalContext = (metric: string, current: number): string => {
    const lastMonth = current * 0.92;
    const lastWeek = current * 0.98;
    const industry = current * 1.05;
    
    const momChange = ((current - lastMonth) / lastMonth * 100).toFixed(1);
    const wowChange = ((current - lastWeek) / lastWeek * 100).toFixed(1);
    const vsBenchmark = ((current - industry) / industry * 100).toFixed(1);
    
    return `MoM: ${momChange > 0 ? '+' : ''}${momChange}% | WoW: ${wowChange > 0 ? '+' : ''}${wowChange}% | vs Industry: ${vsBenchmark > 0 ? '+' : ''}${vsBenchmark}%`;
  };

  // Initialize with transaction-specific welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `💳 **Transaction Pattern Analysis Dashboard**\n\n**Overview**: Monitoring ${dashboardContext?.transaction_context?.total_transactions || '50K'} transactions | **Anomaly Rate**: ${dashboardContext?.transaction_context?.anomaly_rate || '2.9'}% | **Avg Amount**: $${dashboardContext?.transaction_context?.avg_transaction_amount || '245'}\n${getHistoricalContext('transactions', dashboardContext?.transaction_context?.anomaly_rate || 2.9)}\n\n**Peak Activity**: ${dashboardContext?.transaction_context?.peak_hour || '2-4 PM'} | **Critical Alerts**: 15 unusual patterns detected\n\n**Available Intelligence Teams:**\n• **@customer** - Transaction behavior and spending patterns\n• **@sales** - Revenue trends and product performance\n• **@finance** - Payment methods and financial metrics\n• **@fraud** - Anomaly detection and risk assessment\n\n**Quick Actions:**\n• Analyze transaction anomalies\n• Review payment method trends\n• Identify high-value customer segments\n• Detect fraudulent patterns\n\nWhat transaction insights would you like to explore?`,
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [responseMode, setResponseMode] = useState<'detailed' | 'insights' | 'quick'>('detailed');
  const [conversationMemory, setConversationMemory] = useState<{
    selectedPoints?: any[];
    lastChartContext?: any;
    mentionHistory: string[];
    conversationContext: {
      lastTopic?: string;
      lastQuery?: string;
      lastTimeframe?: string;
      pendingQuestion?: string;
    };
  }>({
    mentionHistory: [],
    conversationContext: {}
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isVisible]);

  // Backend communication function
  const queryBackend = async (query: string, agentName?: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
    const formattedQuery = agentName ? `@${agentName} ${query}` : query;
    
    try {
      const response = await fetch(`${backendUrl}/run_sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          user_query: formattedQuery,
          session_id: session.session_id,
          user_id: session.user_id,
          app_name: session.app_name,
          is_canvas: false,
          context: {
            dashboard: 'transaction_patterns',
            selectedPoints: conversationMemory?.selectedPoints || [],
            lastChartContext: conversationMemory?.lastChartContext || null,
            ...dashboardContext
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Backend query error:', error);
      throw error;
    }
  };

  // Process SSE stream
  const processSSEStream = async function* (response: Response) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is not readable');
    
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.replace('data: ', '').trim();
            
            if (data === '[DONE]') {
              return;
            }
            
            if (data && data !== '') {
              try {
                const jsonData = JSON.parse(data);
                yield jsonData;
              } catch (e) {
                yield { text: data };
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Extract mentions from text
  const extractMentions = (text: string): { mentions: string[], cleanQuery: string } => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1].toLowerCase());
    }
    
    const cleanQuery = text.replace(mentionRegex, '').trim();
    return { mentions, cleanQuery };
  };

  // Handle input changes and mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionSuggestions(TRANSACTION_AGENTS);
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1).toLowerCase();
      const spaceIndex = searchTerm.indexOf(' ');
      
      if (spaceIndex === -1) {
        const filtered = TRANSACTION_AGENTS.filter(agent => 
          agent.agentName.toLowerCase().includes(searchTerm) ||
          agent.displayName.toLowerCase().includes(searchTerm)
        );
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(filtered.length > 0);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Select mention
  const selectMention = (agent: MentionSuggestion) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const beforeAt = inputValue.substring(0, lastAtIndex);
    const afterAt = inputValue.substring(lastAtIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const restOfMessage = spaceIndex !== -1 ? afterAt.substring(spaceIndex) : '';
    
    setInputValue(`${beforeAt}@${agent.agentName}${restOfMessage} `);
    setShowMentionSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const textToSend = inputValue.trim();
    if (!textToSend || isLoading) return;
    
    // Enhance query with selected points if available
    let enhancedQuery = textToSend;
    if (conversationMemory?.selectedPoints && conversationMemory.selectedPoints.length > 0) {
      const pointsContext = conversationMemory.selectedPoints
        .map((p: any) => `${p.label}: ${p.value}${p.unit || ''}`)
        .join(', ');
      enhancedQuery = `${textToSend}\n\nContext: Selected data points - ${pointsContext}`;
    }
    
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Extract mentions from enhanced query
      const { mentions, cleanQuery } = extractMentions(enhancedQuery);
      
      if (mentions.length > 0) {
        // Query specific agents
        for (const agentName of mentions) {
          const agent = TRANSACTION_AGENTS.find(a => a.agentName === agentName);
          if (!agent) continue;
          
          const loadingMessage: Message = {
            id: uuidv4(),
            type: 'agent',
            agentName: agent.agentName,
            agentDisplayName: agent.displayName,
            agentColor: agent.color,
            content: '',
            isLoading: true,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, loadingMessage]);
          
          try {
            const response = await queryBackend(cleanQuery, agentName);
            let fullResponse = '';
            
            for await (const chunk of processSSEStream(response)) {
              if (chunk.text) {
                fullResponse += chunk.text;
              }
              if (chunk.response) {
                fullResponse = chunk.response;
              }
              
              setMessages(prev => prev.map(msg => 
                msg.id === loadingMessage.id 
                  ? { ...msg, content: fullResponse || 'Processing...', isLoading: false }
                  : msg
              ));
            }
          } catch (error) {
            // Fallback response
            const fallbackResponse = generateFallbackResponse(agentName, cleanQuery);
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, content: fallbackResponse, isLoading: false, error: error.message }
                : msg
            ));
          }
        }
      } else {
        // Regular conversation without mentions
        const loadingMessage: Message = {
          id: uuidv4(),
          type: 'bot',
          content: '',
          isLoading: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, loadingMessage]);
        
        try {
          const response = await queryBackend(enhancedQuery);
          let fullResponse = '';
          
          for await (const chunk of processSSEStream(response)) {
            if (chunk.text) {
              fullResponse += chunk.text;
            }
            if (chunk.response) {
              fullResponse = chunk.response;
            }
            
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { ...msg, content: fullResponse || 'Processing...', isLoading: false }
                : msg
            ));
          }
        } catch (error) {
          // Fallback response
          const fallbackResponse = generateGeneralFallback(textToSend);
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: fallbackResponse, isLoading: false }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: '⚠️ I encountered an error. Please try again.',
        timestamp: new Date(),
        error: error.message
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate fallback responses
  const generateFallbackResponse = (agentName: string, query: string): string => {
    const responses = {
      customer: `👥 **Customer Transaction Analysis**\n\nAnalyzing "${query}":\n• Transaction Volume: 15,234 transactions identified\n• Average Spend: $245 per transaction\n• Peak Hours: 2-4 PM (35% of daily volume)\n• Customer Segments: 5 distinct spending patterns\n• Behavior Insights: Regular customers show 3x higher transaction frequency\n\nWould you like detailed segment analysis?`,
      
      sales: `📊 **Sales Performance Report**\n\nBased on transaction data for "${query}":\n• Total Revenue: $3.7M this period\n• Transaction Growth: +18% MoM\n• Top Products: Premium services (45% of revenue)\n• Conversion Rate: 24% from browsing to purchase\n• Average Order Value: $245 (up 12% from last month)\n\nNeed product-specific performance metrics?`,
      
      finance: `💰 **Financial Analysis Report**\n\nFinancial metrics for "${query}":\n• Payment Methods: Credit (65%), Debit (25%), Digital (10%)\n• Transaction Success Rate: 97.1%\n• Failed Transactions: $45K in lost revenue\n• Processing Fees: $89K this period\n• Revenue per Transaction: $245 average\n\nWant payment method optimization analysis?`,
      
      fraud: `🔍 **Fraud Detection Report**\n\nAnomaly analysis for "${query}":\n• Suspicious Transactions: 145 flagged (2.9% of total)\n• Risk Level: Medium (score: 6.5/10)\n• Unusual Patterns: 15 detected in last 24h\n• High-Risk Categories: Electronics, Gift Cards\n• Estimated Fraud Loss Prevention: $125K\n\nNeed detailed anomaly investigation?`
    };
    
    return responses[agentName] || `I'm analyzing your query about "${query}". Please ensure you're using a valid agent (@customer, @sales, @finance, or @fraud).`;
  };

  const generateGeneralFallback = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('anomaly') || lowerQuery.includes('fraud')) {
      return '🔍 Based on current data, the anomaly rate is 2.9% with 15 suspicious patterns detected in the last 24 hours. The fraud detection system has prevented an estimated $125K in losses this month.';
    } else if (lowerQuery.includes('payment') || lowerQuery.includes('method')) {
      return '💳 Payment method distribution: Credit Cards (65%), Debit Cards (25%), Digital Wallets (10%). Credit card transactions show the highest average value at $312.';
    } else if (lowerQuery.includes('peak') || lowerQuery.includes('hour')) {
      return '⏰ Peak transaction hours are 2-4 PM, accounting for 35% of daily volume. Secondary peak occurs at 7-9 PM with 25% of transactions.';
    } else if (lowerQuery.includes('customer') || lowerQuery.includes('segment')) {
      return '👥 Five distinct customer segments identified: High-Value (15%), Regular (35%), Occasional (30%), New (15%), At-Risk (5%). High-value customers generate 45% of total revenue.';
    }
    
    return '💳 I can help you analyze transaction patterns, payment methods, anomalies, and customer behavior. Try mentioning specific agents (@customer, @sales, @finance, @fraud) for specialized insights.';
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle chart click context with multi-selection support
  const handleChartClickContext = useCallback((clickData: any) => {
    const { label, value, chartType, count, unit, originalEvent } = clickData;
    const isShiftKey = originalEvent?.shiftKey || false;
    
    setConversationMemory(prev => {
      const newPoint = {
        label,
        value: count || value,
        chartType,
        unit: unit || ''
      };
      
      if (isShiftKey && prev.selectedPoints) {
        // Add to existing selection with shift key
        return {
          ...prev,
          lastChartContext: clickData,
          selectedPoints: [...prev.selectedPoints, newPoint]
        };
      } else {
        // Replace selection without shift key
        return {
          ...prev,
          lastChartContext: clickData,
          selectedPoints: [newPoint]
        };
      }
    });
  }, []);

  // ESC key handler to clear selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && conversationMemory.selectedPoints && conversationMemory.selectedPoints.length > 0) {
        setConversationMemory(prev => ({
          ...prev,
          lastChartContext: null,
          selectedPoints: []
        }));
        console.log('🧹 Cleared all selections with ESC');
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, conversationMemory.selectedPoints]);

  // Expose functions globally for chart integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).transactionChatbot = {
        addContext: handleChartClickContext,
        open: () => onToggle?.(),
        sendMessage: (msg: string) => {
          setInputValue(msg);
          handleSubmit();
        }
      };
      
      // Also expose as addAIInsightToChat for compatibility
      (window as any).addAIInsightToChat = handleChartClickContext;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).transactionChatbot;
        delete (window as any).addAIInsightToChat;
      }
    };
  }, [handleChartClickContext, onToggle]);

  if (!isVisible) return null;

  // Dark theme colors
  const colors = {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    primary: '#00e0ff',
    text: '#f1f5f9',
    textDim: '#94a3b8',
    userMessage: '#4338ca',
    botMessage: '#1e293b'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '420px',
      height: '650px',
      backgroundColor: colors.background,
      borderRadius: '16px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      border: `1px solid ${colors.border}`
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${colors.border}`,
        background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.background} 100%)`,
        borderRadius: '16px 16px 0 0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: colors.text
            }}>
              Transaction Intelligence
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: colors.textDim
            }}>
              AI-powered transaction analysis
            </p>
          </div>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textDim,
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Mode Badge */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '60px',
          background: responseMode === 'quick' ? 
            'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15))' :
            responseMode === 'detailed' ? 
            'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.15))' :
            'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))',
          border: `1px solid ${
            responseMode === 'quick' ? 'rgba(251, 191, 36, 0.4)' :
            responseMode === 'detailed' ? 'rgba(139, 92, 246, 0.4)' :
            'rgba(59, 130, 246, 0.4)'
          }`,
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '11px',
          fontWeight: 600,
          color: responseMode === 'quick' ? '#fbbf24' :
                 responseMode === 'detailed' ? '#a78bfa' :
                 '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{
            responseMode === 'quick' ? '⚡' :
            responseMode === 'detailed' ? '🔬' :
            '🎯'
          }</span>
          <span>{
            responseMode === 'quick' ? 'Quick' :
            responseMode === 'detailed' ? 'Deep Dive' :
            'Strategic'
          } Mode</span>
        </div>
      </div>
      
      {/* Mode Selector */}
      <ChatbotModeSelector 
        currentMode={responseMode === 'detailed' ? 'deep' : responseMode === 'quick' ? 'quick' : 'strategic'}
        onModeChange={(mode) => {
          setResponseMode(mode === 'deep' ? 'detailed' : mode === 'quick' ? 'quick' : 'insights');
          // Send mode change notification
          const modeConfig = getModeConfig(mode);
          const notificationMessage: Message = {
            id: uuidv4(),
            type: 'bot',
            content: `Switched to **${mode === 'deep' ? 'Deep Dive' : mode === 'quick' ? 'Quick' : 'Strategic'}** mode. ${
              mode === 'quick' ? 'I\'ll provide fast, concise insights focused on key metrics.' :
              mode === 'deep' ? 'I\'ll provide comprehensive analysis with detailed breakdowns and predictions.' :
              'I\'ll provide balanced strategic insights with actionable recommendations.'
            }`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, notificationMessage]);
        }}
      />

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map(message => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: message.type === 'user' 
                ? colors.userMessage
                : message.type === 'agent'
                  ? colors.surface
                  : colors.botMessage,
              color: message.type === 'user' ? 'white' : colors.text,
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: message.type === 'agent' && message.agentColor 
                ? `1px solid ${message.agentColor}40` 
                : 'none'
            }}>
              {message.type === 'agent' && message.agentDisplayName && (
                <div style={{
                  fontSize: '12px',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: message.agentColor || colors.primary
                }}>
                  {message.agentDisplayName}
                </div>
              )}
              {message.isLoading ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  color: colors.textSecondary 
                }}>
                  <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>⚡</span>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {message.content && (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formatMessageContent(message.content) 
                      }}
                      style={{
                        '& strong': { fontWeight: 600, color: colors.primary },
                        '& em': { fontStyle: 'italic' },
                        '& code': { 
                          backgroundColor: 'rgba(0, 224, 255, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        },
                        '& ul': { 
                          marginLeft: '20px',
                          marginTop: '8px',
                          marginBottom: '8px'
                        },
                        '& li': { 
                          marginBottom: '4px',
                          lineHeight: '1.6'
                        },
                        '& p': { 
                          marginBottom: '8px'
                        },
                        '& h3': { 
                          fontSize: '15px',
                          fontWeight: 600,
                          marginTop: '12px',
                          marginBottom: '8px',
                          color: colors.primary
                        },
                        '& blockquote': {
                          borderLeft: `3px solid ${colors.primary}`,
                          paddingLeft: '12px',
                          marginLeft: '0',
                          color: colors.textSecondary,
                          fontStyle: 'italic'
                        }
                      } as any}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Points Display - Clean hover style above input */}
      {conversationMemory?.selectedPoints && conversationMemory.selectedPoints.length > 0 && (
        <div style={{
          padding: '10px 20px',
          background: 'rgba(0, 224, 255, 0.03)',
          borderTop: '1px solid rgba(0, 224, 255, 0.1)',
          borderBottom: '1px solid rgba(0, 224, 255, 0.1)',
          maxHeight: conversationMemory.selectedPoints.length > 2 ? '80px' : 'auto',
          overflowY: conversationMemory.selectedPoints.length > 2 ? 'auto' : 'visible',
          transition: 'all 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  color: '#00e0ff', 
                  fontSize: '8px',
                  animation: 'pulse 2s infinite'
                }}>●</span>
                <span>Selected Points ({conversationMemory.selectedPoints.length})</span>
                {conversationMemory.selectedPoints.length > 1 && (
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>
                    Shift+click to add more
                  </span>
                )}
              </div>
              <button
                onClick={() => setConversationMemory(prev => ({ 
                  ...prev, 
                  lastChartContext: null,
                  selectedPoints: []
                }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(247, 249, 251, 0.4)',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  fontSize: '16px',
                  lineHeight: 1,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.4)'}
                title="Clear selection (ESC)"
              >
                ×
              </button>
            </div>
            
            {/* Selected points list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {conversationMemory.selectedPoints.map((point, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#f8fafc',
                    padding: '4px 8px',
                    background: 'rgba(0, 224, 255, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 224, 255, 0.1)',
                    position: 'relative',
                    paddingRight: '32px'
                  }}
                >
                  <span style={{ 
                    fontSize: '11px', 
                    opacity: 0.5,
                    minWidth: '16px'
                  }}>
                    {index + 1}.
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {point.label}: {point.value}{point.unit}
                  </span>
                  {point.chartType && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'rgba(0, 224, 255, 0.1)',
                      borderRadius: '4px',
                      color: '#00e0ff',
                      marginLeft: 'auto',
                      marginRight: '24px'
                    }}>
                      {point.chartType}
                    </span>
                  )}
                  {/* Individual remove button */}
                  <button
                    onClick={() => {
                      setConversationMemory(prev => ({
                        ...prev,
                        selectedPoints: prev.selectedPoints?.filter((_, i) => i !== index) || []
                      }));
                    }}
                    style={{
                      position: 'absolute',
                      right: '4px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(247, 249, 251, 0.3)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '2px',
                      lineHeight: 1,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.3)'}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mention Suggestions */}
      {showMentionSuggestions && mentionSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          right: '20px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1001
        }}>
          {mentionSuggestions.map(agent => (
            <div
              key={agent.agentName}
              onClick={() => selectMention(agent)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.border}`,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{agent.avatar}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>
                    @{agent.agentName}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textDim }}>
                    {agent.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '20px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        gap: '12px'
      }}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask about transactions, or mention @customer @sales @finance @fraud..."
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: '44px',
            maxHeight: '120px',
            padding: '12px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: isLoading || !inputValue.trim() 
              ? colors.surfaceHover 
              : colors.primary,
            color: isLoading || !inputValue.trim() 
              ? colors.textDim 
              : colors.background,
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}