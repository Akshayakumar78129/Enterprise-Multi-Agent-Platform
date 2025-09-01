import React, { useState, useRef, useEffect } from 'react';
import { AIResponseDashboard } from '../../../../../../ui-common/ai-interaction/aiResponse';
import { v4 as uuidv4 } from 'uuid';
import styles from './EnhancedInventoryChatbot.module.css';

interface EnhancedInventoryChatbotProps {
  dashboardContext?: any;
}

export default function EnhancedInventoryChatbot({ dashboardContext }: EnhancedInventoryChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(uuidv4());
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Here you would integrate with the actual AI backend
    // For now, using the AIResponseDashboard for responses
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.chatToggleButton}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 224, 255, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={styles.chatWindow}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '400px',
            height: '600px',
            background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 224, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden'
          }}
        >
          {/* Chat Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
            background: 'rgba(0, 224, 255, 0.05)'
          }}>
            <h3 style={{
              margin: 0,
              color: '#00e0ff',
              fontSize: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🤖 Inventory AI Assistant
            </h3>
            <p style={{
              margin: '5px 0 0 0',
              color: 'rgba(247, 249, 251, 0.7)',
              fontSize: '14px'
            }}>
              Ask about inventory optimization
            </p>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto'
          }}>
            {messages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'rgba(247, 249, 251, 0.5)',
                marginTop: '50px'
              }}>
                <p>👋 Hi! I'm your Inventory Assistant.</p>
                <p>Ask me about:</p>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
                  <li>📊 Inventory health analysis</li>
                  <li>💰 Cost optimization opportunities</li>
                  <li>📦 Slow-moving inventory</li>
                  <li>⚠️ Stock-out risks</li>
                </ul>
              </div>
            ) : (
              <div>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 15px',
                      borderRadius: '12px',
                      background: msg.role === 'user' 
                        ? 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)'
                        : 'rgba(10, 18, 36, 0.5)',
                      color: msg.role === 'user' ? '#0a1224' : '#f7f9fb',
                      border: msg.role !== 'user' ? '1px solid rgba(0, 224, 255, 0.1)' : 'none'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Response Dashboard Integration */}
            <AIResponseDashboard
              sessionId={sessionId}
              apiEndpoint="/api/insights/explain"
              appName="inventory_optimization"
              defaultContext={{
                source: 'inventory_optimization',
                dashboard_context: dashboardContext
              }}
              onResponseReceived={(response) => {
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: response,
                  timestamp: new Date()
                }]);
              }}
            />
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px',
            borderTop: '1px solid rgba(0, 224, 255, 0.2)',
            background: 'rgba(0, 224, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 224, 255, 0.2)',
                  background: 'rgba(10, 18, 36, 0.5)',
                  color: '#f7f9fb',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
                  border: 'none',
                  color: '#0a1224',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}