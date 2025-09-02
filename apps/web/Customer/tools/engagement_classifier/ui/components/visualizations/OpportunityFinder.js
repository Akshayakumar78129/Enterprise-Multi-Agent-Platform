import React, { useState } from "react";

const OpportunityFinder = ({ 
  opportunities = [], 
  isLoading = false, 
  onOpportunitySelect = null,
  valueThreshold = 5000,
  potentialThreshold = 60,
  onThresholdChange = null
}) => {
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [thresholds, setThresholds] = useState({
    value: valueThreshold,
    potential: potentialThreshold
  });
  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    opportunity: null,
    contextPoints: [],
    position: { x: 0, y: 0 }
  });

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="glass-chart-container">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Re-engagement Opportunity Finder</h3>
            <p className="chart-subtitle">High-value customer re-engagement opportunities</p>
          </div>
        </div>
        <div className="chart-loading">
          {isLoading ? 'Loading...' : 'No re-engagement opportunities available'}
        </div>
      </div>
    );
  }

  // Define opportunity matrix quadrants
  const getQuadrant = (opportunity) => {
    const valueScore = opportunity.avg_customer_value > thresholds.value ? 'High' : 'Low';
    const potentialScore = opportunity.avg_days_inactive < thresholds.potential ? 'High' : 'Low';
    
    if (valueScore === 'High' && potentialScore === 'High') {
      return { name: 'Priority Re-engage', color: '#00e0ff', priority: 1 };
    } else if (valueScore === 'High' && potentialScore === 'Low') {
      return { name: 'Nurture', color: '#5fd4d6', priority: 2 };
    } else if (valueScore === 'Low' && potentialScore === 'High') {
      return { name: 'Bulk Activation', color: '#ffa726', priority: 3 };
    } else {
      return { name: 'Monitor', color: '#666', priority: 4 };
    }
  };

  // Create matrix visualization data
  const createMatrix = () => {
    return opportunities.map(opp => {
      const quadrant = getQuadrant(opp);
      const x = opp.avg_days_inactive > thresholds.potential ? 25 : 75; // Potential axis (inverted - lower days = higher potential)
      const y = opp.avg_customer_value > thresholds.value ? 75 : 25; // Value axis
      
      return {
        ...opp,
        x,
        y,
        quadrant,
        size: Math.min(Math.max(opp.customer_count / 10, 15), 60) // Bubble size based on customer count
      };
    });
  };

  const matrixData = createMatrix();

  const handleThresholdChange = (type, value) => {
    const newThresholds = { ...thresholds, [type]: value };
    setThresholds(newThresholds);
    if (onThresholdChange) {
      onThresholdChange(type, value);
    }
  };

  // Generate context points for chatbot
  const generateContextPoints = (opportunity) => {
    const quadrant = getQuadrant(opportunity);
    const contextPoints = [
      `🎯 Opportunity: ${opportunity.segment_name || 'Customer Segment'}`,
      `💰 Average Customer Value: $${opportunity.avg_customer_value?.toLocaleString() || 'N/A'}`,
      `⏰ Days Inactive: ${opportunity.avg_days_inactive || 'N/A'} days average`,
      `👥 Customer Count: ${opportunity.customer_count?.toLocaleString() || 'N/A'} customers`,
      `📊 Quadrant: ${quadrant.name} (Priority ${quadrant.priority})`
    ];

    // Add quadrant-specific insight
    switch (quadrant.name) {
      case 'Priority Re-engage':
        contextPoints.push(`💡 Insight: High-value, recently active customers - immediate re-engagement campaigns`);
        break;
      case 'Nurture':
        contextPoints.push(`💡 Insight: High-value but inactive - nurture with premium offers and personal touch`);
        break;
      case 'Bulk Activation':
        contextPoints.push(`💡 Insight: Lower value but active - bulk email campaigns and automated sequences`);
        break;
      case 'Monitor':
        contextPoints.push(`💡 Insight: Lower priority - monitor for changes and include in general campaigns`);
        break;
    }

    return contextPoints;
  };

  const showContextMenu = (e, opportunity) => {
    console.log('showContextMenu called for opportunity:', opportunity);
    
    let x = 100;
    let y = 100;
    
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 320;
      const menuHeight = 330;
      
      x = rect.left + (rect.width / 2) - (menuWidth / 2);
      y = rect.top - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = rect.bottom + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    } else if (e && e.clientX) {
      const menuWidth = 320;
      const menuHeight = 330;
      
      x = e.clientX - (menuWidth / 2);
      y = e.clientY - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    }
    
    const contextPoints = generateContextPoints(opportunity);
    
    setContextMenu({
      visible: true,
      opportunity: opportunity,
      contextPoints: contextPoints,
      position: { x, y }
    });
    
    console.log('Context points for chatbot:', contextPoints);
  };

  const handleOpportunityClick = (e, opportunity) => {
    // Check if Shift key was pressed
    const isShiftClick = e && e.shiftKey;
    
    if (isShiftClick) {
      // Directly send context to chat (no popup)
      try {
        const contextPoints = generateContextPoints(opportunity);
        if (window.attachContextTags) {
          contextPoints.forEach(point => window.attachContextTags(point));
          if (window.openChatPanel) window.openChatPanel();
        } else if (window.sendContextToChat) {
          window.sendContextToChat(contextPoints);
        }
      } catch (err) {
        console.error('Error sending context to chat:', err);
      }
      return;
    }

    // Regular click - select opportunity
    console.log('Regular click detected - selecting opportunity:', opportunity);
    setSelectedOpportunity(opportunity);
    if (onOpportunitySelect) {
      onOpportunitySelect(opportunity);
    }
  };

  const renderMatrix = () => {
    return (
      <div style={{
        width: '480px',
        height: '320px',
        position: 'relative',
        border: '1px solid #3a4459',
        borderRadius: '8px',
        backgroundColor: '#1a1f2e',
        margin: '0 auto 24px'
      }}>
        {/* Quadrant labels */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          fontSize: '12px',
          color: '#5891cb',
          fontWeight: '500'
        }}>
          Nurture
        </div>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '12px',
          color: '#00e0ff',
          fontWeight: '500'
        }}>
          Priority Re-engage
        </div>
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          fontSize: '12px',
          color: '#666',
          fontWeight: '500'
        }}>
          Monitor
        </div>
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          fontSize: '12px',
          color: '#ffa726',
          fontWeight: '500'
        }}>
          Bulk Activation
        </div>

        {/* Quadrant dividers */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          height: '1px',
          backgroundColor: '#f7f9fb',
          opacity: 0.3,
          borderStyle: 'dashed'
        }} />
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '0',
          bottom: '0',
          width: '1px',
          backgroundColor: '#f7f9fb',
          opacity: 0.3,
          borderStyle: 'dashed'
        }} />

        {/* Axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          color: '#f7f9fb',
          fontWeight: '500'
        }}>
          Engagement Potential (Days Inactive) →
        </div>
        <div style={{
          position: 'absolute',
          left: '-80px',
          top: '50%',
          transform: 'translateY(-50%) rotate(-90deg)',
          fontSize: '12px',
          color: '#f7f9fb',
          fontWeight: '500'
        }}>
          Customer Value →
        </div>

        {/* Data points (bubbles) */}
        {matrixData.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${item.x}%`,
              top: `${100 - item.y}%`,
              width: `${item.size}px`,
              height: `${item.size}px`,
              backgroundColor: item.quadrant.color,
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              opacity: selectedOpportunity === item ? 1 : 0.8,
              border: selectedOpportunity === item ? '3px solid #f7f9fb' : 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#f7f9fb',
              fontWeight: '600'
            }}
            onClick={(e) => handleOpportunityClick(e, item)}
            title={`${item.opportunity_type}\nCustomers: ${item.customer_count}\nAvg Value: $${Math.round(item.avg_customer_value)}\nDays Inactive: ${Math.round(item.avg_days_inactive)}`}
          >
            {item.customer_count}
          </div>
        ))}
      </div>
    );
  };

  const renderOpportunityCards = () => {
    // Sort opportunities by priority and customer count
    const sortedOpportunities = [...opportunities].sort((a, b) => {
      const aQuadrant = getQuadrant(a);
      const bQuadrant = getQuadrant(b);
      if (aQuadrant.priority !== bQuadrant.priority) {
        return aQuadrant.priority - bQuadrant.priority;
      }
      return b.customer_count - a.customer_count;
    });

    return sortedOpportunities.slice(0, 3).map((opp, index) => {
      const quadrant = getQuadrant(opp);
      const isSelected = selectedOpportunity === opp;
      
      return (
        <div
          key={index}
          style={{
            width: '320px',
            minHeight: '160px',
            background: `linear-gradient(135deg, #232a36 0%, #2c3341 100%)`,
            borderLeft: `4px solid ${quadrant.color}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            cursor: 'pointer',
            border: isSelected ? `1px solid ${quadrant.color}` : '1px solid #3a4459',
            transition: 'all 0.3s ease',
            transform: isSelected ? 'scale(1.02)' : 'scale(1)'
          }}
          onClick={(e) => handleOpportunityClick(e, opp)}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#f7f9fb',
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              {opp.opportunity_type}
            </h4>
            <span style={{
              fontSize: '12px',
              color: quadrant.color,
              fontWeight: '500',
              padding: '4px 8px',
              backgroundColor: `${quadrant.color}20`,
              borderRadius: '4px'
            }}>
              {quadrant.name}
            </span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: '14px',
            color: '#f7f9fb',
            opacity: 0.9,
            margin: '0 0 12px 0',
            lineHeight: 1.4,
            fontFamily: 'Inter, sans-serif'
          }}>
            {opp.customer_count.toLocaleString()} customers with{' '}
            <span style={{ color: quadrant.color, fontWeight: '500' }}>
              {opp.value_tier.toLowerCase()} value potential
            </span>
          </p>

          {/* Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#5891cb', marginBottom: '2px' }}>
                Avg Customer Value
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f7f9fb' }}>
                ${Math.round(opp.avg_customer_value).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#5891cb', marginBottom: '2px' }}>
                Days Inactive
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f7f9fb' }}>
                {Math.round(opp.avg_days_inactive)}
              </div>
            </div>
          </div>

          {/* Action button */}
          <button style={{
            width: '100%',
            padding: '8px 16px',
            backgroundColor: '#00e0ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            Create Campaign
          </button>
        </div>
      );
    });
  };

  return (
    <div className="glass-chart-container">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Re-engagement Opportunity Finder</h3>
          <p className="chart-subtitle">Identify high-value re-engagement targets</p>
        </div>
      </div>
      
      <div style={{ padding: 'var(--spacing-md)' }}>
        {/* Threshold Controls */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#f7f9fb',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Value Threshold: ${thresholds.value.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={thresholds.value}
              onChange={(e) => handleThresholdChange('value', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#3a4459',
                borderRadius: '3px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#f7f9fb',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Potential Threshold: {thresholds.potential} days
            </label>
            <input
              type="range"
              min="30"
              max="180"
              step="10"
              value={thresholds.potential}
              onChange={(e) => handleThresholdChange('potential', parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                backgroundColor: '#3a4459',
                borderRadius: '3px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Matrix Visualization */}
          <div>
            {renderMatrix()}
          </div>

          {/* Opportunity Cards */}
          <div>
            {renderOpportunityCards()}
          </div>
        </div>

        {/* Summary Statistics */}
        {selectedOpportunity && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#232a36',
            borderRadius: '8px',
            border: `1px solid ${getQuadrant(selectedOpportunity).color}`
          }}>
            <h4 style={{
              fontSize: '16px',
              color: '#f7f9fb',
              marginBottom: '12px',
              fontFamily: 'Inter, sans-serif'
            }}>
              Selected Opportunity: {selectedOpportunity.opportunity_type}
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Customer Count</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  {selectedOpportunity.customer_count.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Avg Customer Value</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  ${Math.round(selectedOpportunity.avg_customer_value).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Days Inactive</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  {Math.round(selectedOpportunity.avg_days_inactive)}
                </div>
              </div>
              <div>
                <div style={{ color: '#5891cb', marginBottom: '4px' }}>Total Opportunity</div>
                <div style={{ color: '#f7f9fb', fontWeight: '600' }}>
                  ${Math.round(selectedOpportunity.avg_customer_value * selectedOpportunity.customer_count).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu for Chatbot */}
        {contextMenu.visible && (
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
              animation: 'fadeIn 0.3s ease',
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
                    console.log('Sending context to chatbot:', contextMenu.contextPoints);
                    if (window.attachContextTags) {
                      window.attachContextTags(contextMenu.contextPoints);
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
                  🏷️ Add Context Tags
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpportunityFinder; 