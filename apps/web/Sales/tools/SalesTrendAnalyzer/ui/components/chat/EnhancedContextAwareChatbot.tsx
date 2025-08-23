import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardState } from '../../types';
import { MAIN_AGENTS, getAgentByName, getAgentSuggestions } from '../../config/agentRegistry';
import { parseMentions, getMentionSuggestions, insertMention } from '../../utils/mentionParser';
import { packSalesContext } from '../../utils/contextPacker';
import { sendMessageToAgent, suggestBestAgent, AgentMessage } from '../../services/agentCommunication';
import { useTheme } from '../../contexts/ThemeContext';

interface EnhancedContextAwareChatbotProps {
  dashboardState: DashboardState;
  lastClickedPoint?: any;
  isOpen: boolean;
  onToggle: () => void;
  onNewChart?: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
  agentDisplayName?: string;
  agentAvatar?: string;
  agentColor?: string;
  isLoading?: boolean;
}

const EnhancedContextAwareChatbot: React.FC<EnhancedContextAwareChatbotProps> = ({
  dashboardState,
  lastClickedPoint,
  isOpen,
  onToggle,
  onNewChart
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState(MAIN_AGENTS);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showNewChartDialog, setShowNewChartDialog] = useState(false);
  const [chatSessions, setChatSessions] = useState<{[key: string]: ChatMessage[]}>({});
  const [currentSessionId, setCurrentSessionId] = useState('main');
  
  // Predefined questions dropdown state
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(-1);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Predefined dashboard-specific questions
  const predefinedQuestions = [
    "What are my best performing months and why?",
    "Which months show declining sales and what could be the reasons?",
    "What seasonal patterns do I have and how can I leverage them?",
    "What's my average monthly growth rate and is it sustainable?",
    "Which periods had the highest growth spikes and what caused them?",
    "How does my current performance compare to last year?",
    "What are the key trends I should be aware of in my sales data?",
    "Which months should I focus on for marketing campaigns?",
    "What's my revenue forecast for the next quarter based on trends?",
    "Are there any concerning patterns or anomalies in my data?",
    "What's the best strategy to improve my lowest performing periods?",
    "How consistent is my business growth and what affects volatility?"
  ];

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Save current session messages
    if (messages.length > 0) {
      setChatSessions(prev => ({
        ...prev,
        [currentSessionId]: messages
      }));
    }
  }, [messages, currentSessionId]);

  // Generate welcome message based on context
  const createWelcomeMessage = useCallback((): ChatMessage => {
    if (lastClickedPoint) {
      // Context-aware welcome when data point was clicked
      const change = lastClickedPoint.percentChange !== undefined 
        ? ` (${lastClickedPoint.percentChange >= 0 ? '+' : ''}${lastClickedPoint.percentChange.toFixed(1)}%)`
        : '';
      
      return {
        id: `welcome-context-${lastClickedPoint.date}-${lastClickedPoint.value}`,
        type: 'bot',
        content: `🎯 **Data Point Analysis**

I see you clicked on ${lastClickedPoint.date} showing **${lastClickedPoint.metricName}: $${lastClickedPoint.value.toLocaleString()}${change}**

**Ask me about:**
• Why this change happened
• How it compares to historical patterns
• What to expect next

**Available Experts:**
📊 @sales - Sales performance analysis
👥 @customer - Customer behavior insights  
💰 @finance - Financial analysis
📦 @inventory - Inventory management

Type @ to mention an expert or just ask your question!`,
        timestamp: new Date()
      };
    } else {
      // General welcome message
      return {
        id: `welcome-general-${Date.now()}`,
        type: 'bot',
        content: `🎯 **Sales Trend Analyzer AI Assistant**

**Available Experts:**
📊 @sales - Sales performance analysis
👥 @customer - Customer behavior insights  
💰 @finance - Financial analysis
📦 @inventory - Inventory management

**Quick Start:**
• Click any chart data point for instant analysis
• Type @ to see all available agents
• Ask anything about your sales data

Ready to help! 🚀`,
        timestamp: new Date()
      };
    }
  }, [lastClickedPoint]);

  // Handle new chart creation
  const handleNewChart = useCallback(() => {
    if (onNewChart) {
      // Create a new session for the new chart
      const newSessionId = `session-${Date.now()}`;
      
      // Save current session
      setChatSessions(prev => ({
        ...prev,
        [currentSessionId]: messages
      }));
      
      // Switch to new session
      setCurrentSessionId(newSessionId);
      setMessages([]);
      
      // Call the parent's new chart handler
      onNewChart();
      
      // Show success message
      const successMessage: ChatMessage = {
        id: `new-chart-${Date.now()}`,
        type: 'bot',
        content: `🎉 **New Chart Created!**

Your previous conversation has been saved and a new chart analysis session has started.

**What would you like to analyze?**
• Different time periods
• Alternative metrics
• Comparative analysis
• Custom visualizations

Type @ to see available experts or describe what you'd like to explore!`,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages([successMessage]);
      }, 100);
    }
  }, [onNewChart, currentSessionId, messages]);

  // Initialize welcome message when chatbot opens OR when lastClickedPoint changes
  useEffect(() => {
    console.log('🤖 Chatbot effect triggered - isOpen:', isOpen, 'lastClickedPoint:', lastClickedPoint);
    
    if (isOpen) {
      // Clear loading state and reset chatbot for new data point
      setIsLoading(false);
      setInputValue('');
      setShowMentionSuggestions(false);
      
      // Check if we have messages for current session
      const sessionMessages = chatSessions[currentSessionId];
      if (sessionMessages && sessionMessages.length > 0) {
        setMessages(sessionMessages);
      } else {
        // Always update the welcome message when a new data point is clicked
        const newWelcomeMessage = createWelcomeMessage();
        console.log('🤖 Creating new welcome message:', newWelcomeMessage);
        setMessages([newWelcomeMessage]);
      }
    }
  }, [isOpen, lastClickedPoint, createWelcomeMessage, chatSessions, currentSessionId]);



  // Handle mention selection
  const handleMentionSelect = (agentName: string) => {
    const result = insertMention(inputValue, cursorPosition, agentName);
    setInputValue(result.newText);
    setShowMentionSuggestions(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
      }
    }, 0);
  };

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowMentionSuggestions(false);

    try {
      // Parse mentions from the user message
      const parsedMentions = parseMentions(inputValue);
      const context = packSalesContext(dashboardState, lastClickedPoint, inputValue);

      if (parsedMentions.hasValidMentions && parsedMentions.primaryAgent) {
        // User mentioned specific agent(s)
        const agentName = parsedMentions.primaryAgent;
        const agent = getAgentByName(agentName);
        
        if (agent) {
          // Create loading message for agent
          const loadingMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            content: '',
            timestamp: new Date(),
            agentName: agent.agentName,
            agentDisplayName: agent.displayName,
            agentAvatar: agent.avatar,
            agentColor: agent.color,
            isLoading: true
          };

          setMessages(prev => [...prev, loadingMessage]);

          // Send to specific agent
          const response = await sendMessageToAgent(
            agentName,
            parsedMentions.cleanedMessage,
            context
          );

          // Update the loading message with the response
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: response.success ? response.content : `Sorry, I encountered an error: ${response.error}`,
                  isLoading: false
                }
              : msg
          ));
        }
      } else {
        // No specific agent mentioned, suggest best agent and use it
        const suggestedAgent = suggestBestAgent(inputValue, context);
        const agent = getAgentByName(suggestedAgent);

        if (agent) {
          // Create loading message for suggested agent
          const loadingMessage: ChatMessage = {
            id: `agent-${Date.now()}`,
            type: 'agent',
            content: '',
            timestamp: new Date(),
            agentName: agent.agentName,
            agentDisplayName: agent.displayName,
            agentAvatar: agent.avatar,
            agentColor: agent.color,
            isLoading: true
          };

          setMessages(prev => [...prev, loadingMessage]);

          // Send to suggested agent
          const response = await sendMessageToAgent(
            suggestedAgent,
            inputValue,
            context
          );

          // Update the loading message with the response
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessage.id
              ? {
                  ...msg,
                  content: response.success ? response.content : `Sorry, I encountered an error: ${response.error}`,
                  isLoading: false
                }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, dashboardState, lastClickedPoint]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Handle spacebar to show question dropdown (only if input is empty)
    if (e.key === ' ' && inputValue.trim() === '') {
      e.preventDefault();
      setShowQuestionDropdown(true);
      setSelectedQuestionIndex(0);
      return;
    }

    // Handle dropdown navigation
    if (showQuestionDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedQuestionIndex(prev => 
          prev < predefinedQuestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedQuestionIndex(prev => 
          prev > 0 ? prev - 1 : predefinedQuestions.length - 1
        );
        return;
      }
      
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedQuestionIndex >= 0) {
          selectQuestion(selectedQuestionIndex);
        }
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuestionDropdown(false);
        setSelectedQuestionIndex(-1);
        return;
      }
    }

    // Handle normal Enter to send message
    if (e.key === 'Enter' && !e.shiftKey && !showQuestionDropdown) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle question selection
  const selectQuestion = (index: number) => {
    const selectedQuestion = predefinedQuestions[index];
    setInputValue(selectedQuestion);
    setShowQuestionDropdown(false);
    setSelectedQuestionIndex(-1);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Handle input change to hide dropdown when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || 0;
    
    setInputValue(value);
    setCursorPosition(cursor);
    
    // Hide question dropdown if user starts typing
    if (showQuestionDropdown && value.trim() !== '') {
      setShowQuestionDropdown(false);
      setSelectedQuestionIndex(-1);
    }
    
    // Handle mention suggestions (existing logic)
    const suggestions = getMentionSuggestions(value, cursor);
    if (suggestions.show) {
      setMentionSuggestions(suggestions.suggestions);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Message bubble styling functions using theme
  const userMessageStyle = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 6px 20px',
    background: theme.chat.userMessage,
    color: theme.text.inverse,
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '600',
    boxShadow: `0 4px 15px ${theme.accent.primary}30`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap' as const
  };

  const botMessageStyle = {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '20px 20px 20px 6px',
    background: theme.chat.botMessage,
    color: theme.text.primary,
    fontSize: '14px',
    lineHeight: '1.5',
    fontWeight: '400',
    border: `1px solid ${theme.border.light}`,
    boxShadow: `0 4px 15px ${theme.chat.shadow}`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-wrap' as const
  };

  const agentMessageStyle = (agentColor: string) => ({
    maxWidth: '90%',
    padding: '16px 20px',
    borderRadius: '20px 20px 20px 6px',
    background: theme.chat.agentMessage,
    color: theme.text.primary,
    fontSize: '14px',
    lineHeight: '1.6',
    fontWeight: '400',
    border: `1px solid ${agentColor}40`,
    boxShadow: `0 6px 20px ${agentColor}20`,
    backdropFilter: 'blur(10px)',
    whiteSpace: 'pre-line' as const
  });

  if (!isOpen) {
    // EXACT FLOATING BUTTON STYLING - DO NOT CHANGE
    return (
      <button
        onClick={onToggle}
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
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1001
          }}
        >
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: theme.bg.card,
              border: `2px solid ${theme.border.medium}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: theme.text.primary,
              boxShadow: `0 4px 16px ${theme.chat.shadow}`,
              transition: 'all 0.3s ease',
              marginBottom: '12px',
              marginLeft: 'auto'
            }}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>

          {/* Chat Button */}
          <button
            onClick={onToggle}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: theme.chat.userMessage,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: theme.text.inverse,
              boxShadow: `0 8px 32px ${theme.accent.primary}40`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 40px ${theme.accent.primary}60`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${theme.accent.primary}40`;
            }}
          >
            🤖
          </button>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="chatbot-container"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '420px',
            height: '100vh',
            background: theme.chat.panel,
            backdropFilter: 'blur(20px)',
            borderLeft: `1px solid ${theme.border.medium}`,
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `-20px 0 60px ${theme.chat.shadow}`,
            overflow: 'hidden',
            transform: 'translateX(0)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
      {/* Professional Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${theme.border.light}`,
        background: `linear-gradient(135deg, ${theme.accent.primary}10, ${theme.accent.secondary}10)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
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
              color: theme.text.primary
            }}>
              Enhanced AI Assistant
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              Ready with @mentions
            </div>
          </div>
        </div>
        
        {/* Header Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* New Chart Button */}
          {onNewChart && (
            <button
              onClick={handleNewChart}
              style={{
                background: theme.accent.success || '#10b981',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}
              title="Create new chart analysis (keeps current chat history)"
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accent.success}40`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕
            </button>
          )}
          
          {/* Theme Toggle in Header */}
          <button
            onClick={toggleTheme}
            style={{
              background: theme.bg.overlay,
              border: `1px solid ${theme.border.light}`,
              color: theme.text.secondary,
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
          
          {/* Close Button */}
          <button
            onClick={onToggle}
            style={{
              background: theme.bg.overlay,
              border: `1px solid ${theme.border.light}`,
              color: theme.text.secondary,
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = theme.bg.tertiary;
              e.currentTarget.style.color = theme.text.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = theme.bg.overlay;
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div>
              {/* AGENT MESSAGE HEADER */}
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
                  {message.isLoading && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: `2px solid ${message.agentColor || '#6b7280'}30`,
                      borderTop: `2px solid ${message.agentColor || '#6b7280'}`,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                </div>
              )}

              {/* MESSAGE BUBBLE */}
              <div style={
                message.type === 'user' 
                  ? userMessageStyle
                  : message.type === 'agent'
                  ? agentMessageStyle(message.agentColor || '#6b7280')
                  : botMessageStyle
              }>
                {message.isLoading ? 'Thinking...' : message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* @MENTION SUGGESTIONS PANEL */}
      {showMentionSuggestions && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          background: theme.chat.panel,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${theme.accent.info}40`,
          boxShadow: `0 10px 30px ${theme.accent.info}20`,
          maxHeight: '320px',
          overflowY: 'auto',
          zIndex: 1005
        }}>
          {mentionSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.agentName}
              onClick={() => handleMentionSelect(suggestion.agentName)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < mentionSuggestions.length - 1 ? `1px solid ${theme.border.light}` : 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${theme.accent.primary}10`;
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
                      color: theme.text.primary,
                      fontSize: '14px'
                    }}>
                      @{suggestion.agentName}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.text.secondary,
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

      {/* PREDEFINED QUESTIONS DROPDOWN */}
      {showQuestionDropdown && (
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '20px',
          right: '20px',
          background: theme.bg.glass,
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: `1px solid ${theme.accent.primary}40`,
          boxShadow: `0 10px 30px ${theme.accent.primary}20`,
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1005
        }}>
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${theme.border.light}`,
            background: `${theme.accent.primary}10`
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: theme.text.primary,
              marginBottom: '4px'
            }}>
              📋 Quick Questions
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.text.secondary
            }}>
              Use ↑↓ arrows to navigate, Enter to select, Esc to close
            </div>
          </div>
          {predefinedQuestions.map((question, index) => (
            <div
              key={index}
              onClick={() => selectQuestion(index)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: index < predefinedQuestions.length - 1 ? `1px solid ${theme.border.light}` : 'none',
                transition: 'all 0.2s ease',
                background: selectedQuestionIndex === index ? `${theme.accent.primary}15` : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (selectedQuestionIndex !== index) {
                  e.currentTarget.style.background = `${theme.accent.primary}08`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedQuestionIndex !== index) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ 
                  fontSize: '16px', 
                  marginTop: '2px',
                  color: selectedQuestionIndex === index ? theme.accent.primary : theme.text.secondary
                }}>
                  {selectedQuestionIndex === index ? '▶️' : '❓'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    color: selectedQuestionIndex === index ? theme.accent.primary : theme.text.primary,
                    fontWeight: selectedQuestionIndex === index ? '600' : '400',
                    lineHeight: '1.4'
                  }}>
                    {question}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INPUT CONTAINER */}
      <div style={{
        padding: '20px',
        borderTop: `1px solid ${theme.border.light}`,
        background: theme.bg.glass,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything, press SPACE for quick questions, or type @ to see available agents..."
            style={{
              width: '100%',
              minHeight: '44px',
              maxHeight: '120px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: `1px solid ${theme.border.medium}`,
              background: theme.bg.tertiary,
              color: theme.text.primary,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              resize: 'none',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          />
          
          {/* SEND BUTTON */}
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: 'none',
              background: inputValue.trim() && !isLoading
                ? theme.chat.userMessage
                : theme.bg.overlay,
              color: inputValue.trim() && !isLoading ? theme.text.inverse : theme.text.tertiary,
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

        {/* Add spin animation keyframes */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        </div>
      )}
    </>
  );
};

export default EnhancedContextAwareChatbot;