import React, { useState } from 'react';

interface ChartWithAIInsightsProps {
  chartType: string;
  data: any;
  children: React.ReactNode;
}

export const ChartWithAIInsights: React.FC<ChartWithAIInsightsProps> = ({
  chartType,
  data,
  children
}) => {
  const [showInsightTooltip, setShowInsightTooltip] = useState(false);
  const [insightContent, setInsightContent] = useState('');

  // Generate quick insights based on chart type
  const generateQuickInsight = () => {
    switch (chartType) {
      case 'performance_overview':
        return 'Performance trends show opportunity for growth. Click AI Insights for detailed analysis.';
      case 'time_series':
        return 'Time series reveals seasonal patterns. AI can predict future trends.';
      case 'distribution':
        return 'Distribution analysis identifies top performers. Explore optimization opportunities.';
      default:
        return 'AI-powered insights available. Click to explore deeper analysis.';
    }
  };

  const handleMouseEnter = () => {
    setInsightContent(generateQuickInsight());
    setShowInsightTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowInsightTooltip(false);
  };

  return (
    <div 
      style={{ 
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main chart content */}
      {children}
      
      {/* AI Insights Tooltip */}
      {showInsightTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.95) 0%, rgba(233, 48, 255, 0.95) 100%)',
            color: '#0a1224',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            maxWidth: '300px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            animation: 'fadeIn 0.3s ease',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span>🤖</span>
            <strong>AI Insight</strong>
          </div>
          <div>{insightContent}</div>
        </div>
      )}
      
      {/* AI Enhancement Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0, 224, 255, 0.1)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '20px',
          padding: '6px 12px',
          fontSize: '11px',
          color: '#00e0ff',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00e0ff',
            animation: 'pulse 2s infinite'
          }}
        />
        <span>AI-Enhanced</span>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};