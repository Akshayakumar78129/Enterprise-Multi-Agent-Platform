/**
 * FloatingAIChat Component - Inventory-Focused AI Assistant
 * Specialized for Slow Moving Inventory Analysis Dashboard
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { contextManager, ContextItem } from '../../utils/contextManager';
import { parseMention, generateSuggestions, packInventoryContext } from '../../utils/mentionParser';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';

interface FloatingAIChatProps {
  insights?: string[] | null;
  onAskAI?: ((message: string) => Promise<string>) | null;
}

interface Message {
  id: number;
  type: 'user' | 'bot' | 'agent';
  content: string;
  author?: string;
  timestamp: Date;
  visualData?: any;
  isLoading?: boolean;
}

interface AgentConfig {
  name: string;
  color: string;
  avatar: string;
  displayName: string;
  description: string;
  category: string;
}


// Simple 5-agent configuration as requested
const AGENT_CONFIG: { [key: string]: AgentConfig } = {
  sales: {
    name: 'sales',
    color: '#00e0ff',
    avatar: '💬',
    displayName: 'Sales Agent',
    description: 'Sales analysis, performance tracking, and revenue optimization',
    category: 'SALES'
  },
  customer: {
    name: 'customer',
    color: '#10b981',
    avatar: '👤',
    displayName: 'Customer Agent',
    description: 'Customer insights, satisfaction analysis, and relationship management',
    category: 'CUSTOMER'
  },
  finance: {
    name: 'finance',
    color: '#f59e0b',
    avatar: '💰',
    displayName: 'Financial Agent',
    description: 'Financial analysis, cost optimization, and profitability insights',
    category: 'FINANCE'
  },
  inventory: {
    name: 'inventory',
    color: '#8b5cf6',
    avatar: '📦',
    displayName: 'Inventory Agent',
    description: 'Inventory management, stock optimization, and supply chain insights',
    category: 'INVENTORY'
  },
  enterpriseiq: {
    name: 'enterpriseiq',
    color: '#e930ff',
    avatar: '🎯',
    displayName: 'Enterprise IQ',
    description: 'Workflow coordination, cross-department analysis, and strategic planning',
    category: 'ORCHESTRATION'
  }
};

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ 
  insights = null, 
  onAskAI = null 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<AgentConfig[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  
  // Context management
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [responseMode, setResponseMode] = useState<'quick' | 'strategic' | 'forecast'>('quick');
  
  // Resizing functionality
  const [chatWidth, setChatWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to context changes
  useEffect(() => {
    console.log('🔗 FloatingAIChat: Setting up context subscription');
    
    const unsubscribe = contextManager.subscribe((newContexts) => {
      console.log('📨 FloatingAIChat: Received context update:', newContexts.length, 'contexts');
      setContexts(newContexts);
    });

    // Set chat open callback
    contextManager.setOnChatOpenRequest(() => {
      console.log('🚀 FloatingAIChat: Auto-opening chat due to context addition');
      setIsChatOpen(true);
    });

    // Initialize contexts
    const currentContexts = contextManager.getContexts();
    console.log('📋 FloatingAIChat: Initial contexts:', currentContexts.length);
    setContexts(currentContexts);

    return unsubscribe;
  }, []);

  // Initialize welcome message when chat opens
  useEffect(() => {
    if (isChatOpen && messages.length === 0) {
      const welcomeContent = `# Welcome to Inventory Intelligence AI!
I'm your **Inventory AI Assistant** with **5 specialized agents** ready to help optimize your slow-moving inventory.
## Available Specialists:
${Object.values(AGENT_CONFIG).map(agent => 
  `**@${agent.name}** (${agent.category}) - ${agent.description}`
).join('\n')}
## Quick Start:
- Type **@** to see all available agents
- Ask general questions for broad analysis
- Mention specific agents for specialized insights
- Example: *"@sales help with Luxury category"*

**What would you like to analyze today?**`;

      setMessages([{
        id: Date.now(),
        type: 'bot',
        content: welcomeContent.trim(),
        timestamp: new Date()
      }]);
    }
  }, [isChatOpen, insights]);

  // Handle @ mention detection
  useEffect(() => {
    const atIndex = inputValue.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = inputValue.substring(atIndex + 1).toLowerCase();
      setMentionQuery(query);

      // Use generateSuggestions if available to provide richer suggestions
      try {
        const suggestions = generateSuggestions(query || '@');
        if (Array.isArray(suggestions) && suggestions.length) {
          // Map suggestion names to AGENT_CONFIG entries where possible
          const mapped = suggestions.map((s: any) => AGENT_CONFIG[s.name] || AGENT_CONFIG[s]);
          const filtered = mapped.filter(Boolean) as AgentConfig[];
          setMentionSuggestions(filtered);
          setShowMentionSuggestions(filtered.length > 0);
          return;
        }
      } catch (e) {
        // Fallback to simple filter
      }

      const filtered = Object.values(AGENT_CONFIG).filter(agent => 
        agent.name.toLowerCase().includes(query) || 
        agent.displayName.toLowerCase().includes(query)
      );

      setMentionSuggestions(filtered);
      setShowMentionSuggestions(filtered.length > 0);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery('');
    }
  }, [inputValue, mentionQuery]);

  // Resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      setChatWidth(Math.max(300, Math.min(800, newWidth))); // Min 300px, Max 800px
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const selectAgent = (agent: AgentConfig) => {
    const atIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.substring(0, atIndex) + `@${agent.name} `;
    setInputValue(newValue);
    setShowMentionSuggestions(false);
    inputRef.current?.focus();
  };

  const simulateAgentResponse = async (agentName: string, message: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const agent = AGENT_CONFIG[agentName];
    if (!agent) return "Agent not found.";

    // Minimal agent responses
    const responses: { [key: string]: string } = {
      sales: `# Sales Analysis Report\n\n- Promotional ideas for slow movers\n- Channel mix suggestions\n- Expected revenue impact`,
      customer: `# Customer Insights\n\n- Preference trends\n- Discount sensitivity\n- Feedback themes`,
      finance: `# Financial Impact\n\n- Carrying cost overview\n- Capital tie-up\n- Savings opportunities`,
      inventory: `# Inventory Analysis\n\n- Turnover gaps\n- Reorder point review\n- Safety stock suggestions`,
      enterpriseiq: `# Enterprise IQ Plan\n\n- Cross-team actions\n- Data flow\n- Tracking metrics`
    };

    return responses[agentName] || `# ${agent.avatar} ${agent.displayName} Response\n\n${message}`.trim();
  };

  // Session management: persist current session id in localStorage
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try { return localStorage.getItem('inventory.chat.session') || null; } catch { return null; }
  });

  useEffect(() => {
    if (!sessionId) {
      const newId = `local-${Date.now()}`;
      setSessionId(newId);
      try { localStorage.setItem('inventory.chat.session', newId); } catch {}
    }
  }, [sessionId]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Build and append the user message
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Include context in the message for AI processing
    const contextString = contextManager.getContextsForAI(responseMode);
    const fullMessage = contextString ? `${contextString}\n\n**User Question:** ${inputValue}` : inputValue;

    // Use inventory mention parser to detect @inventory commands
    const parsedCmd = parseMention(inputValue);
    const isInventoryMention = !!parsedCmd && parsedCmd.isInventoryRelated;
    const agentName = isInventoryMention ? 'inventory' : null;
    const agentConfig = agentName ? AGENT_CONFIG[agentName] : null;
    const sanitizedMessage = parsedCmd && parsedCmd.parameter ? parsedCmd.parameter : inputValue.replace(/@inventory/g, '').trim();

    setInputValue('');
    setIsLoading(true);

  try {

      // Build a session object (use contextManager.getSession if available)
      const session = (contextManager as any && typeof (contextManager as any).getSession === 'function')
        ? (contextManager as any).getSession()
        : { session_id: sessionId || `local-${Date.now()}`, user_id: 'local-user', app_name: 'inventory' };

      // helper: stream from ADK and update loading message; fallback to simulateAgentResponse
      const streamFromAdk = async (loadingId: number, messageText: string, agentForFallback?: string, contextForFallback?: any) => {
        try {
          console.log('🛰️ streamFromAdk calling AIResponseDashboard, session:', session.session_id, 'preview:', messageText?.slice?.(0,200));
          for await (const chunk of AIResponseDashboard(messageText, session) as any) {
            if (!chunk) continue;
            if (chunk === '[DONE]') break;
            if (chunk === '[ERROR]') throw new Error('ADK stream returned [ERROR]');

            const delta = typeof chunk === 'object' && chunk?.text ? String(chunk.text) : String(chunk ?? '');
            setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: (m.content || '') + delta } : m));
          }

          setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, isLoading: false } : m));
        } catch (e) {
          console.warn('⚠️ streamFromAdk error:', e);
          if (agentForFallback) {
            try {
              const fallbackResp = await simulateAgentResponse(agentForFallback, contextForFallback || messageText);
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: fallbackResp, isLoading: false } : m));
            } catch (fallbackErr) {
              console.error('‼️ Local simulation fallback failed:', fallbackErr);
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: '❌ Error getting agent response.', isLoading: false } : m));
            }
          } else {
            try {
              const fallbackResp = await simulateAgentResponse('inventory', messageText);
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: fallbackResp, isLoading: false } : m));
            } catch (fallbackErr) {
              console.error('‼️ Local simulation fallback failed:', fallbackErr);
              setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, content: '❌ Error getting agent response.', isLoading: false } : m));
            }
          }
        }
      };

      // If user explicitly mentioned the inventory agent, prefer agent flow and attempt ADK streaming with fallback
      if (agentConfig) {
        const streamId = Date.now() + 1;
        const placeholder: Message = { id: streamId, type: 'agent', content: '', author: agentName!, timestamp: new Date(), isLoading: true };
        setMessages(prev => [...prev, placeholder]);

        // Provide inventory-specific context using packInventoryContext
        const extraContext = packInventoryContext(contextManager.getContexts && (contextManager.getContexts() || {}));
        const agentMessageForADK = `${extraContext}\n\nUser Command: ${sanitizedMessage || fullMessage}`;

        await streamFromAdk(streamId, sanitizedMessage || agentMessageForADK, agentName!, fullMessage);

  // agent response handled via placeholder update in streamFromAdk

      } else if (onAskAI) {
        // If a custom non-streaming handler is provided, use it
        const resp = await onAskAI(fullMessage);
        const botMessage: Message = { id: Date.now() + 1, type: 'bot', content: resp || '', timestamp: new Date() };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Non-agent general question: stream into a bot placeholder
        const streamId = Date.now() + 1;
        const placeholder: Message = { id: streamId, type: 'bot', content: '', timestamp: new Date(), isLoading: true };
        setMessages(prev => [...prev, placeholder]);

        await streamFromAdk(streamId, fullMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMarkdown = (content: string) => {
    return content
      .replace(/^(#{1,3})\s*(.*?)$/gm, (match, hashes, content) => {
        const level = hashes.length;
        const size = level === 1 ? '20px' : level === 2 ? '18px' : '16px';
        const color = level === 1 ? '#00e0ff' : level === 2 ? '#10b981' : '#f8fafc';
        return `<div style="font-size: ${size}; color: ${color}; font-weight: 600; margin: 8px 0 0 0; line-height: 1.2;">${content}</div>`;
      })
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #00e0ff;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #94a3b8;">$1</em>')
      .replace(/^• (.*?)$/gm, '<div style="margin: 2px 0; padding-left: 16px; position: relative; line-height: 1.3;"><span style="position: absolute; left: 0; color: #00e0ff;">•</span>$1</div>')
      .replace(/^(\d+)\. (.*?)$/gm, '<div style="margin: 2px 0; padding-left: 20px; position: relative; line-height: 1.3;"><span style="position: absolute; left: 0; color: #10b981; font-weight: 600;">$1.</span>$2</div>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0, 224, 255, 0.1); padding: 2px 4px; border-radius: 4px; color: #00e0ff; font-family: monospace;">$1</code>')
      .replace(/\n/g, '<br style="line-height: 1.1;"/>');
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
          transition: 'all 0.3s ease',
          fontFamily: 'Inter, sans-serif'
        }}
        title="Open Inventory AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: `${chatWidth}px`,
      height: '100vh',
      background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(59, 130, 246, 0.3)',
      zIndex: 1002,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'ew-resize',
          backgroundColor: isResizing ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
          transition: 'background-color 0.2s ease',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      />
      
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        borderBottom: '1px solid rgba(58, 68, 89, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 600 }}>Simple Inventory AI</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>5 Agents Ready with @mentions</div>
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
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '12px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div key={message.id} style={{ display: 'flex', flexDirection: message.type === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: '12px' }}>
            {/* Avatar */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: message.type === 'user' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : message.type === 'agent' && message.author && AGENT_CONFIG[message.author]
                ? AGENT_CONFIG[message.author].color
                : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0
            }}>
              {message.type === 'user' ? '👤' : message.type === 'agent' && message.author && AGENT_CONFIG[message.author] ? AGENT_CONFIG[message.author].avatar : '🤖'}
            </div>

            {/* Message Bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '12px 16px',
              borderRadius: message.type === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
              background: message.type === 'user'
                ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                : message.type === 'agent' && message.author && AGENT_CONFIG[message.author]
                ? `linear-gradient(135deg, ${AGENT_CONFIG[message.author].color}15, ${AGENT_CONFIG[message.author].color}25)`
                : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))',
              color: '#f8fafc', fontSize: '14px', lineHeight: '1.5',
              border: message.type === 'agent' && message.author && AGENT_CONFIG[message.author]
                ? `1px solid ${AGENT_CONFIG[message.author].color}40`
                : '1px solid rgba(58, 68, 89, 0.3)'
            }}>
              {message.type === 'agent' && message.author && AGENT_CONFIG[message.author] && (
                <div style={{ color: AGENT_CONFIG[message.author].color, fontSize: '12px', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {AGENT_CONFIG[message.author].avatar} {AGENT_CONFIG[message.author].displayName}
                  <span style={{ background: AGENT_CONFIG[message.author].color, color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    {AGENT_CONFIG[message.author].category}
                  </span>
                </div>
              )}
              {message.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #00e0ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div style={{ color: '#94a3b8' }}>Thinking...</div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div style={{ padding: '12px 16px', borderRadius: '20px 20px 20px 6px', background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.8), rgba(44, 51, 65, 0.8))', border: '1px solid rgba(58, 68, 89, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>AI is thinking</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', animation: `pulse 1.4s ease-in-out infinite ${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mention Suggestions */}
      {showMentionSuggestions && (
        <div style={{ margin: '0 20px', background: 'linear-gradient(135deg, rgba(26, 31, 46, 0.98), rgba(42, 47, 62, 0.98))', border: '1px solid rgba(0, 224, 255, 0.3)', borderRadius: '12px', maxHeight: '320px', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)' }}>
          {mentionSuggestions.map((agent) => (
            <button key={agent.name} onClick={() => selectAgent(agent)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(58, 68, 89, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: agent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  {agent.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    @{agent.name}
                    <span style={{ background: agent.color, color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                      {agent.category}
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                    {agent.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Context Display Area */}
      {contexts.length > 0 && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(58, 68, 89, 0.5)',
          background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.05), rgba(139, 92, 246, 0.05))',
          maxHeight: '100px',
          overflowY: 'auto',
          borderBottom: '1px solid rgba(58, 68, 89, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <div style={{
              color: '#00e0ff',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Context ({contexts.length} item{contexts.length > 1 ? 's' : ''})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Response Mode Buttons */}
              {(['quick', 'strategic', 'forecast'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setResponseMode(mode)}
                  style={{
                    background: responseMode === mode 
                      ? 'linear-gradient(135deg, rgba(0, 224, 255, 0.2), rgba(0, 224, 255, 0.1))' 
                      : 'rgba(30, 39, 56, 0.3)',
                    border: `1px solid ${responseMode === mode ? '#00e0ff' : 'rgba(0, 224, 255, 0.2)'}`,
                    borderRadius: '6px',
                    color: responseMode === mode ? '#00e0ff' : '#94a3b8',
                    fontSize: '11px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: responseMode === mode ? 600 : 400,
                    transition: 'all 0.2s ease',
                    boxShadow: responseMode === mode ? '0 0 8px rgba(0, 224, 255, 0.2)' : 'none'
                  }}
                  title={`${mode === 'quick' ? 'Quick solutions and immediate actions' : 
                          mode === 'strategic' ? 'Strategic analysis and long-term planning' : 
                          'Future predictions and forecasting'}`}
                  onMouseEnter={(e) => {
                    if (responseMode !== mode) {
                      e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.4)';
                      e.currentTarget.style.color = '#c7d2fe';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (responseMode !== mode) {
                      e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.2)';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  {mode}
                </button>
              ))}
              <button
                onClick={() => {
                  console.log('🧹 Clearing all contexts');
                  contextManager.clearAllContexts();
                }}
                style={{
                  background: 'none',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '12px',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {contexts.map((ctx) => (
              <div
                key={ctx.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.6), rgba(44, 51, 65, 0.6))',
                  border: '1px solid rgba(0, 224, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#00e0ff',
                    fontWeight: 600,
                    fontSize: '12px',
                    marginBottom: '1px'
                  }}>
                    {ctx.title}
                  </div>
                  <div style={{ 
                    color: '#94a3b8', 
                    fontSize: '11px',
                    opacity: 0.8
                  }}>
                    {ctx.source}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    console.log('🗑️ Removing context:', ctx.id);
                    contextManager.removeContext(ctx.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(58, 68, 89, 0.5)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything or type @ to see available agents..."
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '36px',
              maxHeight: '120px',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.6), rgba(44, 51, 65, 0.6))',
              border: '1px solid rgba(58, 68, 89, 0.5)',
              borderRadius: '12px',
              color: '#f8fafc',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              resize: 'none',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: inputValue.trim() && !isLoading ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(58, 68, 89, 0.5)',
              border: 'none',
              color: inputValue.trim() && !isLoading ? '#fff' : '#94a3b8',
              fontSize: '16px',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isLoading ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              '→'
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FloatingAIChat;
