import React, { useState, useRef, useEffect } from 'react';

// Agent configuration with exact colors and details
const AGENT_CONFIG = {
  sales: {
    name: 'sales',
    displayName: 'Sales Agent',
    avatar: '📈',
    color: '#10b9      .replace(/([�✨�💡��👥💰📦🤖⚠️🔍📋🔄💸🏆📉🎯💼📊])/g,
        '<span style="font-size: 20px; vertical-align: middle; margin-right: 6px; display: inline-block;">$1</span>')
      // Fix encoding issues with emojis showing as question marks
      .replace(/�{2}/g, '🎉')  // Replace double question marks with party emoji
      .replace(/�/g, '✨')    // Replace single question marks with sparkles
      // Wrap in paragraph with better typography,
    description: 'Revenue analysis, pipeline insights, and sales performance metrics'
  },
  customer: {
    name: 'customer',
    displayName: 'Customer Agent',
    avatar: '👥',
    color: '#3b82f6',
    description: 'Customer segmentation, retention analytics, and behavior insights'
  },
  finance: {
    name: 'finance',
    displayName: 'Finance Agent',
    avatar: '💰',
    color: '#f59e0b',
    description: 'Financial metrics, cash flow analysis, and profitability insights'
  },
  inventory: {
    name: 'inventory',
    displayName: 'Inventory Agent',
    avatar: '📦',
    color: '#8b5cf6',
    description: 'Stock levels, slow-moving items, and inventory optimization'
  }
};

const FloatingAIChat = () => {
  console.log('🚀 UPDATED FloatingAIChat v2.1 - Enhanced visibility loaded!');
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `# 🎉 Welcome to Enhanced AI Assistant v2!

## ✨ Available AI Agents:

• **@sales** 📈 - Sales performance, revenue analysis, and pipeline insights
• **@customer** 👥 - Customer analytics, segmentation, and behavior patterns  
• **@finance** 💰 - Financial metrics, cash flow, and profitability analysis
• **@inventory** 📦 - Stock levels, inventory optimization, and demand patterns

## 🚀 Quick Start Guide:

1. **Type @** to see live agent suggestions
2. **Mention an agent** like "@sales show me revenue trends"
3. **Ask naturally** - "What's our inventory status?"
4. **Get instant insights** from your connected databases

💡 **Pro Tip:** Each agent has access to real-time data and provides detailed analysis with proper formatting!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle @ mention detection
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex >= 0) {
      const afterAt = value.substring(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      const mentionText = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex);
      
      if (spaceIndex === -1 && mentionText.length >= 0) {
        // Show suggestions
        const filtered = Object.values(AGENT_CONFIG).filter(agent =>
          agent.name.toLowerCase().includes(mentionText.toLowerCase())
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

  const handleMentionSelect = (agentName) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const beforeAt = inputValue.substring(0, lastAtIndex);
    const afterAt = inputValue.substring(lastAtIndex + 1);
    const spaceIndex = afterAt.indexOf(' ');
    const afterMention = spaceIndex === -1 ? '' : afterAt.substring(spaceIndex);
    
    setInputValue(`${beforeAt}@${agentName} ${afterMention}`);
    setShowMentionSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      setShowMentionSuggestions(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if it's an @mention
      const mentionMatch = messageText.match(/@(\w+)/);
      let response;

      if (mentionMatch) {
        // Agent mention - use /api/assistant
        const agentName = mentionMatch[1].toLowerCase();
        const agent = AGENT_CONFIG[agentName];
        
        const resp = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            appName: 'web',
            userId: 'chat-user',
            sessionId: 'floating-chat'
          })
        });

        const json = await resp.json();
        if (!resp.ok) throw new Error(json?.error || 'Assistant error');

        const agentMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: json.text || 'No response received.',
          timestamp: new Date(),
          agentName: agent?.name || agentName,
          agentDisplayName: agent?.displayName || agentName,
          agentAvatar: agent?.avatar || '🤖',
          agentColor: agent?.color || '#6b7280',
          audit: json.audit
        };
        setMessages(prev => [...prev, agentMessage]);
      } else {
        // Regular query - use /api/insights/explain
        const resp = await fetch('/api/insights/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: messageText,
            context: { source: 'floating-chat' },
            mode: 'quick',
            action: 'explain'
          })
        });

        const json = await resp.json();
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: json.text || 'I apologize, but I couldn\'t process your request. Please try again or use @mention to contact a specific agent.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `⚠️ **Error**: ${error.message}\n\nPlease try again or contact support if the issue persists.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Markdown-ish rendering for agent messages
  const renderAgentMessage = (content) => {
    return content
      // Headers with emojis
      .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        const size = level === 1 ? '20px' : level === 2 ? '18px' : '16px';
        const margin = level === 1 ? '20px' : level === 2 ? '16px' : '12px';
        const color = level === 1 ? '#00e0ff' : level === 2 ? '#10b981' : '#f8fafc';
        return `<div style="font-size: ${size}; font-weight: 700; margin-top: ${margin}; margin-bottom: 12px; color: ${color}; line-height: 1.4;">${content}</div>`;
      })
      // Bold text (cyan highlight)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff; font-weight: 600;">$1</strong>')
      // Bullet points with better spacing
      .replace(/^• (.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;">• $1</div>')
      // Numbered lists with better styling
      .replace(/^(\d+)\.\s*(.*?)$/gm, '<div style="margin-left: 20px; margin-bottom: 8px; color: #e2e8f0; line-height: 1.5;"><strong style="color: #10b981;">$1.</strong> $2</div>')
      // Line breaks with proper spacing
      .replace(/\n\n/g, '</p><p style="margin-top: 16px; margin-bottom: 0; line-height: 1.6;">')
      .replace(/\n/g, '<br/>')
      // Enhanced emoji sizing and spacing
      .replace(/([�✨�💡��👥💰📦🤖⚠️🔍📋🔄💸🏆📉🎯💼📊])/g,
        '<span style="font-size: 20px; vertical-align: middle; margin-right: 6px; display: inline-block;">$1</span>')
      // Wrap in paragraph with better typography
      .replace(/^(.*)$/, '<p style="margin: 0; line-height: 1.6; color: #f1f5f9;">$1</p>');
  };

  // Floating button (closed state)
  if (!isChatOpen) {
    return (
      <div style={{ position: 'relative' }}>
        {/* Notification badge */}
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '-12px',
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #ff1744, #ff6b35)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'white',
          zIndex: 999999,
          boxShadow: '0 4px 16px rgba(255, 23, 68, 0.6)',
          animation: 'pulse 1.5s infinite',
          border: '2px solid #ffffff'
        }}>
          NEW!
        </div>
        
        <button
          onClick={() => setIsChatOpen(true)}
          className="floating-button"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ff88, #00bfff)',
            border: '3px solid #ffffff',
            color: 'white',
            fontSize: '28px',
            cursor: 'pointer',
            boxShadow: '0 12px 48px rgba(0, 255, 136, 0.6), 0 0 0 0 rgba(0, 255, 136, 0.4)',
            zIndex: 999999,
            transition: 'all 0.3s ease',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.boxShadow = '0 16px 64px rgba(0, 255, 136, 0.8), 0 0 40px rgba(0, 255, 136, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 255, 136, 0.6), 0 0 0 0 rgba(0, 255, 136, 0.4)';
          }}
          title="🚀 NEW: Enhanced AI Assistant with @mentions - CLICK ME!"
        >
          🤖
        </button>
      </div>
    );
  }

  // Chat panel (open state)
  return (
    <div>
      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.7);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
            box-shadow: 0 0 0 20px rgba(0, 255, 136, 0);
          }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        .chatbot-container {
          animation: slideInFromRight 0.3s ease-out;
        }
        .message {
          animation: fadeInUp 0.3s ease-out;
        }
        .floating-button:hover {
          animation: bounce 0.6s ease-in-out;
        }
      `}</style>

      {/* Chat Panel Container */}
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
          zIndex: 999998,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
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
          <button
            onClick={() => setIsChatOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Close chat"
          >
            ×
          </button>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message) => (
            <div key={message.id} className="message" style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={
                message.type === 'user' ? {
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: '20px 20px 6px 20px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#ffffff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'pre-wrap'
                } : message.type === 'agent' ? {
                  maxWidth: '90%',
                  padding: '16px 20px',
                  borderRadius: '20px 20px 20px 6px',
                  background: `linear-gradient(135deg, ${message.agentColor}15, ${message.agentColor}08)`,
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontWeight: '400',
                  border: `1px solid ${message.agentColor}25`,
                  boxShadow: `0 6px 20px ${message.agentColor}15`,
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'normal'
                } : {
                  maxWidth: '85%',
                  padding: '14px 18px',
                  borderRadius: '20px 20px 20px 6px',
                  background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
                  color: '#f8fafc',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  fontWeight: '400',
                  border: '1px solid rgba(58, 68, 89, 0.3)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)',
                  whiteSpace: 'pre-wrap'
                }
              }>
                {/* Agent Header */}
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
                    {message.audit && (
                      <span style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '2px 6px',
                        borderRadius: '8px'
                      }}>
                        {message.audit.transport}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Message Content */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: message.type === 'agent' || message.type === 'bot'
                      ? renderAgentMessage(message.content)
                      : message.content.replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
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
            {mentionSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                onClick={() => handleMentionSelect(suggestion.name)}
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
                        @{suggestion.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      marginBottom: '4px'
                    }}>
                      {suggestion.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
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
            <textarea
              ref={textareaRef}
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
              <span>Send</span>
              <span>🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingAIChat;
