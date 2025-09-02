import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AIResponseDashboard } from './ai-interaction/aiResponse';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const AGENT_CONFIG = {
  sales: { name: 'sales', backendName: 'sales_agent', displayName: 'Sales Agent', avatar: '📈', color: '#10b981', description: 'Revenue analysis, pipeline insights, and sales performance metrics' },
  customer: { name: 'customer', backendName: 'customer_agent', displayName: 'Customer Agent', avatar: '👥', color: '#3b82f6', description: 'Customer segmentation, retention analytics, and behavior insights' },
  finance: { name: 'finance', backendName: 'financial_agent', displayName: 'Finance Agent', avatar: '💰', color: '#f59e0b', description: 'Financial metrics, cash flow analysis, and profitability insights' },
  inventory: { name: 'inventory', backendName: 'inventory_agent', displayName: 'Inventory Agent', avatar: '📦', color: '#8b5cf6', description: 'Stock levels, slow-moving items, and inventory optimization' },
  enterpriseiq: { name: 'enterpriseiq', backendName: 'orchestration_agent', displayName: 'Enterprise IQ', avatar: '🧠', color: '#6366f1', description: 'Comprehensive business intelligence and multi-domain insights' },
};

const agentKeyFromAuthor = (author) => { 
  if (!author) return undefined; 
  const key = author.replace('_agent', ''); 
  if (key === 'customer_insights') return 'customer';
  if (key === 'orchestration') return 'enterpriseiq';
  return key; 
};

const detectAgentByKeyword = (text) => {
  const t = (text || '').toLowerCase();
  if (/(finance|financial|cash\s*flow|profit|margin|ebitda|net\s*income|p&l|p\&l|revenue\s*forecast|balance\s*sheet)/i.test(t)) return AGENT_CONFIG.finance;
  if (/(inventory|stock|sku|reorder|holding\s*cost|slow\s*moving|stockout|warehouse)/i.test(t)) return AGENT_CONFIG.inventory;
  if (/(sales|revenue|pipeline|deal|order|quote|win\s*rate|growth)/i.test(t)) return AGENT_CONFIG.sales;
  if (/(customer|churn|retention|segment|cohort|ltv|lifetime\s*value|demographic)/i.test(t)) return AGENT_CONFIG.customer;
  if (/(enterprise|business\s*intelligence|overview|insights|analytics|dashboard|kpi|metrics|performance)/i.test(t)) return AGENT_CONFIG.enterpriseiq;
  return null;
};

const FloatingAIChat = ({ insights = null }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([{
    id: 1,
    type: 'bot',
    content: (() => {
      let content = `# 🎉 Welcome to Enhanced AI Assistant v2!\n\n## ✨ Available AI Agents:\n\n• **@sales** 📈 - Sales performance, revenue analysis, and pipeline insights\n• **@customer** 👥 - Customer analytics, segmentation, and behavior patterns  \n• **@finance** 💰 - Financial metrics, cash flow, and profitability analysis\n• **@inventory** 📦 - Stock levels, inventory optimization, and demand patterns\n• **@enterpriseiq** 🧠 - Comprehensive business intelligence and multi-domain insights\n\n## 🚀 New Feature: Single Agent Queries\n\n💡 **Direct Agent Communication**: Send queries directly to specific agents for faster, more focused responses!`;
      if (insights && insights.length > 0) {
        content += `\n\n## 📊 Current Page Insights:\n\n`;
        insights.forEach((insight, index) => { content += `${index + 1}. **${insight.title}**: ${insight.content}\n`; });
        content += `\nAsk me about these insights or anything else on this page.`;
      }
      return content;
    })(),
    timestamp: new Date(),
  }]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const makeUUID = () => { try { if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); } catch {} return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; };

  // New function for single agent queries
  const handleSingleAgentQuery = async (query, agentConfig) => {
    console.log('Query from user:', query);
    console.log('Target agent:', agentConfig.backendName);
    
    const session = {
      session_id: makeUUID(),
      user_id: 'ari',
      app_name: agentConfig.backendName
    };

    try {
      // First, create the session
      const backendAiUrl = process.env.NEXT_PUBLIC_BACKEND_AI_URL || 'http://127.0.0.1:8000';
      const sessionResponse = await fetch(`${backendAiUrl}/apps/${session.app_name}/users/${session.user_id}/sessions/${session.session_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!sessionResponse.ok) {
        console.error('Failed to create session:', sessionResponse.status);
        return {
          success: false,
          content: '⚠️ Failed to initialize session. Please try again.',
          hasVisualization: false,
          visualData: null
        };
      }
      
      console.log('✅ Session created successfully');
      
      const response = AIResponseDashboard(query, session);
      let fullResponse = '';
      let hasVisualization = false;
      let visualData = null;

      for await (const chunk of response) {
        console.log('AI response:', chunk);
        
        if (chunk === '[DONE]') {
          break;
        }
        
        if (chunk === '[ERROR]') {
          console.error('Error in AI response:', chunk);
          return {
            success: false,
            content: '⚠️ Error receiving response from agent.',
            hasVisualization: false,
            visualData: null
          };
        }

        // Handle the full JSON object from AIResponseDashboard
        if (typeof chunk === 'object' && chunk !== null) {
          // Extract text content
          fullResponse += chunk.text || '';
          
          // Check for visualization data
          if (chunk.is_visualisation && chunk.visualData) {
            hasVisualization = true;
            visualData = chunk.visualData;
          }
        } else {
          // Fallback for plain text chunks
          fullResponse += chunk;
        }
      }

      return {
        success: true,
        content: fullResponse,
        hasVisualization,
        visualData
      };

    } catch (error) {
      console.error('Error in single agent query:', error);
      return {
        success: false,
        content: '⚠️ Failed to connect to agent. Please try again.',
        hasVisualization: false,
        visualData: null
      };
    }
  };

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  useEffect(() => {
    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex !== -1 && atIndex === inputValue.length - 1) {
      const suggestions = Object.values(AGENT_CONFIG).map(a => ({ agentName: a.name, avatar: a.avatar, description: a.description }));
      setMentionSuggestions(suggestions); setShowMentionSuggestions(true);
    } else if (atIndex !== -1) {
      const query = inputValue.substring(atIndex + 1).toLowerCase();
      const filtered = Object.values(AGENT_CONFIG).map(a => ({ agentName: a.name, avatar: a.avatar, description: a.description })).filter(agent => agent.agentName.toLowerCase().includes(query));
      setMentionSuggestions(filtered); setShowMentionSuggestions(filtered.length > 0);
    } else { setShowMentionSuggestions(false); }
  }, [inputValue]);

  const handleMentionSelect = (agentName) => { const atIndex = inputValue.lastIndexOf('@'); const beforeAt = inputValue.substring(0, atIndex); const newValue = `${beforeAt}@${agentName} `; setInputValue(newValue); setShowMentionSuggestions(false); inputRef.current?.focus(); };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = { id: Date.now(), type: 'user', content: inputValue, timestamp: new Date() };
    const sanitizedMessage = inputValue.replace(/@(\w+)/g, '').trim();
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Detect agent mention or use keyword detection
      const mentionMatch = inputValue.match(/@([a-zA-Z_]+)/);
      const mentionName = mentionMatch ? mentionMatch[1] : null;
      let agentCfg = mentionName ? AGENT_CONFIG[mentionName] : null;
      if (!agentCfg) agentCfg = detectAgentByKeyword(sanitizedMessage) || AGENT_CONFIG.enterpriseiq;
      
      const pendingId = Date.now() + 1;
      
      // Add pending message with loading state
      setMessages(prev => [...prev, {
        id: pendingId,
        type: 'agent',
        content: '',
        author: agentCfg.backendName,
        agentColor: agentCfg.color,
        agentAvatar: agentCfg.avatar,
        agentDisplayName: agentCfg.displayName,
        timestamp: new Date(),
        isLoading: true
      }]);

      // Use new single agent query function
      const result = await handleSingleAgentQuery(sanitizedMessage, agentCfg);
      
      if (result.success) {
        // Update message with successful response
        setMessages(prev => prev.map(m => (m.id === pendingId ? {
          ...m,
          isLoading: false,
          content: result.content,
          is_visualisation: result.hasVisualization,
          visualData: result.visualData
        } : m)));
      } else {
        // Update message with error
        setMessages(prev => prev.map(m => (m.id === pendingId ? {
          ...m,
          isLoading: false,
          content: result.content
        } : m)));
      }
      
    } catch (err) {
      console.error('Error in sendMessage:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAgentMessage = (content) => {
    if (!content || content.trim() === '') {
      return '<p style="color: #f1f5f9;">🤖 Agent is processing your request. This might take a moment...</p>';
    }
    return content
      .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, content) => { const level = hashes.length; const size = level === 1 ? '20px' : level === 2 ? '18px' : '16px'; const margin = level === 1 ? '20px' : level === 2 ? '16px' : '12px'; const color = level === 1 ? '#00e0ff' : level === 2 ? '#10b981' : '#f8fafc'; return `<div style="font-size: ${size}; font-weight: 700; margin-top: ${margin}; margin-bottom: 12px; color: ${color}; line-height: 1.4;">${content}</div>`; })
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
      .replace(/^• (.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;">• $1</div>')
      .replace(/^- (.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;">• $1</div>')
      .replace(/^(\d+)\.\s*(.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;"><strong style="color: #10b981;">$1.</strong> $2</div>')
      .replace(/\n\n/g, '</p><p style="margin-top: 16px; margin-bottom: 0; line-height: 1.6;">')
      .replace(/\n/g, '<br/>')
      .replace(/([🎉✨🚀💡📈👥💰📦🤖⚠️🔍📋🔄💸🏆📉🎯💼📊])/g, '<span style="font-size: 20px; vertical-align: middle; margin-right: 6px; display: inline-block;">$1</span>')
      .replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid rgba(58, 68, 89, 0.3);">')
      .replace(/<tr>/g, '<tr style="border-bottom: 1px solid rgba(58, 68, 89, 0.3);">')
      .replace(/<th>/g, '<th style="padding: 8px; text-align: left; background: rgba(59, 130, 246, 0.1); color: #f8fafc;">')
      .replace(/<td>/g, '<td style="padding: 8px; border-right: 1px solid rgba(58, 68, 89, 0.3);">')
      .replace(/^(.*)$/, '<p style="margin: 0; line-height: 1.6; color: #f1f5f9;">$1</p>');
  };

  const userMessageStyle = { maxWidth: '85%', padding: '14px 18px', borderRadius: '20px 20px 6px 20px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#ffffff', fontSize: '14px', lineHeight: '1.5', fontWeight: '600', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', backdropFilter: 'blur(10px)', whiteSpace: 'pre-wrap' };
  const botMessageStyle = { maxWidth: '85%', padding: '14px 18px', borderRadius: '20px 20px 20px 6px', background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))', color: '#f8fafc', fontSize: '14px', lineHeight: '1.5', fontWeight: '400', border: '1px solid rgba(58, 68, 89, 0.3)', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(10px)', whiteSpace: 'pre-wrap' };
  const agentMessageStyle = (agentColor) => ({ maxWidth: '90%', padding: '16px 20px', borderRadius: '20px 20px 20px 6px', background: `linear-gradient(135deg, ${agentColor}15, ${agentColor}08)`, color: '#f8fafc', fontSize: '14px', lineHeight: '1.5', fontWeight: '400', border: `1px solid ${agentColor}25`, boxShadow: `0 6px 20px ${agentColor}15`, backdropFilter: 'blur(10px)', whiteSpace: 'normal' });

  if (!isChatOpen) {
    return (<button onClick={() => setIsChatOpen(true)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)', zIndex: 1001, transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.6)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)'; }} title="Open AI Assistant">🤖</button>);
  }

  return (
    <div className="chatbot-container" style={{ position: 'fixed', top: 0, right: 0, width: '420px', height: '100vh', background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(59, 130, 246, 0.3)', zIndex: 1002, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(58, 68, 89, 0.5)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🤖</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', color: '#f8fafc' }}>Enhanced AI Assistant</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Ready with @mentions</div>
          </div>
        </div>
        <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}>✕</button>
      </div>

      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', flexDirection: message.type === 'user' ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: message.type === 'user' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : message.author ? (() => { const k = agentKeyFromAuthor(message.author); const c = (AGENT_CONFIG[k]?.color) || '#6366f1'; return `linear-gradient(135deg, ${c}, ${c})`; })() : 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
              {message.type === 'user' ? '👤' : message.author ? (AGENT_CONFIG[agentKeyFromAuthor(message.author)]?.avatar || '🤖') : '🤖'}
            </div>

            <div style={message.type === 'user' ? userMessageStyle : message.type === 'bot' ? botMessageStyle : agentMessageStyle(AGENT_CONFIG[agentKeyFromAuthor(message.author)]?.color || '#6b7280')}>
              {message.type === 'agent' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingBottom: '8px', borderBottom: `1px solid ${message.agentColor || '#6b7280'}30` }}>
                  <span style={{ fontSize: '16px' }}>{message.agentAvatar}</span>
                  <span style={{ fontWeight: '600', color: message.agentColor || '#6b7280', fontSize: '13px' }}>{message.agentDisplayName}</span>
                  {message.isLoading && (<div style={{ width: '12px', height: '12px', border: `2px solid ${message.agentColor || '#6b7280'}30`, borderTop: `2px solid ${message.agentColor || '#6b7280'}`, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />)}
                </div>
              )}

              {message.type === 'bot' ? (
                <div dangerouslySetInnerHTML={{ __html: renderAgentMessage(message.content) }} />
              ) : message.type === 'agent' ? (
                <div>
                  <div dangerouslySetInnerHTML={{ __html: renderAgentMessage(message.content) }} />
                  {message.is_visualisation && message.visualData && (
                    <div style={{ marginTop: '16px', width: '100%', height: '300px', border: `1px solid ${message.agentColor || '#6b7280'}25`, borderRadius: '12px', overflow: 'hidden', padding: '12px', backgroundColor: 'rgba(30, 39, 56, 0.4)' }}>
                      <Plot data={message.visualData.data} layout={{ ...message.visualData.layout, autosize: true, margin: { l: 50, r: 30, t: 50, b: 50 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#f8fafc', family: 'Inter, sans-serif' }, colorway: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'], grid: { rows: 1, columns: 1, pattern: 'independent', roworder: 'top to bottom' }, xaxis: { ...(message.visualData.layout?.xaxis || {}), gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', showgrid: true }, yaxis: { ...(message.visualData.layout?.yaxis || {}), gridcolor: 'rgba(255,255,255,0.1)', zerolinecolor: 'rgba(255,255,255,0.2)', showgrid: true } }} config={{ responsive: true, displayModeBar: false, staticPlot: false }} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
              ) : (message.content)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
            <div style={{ padding: '14px 18px', borderRadius: '20px 20px 20px 6px', background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))', border: '1px solid rgba(58, 68, 89, 0.3)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (<div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s` }} />))}
                <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '12px' }}>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test Buttons for Single Agent Queries */}
        {messages.length === 1 && (
          <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#00e0ff', marginBottom: '12px' }}>🧪 Quick Test - Single Agent Queries:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(AGENT_CONFIG).map((agent) => (
                <button
                  key={agent.name}
                  onClick={() => {
                    setInputValue(`@${agent.name} show me a quick overview`);
                    setTimeout(() => sendMessage(), 100);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${agent.color}40`,
                    background: `${agent.color}15`,
                    color: '#f8fafc',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${agent.color}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${agent.color}15`; }}
                >
                  <span>{agent.avatar}</span>
                  <span>Test {agent.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showMentionSuggestions && (
        <div style={{ position: 'absolute', bottom: '100px', left: '20px', right: '20px', background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))', backdropFilter: 'blur(20px)', borderRadius: '12px', border: '1px solid rgba(0, 224, 255, 0.3)', boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)', maxHeight: '320px', overflowY: 'auto', zIndex: 1005 }}>
          {mentionSuggestions.map((suggestion, index) => (
            <div key={suggestion.agentName} onClick={() => handleMentionSelect(suggestion.agentName)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: index < mentionSuggestions.length - 1 ? '1px solid rgba(58, 68, 89, 0.3)' : 'none', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>{suggestion.avatar}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '14px' }}>@{suggestion.agentName}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{suggestion.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '20px', borderTop: '1px solid rgba(58, 68, 89, 0.3)', background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9), rgba(42, 47, 62, 0.9))', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(58, 68, 89, 0.5)',
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
            <span>Send</span>
            <span>🚀</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingAIChat;
