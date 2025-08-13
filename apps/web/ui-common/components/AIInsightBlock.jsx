import React, { useState } from 'react';

export default function AIInsightBlock({ 
  title, 
  breakdown, 
  insights, 
  actionPlan, 
  riskLevel,
  revenue,
  trend,
  timestamp,
  charts = [],
  visualizations = [] 
}) {
  const [expanded, setExpanded] = useState(true); // Start expanded for immediate visibility

  // Determine color scheme based on risk level
  const getRiskColor = () => {
    if (riskLevel === 'critical') return '#ef4444'; // red
    if (riskLevel === 'high') return '#f97316'; // orange
    if (riskLevel === 'medium') return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const getRiskEmoji = () => {
    if (riskLevel === 'critical') return '🔴';
    if (riskLevel === 'high') return '🟠';
    if (riskLevel === 'medium') return '🟡';
    return '🟢';
  };

  const getTrendIcon = () => {
    if (trend === 'increasing') return '📈 ↗️';
    if (trend === 'decreasing') return '📉 ↘️';
    return '➡️';
  };

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(15, 20, 25, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '16px',
        margin: '12px 0',
        border: `1px solid ${getRiskColor()}30`,
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px ${getRiskColor()}10`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Gradient accent line */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${getRiskColor()}, ${getRiskColor()}80)`,
        }}
      />

      {/* Header */}
      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: expanded ? '16px' : '0',
          color: '#f7f9fb'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getRiskEmoji()}</span>
          <div>
            <h3 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: '600',
              color: '#f7f9fb'
            }}>
              {title}
            </h3>
            {revenue && (
              <span style={{ 
                fontSize: '12px', 
                color: getRiskColor(),
                fontWeight: '500'
              }}>
                Revenue at Risk: {revenue} {getTrendIcon()}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {timestamp && (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          <span style={{ 
            color: '#94a3b8',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div style={{ color: '#e2e8f0' }}>
          {/* Breakdown Section */}
          {breakdown && breakdown.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Risk Distribution
              </h4>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {breakdown.map((item, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 0',
                      fontSize: '13px',
                      color: '#cbd5e1'
                    }}
                  >
                    <span style={{ color: getRiskColor() }}>▸</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights Section */}
          {insights && insights.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Key Insights
              </h4>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {insights.map((item, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '4px 0',
                      fontSize: '13px',
                      color: '#cbd5e1'
                    }}
                  >
                    <span style={{ color: '#60a5fa', marginTop: '2px' }}>💡</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan Section */}
          {actionPlan && actionPlan.length > 0 && (
            <div>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Recommended Actions
              </h4>
              <div style={{ 
                background: `linear-gradient(135deg, ${getRiskColor()}10, transparent)`,
                borderRadius: '8px', 
                padding: '12px',
                border: `1px solid ${getRiskColor()}20`
              }}>
                {actionPlan.map((item, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '6px 0',
                      fontSize: '13px',
                      color: '#f1f5f9',
                      fontWeight: '500'
                    }}
                  >
                    <span style={{ 
                      color: getRiskColor(),
                      fontWeight: 'bold',
                      minWidth: '20px'
                    }}>
                      {i + 1}.
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Section */}
          {(charts?.length > 0 || visualizations?.length > 0) && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '13px', 
                fontWeight: '600',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Visual Analysis
              </h4>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '12px'
              }}>
                {[...(charts || []), ...(visualizations || [])].map((chart, i) => (
                  <div 
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px',
                      padding: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {typeof chart === 'string' ? (
                      <div style={{
                        color: '#94a3b8',
                        fontSize: '12px',
                        textAlign: 'center',
                        padding: '20px'
                      }}>
                        {chart}
                      </div>
                    ) : chart?.component ? (
                      <div style={{ flex: 1 }}>
                        {chart.component}
                      </div>
                    ) : chart?.type ? (
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#cbd5e1'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                          {chart.type === 'bar' ? '📊' : 
                           chart.type === 'line' ? '📈' : 
                           chart.type === 'pie' ? '🥧' : 
                           chart.type === 'scatter' ? '⚡' : '📉'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                          {chart.title || 'Chart'}
                        </div>
                        {chart.value && (
                          <div style={{ 
                            fontSize: '20px', 
                            fontWeight: 'bold', 
                            color: getRiskColor(),
                            marginTop: '8px'
                          }}>
                            {chart.value}
                          </div>
                        )}
                        {chart.description && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#94a3b8',
                            marginTop: '4px',
                            textAlign: 'center'
                          }}>
                            {chart.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>{chart}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = getRiskColor();
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('View accounts clicked');
            }}>
              📊 View Accounts
            </button>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = getRiskColor();
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Export data clicked');
            }}>
              📥 Export Data
            </button>
            <button style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.borderColor = getRiskColor();
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Launch campaign clicked');
            }}>
              🚀 Launch Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}