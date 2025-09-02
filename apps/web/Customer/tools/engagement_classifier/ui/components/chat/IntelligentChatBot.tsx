import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, X, Minimize2, Maximize2, User, AlertCircle, Database, FileText, Loader2 } from 'lucide-react';
import AgentMentions from './AgentMentions';
import ChatMessage from './ChatMessage';
import styles from './ChatBot.module.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'system' | 'data_query' | 'ui_explanation';
  mentions?: string[];
  metadata?: {
    intent?: string;
    responseTime?: number;
    sqlQuery?: string;
  };
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
  dashboardData?: any;
}

interface ChatbotStatus {
  status: string;
  initialized: boolean;
  stats?: any;
}

// Hardcode engagement classifier chatbot URL to fixed port 3010 to avoid external env overrides
const CHATBOT_API_URL = (typeof window === 'undefined')
  ? ''
  : `${window.location.protocol}//${window.location.hostname}:3010`;

const IntelligentChatBot = forwardRef<any, ChatBotProps>(({ isOpen, onToggle, dashboardData }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your Intelligent Customer Engagement Assistant. Choose a response mode below:\n\n💬 **Talk**: Short, conversational summaries (max 6 lines)\n💡 **Insights**: Actionable strategies and business advice in bullet points (max 15 lines)\n📘 **Detailed**: Comprehensive explanations with metrics and examples (default)\n\nThen ask about your data or dashboard features.",
      sender: 'bot',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [responseMode, setResponseMode] = useState<'talk' | 'insights' | 'detailed'>('detailed');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [chatbotStatus, setChatbotStatus] = useState<ChatbotStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => {
    console.log('🔧 Setting up chatbot ref methods');
    return {
      addContextMessage: (contextMessage: string) => {
        console.log('📨 addContextMessage called with:', contextMessage);
        const contextMsg: Message = {
          id: Date.now().toString(),
          content: contextMessage,
          sender: 'user',
          timestamp: new Date(),
          type: 'system'
        };
        console.log('📝 Adding message to chat:', contextMsg);
        setMessages(prev => {
          const newMessages = [...prev, contextMsg];
          console.log('💬 Updated messages array length:', newMessages.length);
          return newMessages;
        });
        
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };
  });

  const agents = [
    { id: 'sales', name: 'Sales', description: 'Sales performance and forecasting' },
    { id: 'inventory', name: 'Inventory', description: 'Stock levels and optimization' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      checkChatbotStatus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkChatbotStatus = async () => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/api/chatbot/status`);
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${errText?.slice(0, 200)}`);
      }

      let status;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        status = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
      }

      setChatbotStatus(status);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to check chatbot status:', error);
      setConnectionError('Unable to connect to intelligent chatbot service. Using fallback mode.');
      setChatbotStatus(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    
    setInputValue(value);
    setCursorPosition(position);

    // Check for @ mentions
    const beforeCursor = value.substring(0, position);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (agent: typeof agents[0]) => {
    const beforeMention = inputValue.substring(0, cursorPosition - mentionQuery.length - 1);
    const afterCursor = inputValue.substring(cursorPosition);
    // Always insert lowercase tag matching backend parsing: @sales or @inventory
    const newValue = `${beforeMention}@${agent.id} ${afterCursor}`;
    
    setInputValue(newValue);
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const sendToIntelligentChatbot = async (message: string): Promise<Message> => {
    try {
      console.log(`Sending message to chatbot with mode: ${responseMode}`);
      
      const requestBody = {
        message: message,
        sessionId: 'web-session-' + Date.now(),
        mode: responseMode
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${CHATBOT_API_URL}/api/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response from chatbot:', result);
      
      return {
        id: Date.now().toString(),
        content: result.response,
        sender: 'bot',
        timestamp: new Date(),
        type: result.type || 'text',
        metadata: result.metadata
      };

    } catch (error) {
      console.error('Error calling intelligent chatbot:', error);
      throw error;
    }
  };

  const generateFallbackResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Simple fallback responses when API is unavailable
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm currently running in fallback mode. The intelligent chatbot service is temporarily unavailable, but I can still provide basic help with dashboard features.";
    }
    
    if (lowerMessage.includes('kpi') || lowerMessage.includes('metrics')) {
      return "KPI tiles show your key performance indicators: Total Customers, Average Engagement Score, Days Since Activity, and Re-engagement Opportunities. These metrics help you quickly assess your customer engagement health.";
    }
    
    if (lowerMessage.includes('engagement') && (lowerMessage.includes('score') || lowerMessage.includes('calculation'))) {
      return "Engagement scores (1-10) are calculated using RFM analysis: Recency (how recently they interacted), Frequency (how often they engage), and Monetary value (how much they spend). Higher scores indicate more engaged customers.";
    }
    
    if (lowerMessage.includes('how many') || lowerMessage.includes('count') || lowerMessage.includes('customers')) {
      return "I'd love to help with data queries, but the intelligent chatbot service is currently unavailable. This would normally query your customer database directly. Please try again later or contact support.";
    }
    
    return "I'm currently running in limited mode due to a service issue. I can provide basic dashboard help, but for detailed data queries and advanced assistance, please try again later when the intelligent chatbot service is restored.";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let botResponse: Message;

      // Try intelligent chatbot first
      if (chatbotStatus?.initialized && !connectionError) {
        try {
          botResponse = await sendToIntelligentChatbot(userMessage.content);
        } catch (error) {
          console.warn('Intelligent chatbot failed, using fallback:', error);
          // Fall back to simple responses
          botResponse = {
            id: (Date.now() + 1).toString(),
            content: generateFallbackResponse(userMessage.content),
            sender: 'bot',
            timestamp: new Date(),
            type: 'error'
          };
        }
      } else {
        // Use fallback mode
        botResponse = {
          id: (Date.now() + 1).toString(),
          content: generateFallbackResponse(userMessage.content),
          sender: 'bot',
          timestamp: new Date(),
          type: 'text'
        };
      }

      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact support if the problem persists.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = () => {
    if (connectionError) {
      return <AlertCircle className={styles.statusIcon} size={16} style={{ color: '#f59e0b' }} />;
    }
    if (chatbotStatus?.initialized) {
      return <Database className={styles.statusIcon} size={16} style={{ color: '#10b981' }} />;
    }
    return <Loader2 className={styles.statusIcon} size={16} style={{ color: '#6b7280' }} />;
  };

  const getStatusText = () => {
    if (connectionError) {
      return 'Fallback Mode';
    }
    if (chatbotStatus?.initialized) {
      return 'Intelligent Mode';
    }
    return 'Connecting...';
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.chatbotContainer} ${isMinimized ? styles.minimized : ''}`}>
      {/* Header */}
      <div className={styles.chatbotHeader}>
        <div className={styles.chatbotHeaderInfo}>
          <Bot className={styles.chatbotIcon} size={20} />
          <div>
            <h3>Intelligent Assistant</h3>
            <div className={styles.chatbotStatus}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
              <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#4b5563' }}>
                Mode: {responseMode === 'talk' ? '💬 Talk' : responseMode === 'insights' ? '💡 Insights' : '📘 Detailed'}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.chatbotControls}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className={styles.controlBtn}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button 
            onClick={onToggle} 
            className={styles.controlBtn}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Connection Status Banner */}
          {connectionError && (
            <div className={styles.statusBanner} style={{ 
              background: '#fef3c7', 
              color: '#92400e', 
              padding: '8px 12px', 
              fontSize: '12px',
              borderBottom: '1px solid #fbbf24'
            }}>
              <AlertCircle size={14} style={{ marginRight: '6px', display: 'inline' }} />
              Running in fallback mode - some features may be limited
            </div>
          )}

          {/* Mode Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#4b5563' }}>
              Response Mode:
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'talk', label: '💬 Talk', desc: 'Short answers (max 6 lines)' },
                { key: 'insights', label: '💡 Insights', desc: 'Actionable strategies (max 15 lines)' },
                { key: 'detailed', label: '📘 Detailed', desc: 'Comprehensive explanations' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    console.log(`Setting response mode to: ${opt.key}`);
                    setResponseMode(opt.key as 'talk' | 'insights' | 'detailed');
                    // Add a message to show the mode change
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      content: `Mode changed to: ${opt.label} - ${opt.desc}`,
                      sender: 'bot',
                      timestamp: new Date(),
                      type: 'system'
                    }]);
                  }}
                  className={styles.quickActionBtn}
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    background: responseMode === opt.key ? '#111827' : '#f3f4f6',
                    color: responseMode === opt.key ? '#e5e7eb' : '#111827',
                    border: '1px solid #d1d5db',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}
                  title={opt.desc}
                >
                  <span style={{ marginBottom: '2px' }}>{opt.label}</span>
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className={styles.chatbotMessages}>
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} styles={styles} />
                {/* Show metadata for intelligent responses */}
                {message.metadata && chatbotStatus?.initialized && (
                  <div className={styles.messageMetadata} style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginLeft: '40px',
                    marginTop: '-8px',
                    marginBottom: '12px'
                  }}>
                    {message.type === 'data_query' && <Database size={12} style={{ marginRight: '4px', display: 'inline' }} />}
                    {message.type === 'ui_explanation' && <FileText size={12} style={{ marginRight: '4px', display: 'inline' }} />}
                    {message.metadata.intent} • {message.metadata.responseTime}ms
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.botMessage}`}>
                <Bot className={styles.messageAvatar} size={24} />
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Agent Mentions Dropdown */}
          {showMentions && (
            <AgentMentions
              agents={agents}
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
              styles={styles}
            />
          )}

          {/* Input */}
          <div className={styles.chatbotInput}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                chatbotStatus?.initialized 
                  ? "Ask about your data or dashboard features..." 
                  : "Ask about dashboard features (limited mode)..."
              }
              className={styles.chatTextarea}
              rows={1}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={styles.sendButton}
              title="Send message"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {/* Quick Actions */}
          {chatbotStatus?.initialized && (
            <div className={styles.quickActions} style={{
              padding: '8px 12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setInputValue("How many customers do we have?")}
                className={styles.quickActionBtn}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                📊 Customer Count
              </button>
              <button
                onClick={() => setInputValue("What are KPI tiles?")}
                className={styles.quickActionBtn}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                🎨 KPI Help
              </button>
              <button
                onClick={() => setInputValue("Show me high engagement customers")}
                className={styles.quickActionBtn}
                style={{
                  fontSize: '11px',
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                🔥 Top Customers
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

IntelligentChatBot.displayName = 'IntelligentChatBot';

export default IntelligentChatBot;