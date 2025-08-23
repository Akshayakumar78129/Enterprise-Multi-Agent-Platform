import React, { useState, useEffect, useRef } from 'react';
import { sendAgentMessage, fetchAgentSuggestions } from '../../services/agentCommunication';
import { AGENT_REGISTRY, AGENT_COLORS } from '../../config/agentRegistry';
import { parseMentions } from '../../utils/mentionParser';
import { packContextForAgents } from '../../utils/contextPacker';

// NOTE: Removed temporary inline context builder. We now import a shared packer and
// enrich it with recent conversation + active agents for higher-fidelity agent prompts.

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: number;
  // agent specific
  agentName?: string;
  agentDisplayName?: string;
  agentColor?: string;
  agentAvatar?: string;
  isLoading?: boolean;
  error?: string;
}

const renderAgentMessage = (content: string) => {
  return content
    .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, inner) => {
      const level = hashes.length;
      const size = level === 1 ? '18px' : level === 2 ? '16px' : '14px';
      const margin = level === 1 ? '16px' : level === 2 ? '12px' : '8px';
      return `<div style="font-size: ${size}; font-weight: 700; margin-top: ${margin}; margin-bottom: 8px; color: #f8fafc;">${inner}</div>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
    .replace(/^• (.*?)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">• $1</div>')
    .replace(/^(\d+)\. (.*?)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">$1. $2</div>')
    .replace(/\n\n/g, '</p><p style="margin-top: 12px; margin-bottom: 0;">')
    .replace(/\n/g, '<br/>')
    .replace(/([💼📊🎯📈💡👥💰📦🤖⚠️🔍📋🔄💸🏆📉])/g,
      '<span style="font-size: 18px; vertical-align: middle; margin-right: 4px;">$1</span>')
    .replace(/^(.*)$/,'<p style="margin: 0;">$1</p>');
};

const EnhancedContextAwareChatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [currentMentionQuery, setCurrentMentionQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const mentionData = parseMentions(value);
    if (mentionData.trigger) {
      setShowMentionSuggestions(true);
      setCurrentMentionQuery(mentionData.query.toLowerCase());
      const suggestions = fetchAgentSuggestions(mentionData.query);
      setMentionSuggestions(suggestions);
    } else {
      setShowMentionSuggestions(false);
      setCurrentMentionQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        sendMessage();
      }
    }
  };

  const handleMentionSelect = (agentName: string) => {
    const cursorIdx = inputValue.lastIndexOf('@');
    const newText = inputValue.substring(0, cursorIdx) + `@${agentName} `;
    setInputValue(newText);
    setShowMentionSuggestions(false);
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: Date.now() + '-user',
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    const mentions = parseMentions(text).mentions;
    const agentsToQuery = mentions.length > 0 ? mentions : Object.keys(AGENT_REGISTRY).slice(0, 1); // default one agent

    // Build enriched context for agents
    const baseContext = packContextForAgents();
    const conversationSnapshot = [...messages, userMessage]
      .slice(-15) // last 15 exchanges
      .map(m => ({
        role: m.role,
        // Strip simple HTML produced by renderAgentMessage for cleaner prompt tokens
        content: m.content.replace(/<[^>]+>/g, '').slice(0, 800)
      }));
    const context = {
      ...baseContext,
      conversation: conversationSnapshot,
      currentUserMessage: text,
      agentsAddressed: agentsToQuery,
      stats: {
        totalMessages: messages.length + 1,
        distinctAgentsContacted: new Set(messages.filter(m => m.agentName).map(m => m.agentName)).size
      }
    };

    setIsLoading(true);

    // Add loading placeholders for agents
    const loadingMessages: ChatMessage[] = agentsToQuery.map(a => {
  const reg = AGENT_REGISTRY[a];
      return {
        id: Date.now() + '-agent-' + a,
        role: 'agent',
        content: '',
        timestamp: Date.now(),
        agentName: a,
        agentDisplayName: reg.displayName,
        agentAvatar: reg.avatar,
        agentColor: AGENT_COLORS[reg.department] || '#6b7280',
        isLoading: true
      };
    });
    setMessages(prev => [...prev, ...loadingMessages]);

    for (const agent of agentsToQuery) {
      try {
        const reg = AGENT_REGISTRY[agent];
        const response = await sendAgentMessage(agent, text, context);
        setMessages(prev => prev.map(m => m.agentName === agent ? {
          ...m,
          content: renderAgentMessage(response.content),
          isLoading: false
        } : m));
      } catch (err: any) {
        setMessages(prev => prev.map(m => m.agentName === agent ? {
          ...m,
          content: `<p style='color:#f87171;margin:0;'>Error: ${err.message}</p>`,
          isLoading: false
        } : m));
      }
    }

    setIsLoading(false);
  };

  const userMessageStyle: React.CSSProperties = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 6px 20px',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: 600,
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap'
  };

  const botMessageStyle: React.CSSProperties = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 20px 6px',
    background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
    color: '#f8fafc',
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: 400,
    border: '1px solid rgba(58, 68, 89, 0.3)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap'
  };

  const agentMessageStyle = (agentColor: string): React.CSSProperties => ({
    maxWidth: '90%',
    padding: '16px 20px',
    borderRadius: '20px 20px 20px 6px',
    background: `linear-gradient(135deg, ${agentColor}15, ${agentColor}08)`,
    color: '#f8fafc',
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: 400,
    border: `1px solid ${agentColor}25`,
    boxShadow: `0 6px 20px ${agentColor}15`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'normal'
  });

  return (
    <>
      {!isChatOpen && (
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
      )}
      {/* Persistent panel with animated open/close (translateX) */}
      <div
        className="chatbot-container"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
            width: '420px',
          maxWidth: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(59, 130, 246, 0.3)',
          zIndex: 1002,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          transform: isChatOpen ? 'translateX(0)' : 'translateX(110%)',
          opacity: isChatOpen ? 1 : 0,
          pointerEvents: isChatOpen ? 'auto' : 'none',
          transition: 'transform .55s cubic-bezier(.4,.14,.12,1), opacity .55s ease',
          willChange: 'transform, opacity'
        }}
        aria-hidden={!isChatOpen}
        aria-label="AI Assistant Panel"
      >
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
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#f8fafc'
                }}>
                  Enhanced AI Assistant
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8'
                }}>
                  Ready with @mentions
                </div>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '20px'
            }}>×</button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px 20px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
                animation: msg.role === 'user' ? 'slideInFromRight 0.45s cubic-bezier(.4,.12,.2,1)' : 'fadeInUp 0.45s cubic-bezier(.4,.12,.2,1)'
              }}>
                <div style={msg.role === 'user' ? userMessageStyle : msg.role === 'agent' ? agentMessageStyle(msg.agentColor || '#6b7280') : botMessageStyle}>
                  {msg.role === 'agent' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                      paddingBottom: '8px',
                      borderBottom: `1px solid ${(msg.agentColor || '#6b7280')}30`
                    }}>
                      <span style={{ fontSize: '16px' }}>{msg.agentAvatar}</span>
                      <span style={{
                        fontWeight: 600,
                        color: msg.agentColor || '#6b7280',
                        fontSize: '13px'
                      }}>{msg.agentDisplayName}</span>
                      {msg.isLoading && (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          border: `2px solid ${(msg.agentColor || '#6b7280')}30`,
                          borderTop: `2px solid ${msg.agentColor || '#6b7280'}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                      )}
                    </div>
                  )}
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '20px 20px 20px 6px',
                  background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
                  border: '1px solid rgba(58, 68, 89, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s`
                      }} />
                    ))}
                    <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '12px' }}>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(58, 68, 89, 0.3)',
            background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.9), rgba(42, 47, 62, 0.9))',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
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
                  fontWeight: 600,
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
                {mentionSuggestions.map((s, i) => (
                  <div
                    key={s.agentName}
                    onClick={() => handleMentionSelect(s.agentName)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: i < mentionSuggestions.length - 1 ? '1px solid rgba(58, 68, 89, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '20px', marginTop: '2px' }}>{s.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '14px' }}>@{s.agentName}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{s.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
  </div>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(1); } 50% { opacity:1; transform:scale(1.05);} }
        @keyframes spin { 0% { transform:rotate(0deg);} 100% { transform:rotate(360deg);} }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px);} to { opacity:1; transform:translateY(0);} }
        @keyframes slideInFromRight { from { opacity:0; transform:translateX(50px);} to { opacity:1; transform:translateX(0);} }
      `}</style>
    </>
  );
};

export default EnhancedContextAwareChatbot;
