import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { AIResponseDashboard } from '../ai-interaction/aiResponse';
import { theme } from '../theme/theme.constants';
import { 
  agents, 
  detectAgentFromContext, 
  getAgentByMention, 
  extractMentions,
  replaceMentionsWithAgent,
  AgentConfig 
} from './agentConfig';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  agent?: AgentConfig;
  timestamp: Date;
  isLoading?: boolean;
}

interface UniversalChatbotProps {
  defaultAgent?: string;
  onClose?: () => void;
  dashboardContext?: any;
}

export const UniversalChatbot: React.FC<UniversalChatbotProps> = ({
  defaultAgent,
  onClose,
  dashboardContext
}) => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Detect initial agent based on route with guaranteed fallback
  const initialAgent = defaultAgent 
    ? agents[defaultAgent] 
    : detectAgentFromContext(router.pathname) || agents.enterpriseiq || agents.sales;

  // Ensure we always have a valid agent
  if (!initialAgent) {
    console.error('No valid agent found, using fallback');
  }

  const [session] = useState({
    session_id: uuidv4(),
    user_id: "ari",
    app_name: initialAgent?.appName || 'orchestration_agent'
  });

  const [currentAgent, setCurrentAgent] = useState<AgentConfig>(initialAgent || agents.enterpriseiq);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'agent',
      agent: initialAgent,
      content: `👋 Welcome! I'm ${initialAgent?.displayName || 'your AI assistant'}. ${initialAgent?.description || 'I can help you with various tasks'}.\n\nYou can ask me about:\n${initialAgent?.capabilities?.map(cap => `• ${cap}`).join('\n') || '• General assistance'}\n\nTo switch agents, use @mentions: ${Object.keys(agents).map(a => `@${a}`).join(', ')}`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const { cleanText, targetAgent } = replaceMentionsWithAgent(inputValue);
    
    // If agent mention detected, switch agent
    if (targetAgent && targetAgent.appName && currentAgent && targetAgent.appName !== currentAgent.appName) {
      setCurrentAgent(targetAgent);
      session.app_name = targetAgent.appName;
      
      // Add system message about agent switch
      setMessages(prev => [...prev, 
        {
          id: uuidv4(),
          type: 'user',
          content: inputValue,
          timestamp: new Date()
        },
        {
          id: uuidv4(),
          type: 'system',
          content: `Switching to ${targetAgent.displayName}...`,
          timestamp: new Date()
        }
      ]);
    } else {
      // Add user message
      setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'user',
        content: inputValue,
        timestamp: new Date()
      }]);
    }

    setInputValue('');
    setIsLoading(true);

    // Create loading message
    const loadingMessageId = uuidv4();
    setMessages(prev => [...prev, {
      id: loadingMessageId,
      type: 'agent',
      agent: targetAgent || currentAgent,
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const queryToSend = targetAgent ? cleanText : inputValue;
      const response = AIResponseDashboard(queryToSend, {
        ...session,
        app_name: targetAgent?.appName || session.app_name || 'chatbot'
      });

      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk === '[DONE]') {
          break;
        } else if (chunk === '[ERROR]') {
          throw new Error('AI response error');
        } else if (typeof chunk === 'object' && chunk !== null && chunk.text) {
          fullResponse += chunk.text;
          
          // Update the loading message with accumulated response
          setMessages(prev => prev.map(msg => 
            msg.id === loadingMessageId 
              ? { ...msg, content: fullResponse, isLoading: false }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { 
              ...msg, 
              content: 'Sorry, I encountered an error processing your request. Please try again.', 
              isLoading: false 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch('');
    } else if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1);
      const spaceIndex = afterAt.indexOf(' ');
      if (spaceIndex === -1) {
        setShowMentions(true);
        setMentionSearch(afterAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (agentKey: string) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.substring(0, lastAtIndex) + `@${agentKey} `;
    setInputValue(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredAgents = Object.entries(agents).filter(([key]) => 
    key.toLowerCase().includes(mentionSearch)
  );

  const styles = {
    container: {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      width: '450px',
      height: '600px',
      background: theme.colors.background.card,
      border: `1px solid ${theme.colors.border.active}`,
      borderRadius: theme.borderRadius.xl,
      boxShadow: theme.shadows.xl,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
      zIndex: theme.zIndex.modal,
    },
    header: {
      padding: theme.spacing.md,
      background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.card} 100%)`,
      borderBottom: `1px solid ${theme.colors.border.default}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    agentIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: `${currentAgent?.color || '#00e0ff'}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
    },
    agentName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    agentStatus: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: theme.colors.text.secondary,
      fontSize: '20px',
      cursor: 'pointer',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      transition: theme.transitions.fast,
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: theme.spacing.md,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.spacing.md,
    },
    message: {
      maxWidth: '80%',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      fontSize: theme.typography.fontSize.sm,
      lineHeight: theme.typography.lineHeight.relaxed,
    },
    userMessage: {
      alignSelf: 'flex-end' as const,
      background: theme.colors.accent.primary,
      color: theme.colors.background.primary,
    },
    agentMessage: {
      alignSelf: 'flex-start' as const,
      background: theme.colors.background.secondary,
      color: theme.colors.text.primary,
      border: `1px solid ${theme.colors.border.default}`,
    },
    systemMessage: {
      alignSelf: 'center' as const,
      background: 'transparent',
      color: theme.colors.text.secondary,
      fontSize: theme.typography.fontSize.xs,
      fontStyle: 'italic',
      padding: theme.spacing.sm,
    },
    loadingDots: {
      display: 'inline-block',
      animation: 'pulse 1.5s infinite',
    },
    inputContainer: {
      padding: theme.spacing.md,
      borderTop: `1px solid ${theme.colors.border.default}`,
      position: 'relative' as const,
    },
    inputWrapper: {
      display: 'flex',
      gap: theme.spacing.sm,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      color: theme.colors.text.primary,
      fontSize: theme.typography.fontSize.sm,
      resize: 'none' as const,
      minHeight: '40px',
      maxHeight: '120px',
      fontFamily: theme.typography.fontFamily,
      outline: 'none',
    },
    sendButton: {
      background: theme.colors.accent.primary,
      border: 'none',
      borderRadius: theme.borderRadius.lg,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      color: theme.colors.background.primary,
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      cursor: 'pointer',
      transition: theme.transitions.fast,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    mentionsDropdown: {
      position: 'absolute' as const,
      bottom: '100%',
      left: theme.spacing.md,
      right: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      background: theme.colors.background.card,
      border: `1px solid ${theme.colors.border.active}`,
      borderRadius: theme.borderRadius.md,
      maxHeight: '200px',
      overflowY: 'auto' as const,
      boxShadow: theme.shadows.lg,
    },
    mentionItem: {
      padding: theme.spacing.sm,
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      cursor: 'pointer',
      transition: theme.transitions.fast,
      borderBottom: `1px solid ${theme.colors.border.subtle}`,
    },
    mentionIcon: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
    },
    mentionInfo: {
      flex: 1,
    },
    mentionName: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
    },
    mentionDescription: {
      fontSize: theme.typography.fontSize.xs,
      color: theme.colors.text.secondary,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={{ ...styles.agentIcon, background: `${currentAgent?.color || '#00e0ff'}20` }}>
            {currentAgent?.icon || '🤖'}
          </div>
          <div>
            <div style={styles.agentName}>{currentAgent?.displayName || 'AI Assistant'}</div>
            <div style={styles.agentStatus}>Ready with @mentions</div>
          </div>
        </div>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.message,
              ...(message.type === 'user' ? styles.userMessage : 
                 message.type === 'system' ? styles.systemMessage : 
                 styles.agentMessage)
            }}
          >
            {message.isLoading ? (
              <span style={styles.loadingDots}>Thinking...</span>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputContainer}>
        {showMentions && (
          <div style={styles.mentionsDropdown}>
            {filteredAgents.map(([key, agent]) => (
              <div
                key={key}
                style={styles.mentionItem}
                onClick={() => handleMentionSelect(key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.background.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ ...styles.mentionIcon, background: `${agent.color}20` }}>
                  {agent.icon}
                </div>
                <div style={styles.mentionInfo}>
                  <div style={styles.mentionName}>@{key}</div>
                  <div style={styles.mentionDescription}>{agent.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            style={styles.input}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me anything or type @ to see available agents..."
            disabled={isLoading}
          />
          <button
            style={{
              ...styles.sendButton,
              opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
              cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            <span>Send</span>
            <span>🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalChatbot;