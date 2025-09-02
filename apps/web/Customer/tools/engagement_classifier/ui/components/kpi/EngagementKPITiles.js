import React, { useState, useEffect } from "react";
import ErrorBoundary from "../ErrorBoundary";

// Standard KPI Tile Component
const StandardKpiTile = ({ 
  label, 
  value, 
  trend, 
  variant = 'default', 
  isLoading = false, 
  onClick,
  animationDelay = 0,
  icon,
  formatter = (val) => val,
  id,
  onShowAssistant
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const baseColor = (() => {
    if (id === 'total_customers') return '#22c55e';
    if (id === 'avg_engagement_score') return '#3b82f6';
    if (id === 'avg_days_since_activity') return '#f97316';
    if (id === 'reengagement_opportunities') return '#8b5cf6';
    if (variant === 'success') return '#22c55e';
    if (variant === 'warning') return '#f97316';
    if (variant === 'danger') return '#ef4444';
    if (variant === 'info') return '#8b5cf6';
    return '#3b82f6';
  })();

  useEffect(() => {
    if (isLoading) {
      setIsVisible(false);
      setDisplayValue(0);
      return;
    }
    // Show as soon as we have a value (including 0)
    setIsVisible(true);
    if (typeof value === 'number' && !Number.isNaN(value)) {
      const duration = 800;
      const steps = 50;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value ?? 0);
    }
  }, [value, isLoading]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      case 'info': return 'info';
      default: return '';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return '📈';
    if (trend.direction === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (!trend) return '#64748b';
    if (trend.direction === 'up') return '#22c55e';
    if (trend.direction === 'down') return '#ef4444';
    return '#eab308';
  };



  const handleTileClick = (e) => {
    // Prevent event bubbling
    e.stopPropagation();
    
    // Show AI assistant with explanation
    if (onShowAssistant) {
      onShowAssistant(e, id, label, value, trend, formatter);
    }
    
    // Still call the original onClick if provided
    if (onClick) {
      onClick();
    }
  };

  if (isLoading) {
    return (
      <div 
        className="standard-kpi-tile"
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animation: 'counterUp 0.6s ease both'
        }}
      >
        <div className="chart-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div
      onClick={handleTileClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: 200,
        height: 160,
        background: isHovered
          ? 'linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif',
        boxShadow: isHovered
          ? `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px ${baseColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${baseColor}20`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible
          ? (isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        border: isHovered ? `2px solid ${baseColor}80` : '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Particle background (dark neon style) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 30% 20%, ${baseColor}25 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${baseColor}1A 0%, transparent 50%)`,
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none'
      }} />

      {/* Glowing border effect */}
      <div style={{
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        background: `linear-gradient(45deg, ${baseColor}40, transparent, ${baseColor}40)`,
        borderRadius: 22,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: -1
      }} />

      {/* Icon */}
      {icon && (
        <div style={{
          fontSize: 28,
          marginBottom: 6,
          transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-180deg)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: `${animationDelay + 200}ms`
        }} aria-hidden>
          {icon}
        </div>
      )}

      {/* Value */}
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        marginBottom: 4,
        color: baseColor,
        textAlign: 'center',
        textShadow: `0 0 20px ${baseColor}40`,
        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${animationDelay + 400}ms`
      }}>
        {typeof displayValue === 'number' ? formatter(displayValue) : (displayValue ?? 0)}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#c7d2fe',
        textAlign: 'center',
        marginBottom: trend ? 8 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${animationDelay + 600}ms`
      }}>
        {label}
      </div>

      {/* Trend pill */}
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: getTrendColor(),
          background: `${getTrendColor()}15`,
          padding: '4px 8px',
          borderRadius: 12,
          border: `1px solid ${getTrendColor()}30`,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: `${animationDelay + 800}ms`
        }}>
          <span aria-hidden>{getTrendIcon()}</span>
          <span>{trend.value}% {trend.period}</span>
        </div>
      )}

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent 0%, ${baseColor} 50%, transparent 100%)`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'opacity 0.4s ease'
      }} />

      {/* Hover pulse overlay */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: 'linear-gradient(135deg, #3b82f620, transparent)',
          borderRadius: 22,
          pointerEvents: 'none',
          animation: 'pulse 2s infinite'
        }} />
      )}

      {/* Local keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};

const EngagementKPITiles = ({ kpis, isLoading = false, onTileClick }) => {
  const [aiAssistant, setAiAssistant] = useState({
    visible: false,
    tileId: '',
    explanation: ''
  });
  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    tileId: '',
    contextPoints: '', // Changed from array to string
    position: { x: 0, y: 0 }
  });
  
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 });
  
  // Generate context points for chatbot
  const generateContextPoints = (id, label, value, trend, formatter) => {
    // For KPI tiles, just return simple context
    return `KPI Tile: ${label} (${formatter(value)})`;
  };

  // Generate AI explanation for KPI
  const generateAIExplanation = (id, label, value, trend, formatter) => {
    let explanation = '';
    
    switch (id) {
      case 'total_customers':
        explanation = `Total Customers: ${formatter(value)}\n\n` +
          `This represents your entire customer base. ` +
          `${trend?.direction === 'up' ? 'Growing' : 'Declining'} by ${trend?.value}% ${trend?.period}.\n\n` +
          `Focus: Monitor overall growth trends and segment distribution.`;
        break;
      case 'avg_engagement_score':
        explanation = `Average Engagement Score: ${formatter(value)}\n\n` +
          `This score (0-10) measures overall customer engagement. ` +
          `${value > 7 ? 'Excellent!' : value > 5 ? 'Room for improvement.' : 'Needs attention!'}\n\n` +
          `Focus: ${value > 7 ? 'Maintain high engagement with loyalty programs.' : 
                   value > 5 ? 'Target medium-engaged customers for growth.' : 
                   'Implement re-engagement campaigns urgently.'}`;
        break;
      case 'avg_days_since_activity':
        explanation = `Average Days Since Activity: ${formatter(value)}\n\n` +
          `Measures recency of customer interactions. ` +
          `${value < 30 ? 'Excellent activity levels!' : value < 90 ? 'Moderate activity levels.' : 'Low activity - risk of churn!'}\n\n` +
          `Focus: ${value < 30 ? 'Maintain engagement with regular touchpoints.' : 
                   value < 90 ? 'Re-engage with targeted offers.' : 
                   'Implement win-back campaigns immediately.'}`;
        break;
      case 'reengagement_opportunities':
        explanation = `Re-engagement Opportunities: ${formatter(value)}\n\n` +
          `Customers identified as at-risk but with high potential value. ` +
          `${trend?.value}% ${trend?.period}.\n\n` +
          `Focus: Targeted win-back campaigns with personalized offers based on past purchase behavior.`;
        break;
      default:
        explanation = `${label}: ${formatter(value)}\n\n` +
          `${trend ? `Trend: ${trend.value}% ${trend.direction} ${trend.period}` : ''}\n\n` +
          `Click for more detailed analysis.`;
    }
    
    return explanation;
  };

  // Show context menu for chatbot
  const showContextMenu = (e, id, label, value, trend, formatter) => {
    console.log('showContextMenu called for KPI:', id);
    
    let x = 100;
    let y = 100;
    
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 320;
      const menuHeight = 380;
      
      // Center horizontally on the tile
      x = rect.left + (rect.width / 2) - (menuWidth / 2);
      y = rect.top - menuHeight - 15;
      
      // Adjust horizontal position if off screen
      if (x < 10) {
        x = 10;
      } else if (x + menuWidth > window.innerWidth - 10) {
        x = window.innerWidth - menuWidth - 10;
      }
      
      // Adjust vertical position if off screen
      if (y < 10) {
        y = rect.bottom + 15;
      }
      
      // Final safety check
      if (y + menuHeight > window.innerHeight - 10) {
        y = window.innerHeight - menuHeight - 10;
      }
    } else if (e && e.clientX) {
      const menuWidth = 320;
      const menuHeight = 380;
      
      x = e.clientX - (menuWidth / 2);
      y = e.clientY - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    }
    
    const contextPoint = generateContextPoints(id, label, value, trend, formatter);
    
    setContextMenu({
      visible: true,
      tileId: id,
      contextPoints: contextPoint, // Single string now
      position: { x, y }
    });
    
    console.log('Context point for chatbot:', contextPoint);
  };

  // Handle showing the AI assistant
  const handleShowAssistant = (e, id, label, value, trend, formatter) => {
    // Check if Shift key was pressed
    const isShiftClick = e && e.shiftKey;
    
    if (isShiftClick) {
      // Directly send context to chat (no popup)
      try {
        const contextPoint = generateContextPoints(id, label, value, trend, formatter);
        if (window.attachContextTags) {
          // KPI returns a single string; attach and open chat
          window.attachContextTags(contextPoint);
          if (window.openChatPanel) window.openChatPanel();
        } else if (window.sendContextToChat) {
          window.sendContextToChat([contextPoint]);
        }
      } catch (err) {
        console.error('Error sending KPI context to chat:', err);
      }
      return;
    }

    // Regular click - show AI assistant
    console.log('Regular click detected - showing AI assistant for KPI:', id);
    
    // Calculate position for the popup
    let x = 100;
    let y = 100;
    
    // Handle different event types
    if (e && e.currentTarget) {
      // Regular DOM events (clicking on KPI tiles)
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left;
      y = rect.top - 10; // Position slightly above the element
    } else if (e && e.clientX) {
      // Direct events with clientX/clientY
      x = e.clientX;
      y = e.clientY - 10;
    }
    
    setAssistantPosition({ x, y });
    
    setAiAssistant({
      visible: true,
      tileId: id,
      explanation: generateAIExplanation(id, label, value, trend, formatter)
    });
  };
  if (!kpis) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4].map((index) => (
          <StandardKpiTile
            key={index}
            label="Loading..."
            value={0}
            isLoading={true}
            animationDelay={index * 150}
          />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      id: 'total_customers',
      label: "Total Customers",
      value: kpis.total_customers || 0,
      formatter: (val) => val.toLocaleString(),
      variant: "default",
      icon: "👥",
      onClick: () => onTileClick && onTileClick('total_customers'),
      trend: {
        value: 5.2,
        direction: "up",
        period: "vs last month"
      }
    },
    {
      id: 'avg_engagement_score',
      label: "Avg Engagement Score",
      value: kpis.avg_engagement_score || 0,
      formatter: (val) => `${Math.round(val * 10) / 10}/10`,
      variant: kpis.avg_engagement_score > 7 ? "success" : kpis.avg_engagement_score > 5 ? "warning" : "danger",
      icon: "📊",
      onClick: () => onTileClick && onTileClick('avg_engagement_score'),
      trend: {
        value: 2.1,
        direction: kpis.avg_engagement_score > 6 ? "up" : "down",
        period: "vs last month"
      }
    },
    {
      id: 'avg_days_since_activity',
      label: "Days Since Activity",
      value: Math.round(kpis.avg_days_since_activity || 0),
      formatter: (val) => `${val} days`,
      variant: kpis.avg_days_since_activity < 30 ? "success" : kpis.avg_days_since_activity < 90 ? "warning" : "danger",
      icon: "⏱️",
      onClick: () => onTileClick && onTileClick('avg_days_since_activity'),
      trend: {
        value: 1.8,
        direction: kpis.avg_days_since_activity < 45 ? "up" : "down",
        period: "vs last month"
      }
    },
    {
      id: 'reengagement_opportunities',
      label: "Re-engagement Opportunities",
      value: kpis.reengagement_opportunities || 0,
      formatter: (val) => val.toLocaleString(),
      variant: kpis.reengagement_opportunities > 50 ? "warning" : "info",
      icon: "🎯",
      onClick: () => onTileClick && onTileClick('reengagement_opportunities'),
      trend: {
        value: 12.5,
        direction: "up",
        period: "new this week"
      }
    }
  ];

  return (
    <div className="kpi-grid" style={{ position: 'relative' }}>
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
              
              {/* Context Point */}
              <div style={{
                padding: '12px 16px',
                color: '#f7f9fb',
                fontSize: '13px',
                lineHeight: '1.6'
              }}>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(233, 48, 255, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(233, 48, 255, 0.1)',
                  fontFamily: 'monospace',
                  fontSize: '12px'
                }}>
                  {contextMenu.contextPoints}
                </div>
              </div>
              
              {/* Add Context Tags Button */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(233, 48, 255, 0.2)',
                backgroundColor: 'rgba(233, 48, 255, 0.05)'
              }}>
                <button
                  onClick={() => {
                    console.log('Adding context tag:', contextMenu.contextPoints);
                    
                    // Add context using the global function
                    if (window.attachContextTags) {
                      window.attachContextTags(contextMenu.contextPoints);
                      
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

      {tiles.map((tile, index) => (
        <StandardKpiTile 
          key={index} 
          {...tile} 
          isLoading={isLoading}
          animationDelay={index * 150}
          onShowAssistant={handleShowAssistant}
        />
      ))}
    </div>
  );
};

export default EngagementKPITiles; 