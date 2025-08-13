import React, { useState, useRef, useEffect } from 'react';
import styles from './EnhancedAIChat.module.css';

const EnhancedAIChat = ({ insights = [] }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Chat cleared! How can I help you analyze your transaction patterns today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgents, setShowAgents] = useState(true);
  const messagesEndRef = useRef(null);

  const availableAgents = [
    {
      name: '@sales',
      category: 'SALES',
      categoryColor: '#10b981',
      description: 'Analyze sales trends and customer behavior patterns'
    },
    {
      name: '@customer',
      category: 'CUSTOMER',
      categoryColor: '#3b82f6',
      description: 'Customer segmentation and retention insights'
    },
    {
      name: '@finance',
      category: 'FINANCE',
      categoryColor: '#f59e0b',
      description: 'Financial analysis and revenue optimization'
    },
    {
      name: '@risk',
      category: 'RISK',
      categoryColor: '#ef4444',
      description: 'Fraud detection and risk assessment'
    },
    {
      name: '@product',
      category: 'PRODUCT',
      categoryColor: '#8b5cf6',
      description: 'Product performance and inventory analysis'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('@sales')) {
      return "I've analyzed your sales data. Your transaction volume shows a 15% increase this quarter, with peak activity on Tuesdays and Wednesdays. Would you like me to dive deeper into specific product categories?";
    } else if (lowerInput.includes('@customer')) {
      return "Customer analysis shows 3,421 unique customers with an average transaction value of $184.67. I've identified 3 distinct customer segments based on purchasing behavior. Shall I provide detailed segmentation insights?";
    } else if (lowerInput.includes('@finance')) {
      return "Financial overview: Total revenue of $2.85M with a 12.8% growth rate. Your anomaly rate of 2.34% is within acceptable limits. I can provide detailed P&L analysis if needed.";
    } else if (lowerInput.includes('@risk')) {
      return "Risk assessment complete. I've detected 15 high-risk transactions requiring attention. The overall risk score is moderate at 29%. Would you like me to prioritize these by severity?";
    } else if (lowerInput.includes('trend')) {
      return "Transaction trends show seasonal patterns with peaks during business hours (10 AM - 4 PM). Credit card usage dominates at 81% of all transactions.";
    } else {
      return "I can help you analyze transaction patterns, customer behavior, financial metrics, and risk factors. Try mentioning specific agents like @sales or @finance for specialized insights!";
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h3 className={styles.headerTitle}>Enhanced Transaction AI</h3>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
            <div className={styles.messageContent}>
              {message.content}
            </div>
            <div className={styles.messageTime}>
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className={`${styles.message} ${styles.ai} ${styles.loading}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Info Box */}
      <div className={styles.infoBox}>
        <div className={styles.infoIcon}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div className={styles.infoText}>
          <strong>Tip:</strong> Mention specialized AI agents like <code>@sales</code> or <code>@finance</code> for targeted analysis!
        </div>
      </div>

      {/* Available Agents */}
      <div className={styles.agentsSection}>
        <div 
          className={styles.agentsHeader}
          onClick={() => setShowAgents(!showAgents)}
        >
          <span>Available Agents</span>
          <svg 
            className={`${styles.chevron} ${showAgents ? styles.expanded : ''}`}
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
        
        {showAgents && (
          <div className={styles.agentsList}>
            {availableAgents.map((agent) => (
              <div 
                key={agent.name} 
                className={styles.agentItem}
                onClick={() => setInputValue(prev => prev + agent.name + ' ')}
              >
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>{agent.name}</span>
                  <span 
                    className={styles.agentCategory}
                    style={{ backgroundColor: agent.categoryColor }}
                  >
                    {agent.category}
                  </span>
                </div>
                <div className={styles.agentDescription}>
                  {agent.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className={styles.inputContainer}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about transaction patterns, trends, or mention an agent..."
          className={styles.messageInput}
          rows={2}
          disabled={isLoading}
        />
        <button 
          onClick={handleSendMessage}
          className={styles.sendButton}
          disabled={!inputValue.trim() || isLoading}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
