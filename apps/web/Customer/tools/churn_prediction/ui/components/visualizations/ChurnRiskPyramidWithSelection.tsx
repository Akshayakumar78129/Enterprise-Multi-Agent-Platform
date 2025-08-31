import React, { useState, useEffect } from 'react';
import { ChurnCustomer } from '../../../types';

interface ChurnRiskPyramidProps {
  customers: ChurnCustomer[];
  data: any[];
  width?: number;
  height?: number;
  onContextSelect?: (context: any) => void;
}

interface SelectedPoint {
  level: string;
  count: number;
  percentage: number;
  customers: ChurnCustomer[];
}

const riskLevels = [
  { key: 'Very High', color: '#FF4444', emoji: '🔴' },
  { key: 'High', color: '#FF8800', emoji: '🟠' },
  { key: 'Medium', color: '#FFB800', emoji: '🟡' },
  { key: 'Low', color: '#00E676', emoji: '🟢' },
];

const levelHeight = 80;
const levelGap = 4;

const ChurnRiskPyramidWithSelection: React.FC<ChurnRiskPyramidProps> = (props) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [showInsight, setShowInsight] = useState(false);
  const [insightContent, setInsightContent] = useState<any>(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });
  
  const customers = props.customers || props.data || [];
  
  const counts = riskLevels.map(l => customers.filter(c => c.risk_level === l.key).length);
  const total = customers.length || 1;
  const percentages = counts.map(c => (c / total) * 100);

  const getAIInsight = (level: string, count: number, percentage: number) => {
    const insights: Record<string, any> = {
      'Very High': {
        summary: `Critical Alert: ${count} customers (${percentage.toFixed(1)}%) are at very high risk.`,
        details: [
          `📊 These customers show multiple warning signs`,
          `💰 Estimated revenue at risk: $${(count * 15000).toLocaleString()}`,
          `📈 67% retention improvement possible with intervention`
        ],
        questions: [
          'Which customers have the highest CLV?',
          'What were their last 3 interactions?',
          'Which offers worked for similar customers?',
          'Should we escalate to senior management?'
        ],
        actions: [
          'Contact top 10 accounts immediately',
          'Deploy emergency retention offer',
          'Schedule executive review'
        ]
      },
      'High': {
        summary: `Warning: ${count} customers (${percentage.toFixed(1)}%) show high churn risk.`,
        details: [
          `⚠️ Risk increasing over last 30 days`,
          `💵 Potential revenue loss: $${(count * 12000).toLocaleString()}`,
          `🎯 55% success rate with targeted campaigns`
        ],
        questions: [
          'What triggered the risk increase?',
          'Which segments are most affected?',
          'What retention strategies worked before?',
          'Do we need additional resources?'
        ],
        actions: [
          'Launch retention campaign',
          'Analyze usage patterns',
          'Prepare win-back offers'
        ]
      },
      'Medium': {
        summary: `Attention: ${count} customers (${percentage.toFixed(1)}%) have moderate risk.`,
        details: [
          `📝 Early warning signs detected`,
          `💡 Opportunity for proactive engagement`,
          `📊 45% can be moved to low risk`
        ],
        questions: [
          'What are the common risk factors?',
          'Which features are underutilized?',
          'Should we increase touchpoints?',
          'What about loyalty programs?'
        ],
        actions: [
          'Send satisfaction survey',
          'Offer feature training',
          'Monitor weekly'
        ]
      },
      'Low': {
        summary: `Stable: ${count} customers (${percentage.toFixed(1)}%) are low risk.`,
        details: [
          `✅ Healthy engagement metrics`,
          `🏆 Reference group for best practices`,
          `📈 NPS score above 70`
        ],
        questions: [
          'What keeps them satisfied?',
          'Can we upsell additional services?',
          'Will they provide testimonials?',
          'How to replicate this success?'
        ],
        actions: [
          'Request testimonials',
          'Explore upsell opportunities',
          'Document success factors'
        ]
      }
    };
    return insights[level] || { 
      summary: `${count} customers in ${level} risk category.`,
      details: [],
      questions: [],
      actions: []
    };
  };

  // Clean up any existing robot handlers on mount
  useEffect(() => {
    // Remove any existing robot handler to prevent conflicts
    if (typeof window !== 'undefined' && (window as any).robotAddPoint) {
      delete (window as any).robotAddPoint;
    }
  }, []);

  // Handle escape key and click outside for insights popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInsight(false);
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside the insight popup
      if (showInsight && !target.closest('[data-insight-popup]')) {
        setShowInsight(false);
      }
    };
    
    if (showInsight) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showInsight]);

  const handleLevelClick = (e: React.MouseEvent, level: string, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Close any existing popups first
    setShowInsight(false);
    setShowPopup(false);
    
    const isShiftClick = e.shiftKey;
    
    if (isShiftClick) {
      // Shift+Click: Send minimal data to chatbot (like KPI tiles)
      
      // Use the global addAIInsightToChat function if available
      if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
        (window as any).addAIInsightToChat({
          label: `${level} Risk`,
          value: percentages[index].toFixed(1),
          chartType: 'Risk Pyramid',
          count: counts[index],
          total: total,
          originalEvent: e.nativeEvent
        });
      }
      
      // Also send via props if provided - minimal data only
      if (props.onContextSelect) {
        props.onContextSelect({
          chartType: 'risk-pyramid',
          chartName: 'Risk Distribution Pyramid',
          selectedPoint: {
            level,
            count: counts[index],
            percentage: percentages[index]
            // Removed customers array - send only summary data
          },
          message: `Analyzing ${level} risk level: ${counts[index]} customers (${percentages[index].toFixed(1)}% of total)`
        });
      }
      
      // Show feedback popup
      const rect = e.currentTarget.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
      
      // Do NOT show AI insight popup
      return;
      
    } else {
      // Normal Click: Show AI insight ONLY
      const rect = e.currentTarget.getBoundingClientRect();
      const insightData = getAIInsight(level, counts[index], percentages[index]);
      setInsightContent({
        level,
        count: counts[index],
        percentage: percentages[index],
        ...insightData
      });
      setInsightPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
      setShowInsight(true);
      
      // Do NOT send to chatbot
      return;
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minWidth: 400, 
      minHeight: 450, 
      background: 'rgba(30, 39, 56, 0.9)', 
      backdropFilter: 'blur(20px)',
      borderRadius: 20, 
      padding: 32, 
      position: 'relative', 
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)', 
      display: 'flex', 
      flexDirection: 'column',
      border: '1px solid rgba(0, 224, 255, 0.2)',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(255, 68, 68, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 230, 118, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 24, 
        zIndex: 1 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 24,
            background: 'linear-gradient(135deg, #FF4444, #FFB800)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            📊
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#f7f9fb', 
            fontWeight: 800, 
            fontSize: 22,
            background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Risk Distribution Pyramid
          </h3>
        </div>
      </div>
      
      <div style={{
        marginBottom: 16,
        padding: '8px 12px',
        background: 'rgba(0, 224, 255, 0.1)',
        borderRadius: 8,
        border: '1px solid rgba(0, 224, 255, 0.3)',
        fontSize: 13,
        color: 'rgba(247, 249, 251, 0.8)',
        zIndex: 1
      }}>
        💡 <strong>Tip:</strong> Click for AI insights | Shift+Click to send context to chatbot
      </div>
      
      <svg viewBox={`0 0 ${props.width || 520} ${props.height || 360}`} style={{ flexGrow: 1, width: '100%', height: '100%', zIndex: 1 }}>
        <defs>
          {riskLevels.map((level, i) => (
            <linearGradient key={`gradient-${i}`} id={`gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={level.color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={level.color} stopOpacity="1" />
              <stop offset="100%" stopColor={level.color} stopOpacity="0.8" />
            </linearGradient>
          ))}
        </defs>
        
        {riskLevels.map((level, i) => {
          const y = i * (levelHeight + levelGap) + 20;
          const refWidth = props.width || 520;
          const baseWidth = refWidth * 0.85;
          const minWidth = refWidth * 0.25;
          
          // Size blocks based on actual customer count - bigger count = wider block
          // Calculate width based on the proportion of customers in this risk level
          const maxCount = Math.max(...counts); // Find the largest group
          const countRatio = counts[i] / maxCount; // Ratio of this group to largest
          // Ensure minimum width of 30% even for smallest group, max 100% for largest
          const widthRatio = 0.3 + (countRatio * 0.7);
          const w = baseWidth * widthRatio;
          const x = (refWidth - w) / 2;
          
          return (
            <g key={level.key}>
              <rect
                x={x - 2}
                y={y - 2}
                width={w + 4}
                height={levelHeight + 4}
                rx={16}
                fill={`${level.color}30`}
                style={{ filter: 'blur(4px)' }}
              />
              
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight}
                rx={14}
                fill={`url(#gradient-${i})`}
                style={{ 
                  filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))',
                  cursor: 'pointer',
                  opacity: 0.9,
                  transition: 'opacity 0.3s'
                }}
                onClick={(e) => handleLevelClick(e, level.key, i)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
              />
              
              <rect
                x={x}
                y={y}
                width={w}
                height={levelHeight / 3}
                rx={14}
                fill="rgba(255, 255, 255, 0.2)"
                style={{ pointerEvents: 'none' }}
              />
              
              <text
                x={x + 20}
                y={y + levelHeight / 2 + 8}
                fontSize={24}
                fill={level.color}
                style={{ pointerEvents: 'none' }}
              >
                {level.emoji}
              </text>
              
              <text
                x={refWidth / 2}
                y={y + levelHeight / 2 - 4}
                textAnchor="middle"
                fill="#f7f9fb"
                fontSize={18}
                fontWeight={800}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
              >
                {level.key}
              </text>
              
              <text
                x={refWidth / 2}
                y={y + levelHeight / 2 + 20}
                textAnchor="middle"
                fill="rgba(247, 249, 251, 0.9)"
                fontSize={15}
                fontWeight={600}
                style={{ pointerEvents: 'none' }}
              >
                {counts[i]} customers ({percentages[i].toFixed(1)}%)
              </text>
              
              <circle
                cx={x + w - 15}
                cy={y + levelHeight / 2}
                r={6}
                fill={level.color}
                style={{ filter: `drop-shadow(0 0 8px ${level.color})`, pointerEvents: 'none' }}
              />
            </g>
          );
        })}
        
        {riskLevels.slice(0, -1).map((_, i) => {
          const y1 = (i * (levelHeight + levelGap)) + levelHeight + 20;
          const y2 = ((i + 1) * (levelHeight + levelGap)) + 20;
          const refWidth = props.width || 520;
          
          return (
            <line
              key={`line-${i}`}
              x1={refWidth / 2}
              y1={y1}
              x2={refWidth / 2}
              y2={y2}
              stroke="rgba(0, 224, 255, 0.3)"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>
      
      <div style={{
        marginTop: 16,
        padding: 16,
        background: 'rgba(15, 20, 25, 0.8)',
        borderRadius: 12,
        border: '1px solid rgba(0, 224, 255, 0.2)',
        zIndex: 1
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: 14,
          color: 'rgba(247, 249, 251, 0.8)'
        }}>
          <span>Total Customers: <strong style={{ color: '#00e0ff' }}>{total}</strong></span>
          <span>High Risk: <strong style={{ color: '#FF4444' }}>{((counts[0] + counts[1]) / total * 100).toFixed(1)}%</strong></span>
        </div>
      </div>
      
      {showPopup && (
        <div style={{
          position: 'fixed',
          left: popupPosition.x,
          top: popupPosition.y,
          transform: 'translate(-50%, -100%)',
          background: 'linear-gradient(135deg, #1e2738, #2a3447)',
          border: '1px solid rgba(0, 224, 255, 0.5)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: '#f7f9fb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          Context sent to chatbot!
        </div>
      )}
      
      {showInsight && insightContent && (
        <div 
          data-insight-popup
          style={{
            position: 'fixed',
            left: insightPosition.x,
            top: insightPosition.y,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1e2738, #2a3447)',
            border: '2px solid rgba(124, 58, 237, 0.5)',
            borderRadius: 12,
            padding: 20,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
            zIndex: 1001,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: 12
          }}>
            <div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#f7f9fb',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {riskLevels.find(r => r.key === insightContent.level)?.emoji}
                {insightContent.level} Risk
              </div>
              <div style={{
                fontSize: 14,
                color: 'rgba(247, 249, 251, 0.7)'
              }}>
                {insightContent.count} customers ({insightContent.percentage.toFixed(1)}%)
              </div>
            </div>
            <button
              onClick={() => setShowInsight(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(247, 249, 251, 0.6)',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f7f9fb'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.6)'}
            >
              ×
            </button>
          </div>
          
          <div style={{
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 12
          }}>
            <div style={{
              fontSize: 13,
              color: 'rgba(247, 249, 251, 0.9)',
              lineHeight: 1.6,
              marginBottom: 12
            }}>
              {insightContent.summary}
            </div>
            
            {insightContent.details && insightContent.details.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {insightContent.details.map((detail: string, idx: number) => (
                  <div key={idx} style={{
                    fontSize: 12,
                    color: 'rgba(247, 249, 251, 0.8)',
                    marginBottom: 4
                  }}>
                    {detail}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {insightContent.questions && insightContent.questions.length > 0 && (
            <div style={{
              marginBottom: 12
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#00e0ff',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                🤔 Key Questions
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {insightContent.questions.map((q: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Send question to chat
                      if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                        (window as any).addAIInsightToChat({
                          label: `${insightContent.level} Risk - Question`,
                          value: q,
                          chartType: 'Risk Pyramid',
                          count: insightContent.count,
                          total: total
                        });
                      }
                      setShowInsight(false);
                    }}
                    style={{
                      background: 'rgba(0, 224, 255, 0.1)',
                      border: '1px solid rgba(0, 224, 255, 0.3)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                      color: 'rgba(247, 249, 251, 0.9)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.3)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {insightContent.actions && insightContent.actions.length > 0 && (
            <div style={{
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: 6,
              padding: 8,
              marginBottom: 12
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#00e676',
                marginBottom: 6,
                textTransform: 'uppercase'
              }}>
                ⚡ Recommended Actions
              </div>
              {insightContent.actions.map((action: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Send action to chat for execution
                    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                      (window as any).addAIInsightToChat({
                        label: `${insightContent.level} Risk - Action`,
                        value: `Execute: ${action}`,
                        chartType: 'Risk Pyramid',
                        count: insightContent.count,
                        total: total,
                        actionType: 'execute'
                      });
                    }
                    setShowInsight(false);
                  }}
                  style={{
                    fontSize: 11,
                    color: 'rgba(247, 249, 251, 0.8)',
                    marginBottom: 2,
                    paddingLeft: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#00e676';
                    e.currentTarget.style.paddingLeft = '16px';
                    e.currentTarget.style.background = 'rgba(0, 230, 118, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(247, 249, 251, 0.8)';
                    e.currentTarget.style.paddingLeft = '12px';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  • {action}
                </div>
              ))}
            </div>
          )}
          
          <div style={{
            fontSize: 12,
            color: 'rgba(247, 249, 251, 0.6)',
            textAlign: 'center'
          }}>
            Press <strong>Shift+Click</strong> to send to chatbot for deeper analysis
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -90%); }
          to { opacity: 1; transform: translate(-50%, -100%); }
        }
      `}</style>
    </div>
  );
};

export default ChurnRiskPyramidWithSelection;