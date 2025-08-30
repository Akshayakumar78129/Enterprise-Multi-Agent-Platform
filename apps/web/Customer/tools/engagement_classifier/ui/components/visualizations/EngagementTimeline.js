import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";
import ErrorBoundary from "../ErrorBoundary";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const EngagementTimeline = ({ 
  timeline = [], 
  isLoading = false, 
  onPeriodClick = null,
  selectedPeriod = null,
  aggregationLevel = 'week',
  onAddContext = null, // Callback for adding context tags
  existingContexts = [] // Array of existing context tags
}) => {
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked' or 'lines'
  const [aiAssistant, setAiAssistant] = useState({
    visible: false,
    period: '',
    high: 0,
    medium: 0,
    low: 0,
    explanation: ''
  });
  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    period: '',
    contextPoints: '', // Changed from array to string for single context line
    position: { x: 0, y: 0 }
  });
  
  const [assistantPosition, setAssistantPosition] = useState({ x: 0, y: 0 });

  if (!timeline || timeline.length === 0) {
    return (
      <Card title="Engagement Activity Timeline" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "360px",
            color: "#5891cb",
          }}
        >
          No timeline data available
        </div>
      </Card>
    );
  }

  // Process timeline data for visualization
  const processTimelineData = () => {
    // Group data by time period
    const periods = [...new Set(timeline.map(item => item.time_period))];
    const sortedPeriods = periods.sort((a, b) => {
      const order = {
        'This Week': 1,
        'This Month': 2, 
        'Last 3 Months': 3,
        'Last 6 Months': 4,
        'Last Year': 5,
        'Over 1 Year': 6
      };
      return order[a] - order[b];
    });

    const highData = [];
    const mediumData = [];
    const lowData = [];

    sortedPeriods.forEach(period => {
      const periodData = timeline.filter(item => item.time_period === period);
      
      const high = periodData.find(item => item.engagement_level === 'High')?.customer_count || 0;
      const medium = periodData.find(item => item.engagement_level === 'Medium')?.customer_count || 0;
      const low = periodData.find(item => item.engagement_level === 'Low')?.customer_count || 0;

      highData.push(high);
      mediumData.push(medium);
      lowData.push(low);
    });

    return {
      periods: sortedPeriods,
      high: highData,
      medium: mediumData,
      low: lowData
    };
  };

  const { periods, high, medium, low } = processTimelineData();

  // Generate context points for chatbot
  const generateContextPoints = (period, highCount, mediumCount, lowCount) => {
    const total = highCount + mediumCount + lowCount;
    const highPercent = Math.round((highCount / total) * 100);
    const mediumPercent = Math.round((mediumCount / total) * 100);
    const lowPercent = Math.round((lowCount / total) * 100);

    // Return single concise context line
    return `${period}: ${total.toLocaleString()} customers (${highPercent}% high, ${mediumPercent}% medium, ${lowPercent}% low engagement)`;
  };

  // Generate AI explanation for a data point
  const generateAIExplanation = (period, highCount, mediumCount, lowCount) => {
    const total = highCount + mediumCount + lowCount;
    const highPercent = Math.round((highCount / total) * 100);
    const mediumPercent = Math.round((mediumCount / total) * 100);
    const lowPercent = Math.round((lowCount / total) * 100);

    // Determine the dominant segment and generate simple insight
    const maxCount = Math.max(highCount, mediumCount, lowCount);
    let insight = '';

    if (maxCount === highCount) {
      insight = 'Excellent! ' + highPercent + '% of customers are highly engaged in ' + period + '. Keep up the great work with retention strategies.';
    } else if (maxCount === mediumCount) {
      insight = mediumPercent + '% show moderate engagement in ' + period + '. Perfect opportunity for targeted growth campaigns.';
    } else {
      insight = lowPercent + '% have low engagement in ' + period + '. Time for win-back campaigns to re-engage these customers.';
    }

    // Generate concise explanation (4-5 lines max)
    let explanation = period + ' (' + total.toLocaleString() + ' total customers)\n\n';
    explanation += 'High: ' + highCount.toLocaleString() + ' (' + highPercent + '%) • Medium: ' + mediumCount.toLocaleString() + ' (' + mediumPercent + '%) • Low: ' + lowCount.toLocaleString() + ' (' + lowPercent + '%)\n\n';
    explanation += insight;

    return explanation;
  };

  const renderStackedAreaChart = () => {
    const traces = [
      {
        x: periods,
        y: high,
        fill: 'tonexty',
        fillcolor: 'rgba(0, 224, 255, 0.7)',
        line: { color: '#00e0ff', width: 2 },
        mode: 'lines',
        name: 'High Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: medium,
        fill: 'tonexty',
        fillcolor: 'rgba(95, 212, 214, 0.7)',
        line: { color: '#5fd4d6', width: 2 },
        mode: 'lines',
        name: 'Medium Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: low,
        fill: 'tonexty',
        fillcolor: 'rgba(233, 48, 255, 0.7)',
        line: { color: '#e930ff', width: 2 },
        mode: 'lines',
        name: 'Low Engagement',
        type: 'scatter',
        stackgroup: 'one'
      }
    ];

    return traces;
  };

  const renderLineChart = () => {
    const traces = [
      {
        x: periods,
        y: high,
        line: { color: '#00e0ff', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#00e0ff' },
        name: 'High Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: medium,
        line: { color: '#5fd4d6', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#5fd4d6' },
        name: 'Medium Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: low,
        line: { color: '#e930ff', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#e930ff' },
        name: 'Low Engagement',
        type: 'scatter'
      }
    ];

    return traces;
  };

  const layout = {
    height: 360,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { 
      family: 'Inter, sans-serif', 
      color: '#f7f9fb',
      size: 12 
    },
    margin: { l: 60, r: 40, t: 40, b: 80 },
    xaxis: {
      title: 'Time Period',
      titlefont: { size: 14, color: '#f7f9fb' },
      tickfont: { size: 12, color: '#f7f9fb' },
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      showgrid: true,
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: 'Customer Count',
      titlefont: { size: 14, color: '#f7f9fb' },
      tickfont: { size: 12, color: '#f7f9fb' },
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      showgrid: true,
      zeroline: false
    },
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: '#3a4459',
      borderwidth: 1,
      font: { color: '#f7f9fb', size: 11 }
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#232a36',
      bordercolor: '#3a4459',
      font: { color: '#f7f9fb' }
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  const showContextMenu = (e, period) => {
    console.log('showContextMenu called!', { period });
    
    // Calculate position for the context menu
    let x = 100;
    let y = 100;
    
    // Handle different event types
    if (e && e.event && e.event.clientX) {
      // Plotly chart events
      const menuWidth = 320;
      const menuHeight = 320;
      
      x = e.event.clientX - (menuWidth / 2);
      y = e.event.clientY - menuHeight - 15;
      
      // Adjust if off screen
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.event.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    } else if (e && e.clientX) {
      const menuWidth = 320;
      const menuHeight = 320;
      
      x = e.clientX - (menuWidth / 2);
      y = e.clientY - menuHeight - 15;
      
      if (x < 10) x = 10;
      if (x + menuWidth > window.innerWidth - 10) x = window.innerWidth - menuWidth - 10;
      if (y < 10) y = e.clientY + 15;
      if (y + menuHeight > window.innerHeight - 10) y = window.innerHeight - menuHeight - 10;
    }
    
    const periodIndex = periods.indexOf(period);
    
    if (periodIndex !== -1 && high && medium && low) {
      const highCount = high[periodIndex] || 0;
      const mediumCount = medium[periodIndex] || 0;
      const lowCount = low[periodIndex] || 0;
      
      const contextPoint = generateContextPoints(period, highCount, mediumCount, lowCount);
      
      setContextMenu({
        visible: true,
        period: period,
        contextPoints: contextPoint, // Single context string
        position: { x, y }
      });
      
      console.log('Context point for chatbot:', contextPoint);
    }
  };

  const showAIAssistant = (e, type, data) => {
    console.log('showAIAssistant called!', { e, type, data });
    
    // Calculate position for the popup
    let x = 100;
    let y = 100;
    
    // Handle different event types
    if (e && e.currentTarget) {
      // Regular DOM events (clicking on buttons)
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left;
      y = rect.top - 10;
    } else if (e && e.clientX) {
      // Plotly events sometimes pass event with clientX/clientY
      x = e.clientX;
      y = e.clientY - 10;
    } else if (e && e.event && e.event.clientX) {
      // Plotly chart events
      x = e.event.clientX;
      y = e.event.clientY - 10;
    }
    
    console.log('Setting position:', { x, y });
    setAssistantPosition({ x, y });
    
    if (type === 'engagement-point' && data) {
      const period = data.period;
      const periodIndex = periods.indexOf(period);
      

      
      if (periodIndex !== -1 && high && medium && low) {
        const highCount = high[periodIndex] || 0;
        const mediumCount = medium[periodIndex] || 0;
        const lowCount = low[periodIndex] || 0;
        
        console.log('Counts:', { highCount, mediumCount, lowCount });
        
        const explanation = generateAIExplanation(period, highCount, mediumCount, lowCount);
        
        console.log('Generated explanation:', explanation);
        console.log('Setting AI assistant visible');
        
        setAiAssistant({
          visible: true,
          period: period,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          explanation: explanation
        });
      } else {
        console.log('Period not found or data missing');
      }
    }
    
    // Still call the original onPeriodClick if provided
    if (onPeriodClick && data && data.period) {
      onPeriodClick(data.period);
    }
  };

  return (
    <>
      <Card 
        title="Engagement Activity Timeline" 
        subtitle="Customer distribution across engagement levels over time"
        isLoading={isLoading}
      >
      <div className="pyramid-glass-bg">
        {/* View Mode Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'stacked' ? '#00e0ff' : '#232a36',
                color: viewMode === 'stacked' ? '#0a1224' : '#f7f9fb',
                border: `1px solid ${viewMode === 'stacked' ? '#00e0ff' : '#3a4459'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('stacked')}
            >
              Stacked View
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'lines' ? '#00e0ff' : '#232a36',
                color: viewMode === 'lines' ? '#0a1224' : '#f7f9fb',
                border: `1px solid ${viewMode === 'lines' ? '#00e0ff' : '#3a4459'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('lines')}
            >
              Line View
            </button>
          </div>

          {/* Quick Period Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            fontSize: '12px'
          }}>
            {['This Week', 'This Month', 'Last 3 Months'].map(period => (
              <button
                key={period}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedPeriod === period ? '#e930ff' : 'transparent',
                  color: selectedPeriod === period ? '#f7f9fb' : '#5891cb',
                  border: `1px solid ${selectedPeriod === period ? '#e930ff' : '#3a4459'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => {
                  showAIAssistant(e, 'engagement-point', { period });
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant Popup */}
        {console.log('🟢 AI Assistant render check:', { visible: aiAssistant.visible, position: assistantPosition })}
        {aiAssistant.visible && (
          <ErrorBoundary>
            <>
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              `}</style>
              <div style={{
                position: 'fixed',
                top: Math.max(10, Math.min(assistantPosition.y, window.innerHeight - 400)),
                left: Math.max(10, Math.min(assistantPosition.x, window.innerWidth - 320)),
                zIndex: 9999,
                maxWidth: '300px',
                backgroundColor: '#0a1224',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 224, 255, 0.3)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease'
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
                      
                      // Check if this context already exists
                      const contextExists = existingContexts.some(ctx => ctx === contextMenu.contextPoints);
                      
                      if (!contextExists && onAddContext) {
                        onAddContext(contextMenu.contextPoints);
                        
                        // Auto-open chat when context is added
                        if (window.openChatPanel) {
                          window.openChatPanel();
                        }
                      } else if (contextExists) {
                        console.log('Context already exists, skipping...');
                      }
                      
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    disabled={existingContexts.some(ctx => ctx === contextMenu.contextPoints)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: existingContexts.some(ctx => ctx === contextMenu.contextPoints) 
                        ? '#5891cb' : '#e930ff',
                      color: '#f7f9fb',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: existingContexts.some(ctx => ctx === contextMenu.contextPoints) 
                        ? 'default' : 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      opacity: existingContexts.some(ctx => ctx === contextMenu.contextPoints) 
                        ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!existingContexts.some(ctx => ctx === contextMenu.contextPoints)) {
                        e.currentTarget.style.backgroundColor = '#d020e6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!existingContexts.some(ctx => ctx === contextMenu.contextPoints)) {
                        e.currentTarget.style.backgroundColor = '#e930ff';
                      }
                    }}
                  >
                    {existingContexts.some(ctx => ctx === contextMenu.contextPoints) 
                      ? '✓ Already Added' 
                      : '🏷️ Add to Context'}
                  </button>
                </div>
              </div>
            </>
          </ErrorBoundary>
        )}

        {/* Chart */}
        <div style={{ height: '360px', position: 'relative' }}>
          {/* Click instruction */}
          {!aiAssistant.visible && !contextMenu.visible && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '11px',
              color: '#5891cb',
              opacity: 0.8,
              zIndex: 10,
              backgroundColor: 'rgba(10, 18, 36, 0.8)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(58, 68, 89, 0.3)',
              maxWidth: '200px',
              lineHeight: '1.4'
            }}>
              💡 Click for AI insights<br/>
              🎯 Shift+Click for chat context
            </div>
          )}
          <div 
            id="timeline-chart-container"
            style={{ position: 'relative', width: '100%', height: '350px' }}
          >
            <Plot
              data={viewMode === 'stacked' ? renderStackedAreaChart() : renderLineChart()}
              layout={layout}
              config={config}
              style={{ width: '100%', height: '100%' }}
              onInitialized={(figure, graphDiv) => {
                graphDiv.on('plotly_click', (data) => {
                  if (data.points && data.points.length > 0) {
                    const point = data.points[0];
                    
                    // Check if Shift key was pressed
                    const isShiftClick = data.event && data.event.shiftKey;
                    
                    if (isShiftClick) {
                      // Directly send context to chat (no popup)
                      try {
                        const period = point.x;
                        const periodIndex = periods.indexOf(period);
                        if (periodIndex !== -1 && high && medium && low) {
                          const highCount = high[periodIndex] || 0;
                          const mediumCount = medium[periodIndex] || 0;
                          const lowCount = low[periodIndex] || 0;
                          const contextPoint = generateContextPoints(period, highCount, mediumCount, lowCount);
                          if (onAddContext) {
                            // If parent manages context tags, add then open chat
                            onAddContext(contextPoint);
                            if (window.openChatPanel) window.openChatPanel();
                          } else if (window.attachContextTags) {
                            window.attachContextTags(contextPoint);
                            if (window.openChatPanel) window.openChatPanel();
                          } else if (window.sendContextToChat) {
                            window.sendContextToChat([contextPoint]);
                          }
                        }
                      } catch (err) {
                        console.error('Error sending context to chat:', err);
                      }
                    } else {
                      // Show regular AI assistant
                      console.log('Regular click detected - showing AI assistant for:', point.x);
                      showAIAssistant(data, 'engagement-point', { 
                        period: point.x
                      });
                    }
                  }
                });
              }}
            />
          </div>
        </div>

        {/* Summary Statistics */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '16px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#00e0ff',
              marginBottom: '4px'
            }}>
              {high.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              High Engagement Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#5fd4d6',
              marginBottom: '4px'
            }}>
              {medium.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              Medium Engagement Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#e930ff',
              marginBottom: '4px'
            }}>
              {low.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              Low Engagement Total
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .pyramid-glass-bg {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 24px;
          min-height: 480px;
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px) saturate(160%);
          background:
            radial-gradient(1200px 500px at 0% 0%, rgba(0, 224, 255, 0.24), rgba(0, 224, 255, 0) 60%),
            radial-gradient(1200px 500px at 100% 100%, rgba(233, 48, 255, 0.24), rgba(233, 48, 255, 0) 60%),
            linear-gradient(0deg, rgba(95, 212, 214, 0.06), rgba(95, 212, 214, 0.06)),
            linear-gradient(135deg, rgba(10, 15, 30, 0.45), rgba(5, 10, 20, 0.45));
          box-shadow: 0 10px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
        }
      `}</style>
      </Card>

      {/* AI Assistant Popup - MOVED OUTSIDE CARD TO AVOID CLIPPING */}
      {aiAssistant.visible && (
        <ErrorBoundary>
          <>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
            <div style={{
              position: 'fixed',
              top: Math.max(10, Math.min(assistantPosition.y, window.innerHeight - 400)),
              left: Math.max(10, Math.min(assistantPosition.x, window.innerWidth - 320)),
              zIndex: 9999,
              maxWidth: '300px',
              backgroundColor: '#0a1224',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 224, 255, 0.3)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              overflow: 'hidden',
              animation: 'fadeIn 0.3s ease'
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
      
      {/* Context Menu for Chatbot - MOVED OUTSIDE CARD TO AVOID CLIPPING */}
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
              animation: 'fadeIn 0.3s ease'
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
              
              {/* Add Context Button */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(233, 48, 255, 0.2)',
                backgroundColor: 'rgba(233, 48, 255, 0.05)'
              }}>
                <button
                  onClick={() => {
                    const contextExists = existingContexts.some(ctx => ctx === contextMenu.contextPoints);
                    
                    if (!contextExists && onAddContext) {
                      onAddContext(contextMenu.contextPoints);
                      
                      // Auto-open chat when context is added
                      if (window.openChatPanel) {
                        window.openChatPanel();
                      }
                    } else if (contextExists) {
                      console.log('Context already exists, skipping...');
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
    </>
  );
};

export default EngagementTimeline; 