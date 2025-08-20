import React, { useState, useCallback } from 'react';
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

  const handleSelectionChange = useCallback((points: any[]) => {
    setSelectedPoints(points);
    
    // Generate AI insights when points are selected
    if (points.length > 0) {
      generateAIInsight(points);
      setShowAIInsights(true);
    } else {
      setShowAIInsights(false);
    }
  }, []);

  const generateAIInsight = (points: any[]) => {
    // Generate contextual AI insights based on selected points
    let insight = `🎯 **AI Analysis of Selected Data**\n\n`;
    
    if (points.length === 1) {
      const point = points[0];
      insight += `**${point.label}**\n`;
      insight += `• Value: ${point.value}${point.unit || ''}\n`;
      
      if (point.chartType === 'segment-distribution') {
        insight += `• Segment Size: ${point.value} customers\n`;
        insight += `• Revenue Impact: $${(point.value * 1500).toLocaleString()}\n`;
        insight += `• Recommended Action: Focus on ${point.label} segment with personalized campaigns\n`;
      } else if (point.chartType === 'segment-comparison') {
        insight += `• Performance: ${point.value > 75 ? 'Excellent' : point.value > 50 ? 'Good' : 'Needs Improvement'}\n`;
        insight += `• Trend: ${point.metadata?.trend || 'Stable'}\n`;
      }
    } else {
      insight += `**Comparing ${points.length} Data Points:**\n\n`;
      
      // Find highest and lowest values
      const highest = points.reduce((max, p) => p.value > max.value ? p : max);
      const lowest = points.reduce((min, p) => p.value < min.value ? p : min);
      
      insight += `• Highest: ${highest.label} (${highest.value}${highest.unit || ''})\n`;
      insight += `• Lowest: ${lowest.label} (${lowest.value}${lowest.unit || ''})\n`;
      insight += `• Spread: ${highest.value - lowest.value}${highest.unit || ''}\n\n`;
      
      insight += `**Recommendations:**\n`;
      insight += `1. Prioritize ${highest.label} for immediate action\n`;
      insight += `2. Investigate why ${lowest.label} is underperforming\n`;
      insight += `3. Consider rebalancing resources across segments\n`;
    }
    
    setAiInsightMessage(insight);
  };

  const handleInsightGenerated = useCallback((insight: string) => {
    console.log('Insight generated:', insight);
  }, []);

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
            bottom: '80px',
            right: '20px',
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
            
            <div style={{
              color: '#f7f9fb',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {formatMessage(aiInsightMessage)}
            </div>
            
            {/* Action Buttons */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => {
                  // Open chatbot with context
                  const event = new CustomEvent('openSegmentationChatbot', {
                    detail: { selectedPoints, context: segmentData }
                  });
                  window.dispatchEvent(event);
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