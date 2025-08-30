import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';
import { 
  queryAgent, 
  processSSEStream, 
  mockAgentResponse, 
  extractMentions, 
  isValidAgent 
} from '../../services/agentCommunication';

const RegionalSalesChatbot = ({ 
  dashboardContext = {}, 
  onContextUpdate = null,
  isVisible = false,
  onToggle = null 
}) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
      content: '🌍 **Regional Sales Intelligence Assistant**\n\nI can help you analyze regional sales performance, identify growth opportunities, and provide strategic insights.\n\n**Available Intelligence Teams:**\n• **@sales** - Product performance and sales trends\n• **@customer** - Customer behavior and segmentation\n• **@finance** - Financial metrics and cash flow\n• **@inventory** - Stock levels and optimization\n\n**Quick Actions:**\n• Top performing regions analysis\n• Growth opportunity identification\n• Market concentration review\n• Regional metric comparisons\n\nWhat insights would you like to explore?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseMode, setResponseMode] = useState('detailed');
  const [session] = useState({
    session_id: uuidv4(),
    user_id: "regional_analyst",
    app_name: "regional_sales_analyzer"
  });
  const [contextTags, setContextTags] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [conversationMemory, setConversationMemory] = useState({
    selectedPoints: [],
    lastChartContext: null
  });
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Dark theme colors matching churn prediction
  const colors = {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    primary: '#00e0ff',
    primaryDim: '#0891b2',
    secondary: '#e930ff',
    text: '#f1f5f9',
    textDim: '#94a3b8',
    textMuted: '#64748b',
    userMessage: '#4338ca',
    botMessage: '#1e293b',
    agentColors: {
      sales: '#e930ff',
      customer: '#00e0ff',
      finance: '#fbbf24',
      inventory: '#34d399'
    }
  };

  // Available agents for mentions
  const availableAgents = [
    { name: 'sales', displayName: 'Sales Intelligence', color: colors.agentColors.sales, description: 'Product performance & sales trends' },
    { name: 'customer', displayName: 'Customer Intelligence', color: colors.agentColors.customer, description: 'Customer behavior & segmentation' },
    { name: 'finance', displayName: 'Finance Intelligence', color: colors.agentColors.finance, description: 'Financial metrics & cash flow' },
    { name: 'inventory', displayName: 'Inventory Intelligence', color: colors.agentColors.inventory, description: 'Stock levels & optimization' }
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isVisible]);

  // Handle chart click context - expose globally for integration
  const handleChartClickContext = useCallback((clickData) => {
    const { label, value, chartType, count, total, originalEvent } = clickData;
    const isShiftKey = originalEvent?.shiftKey || false;
    
    // NO CHAT MESSAGE - just update the selected points display
    console.log('📊 Chart click received, updating selection:', {
      label,
      value: count || value,
      chartType,
      isShiftKey
    });
    
    // Store chart context - handle multi-selection with shift key
    setConversationMemory(prev => {
      const newPoint = {
        label,
        value: count || value,
        chartType,
        unit: clickData.unit || ''
      };
      
      if (isShiftKey && prev.selectedPoints) {
        // Add to existing selection
        return {
          ...prev,
          lastChartContext: clickData,
          selectedPoints: [...prev.selectedPoints, newPoint]
        };
      } else {
        // Replace selection
        return {
          ...prev,
          lastChartContext: clickData,
          selectedPoints: [newPoint]
        };
      }
    });
    
    // Open chatbot when shift-clicking to show selected points
    if (isShiftKey && onToggle && !isVisible) {
      onToggle();
    }
  }, [onToggle, isVisible]);

  // Expose the function globally for chart integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addAIInsightToChat = handleChartClickContext;
      console.log('✅ AI Insight handler registered globally');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.addAIInsightToChat;
        console.log('🔄 AI Insight handler unregistered');
      }
    };
  }, [handleChartClickContext]);

  // ESC key handler to clear selections
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && conversationMemory.selectedPoints.length > 0) {
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

  // Update context tags when dashboard context changes
  useEffect(() => {
    const tags = [];

    // Regions
    if (dashboardContext?.selectedRegions?.length > 0) {
      tags.push(`Regions: ${dashboardContext.selectedRegions.join(', ')}`);
    } else if (dashboardContext?.filters?.region) {
      tags.push(`Region: ${dashboardContext.filters.region}`);
    } else {
      tags.push('Regions: All');
    }

    // Metric
    if (dashboardContext?.selectedMetric) {
      const metricNames = {
        totalSales: 'Total Sales',
        customerCount: 'Customer Count',
        avgOrderValue: 'Avg Order Value',
        profitMargin: 'Profit Margin'
      };
      tags.push(`Metric: ${metricNames[dashboardContext.selectedMetric] || dashboardContext.selectedMetric}`);
    }

    // Date range
    const dateRange = dashboardContext?.dateRange || dashboardContext?.filters?.dateRange;
    if (dateRange) {
      tags.push(`Period: ${dateRange}`);
    }

    // KPIs if available
    const kpis = dashboardContext?.data || dashboardContext?.kpis;
    if (kpis?.totalSales) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(kpis.totalSales);
      tags.push(`Sales: ${formatted}`);
    }

    setContextTags(tags);
  }, [dashboardContext]);

  // Handle input changes and mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionSuggestions(availableAgents);
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.substring(lastAtIndex + 1).toLowerCase();
      const spaceIndex = searchTerm.indexOf(' ');
      
      if (spaceIndex === -1) {
        const filtered = availableAgents.filter(agent => 
          agent.name.toLowerCase().includes(searchTerm) ||
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

  // Handle mention selection
  const selectMention = (agent) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const beforeAt = inputValue.substring(0, lastAtIndex);
    const afterAt = inputValue.substring(lastAtIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const restOfMessage = spaceIndex !== -1 ? afterAt.substring(spaceIndex) : '';
    
    setInputValue(`${beforeAt}@${agent.name}${restOfMessage} `);
    setShowMentionSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle agent mentions (matching churn functionality)
  const handleAgentMentions = async (mentions, cleanQuery) => {
    console.log('🚀 handleAgentMentions called:', {
      mentions,
      cleanQuery,
      timestamp: new Date().toISOString()
    });

    // Validate agents
    const validAgents = mentions.filter(isValidAgent);
    const invalidAgents = mentions.filter(agent => !isValidAgent(agent));

    if (invalidAgents.length > 0) {
      const errorMessage = {
        id: uuidv4(),
        type: 'bot',
        content: `❌ **Unknown agents**: ${invalidAgents.map(a => `@${a}`).join(', ')}\n\n**Available agents:**\n${availableAgents.map(a => `• @${a.name} - ${a.description}`).join('\n')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Create context for agents
    const agentContext = {
      user_id: session.user_id,
      regions: dashboardContext?.selectedRegions,
      metric: dashboardContext?.selectedMetric,
      dateRange: dashboardContext?.dateRange,
      filters: dashboardContext?.filters,
      contextTags
    };

    // Query each valid agent
    for (const agentName of validAgents) {
      const agent = availableAgents.find(a => a.name === agentName);
      
      // Add loading message
      const loadingMessage = {
        id: uuidv4(),
        type: 'agent',
        agentName: agent.name,
        agentDisplayName: agent.displayName,
        agentColor: agent.color,
        content: '',
        isLoading: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, loadingMessage]);

      try {
        // Check if backend is available
        const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AGENTS === 'true';
        
        if (USE_MOCK) {
          // Use mock response
          await new Promise(resolve => setTimeout(resolve, 1500));
          const mockResponse = mockAgentResponse(agentName, cleanQuery);
          
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? { ...msg, content: mockResponse, isLoading: false }
              : msg
          ));
        } else {
          // Query real agent via backend
          const response = await queryAgent(agentName, cleanQuery, agentContext, session.session_id);
          
          let fullResponse = '';
          let metadata = {};
          
          // Process SSE stream
          for await (const chunk of processSSEStream(response)) {
            if (chunk.type === 'done') break;
            
            if (chunk.text) {
              fullResponse += chunk.text;
            }
            
            if (chunk.response) {
              fullResponse = chunk.response;
            }
            
            if (chunk.metadata) {
              metadata = chunk.metadata;
            }
            
            // Update message progressively
            setMessages(prev => prev.map(msg => 
              msg.id === loadingMessage.id 
                ? { 
                    ...msg, 
                    content: fullResponse || 'Processing...', 
                    isLoading: false,
                    metadata 
                  }
                : msg
            ));
          }
        }
      } catch (error) {
        console.error(`Error querying ${agentName}:`, error);
        
        // Try fallback
        const fallbackResponse = mockAgentResponse(agentName, cleanQuery);
        
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { 
                ...msg, 
                content: fallbackResponse, 
                isLoading: false,
                error: error.message 
              }
            : msg
        ));
      }
    }
  };

  // Handle regular conversation (no mentions)
  const handleRegularConversation = async (query) => {
    console.log('🤖 handleRegularConversation called:', {
      query,
      session,
      timestamp: new Date().toISOString()
    });

    // Create loading message
    const loadingMessage = {
      id: uuidv4(),
      type: 'bot',
      content: '',
      isLoading: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Use AIResponseDashboard for orchestrator
      const response = AIResponseDashboard(query, session);
      
      let fullResponse = '';
      let currentAgent = null;
      let chunkCount = 0;

      // Process SSE stream from orchestrator
      for await (const chunk of response) {
        chunkCount++;
        console.log(`📦 Chunk #${chunkCount}:`, chunk);

        if (chunk === '[DONE]') {
          console.log('✅ Stream completed');
          break;
        }

        if (chunk === '[ERROR]') {
          throw new Error('Backend service error');
        }

        // Handle response chunks
        if (typeof chunk === 'object' && chunk !== null) {
          // Check for agent identification
          if (chunk.agent) {
            currentAgent = chunk.agent;
            console.log(`🤖 Agent identified: ${currentAgent}`);
          }

          // Accumulate text
          if (chunk.text) {
            fullResponse += chunk.text;
          }

          // Handle complete response
          if (chunk.response) {
            fullResponse = chunk.response;
          }

          // Update message progressively
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id 
              ? {
                  ...msg,
                  content: fullResponse || 'Processing...',
                  isLoading: false,
                  agentName: currentAgent,
                  agentDisplayName: currentAgent === 'sales' ? 'Sales Intelligence' :
                                   currentAgent === 'customer' ? 'Customer Intelligence' :
                                   currentAgent === 'finance' ? 'Finance Intelligence' :
                                   currentAgent === 'inventory' ? 'Inventory Intelligence' :
                                   'AI Assistant'
                }
              : msg
          ));
        }
      }

      // If no response, use fallback
      if (!fullResponse) {
        console.log('⚠️ No response from orchestrator, using fallback');
        const fallbackResponse = await fetchFallbackResponse(query);
        
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: fallbackResponse, isLoading: false }
            : msg
        ));
      }

    } catch (error) {
      console.error('Regular conversation error:', error);
      
      // Use fallback
      const fallbackResponse = await fetchFallbackResponse(query);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, content: fallbackResponse, isLoading: false, error: error.message }
          : msg
      ));
    }
  };

  // Main message submission handler (matching churn structure)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    const textToSend = inputValue.trim();
    if (!textToSend || isLoading) return;

    console.log('📤 handleSubmit called:', {
      textToSend,
      timestamp: new Date().toISOString()
    });

    // Add user message
    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Extract mentions from text
      const { mentions, cleanQuery } = extractMentions(textToSend);
      
      console.log('🔍 Message parsing:', {
        originalText: textToSend,
        mentions,
        cleanQuery,
        hasMentions: mentions.length > 0
      });

      // Route based on mentions (EXACTLY like churn)
      if (mentions.length > 0) {
        console.log('✅ @mentions detected! Calling agents:', mentions);
        await handleAgentMentions(mentions, cleanQuery);
      } else {
        console.log('❌ No @mentions found, using regular conversation');
        await handleRegularConversation(textToSend);
      }

    } catch (error) {
      console.error('Submit error:', error);
      
      const errorMessage = {
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

  // Fallback response function
  const fetchFallbackResponse = async (query) => {
    try {
      const response = await fetch('/api/regional-sales-analyzer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: { ...dashboardContext, contextTags },
          session,
          responseMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response || 'I can help you analyze regional sales performance.';
      }
    } catch (error) {
      console.error('Fallback API error:', error);
    }

    // Static fallback
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('top region') || lowerQuery.includes('best perform')) {
      return '🏆 Based on the data, your top performing regions typically show strong sales metrics. Consider focusing on California, Texas, and New York markets for maximum impact.';
    } else if (lowerQuery.includes('growth')) {
      return '🚀 Growth opportunities exist in emerging markets. Consider expanding into regions with low market penetration but high potential demand.';
    } else if (lowerQuery.includes('concentration')) {
      return '📊 Market concentration analysis helps identify risk. Diversifying across multiple regions can reduce dependency on single markets.';
    }
    
    return '🌍 I can help you analyze regional sales performance, identify growth opportunities, and provide strategic insights for market expansion.';
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

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
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 600,
                color: colors.text,
                letterSpacing: '-0.02em'
              }}>
                Regional Sales Intelligence
              </h3>
              <span style={{
                padding: '2px 8px',
                backgroundColor: colors.primary + '20',
                color: colors.primary,
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                AI
              </span>
            </div>
            {contextTags.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                {contextTags.map((tag, i) => (
                  <span key={i} style={{
                    fontSize: '11px',
                    padding: '3px 10px',
                    backgroundColor: colors.surface,
                    color: colors.textDim,
                    borderRadius: '12px',
                    fontWeight: 500,
                    border: `1px solid ${colors.border}`
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textMuted,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceHover;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            ×
          </button>
        </div>

        {/* Response Mode Selector */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          gap: '8px',
          padding: '4px',
          backgroundColor: colors.background,
          borderRadius: '10px',
          border: `1px solid ${colors.border}`
        }}>
          {[
            { mode: 'detailed', icon: '📊', label: 'Detailed' },
            { mode: 'insights', icon: '💡', label: 'Insights' },
            { mode: 'talk', icon: '💬', label: 'Quick' }
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setResponseMode(mode)}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: responseMode === mode ? colors.primary + '20' : 'transparent',
                color: responseMode === mode ? colors.primary : colors.textDim,
                cursor: 'pointer',
                fontWeight: responseMode === mode ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: colors.background
      }}>
        {messages.map(message => (
          <div key={message.id} style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: message.type === 'user' 
                ? colors.userMessage
                : message.type === 'agent' || message.agentName
                  ? colors.surface
                  : colors.botMessage,
              color: message.type === 'user' ? 'white' : colors.text,
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: (message.type === 'agent' || message.agentName) && message.agentColor 
                ? `1px solid ${message.agentColor}40` 
                : 'none',
              boxShadow: (message.type === 'agent' || message.agentName) && message.agentColor
                ? `0 0 20px ${message.agentColor}20`
                : message.type === 'user'
                  ? '0 2px 8px rgba(67, 56, 202, 0.3)'
                  : 'none'
            }}>
              {(message.type === 'agent' || message.agentName) && message.agentDisplayName && (
                <div style={{
                  fontSize: '12px',
                  marginBottom: '8px',
                  fontWeight: 600,
                  color: message.agentColor || colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: message.agentColor || colors.primary,
                    display: 'inline-block'
                  }}></span>
                  {message.agentDisplayName}
                </div>
              )}
              {message.isLoading ? (
                <div style={{ 
                  display: 'flex', 
                  gap: '6px',
                  alignItems: 'center'
                }}>
                  <span style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    color: colors.primary
                  }}>●</span>
                  <span style={{
                    animation: 'pulse 1.5s ease-in-out 0.2s infinite',
                    color: colors.primary,
                    opacity: 0.7
                  }}>●</span>
                  <span style={{
                    animation: 'pulse 1.5s ease-in-out 0.4s infinite',
                    color: colors.primary,
                    opacity: 0.4
                  }}>●</span>
                </div>
              ) : (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:' + (message.type === 'user' ? '#ffffff' : colors.primary) + '">$1</strong>')
                      .replace(/\n/g, '<br>')
                      .replace(/•/g, '&bull;')
                  }} 
                />
              )}
              {message.metadata?.confidence && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: `1px solid ${colors.border}`,
                  fontSize: '11px',
                  color: colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</span>
                  {message.metadata.executionTime && (
                    <span>Time: {message.metadata.executionTime}ms</span>
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
      {showMentionSuggestions && (
        <div style={{
          position: 'absolute',
          bottom: '90px',
          left: '20px',
          right: '20px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '8px',
            borderBottom: `1px solid ${colors.border}`,
            fontSize: '11px',
            color: colors.textMuted,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Intelligence Teams
          </div>
          {mentionSuggestions.map(agent => (
            <button
              key={agent.name}
              onClick={() => selectMention(agent)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
                borderBottom: `1px solid ${colors.border}20`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surfaceHover;
                e.currentTarget.style.paddingLeft = '20px';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.paddingLeft = '16px';
              }}
            >
              <div style={{ 
                fontWeight: 600, 
                color: agent.color,
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: agent.color,
                  display: 'inline-block'
                }}></span>
                @{agent.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: colors.textDim,
                marginLeft: '16px'
              }}>
                {agent.description}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '20px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        gap: '12px',
        backgroundColor: colors.surface
      }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask about regional sales... (@ to mention teams)"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
            e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.border;
            e.target.style.boxShadow = 'none';
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
              ? colors.textMuted 
              : colors.background,
            fontSize: '14px',
            fontWeight: 600,
            cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && inputValue.trim()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                animation: 'spin 1s linear infinite',
                display: 'inline-block'
              }}>⚡</span>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Send</span>
              <span style={{ fontSize: '16px' }}>→</span>
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default RegionalSalesChatbot;