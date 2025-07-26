import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { PatternIntelligenceProps } from '../types';

const PatternIntelligence = forwardRef<any, PatternIntelligenceProps>(({
  isExpanded,
  onToggle,
  onQuery,
  response,
  isLoading = false,
  suggestedQueries = [
    "Why did our high frequency customers decrease last month?",
    "Which segments have the most regular purchase patterns?",
    "What insights can you provide on our at-risk customers?",
    "How do premium customers compare to budget customers in frequency?",
    "What actions should we take to increase purchase frequency?"
  ]
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations'>('chat');
  
  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    setQuery: (query: string) => {
      setInputValue(query);
    },
    submitQuery: (query: string) => {
      handleQuerySubmit(query);
    },
    expandPanel: () => {
      if (!isExpanded) {
        onToggle();
      }
    },
    collapsePanel: () => {
      if (isExpanded) {
        onToggle();
      }
    },
    switchTab: (tab: 'chat' | 'recommendations') => {
      setActiveTab(tab);
    }
  }));

  // Handle query submission
  const handleQuerySubmit = (query: string = inputValue) => {
    if (query.trim() === '') return;
    
    onQuery(query);
    
    // Add to recent queries if not already present
    setRecentQueries(prev => {
      const newQueries = [query, ...prev.filter(q => q !== query)].slice(0, 5);
      return newQueries;
    });
    
    setInputValue('');
  };
  
  // Handle key press in the input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuerySubmit();
    }
  };
  
  // Click handler for suggested queries
  const handleSuggestionClick = (query: string) => {
    setInputValue(query);
    handleQuerySubmit(query);
  };

  return (
    <div 
      className="pattern-intelligence"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: '#f7f9fb'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #3a4459',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}
      >
        <div 
          style={{
            fontSize: '18px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span 
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#00e0ff',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '14px',
              color: '#0a1224',
              fontWeight: 800
            }}
          >
            AI
          </span>
          Purchase Pattern Intelligence
        </div>
        
        <button
          onClick={onToggle}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f7f9fb',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            transition: 'background-color 0.2s ease'
          }}
        >
          ×
        </button>
      </div>
      
      {/* Tabs */}
      <div 
        style={{
          display: 'flex',
          borderBottom: '1px solid #3a4459',
          marginBottom: '16px'
        }}
      >
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'chat' ? '2px solid #00e0ff' : 'none',
            color: activeTab === 'chat' ? '#00e0ff' : '#f7f9fb',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'chat' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Intelligence Chat
        </button>
        
        <button
          onClick={() => setActiveTab('recommendations')}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'recommendations' ? '2px solid #e930ff' : 'none',
            color: activeTab === 'recommendations' ? '#e930ff' : '#f7f9fb',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: activeTab === 'recommendations' ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Recommendations
        </button>
      </div>
      
      {/* Chat Tab Content */}
      {activeTab === 'chat' && (
        <>
          {/* Response Area */}
          <div 
            style={{
              flexGrow: 1,
              overflowY: 'auto',
              marginBottom: '16px',
              padding: '8px',
              backgroundColor: '#1a202c',
              borderRadius: '8px',
              minHeight: '200px'
            }}
          >
            {isLoading ? (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#8893a7'
                }}
              >
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid #00e0ff',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}
                />
                Analyzing purchase patterns...
              </div>
            ) : response ? (
              <div 
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}
              >
                {response}
              </div>
            ) : (
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#8893a7'
                }}
              >
                <div 
                  style={{
                    fontSize: '32px',
                    marginBottom: '12px'
                  }}
                >
                  💡
                </div>
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                  Ask a question about purchase patterns to get insights
                </div>
              </div>
            )}
          </div>
          
          {/* Suggestions */}
          {!response && !isLoading && (
            <div 
              style={{
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#8893a7' }}>
                Suggested queries:
              </div>
              <div 
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                {suggestedQueries.map((query, i) => (
                  <button
                    key={`suggestion-${i}`}
                    onClick={() => handleSuggestionClick(query)}
                    style={{
                      backgroundColor: '#3a4459',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '4px 12px',
                      color: '#f7f9fb',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Recent Queries */}
          {recentQueries.length > 0 && !isLoading && (
            <div 
              style={{
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#8893a7' }}>
                Recent queries:
              </div>
              <div 
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                {recentQueries.map((query, i) => (
                  <button
                    key={`recent-${i}`}
                    onClick={() => handleSuggestionClick(query)}
                    style={{
                      backgroundColor: '#1a202c',
                      border: '1px solid #3a4459',
                      borderRadius: '16px',
                      padding: '4px 12px',
                      color: '#f7f9fb',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about purchase patterns..."
              style={{
                backgroundColor: '#1a202c',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '10px 12px',
                color: '#f7f9fb',
                fontSize: '14px',
                flexGrow: 1
              }}
              disabled={isLoading}
            />
            
            <button
              onClick={() => handleQuerySubmit()}
              disabled={inputValue.trim() === '' || isLoading}
              style={{
                backgroundColor: inputValue.trim() === '' || isLoading ? '#3a4459' : '#00e0ff',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 16px',
                color: inputValue.trim() === '' || isLoading ? '#8893a7' : '#0a1224',
                fontSize: '14px',
                fontWeight: 600,
                cursor: inputValue.trim() === '' || isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Ask
            </button>
          </div>
        </>
      )}
      
      {/* Recommendations Tab Content */}
      {activeTab === 'recommendations' && (
        <div 
          style={{
            flexGrow: 1,
            overflowY: 'auto'
          }}
        >
          {/* Frequency Recommendations */}
          <div 
            style={{
              marginBottom: '24px'
            }}
          >
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#00e0ff' }}>
              Purchase Frequency Opportunities
            </h3>
            
            <div 
              style={{
                backgroundColor: '#1a202c',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                borderLeft: '4px solid #00e0ff'
              }}
            >
              <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>
                Reactivate Dormant Customers
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#8893a7' }}>
                30% of your customers haven't made a purchase in over 90 days. Target them with a special offer to reactivate their purchase behavior.
              </p>
              <button
                style={{
                  backgroundColor: '#00e0ff22',
                  border: '1px solid #00e0ff',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: '#00e0ff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Create Reactivation Campaign
              </button>
            </div>
            
            <div 
              style={{
                backgroundColor: '#1a202c',
                borderRadius: '8px',
                padding: '16px',
                borderLeft: '4px solid #00e0ff'
              }}
            >
              <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>
                Incentivize More Frequent Purchases
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#8893a7' }}>
                Customers who purchase 2-3 times per month spend 45% more than those who purchase once. Offer incentives for multiple purchases per month.
              </p>
              <button
                style={{
                  backgroundColor: '#00e0ff22',
                  border: '1px solid #00e0ff',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: '#00e0ff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                View Loyalty Program Options
              </button>
            </div>
          </div>
          
          {/* Value Recommendations */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#e930ff' }}>
              Value Enhancement Opportunities
            </h3>
            
            <div 
              style={{
                backgroundColor: '#1a202c',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                borderLeft: '4px solid #e930ff'
              }}
            >
              <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>
                Upsell Premium Products
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#8893a7' }}>
                Customers in the 'standard' segment have a 38% conversion rate to premium products when offered. Target the top 20% of this segment.
              </p>
              <button
                style={{
                  backgroundColor: '#e930ff22',
                  border: '1px solid #e930ff',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: '#e930ff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Create Upsell Campaign
              </button>
            </div>
            
            <div 
              style={{
                backgroundColor: '#1a202c',
                borderRadius: '8px',
                padding: '16px',
                borderLeft: '4px solid #e930ff'
              }}
            >
              <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>
                Bundle Products for Higher Value
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#8893a7' }}>
                Product bundles increase average transaction value by 25%. Create bundles based on popular product combinations.
              </p>
              <button
                style={{
                  backgroundColor: '#e930ff22',
                  border: '1px solid #e930ff',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  color: '#e930ff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                View Bundle Recommendations
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PatternIntelligence.displayName = 'PatternIntelligence';

export default PatternIntelligence; 