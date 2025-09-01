import React, { useState, useRef, useEffect } from 'react';
import styles from './InventoryChatbot.module.css';

interface InventoryChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData?: any[];
  dashboardContext?: any;
}

const InventoryChatbot: React.FC<InventoryChatbotProps> = ({ 
  isOpen, 
  onClose, 
  selectedData = [], 
  dashboardContext 
}) => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your Inventory Optimization Assistant. How can I help you analyze your inventory data today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedData.length > 0) {
      const dataContext = `User has selected ${selectedData.length} data point(s) for analysis.`;
      setMessages(prev => [...prev, {
        role: 'system',
        content: dataContext
      }]);
    }
  }, [selectedData]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            dashboard: 'inventory_optimization',
            selectedData,
            ...dashboardContext
          }
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'I can help you analyze inventory health scores, identify slow-moving items, calculate savings opportunities, and optimize stock levels. What would you like to explore?'
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting. I can still help you with: analyzing inventory metrics, understanding health scores, identifying optimization opportunities, and reviewing cost impacts.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.chatIcon}>💬</span>
          <h3 className={styles.chatTitle}>Inventory Assistant</h3>
        </div>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map((message, index) => (
          message.role !== 'system' && (
            <div
              key={index}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              }`}
            >
              {message.role === 'assistant' && (
                <span className={styles.messageIcon}>🤖</span>
              )}
              <div className={styles.messageContent}>
                {message.content}
              </div>
            </div>
          )
        ))}
        {isLoading && (
          <div className={styles.loadingMessage}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Ask about inventory optimization..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          className={styles.sendButton}
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      {selectedData.length > 0 && (
        <div className={styles.contextIndicator}>
          📊 {selectedData.length} data point(s) selected for analysis
        </div>
      )}
    </div>
  );
};

export default InventoryChatbot;