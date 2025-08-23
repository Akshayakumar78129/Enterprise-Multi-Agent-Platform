import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SegmentationChatbot from './chat/SegmentationChatbot';

const ChartSelectionManager = dynamic(
  () => import('../../../churn_prediction/ui/components/selection/ChartSelectionManager'),
  { ssr: false }
);

interface SegmentationDashboardWithSelectionProps {
  children: React.ReactNode;
  segmentData?: any;
  kpiData?: any;
}

const SegmentationDashboardWithSelection: React.FC<SegmentationDashboardWithSelectionProps> = ({
  children,
  segmentData,
  kpiData
}) => {
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightMessage, setAiInsightMessage] = useState('');
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });

  const handleSelectionChange = useCallback((points: any[]) => {
    setSelectedPoints(points);
    
    // Only show AI insights for single selection (not multi-select with shift)
    // Multi-select typically has multiple points or is triggered rapidly
    const isMultiSelect = points.length > 1 || 
                         (points.length === 1 && selectedPoints.length > 0 && 
                          Date.now() - (selectedPoints[0]?.timestamp || 0) < 500);
    
    if (points.length === 1 && !isMultiSelect) {
      // Single click - show AI insights
      generateAIInsight(points);
      setShowAIInsights(true);
      
      // Calculate position based on selected points
      if (points[0]?.coordinates) {
        setInsightPosition({
          x: points[0].coordinates.x,
          y: points[0].coordinates.y
        });
      }
    } else if (points.length > 1) {
      // Multi-selection - send to chatbot but don't show AI insights popup
      setShowAIInsights(false);
      
      // Notify chatbot about multi-selection
      const event = new CustomEvent('segmentationMultiSelect', {
        detail: { 
          selectedPoints: points,
          message: `${points.length} points selected for analysis`
        }
      });
      window.dispatchEvent(event);
    } else if (points.length === 0) {
      setShowAIInsights(false);
    }
  }, [selectedPoints]);

  const generateAIInsight = (points: any[]) => {
    // Generate contextual AI insights based on selected points
    if (points.length === 1) {
      const point = points[0];
      let insight = {
        title: point.label || 'Data Point',
        subtitle: `${point.value}${point.unit || ''}`,
        summary: '',
        details: [],
        questions: [],
        actions: []
      };
      
      if (point.chartType === 'kpi-tile') {
        insight.summary = `This KPI shows ${point.label} with a value of ${point.value}${point.unit || ''}.`;
        insight.details = [
          `📊 Metric: ${point.label}`,
          `📈 Current Value: ${point.value}${point.unit || ''}`,
          `🎯 Status: ${point.metadata?.trend || 'Stable'}`
        ];
        insight.questions = [
          'What drives this metric?',
          'Show historical trends',
          'Compare with previous period',
          'Identify improvement opportunities'
        ];
        insight.actions = [
          'Set performance target',
          'Create monitoring alert',
          'Export metric data',
          'Schedule review'
        ];
      } else if (point.chartType === 'segment-profile') {
        const metadata = point.metadata || {};
        insight.summary = `Segment ${point.label} contains ${point.value} customers with specific characteristics and behaviors.`;
        insight.details = [
          `👥 Customer Count: ${point.value}`,
          `💰 Avg Spend: $${metadata.avgSpend || 0}`,
          `📈 Frequency: ${metadata.frequency || 0}`,
          `⏱️ Recency: ${metadata.recency || 0} days`,
          `⭐ Loyalty: ${metadata.loyaltyScore || 0}%`,
          `📊 Engagement: ${metadata.engagementRate || 0}%`
        ];
        insight.questions = [
          'What drives this segment?',
          'How to increase loyalty?',
          'Show purchase patterns',
          'Compare with other segments'
        ];
        insight.actions = [
          'Create targeted campaign',
          'Export customer list',
          'Set up automation',
          'Schedule segment review'
        ];
      } else if (point.chartType === 'scatter') {
        insight.summary = `Data point at coordinates (${point.value}, ${point.metadata?.y || 0}) in the distribution.`;
        insight.details = [
          `📍 Position: (${point.value}, ${point.metadata?.y || 0})`,
          `🎯 Segment: ${point.label}`,
          `📊 Classification: ${point.metadata?.segment || 'Unknown'}`
        ];
        insight.questions = [
          'Why is this point here?',
          'Show similar points',
          'Predict movement',
          'View details'
        ];
        insight.actions = [
          'Add to watchlist',
          'Create alert',
          'Export data',
          'Analyze pattern'
        ];
      } else {
        insight.summary = `${point.label}: ${point.value}${point.unit || ''}`;
        insight.details = [
          `📊 Type: ${point.chartType}`,
          `📈 Value: ${point.value}${point.unit || ''}`,
          `🎯 Label: ${point.label}`
        ];
        insight.questions = [
          'Explain this metric',
          'Show trends',
          'Compare values',
          'Find correlations'
        ];
        insight.actions = [
          'Monitor changes',
          'Set threshold',
          'Create report',
          'Share insight'
        ];
      }
      
      setAiInsightMessage(insight);
    } else {
      // Multiple points selected
      const highest = points.reduce((max, p) => p.value > max.value ? p : max);
      const lowest = points.reduce((min, p) => p.value < min.value ? p : min);
      
      const insight = {
        title: 'Multi-Selection Analysis',
        subtitle: `${points.length} points selected`,
        summary: `Comparing ${points.length} data points across the dashboard.`,
        details: [
          `📊 Points Selected: ${points.length}`,
          `📈 Highest: ${highest.label} (${highest.value}${highest.unit || ''})`,
          `📉 Lowest: ${lowest.label} (${lowest.value}${lowest.unit || ''})`,
          `📏 Range: ${highest.value - lowest.value}${highest.unit || ''}`
        ],
        questions: [
          'What patterns exist?',
          'Show correlations',
          'Identify outliers',
          'Predict trends'
        ],
        actions: [
          'Create comparison report',
          'Export selected data',
          'Set up monitoring',
          'Build dashboard'
        ]
      };
      
      setAiInsightMessage(insight);
    }
  };

  const handleInsightGenerated = useCallback((insight: string) => {
    console.log('Insight generated:', insight);
  }, []);

  // Add escape key handler for AI insights popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAIInsights) {
        setShowAIInsights(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAIInsights]);

  return (
    <>
      <ChartSelectionManager 
        onSelectionChange={handleSelectionChange}
        onInsightGenerated={handleInsightGenerated}
      >
        {children}
        
        {/* AI Insights Panel */}
        {showAIInsights && (
          <div style={{
            position: 'fixed',
            left: Math.min(insightPosition.x, window.innerWidth - 420),
            top: Math.min(insightPosition.y, window.innerHeight - 400),
            width: '400px',
            maxHeight: '400px',
            background: 'linear-gradient(135deg, #1a1f2e 0%, #232a36 100%)',
            borderRadius: '16px',
            border: '2px solid #3b82f6',
            boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)',
            padding: '20px',
            overflowY: 'auto',
            zIndex: 1100
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#f7f9fb',
                fontSize: '18px',
                fontWeight: 700
              }}>
                AI Insights
              </h3>
              <button
                onClick={() => setShowAIInsights(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f7f9fb',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            <div>
              {typeof aiInsightMessage === 'object' ? (
                <>
                  {/* Summary */}
                  {aiInsightMessage.summary && (
                    <div style={{
                      color: '#f7f9fb',
                      fontSize: '14px',
                      marginBottom: '12px',
                      lineHeight: '1.6'
                    }}>
                      {aiInsightMessage.summary}
                    </div>
                  )}
                  
                  {/* Details */}
                  {aiInsightMessage.details && aiInsightMessage.details.length > 0 && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '8px'
                    }}>
                      {aiInsightMessage.details.map((detail: string, i: number) => (
                        <div key={i} style={{
                          color: '#cbd5e1',
                          fontSize: '12px',
                          marginBottom: '4px'
                        }}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Questions */}
                  {aiInsightMessage.questions && aiInsightMessage.questions.length > 0 && (
                    <div style={{
                      marginBottom: '12px',
                      padding: '8px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#3b82f6',
                        marginBottom: '6px'
                      }}>
                        💡 Key Questions
                      </div>
                      {aiInsightMessage.questions.map((question: string, i: number) => (
                        <div
                          key={i}
                          style={{
                            fontSize: '12px',
                            color: '#e2e8f0',
                            marginBottom: '3px',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            // Send question to chatbot
                            const chatbotElement = document.querySelector('[data-segmentation-chatbot]');
                            if (chatbotElement) {
                              // Try to open chatbot with the question
                              const event = new CustomEvent('segmentationChatbotMessage', {
                                detail: { 
                                  message: question,
                                  context: {
                                    source: 'ai-insights',
                                    data: aiInsightMessage,
                                    selectedPoints
                                  }
                                }
                              });
                              window.dispatchEvent(event);
                            }
                            
                            // Also try the original event
                            const event = new CustomEvent('openSegmentationChatbot', {
                              detail: { 
                                selectedPoints,
                                context: aiInsightMessage,
                                message: question
                              }
                            });
                            window.dispatchEvent(event);
                            setShowAIInsights(false);
                          }}
                        >
                          • {question}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  {aiInsightMessage.actions && aiInsightMessage.actions.length > 0 && (
                    <div style={{
                      padding: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#10b981',
                        marginBottom: '6px'
                      }}>
                        ⚡ Recommended Actions
                      </div>
                      {aiInsightMessage.actions.map((action: string, i: number) => (
                        <div
                          key={i}
                          style={{
                            fontSize: '12px',
                            color: '#e2e8f0',
                            marginBottom: '3px',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            console.log('Action clicked:', action);
                            // Handle action click
                          }}
                        >
                          • {action}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  color: '#f7f9fb',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {formatMessage(aiInsightMessage)}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  // Open chatbot with selected points context
                  const event = new CustomEvent('openSegmentationChatbot', {
                    detail: { 
                      selectedPoints, 
                      context: {
                        segmentData,
                        kpiData,
                        message: `I have selected ${selectedPoints.length} data point(s) for analysis. Please help me understand the patterns and insights.`
                      }
                    }
                  });
                  window.dispatchEvent(event);
                  setShowAIInsights(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                💬 Discuss
              </button>
              <button
                onClick={() => {
                  // Copy insights to clipboard
                  navigator.clipboard.writeText(aiInsightMessage.replace(/\*/g, ''));
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </ChartSelectionManager>
      
      {/* Chatbot Integration */}
      <SegmentationChatbot 
        contextData={segmentData}
        selectedPoints={selectedPoints}
      />
    </>
  );
};

// Helper function to format markdown-style text
const formatMessage = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index} style={{ fontWeight: 700, color: '#3b82f6' }}>{boldText}</strong>;
    }
    return part;
  });
};

export { SegmentationDashboardWithSelection };
export default SegmentationDashboardWithSelection;