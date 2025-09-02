import React from 'react';

interface ChartWithAIInsightsProps {
  children: React.ReactNode;
  onDataPointClick?: (data: any, chartType: string) => void;
  chartType: string;
  data?: any;
}

/**
 * Wrapper component that adds AI Insights trigger instructions
 * The actual click handling should be done by the chart components themselves
 * on individual data points, not on the container
 */
export const ChartWithAIInsights: React.FC<ChartWithAIInsightsProps> = ({ 
  children,
  onDataPointClick,
  chartType,
  data 
}) => {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        fontSize: '11px',
        color: 'rgba(0, 224, 255, 0.5)',
        fontStyle: 'italic',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        💡 Click on data points for AI insights
      </div>
    </div>
  );
};

export default ChartWithAIInsights;