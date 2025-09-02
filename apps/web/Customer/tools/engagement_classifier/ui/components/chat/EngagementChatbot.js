import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatbotModeSelector, { getModeConfig } from './ChatbotModeSelector';
import { v4 as uuidv4 } from 'uuid';
import { 
  queryAgent, 
  processSSEStream, 
  mockAgentResponse, 
  extractMentions, 
  isValidAgent 
} from '../../services/agentCommunication';

// Local AIResponseDashboard function to avoid import issues
const AIResponseDashboard = async function* (query, session) {
  if (!query) yield '[ERROR]';
  
  const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:5000';
  console.log('🌐 AIResponseDashboard:', backendAiUrl);

  try {
    const response = await fetch(`${backendAiUrl}/run_sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({ 
        user_query: query, 
        session_id: session.session_id, 
        user_id: session.user_id, 
        app_name: session.app_name, 
        is_canvas: false,
        mode: (typeof window !== 'undefined' && window.__engagementMode) || 'strategic',
        mode_config: (typeof window !== 'undefined' && window.__engagementModeConfig) || null
      })
    });
    
    const reader = response.body.getReader();
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
            
            if (data === '[DONE]' || data === '') continue;
            
            try {
              const jsonData = JSON.parse(data);
              console.log('🟢 AIResponseDashboard:', jsonData);
              yield jsonData;
            } catch (e) {
              console.warn('Error in AIResponseDashboard:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('❌ AIResponseDashboard error:', error);
    yield { error: error.message };
  }
};

const EngagementChatbot = ({ 
  dashboardContext = {}, 
  onContextUpdate = null,
  isVisible = false,
  onToggle = null 
}) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'bot',
     // content: '👥 **Customer Engagement Intelligence Assistant**\n\nI can help you analyze customer engagement patterns, identify re-engagement opportunities, and provide strategic insights.\n\n**Available Intelligence Teams:**\n• **@customer** - Engagement analysis and segmentation\n• **@sales** - Sales performance and conversion insights\n• **@finance** - Financial metrics and customer value\n• **@inventory** - Product preferences and demand patterns\n\n**Quick Actions:**\n• Engagement score analysis\n• Re-engagement opportunity identification\n• Customer segmentation insights\n• Conversion rate optimization\n\nWhat engagement insights would you like to explore?',
    content: '👥 Customer Engagement Intelligence Assistant\n\nI can help you analyze customer engagement patterns, identify re-engagement opportunities, and provide strategic insights.\n\nAvailable Intelligence Teams:\n• @customer - Engagement analysis and segmentation\n• @sales - Sales performance and conversion insights\n• @finance - Financial metrics and customer value\n• @inventory - Product preferences and demand patterns\n\nQuick Actions:\n• Engagement score analysis\n• Re-engagement opportunity identification\n• Customer segmentation insights\n• Conversion rate optimization\n\nWhat engagement insights would you like to explore?',

     timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Mode (UI inside chatbot): 'quick' | 'strategic' | 'deep'
  const [responseMode, setResponseMode] = useState('strategic');
  const [modeConfig, setModeConfig] = useState(getModeConfig('strategic'));
  const [session] = useState({
    session_id: uuidv4(),
    user_id: "engagement_analyst",
    app_name: "engagement_classifier"
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

  // Dark theme colors matching engagement classifier
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
      customer: '#00e0ff',
      sales: '#e930ff',
      finance: '#fbbf24',
      inventory: '#34d399'
    }
  };

  // Available agents for mentions
  const availableAgents = [
    { name: 'customer', displayName: 'Customer Intelligence', color: colors.agentColors.customer, description: 'Engagement analysis & segmentation' },
    { name: 'sales', displayName: 'Sales Intelligence', color: colors.agentColors.sales, description: 'Sales performance & conversion' },
    { name: 'finance', displayName: 'Finance Intelligence', color: colors.agentColors.finance, description: 'Financial metrics & customer value' },
    { name: 'inventory', displayName: 'Inventory Intelligence', color: colors.agentColors.inventory, description: 'Product preferences & demand' }
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

  // Handle context tags from charts - add to selectedPoints like RSA
  const handleAttachContextTags = useCallback((contextTag) => {
    console.log('🏷️ Attaching context tag:', contextTag);
    
    // Create a point object similar to RSA format
    const newPoint = {
      label: contextTag.split(':')[0] || 'Context',
      value: contextTag.split(':')[1]?.trim() || contextTag,
      chartType: 'engagement',
      unit: ''
    };
    
    setConversationMemory(prev => {
      const existingPoints = prev.selectedPoints || [];
      // Check if this context already exists
      const exists = existingPoints.some(point => 
        point.label === newPoint.label && point.value === newPoint.value
      );
      
      if (!exists) {
        return {
          ...prev,
          selectedPoints: [...existingPoints, newPoint]
        };
      }
      return prev;
    });
  }, []);

  // Handle opening chat panel
  const handleOpenChatPanel = useCallback(() => {
    console.log('📱 Opening chat panel');
    if (onToggle && !isVisible) {
      onToggle();
    }
  }, [onToggle, isVisible]);

  // Handle sending context to chat
  const handleSendContextToChat = useCallback((contextPoints) => {
    console.log('💬 Sending context to chat:', contextPoints);
    if (Array.isArray(contextPoints)) {
      contextPoints.forEach(point => handleAttachContextTags(point));
    } else {
      handleAttachContextTags(contextPoints);
    }
    handleOpenChatPanel();
  }, [handleAttachContextTags, handleOpenChatPanel]);

  // Expose the functions globally for chart integration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addAIInsightToChat = handleChartClickContext;
      window.attachContextTags = handleAttachContextTags;
      window.openChatPanel = handleOpenChatPanel;
      window.sendContextToChat = handleSendContextToChat;
      // expose mode for orchestrator calls
      window.__engagementMode = responseMode;
      window.__engagementModeConfig = modeConfig;
      console.log('✅ Engagement AI handlers registered globally');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.addAIInsightToChat;
        delete window.attachContextTags;
        delete window.openChatPanel;
        delete window.sendContextToChat;
        console.log('🔄 Engagement AI handlers unregistered');
      }
    };
  }, [handleChartClickContext, handleAttachContextTags, handleOpenChatPanel, handleSendContextToChat]);

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

    // Engagement Levels
    if (dashboardContext?.selectedEngagementLevel) {
      tags.push(`Engagement: ${dashboardContext.selectedEngagementLevel}`);
    } else {
      tags.push('Engagement: All Levels');
    }

    // Time Period
    if (dashboardContext?.selectedPeriod) {
      tags.push(`Period: ${dashboardContext.selectedPeriod}`);
    } else if (dashboardContext?.filters?.dateRange) {
      tags.push(`Period: ${dashboardContext.filters.dateRange}`);
    }

    // Filters
    if (dashboardContext?.filters) {
      const filters = dashboardContext.filters;
      if (filters.segment) {
        tags.push(`Segment: ${filters.segment}`);
      }
      if (filters.channel) {
        tags.push(`Channel: ${filters.channel}`);
      }
    }

    // KPIs if available
    const kpis = dashboardContext?.data || dashboardContext?.kpis;
    if (kpis?.totalCustomers) {
      tags.push(`Customers: ${kpis.totalCustomers.toLocaleString()}`);
    }
    if (kpis?.avgEngagementScore) {
      tags.push(`Avg Score: ${kpis.avgEngagementScore.toFixed(1)}`);
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

  // Handle agent mentions (matching regional sales functionality)
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

    // Create context for agents (include selected chart points and last chart context)
    const agentContext = {
      user_id: session.user_id,
      engagementLevels: dashboardContext?.selectedEngagementLevel,
      selectedPeriod: dashboardContext?.selectedPeriod,
      filters: dashboardContext?.filters,
      kpis: dashboardContext?.kpis,
      contextTags,
      selectedPoints: conversationMemory?.selectedPoints || [],
      chartContext: conversationMemory?.lastChartContext || null
    };

    // Prepare augmented query with selected points appended as inline context
    const selectedPointsSuffix = (conversationMemory?.selectedPoints?.length)
      ? `\n\n[Selected Points: ${conversationMemory.selectedPoints.map(p => `${p.label}:${p.value}${p.unit || ''}`).join(', ')}]`
      : '';
    const augmentedQueryBase = `${cleanQuery}${selectedPointsSuffix}`.trim();

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
          // Query real agent via backend (augmented with selected chart points)
          const response = await queryAgent(
            agentName,
            augmentedQueryBase,
            { ...agentContext, mode: responseMode, modeConfig },
            session.session_id
          );
          
          let fullResponse = '';
          let metadata = {};
          
          // Process SSE stream
          for await (const chunk of processSSEStream(response)) {
            if (chunk.type === 'done') break;
            
            if (chunk.text) {
              fullResponse += chunk.text;
            }
            
            if (chunk.response && !fullResponse) {
              fullResponse = chunk.response;
            }

            if (chunk.agent) {
              metadata.agent = chunk.agent;
            }
            
            if (chunk.metadata) {
              metadata = { ...metadata, ...chunk.metadata };
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
        
        // Try fallback (also include selected points in the context of the mock)
        const fallbackResponse = mockAgentResponse(agentName, augmentedQueryBase);
        
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

  // Handle regular conversation (no mentions) — mode-aware timing and formatting
  const handleRegularConversation = async (query) => {
    const mode = responseMode || 'strategic';
    const cfgDelay = (modeConfig && modeConfig.delayMs) || (mode === 'quick' ? 500 : mode === 'deep' ? 2000 : 1500);
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
      // Enhance regular conversation queries with selected chart points
      const selectedPointsSuffix = (conversationMemory?.selectedPoints?.length)
        ? `\n\n[Selected Points: ${conversationMemory.selectedPoints.map(p => `${p.label}:${p.value}${p.unit || ''}`).join(', ')}]`
        : '';
      const augmentedQuery = `${query}${selectedPointsSuffix}`.trim();

      // For regular conversation, call our Next.js API proxy to the local chatbot server
      // This avoids CORS issues with the external orchestrator for non-mention queries
      if (cfgDelay && cfgDelay > 0) {
        await new Promise(r => setTimeout(r, cfgDelay));
      }

      const resp = await fetch('/api/engagement-classifier/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: augmentedQuery,
          context: { ...dashboardContext, contextTags, selectedPoints: conversationMemory?.selectedPoints || [], chartContext: conversationMemory?.lastChartContext || null },
          session,
          responseMode: mode
        })
      });

      let fullResponse = '';
      if (resp.ok) {
        const data = await resp.json();
        fullResponse = data?.response || '';
      }

      const modeEffective = (dashboardContext && dashboardContext.mode) || responseMode || 'strategic';
      const formatByMode = (text) => {
        if (!text) return text;
        if (modeEffective === 'quick') {
          const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
          return sentences.slice(0, 3).join(' ');
        }
        if (modeEffective === 'deep') {
          return `${text}\n\n— Detailed mode with deeper context.`;
        }
        return text; // strategic default
      };

      if (fullResponse) {
        setMessages(prev => prev.map(msg => 
          msg.id === loadingMessage.id 
            ? {
                ...msg,
                content: formatByMode(fullResponse),
                isLoading: false,
                agentName: 'assistant',
                agentDisplayName: 'AI Assistant'
              }
            : msg
        ));
      } else {
        console.log('⚠️ No response from local chatbot API, using fallback');
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

  // Main message submission handler (matching regional sales structure)
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

      // Route based on mentions (EXACTLY like regional sales)
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

  // Fallback response function (mode-aware)
  const fetchFallbackResponse = async (query) => {
    try {
      const selectedPoints = conversationMemory?.selectedPoints || [];
      const chartContext = conversationMemory?.lastChartContext || null;

      const response = await fetch('/api/engagement-classifier/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          // Include dashboard context plus chart selections and context
          context: { ...dashboardContext, contextTags, selectedPoints, chartContext },
          session,
          responseMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) return data.response;
      }
    } catch (error) {
      console.error('Fallback API error:', error);
    }

    // Static, mode-aware fallback
    const lowerQuery = (query || '').toLowerCase();

    const quick = (text) => {
      // Keep it short: 2-3 sentences max
      const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      return sentences.slice(0, 3).join(' ');
    };

    const deepen = (text) => `${text}\n\n• Historical context considered\n• Predictive indicators analyzed\n• Action plan prioritized`;

    let base;
    if (lowerQuery.includes('engagement score') || lowerQuery.includes('score')) {
      base = '📊 Engagement scores range from 1–10 based on RFM (Recency, Frequency, Monetary). Higher scores = healthier engagement and retention.';
    } else if (lowerQuery.includes('re-engagement') || lowerQuery.includes('opportunity')) {
      base = '🎯 Re‑engagement opportunities are customers with declining engagement. Use personalized outreach, targeted offers, and timely nudges to win them back.';
    } else if (lowerQuery.includes('segment') || lowerQuery.includes('group')) {
      base = '👥 Segments by engagement: High (8–10), Medium (5–7), Low (1–4). Tailor playbooks per segment to maximize outcomes.';
    } else {
      base = '👥 I can analyze engagement patterns, surface risks/opportunities, and recommend actions to improve customer relationships.';
    }

    if (responseMode === 'quick') return quick(base);
    if (responseMode === 'deep') return deepen(base);
    return base;
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
                Engagement Intelligence
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

        {/* Response Mode Selector (inside chatbot header) */}
        <div style={{ marginTop: '12px' }}>
          <ChatbotModeSelector
            mode={responseMode}
            onChange={(next) => {
              setResponseMode(next);
              const cfg = getModeConfig(next);
              setModeConfig(cfg);
              // Notify user in the chat
              setMessages(prev => ([
                ...prev,
                {
                  id: uuidv4(),
                  type: 'bot',
                  content: `${cfg.icon} Switched to ${cfg.label} mode`,
                  timestamp: new Date()
                }
              ]));
            }}
          />
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
                  }}>⚡</span>
                  <span style={{ color: colors.textDim }}>Analyzing...</span>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected Points Display - Clean hover style above input (RSA Style) */}
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
              key={agent.name}
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: agent.color
                }}></span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text
                  }}>
                    @{agent.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.textDim
                  }}>
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
        gap: '12px',
        backgroundColor: colors.surface
      }}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Ask about engagement patterns, or mention @customer @sales @finance @inventory..."
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: '44px',
            maxHeight: '120px',
            padding: '12px 16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            color: colors.text,
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
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

export default EngagementChatbot;