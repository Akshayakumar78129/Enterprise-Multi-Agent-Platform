import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import ErrorBoundary from "../ErrorBoundary";

const EngagementPyramid = ({ 
  distribution = [], 
  isLoading = false, 
  onLevelClick = null,
  selectedLevel = null,
  showPercentages = false 
}) => {
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [aiAssistant, setAiAssistant] = useState({
    visible: false,
    level: '',
    count: 0,
    percentage: 0,
    explanation: ''
  });
  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    level: '',
    contextPoints: [], // Keep as array for the 2 points
    position: { x: 0, y: 0 }
  });
  
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 });

  // Debug logging
  console.log('🔺 Pyramid - Distribution data:', distribution);
  console.log('🔺 Pyramid - Selected level:', selectedLevel);

  if (!distribution || distribution.length === 0) {
    return (
      <Card title="Engagement Distribution Pyramid" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "480px",
            color: "#5891cb",
          }}
        >
          No engagement data available
        </div>
      </Card>
    );
  }

  // Sort distribution by engagement level (High, Medium, Low) and filter out levels with 0 customers
  const sortedDistribution = [...distribution]
    .filter(item => item.customer_count > 0) // Only show levels with customers (filtered levels)
    .sort((a, b) => {
      const order = { 'High': 1, 'Medium': 2, 'Low': 3 };
      return order[a.engagement_level] - order[b.engagement_level];
    });

  // Calculate total for percentages
  const totalCustomers = sortedDistribution.reduce((sum, item) => sum + item.customer_count, 0);

  // Generate context points for chatbot - simplified to max 2 points
  const generateContextPoints = (level, count, percentage, tierData) => {
    // Generate simplified 2-line context
    const contextPoints = [
      `${level} Engagement Block`,
      `Customers with ${level === 'High' ? 'high activity and frequent interactions' : 
                      level === 'Medium' ? 'moderate activity levels' : 
                      'low activity and infrequent purchases'} (${count.toLocaleString()})`
    ];

    return contextPoints;
  };

  // Generate AI explanation for engagement level
  const generateAIExplanation = (level, count, percentage, tierData) => {
    const avgDays = Math.round(tierData.avg_days_since_activity || 0);

    let explanation = '';

    if (level === 'High') {
      explanation = 'High Engagement Customers\n\n' + count.toLocaleString() + ' customers (' + percentage + '%) • Avg: ' + avgDays + ' days since activity\n\nYour champions! These customers are highly engaged and drive most of your revenue.\n\nFocus: Retention programs, VIP treatment, referral incentives.';
    } else if (level === 'Medium') {
      explanation = 'Medium Engagement Customers\n\n' + count.toLocaleString() + ' customers (' + percentage + '%) • Avg: ' + avgDays + ' days since activity\n\nYour growth opportunity! These customers have potential but need targeted campaigns.\n\nFocus: Personalized offers, product recommendations, loyalty programs.';
    } else {
      explanation = 'Low Engagement Customers\n\n' + count.toLocaleString() + ' customers (' + percentage + '%) • Avg: ' + avgDays + ' days since activity\n\nAt-risk customers who need immediate attention to prevent churn.\n\nFocus: Win-back campaigns, surveys, special discounts, direct outreach.';
    }

    return explanation;
  };

  // Define tier configurations
  const tierConfigs = {
    'High': {
      color: '#00e0ff',
      icon: '🔥',
      width: '480px',
      height: '120px',
      label: 'High Engagement'
    },
    'Medium': {
      color: '#5fd4d6',
      icon: '⚡',
      width: '520px',
      height: '140px',
      label: 'Medium Engagement'
    },
    'Low': {
      color: '#e930ff',
      icon: '🔋',
      width: '560px',
      height: '160px',
      label: 'Low Engagement'
    }
  };

  const showContextMenu = (e, level) => {
    console.log('showContextMenu called for level:', level);
    
    // Calculate position for the context menu
    let x = 100;
    let y = 100;
    
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 320;
      const menuHeight = 350;
      
      // Start with element position
      x = rect.left + (rect.width / 2) - (menuWidth / 2); // Center horizontally on element
      y = rect.top - menuHeight - 15; // Position above element
      
      // Adjust horizontal position if menu goes off screen
      if (x < 10) {
        x = 10; // Left edge buffer
      } else if (x + menuWidth > window.innerWidth - 10) {
        x = window.innerWidth - menuWidth - 10; // Right edge buffer
      }
      
      // Adjust vertical position if menu goes off screen
      if (y < 10) {
        y = rect.bottom + 15; // Position below element if no space above
      }
      
      // Final check - if still off screen, position in safe zone
      if (y + menuHeight > window.innerHeight - 10) {
        y = window.innerHeight - menuHeight - 10;
      }
    } else if (e && e.clientX) {
      const menuWidth = 320;
      const menuHeight = 350;
      
      // Center on click position
      x = e.clientX - (menuWidth / 2);
      y = e.clientY - menuHeight - 15;
      
      // Adjust if off screen
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    }
    
    // Find the tier data for this level
    const tierData = sortedDistribution.find(item => item.engagement_level === level);
    if (tierData && totalCustomers > 0) {
      const percentage = ((tierData.customer_count / totalCustomers) * 100).toFixed(1);
      const contextPoints = generateContextPoints(level, tierData.customer_count, percentage, tierData);
      
      setContextMenu({
        visible: true,
        level: level,
        contextPoints: contextPoints,
        position: { x, y }
      });
      
      console.log('Context points for chatbot:', contextPoints);
    }
  };

  const handleTierClick = (e, level) => {
    try {
      // Check if Shift key was pressed
      const isShiftClick = e && e.shiftKey;
      
      if (isShiftClick) {
        // Directly send context to chat (no popup)
        try {
          const tierData = sortedDistribution.find(item => item.engagement_level === level);
          if (tierData && totalCustomers > 0) {
            const percentage = ((tierData.customer_count / totalCustomers) * 100).toFixed(1);
            const contextPoints = generateContextPoints(level, tierData.customer_count, percentage, tierData);
            if (window.attachContextTags) {
              // Add each context tag separately and open chat
              contextPoints.forEach(point => window.attachContextTags(point));
              if (window.openChatPanel) window.openChatPanel();
            } else if (window.sendContextToChat) {
              window.sendContextToChat(contextPoints);
            }
          }
        } catch (err) {
          console.error('Error sending context to chat:', err);
        }
        return;
      }

      // Regular click - show AI assistant
      console.log('Regular click detected - showing AI assistant for:', level);
      
      // Calculate position for the popup
      let x = 100;
      let y = 100;
      
      // Handle different event types
      if (e && e.currentTarget) {
        // Regular DOM events (clicking on pyramid tiers)
        const rect = e.currentTarget.getBoundingClientRect();
        x = rect.left;
        y = rect.top - 10; // Position slightly above the element
      } else if (e && e.clientX) {
        // Direct events with clientX/clientY
        x = e.clientX;
        y = e.clientY - 10;
      }
      
      setAssistantPosition({ x, y });
      
      // Find the tier data for this level
      const tierData = sortedDistribution.find(item => item.engagement_level === level);
      if (tierData && totalCustomers > 0) {
        const percentage = ((tierData.customer_count / totalCustomers) * 100).toFixed(1);
        const explanation = generateAIExplanation(level, tierData.customer_count, percentage, tierData);
        
        setAiAssistant({
          visible: true,
          level: level,
          count: tierData.customer_count,
          percentage: percentage,
          explanation: explanation
        });
      }
      
      // Still call the original onLevelClick if provided
      if (onLevelClick) {
        onLevelClick(level);
      }
    } catch (error) {
      console.error('Error in handleTierClick:', error);
    }
  };

  const handleTierHover = (level) => {
    setHoveredLevel(level);
  };

  const renderTier = (tierData) => {
    const config = tierConfigs[tierData.engagement_level];
    const percentage = totalCustomers > 0 ? ((tierData.customer_count / totalCustomers) * 100).toFixed(1) : 0;
    const isSelected = selectedLevel === tierData.engagement_level;
    const isHovered = hoveredLevel === tierData.engagement_level;

    return (
      <div
        key={tierData.engagement_level}
        style={{
          width: config.width,
          height: config.height,
          backgroundColor: isSelected || isHovered ? config.color : `${config.color}80`,
          border: `2px solid ${isSelected ? '#f7f9fb' : config.color}`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '4px auto',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isSelected ? '0 4px 16px rgba(0, 224, 255, 0.3)' : 'none',
          position: 'relative'
        }}
        onClick={(e) => handleTierClick(e, tierData.engagement_level)}
        onMouseEnter={() => handleTierHover(tierData.engagement_level)}
        onMouseLeave={() => handleTierHover(null)}
      >
        {/* Tier Icon */}
        <div style={{
          fontSize: '24px',
          marginBottom: '8px'
        }}>
          {config.icon}
        </div>

        {/* Customer Count */}
        <div style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#f7f9fb',
          fontFamily: 'Inter, sans-serif'
        }}>
          {tierData.customer_count.toLocaleString()}
        </div>

        {/* Percentage */}
        <div style={{
          fontSize: '16px',
          color: '#f7f9fb',
          opacity: 0.9,
          fontFamily: 'Inter, sans-serif'
        }}>
          {percentage}%
        </div>

        {/* Level Label */}
        <div style={{
          fontSize: '14px',
          color: '#f7f9fb',
          marginTop: '4px',
          fontWeight: '500',
          fontFamily: 'Inter, sans-serif'
        }}>
          {config.label}
        </div>

        {/* Key Metric */}
        <div style={{
          fontSize: '12px',
          color: '#f7f9fb',
          opacity: 0.8,
          marginTop: '4px',
          fontFamily: 'Inter, sans-serif'
        }}>
          Avg: {Math.round(tierData.avg_days_since_activity || 0)} days
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '12px',
            height: '12px',
            backgroundColor: '#00e0ff',
            borderRadius: '50%',
            border: '2px solid #f7f9fb'
          }} />
        )}
      </div>
    );
  };

  const renderConnectorLine = (index) => {
    if (index === sortedDistribution.length - 1) return null;
    
    return (
      <div
        key={`connector-${index}`}
        style={{
          width: '2px',
          height: '24px',
          backgroundColor: '#3a4459',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Animated dots showing customer movement */}
        <div style={{
          position: 'absolute',
          width: '6px',
          height: '6px',
          backgroundColor: '#00e0ff',
          borderRadius: '50%',
          left: '-2px',
          top: '4px',
          animation: 'float 2s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '4px',
          height: '4px',
          backgroundColor: '#5fd4d6',
          borderRadius: '50%',
          left: '-1px',
          top: '14px',
          animation: 'float 2s ease-in-out infinite 0.5s'
        }} />
      </div>
    );
  };

  return (
    <Card 
      title="Engagement Distribution Pyramid" 
      subtitle={`${totalCustomers.toLocaleString()} total customers`}
      isLoading={isLoading}
    >
      <div
        className="pyramid-glass-bg"
        style={{
          '--pyramid-hue': selectedLevel === 'High' ? 180 : selectedLevel === 'Medium' ? 260 : selectedLevel === 'Low' ? 330 : 210,
        }}
      >
        {/* Threshold indicators */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12px',
          color: '#9fb7d8'
        }}>
          <div>≤30 days: High</div>
          <div>31-90 days: Medium</div>
          <div>{'>'}90 days: Low</div>
        </div>

        {/* AI Assistant Popup */}
        {aiAssistant.visible && (
          <ErrorBoundary>
            <>
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { transform: translateY(-80%); }
                  to { transform: translateY(-100%); }
                }
              `}</style>
              <div style={{
                position: 'fixed',
                top: assistantPosition.y,
                left: assistantPosition.x,
                zIndex: 9999,
                maxWidth: '300px',
                backgroundColor: '#0a1224',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 224, 255, 0.3)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
                transform: 'translateY(-100%)'
              }}>
                {/* Header */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(0, 224, 255, 0.1)',
                  borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 224, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(0, 224, 255, 0.5)'
                    }}>
                      <span style={{ fontSize: '12px' }}>💡</span>
                    </div>
                    <div style={{
                      color: '#00e0ff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      AI Insight
                    </div>
                  </div>
                  <button
                    onClick={() => setAiAssistant(prev => ({ ...prev, visible: false }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#5891cb',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(88, 145, 203, 0.1)';
                      e.currentTarget.style.color = '#f7f9fb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#5891cb';
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Content */}
                <div style={{
                  padding: '12px 16px',
                  color: '#f7f9fb',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {aiAssistant.explanation}
                </div>
              </div>
            </>
          </ErrorBoundary>
        )}

        {/* Context Menu for Chatbot */}
        {contextMenu.visible && (
          <ErrorBoundary>
            <>
              <div style={{
                position: 'fixed',
                top: contextMenu.position.y,
                left: contextMenu.position.x,
                zIndex: 9999,
                maxWidth: '320px',
                backgroundColor: '#0a1224',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(233, 48, 255, 0.3)',
                border: '1px solid rgba(233, 48, 255, 0.3)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease, slideUp 0.3s ease',
                transform: 'translateY(-100%)'
              }}>
                {/* Header */}
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: 'rgba(233, 48, 255, 0.1)',
                  borderBottom: '1px solid rgba(233, 48, 255, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(233, 48, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(233, 48, 255, 0.5)'
                    }}>
                      <span style={{ fontSize: '12px' }}>🎯</span>
                    </div>
                    <div style={{
                      color: '#e930ff',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      Context for Chat
                    </div>
                  </div>
                  <button
                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#5891cb',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(88, 145, 203, 0.1)';
                      e.currentTarget.style.color = '#f7f9fb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#5891cb';
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {/* Context Points */}
                <div style={{
                  padding: '12px 16px',
                  color: '#f7f9fb',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  {contextMenu.contextPoints.map((point, index) => (
                    <div key={index} style={{
                      marginBottom: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(233, 48, 255, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(233, 48, 255, 0.1)'
                    }}>
                      {point}
                    </div>
                  ))}
                </div>
                
                {/* Add Context Tags Button */}
                <div style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(233, 48, 255, 0.2)',
                  backgroundColor: 'rgba(233, 48, 255, 0.05)'
                }}>
                  <button
                    onClick={() => {
                      console.log('Adding context tags:', contextMenu.contextPoints);
                      
                      // Add each context point separately
                      if (window.attachContextTags) {
                        contextMenu.contextPoints.forEach(point => {
                          window.attachContextTags(point);
                        });
                        
                        // Auto-open chat when context is added
                        if (window.openChatPanel) {
                          window.openChatPanel();
                        }
                      } else if (window.sendContextToChat) {
                        window.sendContextToChat(contextMenu.contextPoints);
                      }
                      
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: '#e930ff',
                      color: '#f7f9fb',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#d020e6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e930ff';
                    }}
                  >
                    🏷️ Add to Context
                  </button>
                </div>
              </div>
            </>
          </ErrorBoundary>
        )}

        {/* Pyramid structure */}
        {sortedDistribution.map((tierData, index) => (
          <React.Fragment key={tierData.engagement_level}>
            {renderTier(tierData)}
            {renderConnectorLine(index)}
          </React.Fragment>
        ))}

        {/* Summary stats */}
        <div className="pyramid-summary">
          {sortedDistribution.map(tier => {
            const percentage = totalCustomers > 0 ? ((tier.customer_count / totalCustomers) * 100).toFixed(1) : 0;
            return (
              <div key={tier.engagement_level} className="pyramid-summary-item">
                <div style={{ fontWeight: '600', color: tierConfigs[tier.engagement_level].color }}>
                  {tier.engagement_level}
                </div>
                <div>Avg Purchase: ${Math.round(tier.avg_purchase_value || 0)}</div>
                <div>Avg Transactions: {Math.round(tier.avg_transactions || 0)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSS animations and local styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-8px); opacity: 0.7; }
        }
        .pyramid-glass-bg {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          min-height: 480px;
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px) saturate(160%);
          background:
            radial-gradient(1200px 500px at 0% 0%, rgba(0, 224, 255, 0.24), rgba(0, 224, 255, 0) 60%),
            radial-gradient(1200px 500px at 100% 100%, rgba(233, 48, 255, 0.24), rgba(233, 48, 255, 0) 60%),
            /* subtle global green tint (half brightness of corners) */
            linear-gradient(0deg, rgba(95, 212, 214, 0.06), rgba(95, 212, 214, 0.06)),
            linear-gradient(135deg, rgba(10, 15, 30, 0.45), rgba(5, 10, 20, 0.45));
          box-shadow: 0 10px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .pyramid-summary {
          margin-top: 24px;
          display: flex;
          justify-content: space-around;
          width: 100%;
          font-size: 14px;
          color: #9fb7d8;
        }
        .pyramid-summary-item { text-align: center; }
      `}</style>
    </Card>
  );
};

export default EngagementPyramid; 