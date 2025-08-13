import React, { useState } from 'react';

interface InfoIconProps {
  title: string;
  description: string;
  chartType: string;
  axisInfo?: {
    xAxis?: string;
    yAxis?: string;
    dataPoints?: string;
    interactions?: string[];
  };
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function InfoIcon({ 
  title, 
  description, 
  chartType, 
  axisInfo, 
  size = 20, 
  position = 'top-right' 
}: InfoIconProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      zIndex: 10
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 12, right: 12 };
      case 'top-left':
        return { ...baseStyles, top: 12, left: 12 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 12, right: 12 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 12, left: 12 };
      default:
        return { ...baseStyles, top: 12, right: 12 };
    }
  };

  const getTooltipPosition = () => {
    switch (position) {
      case 'top-right':
        return { top: '100%', right: 0, marginTop: 8 };
      case 'top-left':
        return { top: '100%', left: 0, marginTop: 8 };
      case 'bottom-right':
        return { bottom: '100%', right: 0, marginBottom: 8 };
      case 'bottom-left':
        return { bottom: '100%', left: 0, marginBottom: 8 };
      default:
        return { top: '100%', right: 0, marginTop: 8 };
    }
  };

  const getChartSpecificInfo = () => {
    const chartInfo: { [key: string]: any } = {
      'risk-pyramid': {
        purpose: 'Shows the distribution of customers across different churn risk levels',
        xAxis: 'Number of customers in each risk category',
        yAxis: 'Risk levels (Low, Medium, High, Very High)',
        dataPoints: 'Each bar represents the count of customers at that risk level',
        interactions: [
          'Click on a risk level to filter the dashboard',
          'Hover for detailed count and percentage',
          'Use for identifying which risk segments need attention'
        ]
      },
      'probability-histogram': {
        purpose: 'Displays the distribution of churn probabilities across all customers',
        xAxis: 'Churn probability (0% to 100%)',
        yAxis: 'Number of customers',
        dataPoints: 'Each bar shows how many customers fall within that probability range',
        interactions: [
          'Click on bars to analyze customers in that probability range',
          'Hover for exact customer counts',
          'Identify probability clusters and outliers'
        ]
      },
      'feature-importance': {
        purpose: 'Ranks the factors that most influence churn prediction',
        xAxis: 'Importance score (0 to 1)',
        yAxis: 'Features/factors that influence churn',
        dataPoints: 'Each bar shows how much that feature contributes to churn prediction',
        interactions: [
          'Click on features to see detailed analysis',
          'Hover for importance percentages',
          'Use to understand what drives customer churn'
        ]
      },
      'temporal-pattern': {
        purpose: 'Shows how churn risk changes over time',
        xAxis: 'Time periods (days, weeks, months)',
        yAxis: 'Number or percentage of customers at each risk level',
        dataPoints: 'Stacked areas show risk level distribution over time',
        interactions: [
          'Click on time periods to analyze specific dates',
          'Hover for detailed breakdowns',
          'Identify seasonal patterns and trends'
        ]
      }
    };

    return chartInfo[chartType] || {
      purpose: description,
      xAxis: axisInfo?.xAxis || 'Horizontal axis data',
      yAxis: axisInfo?.yAxis || 'Vertical axis data',
      dataPoints: axisInfo?.dataPoints || 'Data points on the chart',
      interactions: axisInfo?.interactions || ['Click and hover for more details']
    };
  };

  const chartInfo = getChartSpecificInfo();

  return (
    <div style={getPositionStyles()}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: isHovered 
            ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
            : 'rgba(59, 130, 246, 0.8)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: size * 0.6,
          fontWeight: 'bold',
          transition: 'all 0.3s ease',
          boxShadow: isHovered 
            ? '0 8px 25px rgba(59, 130, 246, 0.4)' 
            : '0 4px 15px rgba(59, 130, 246, 0.2)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setIsVisible(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setTimeout(() => setIsVisible(false), 300);
        }}
        onClick={() => setIsVisible(!isVisible)}
      >
        ℹ️
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            ...getTooltipPosition(),
            width: '320px',
            background: 'rgba(26, 31, 46, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#f8fafc',
            fontSize: '14px',
            lineHeight: '1.5',
            zIndex: 1000,
            animation: 'fadeInUp 0.3s ease-out'
          }}
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(58, 68, 89, 0.3)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              📊
            </div>
            <div>
              <div style={{
                fontWeight: '700',
                fontSize: '16px',
                color: '#f8fafc'
              }}>
                {title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                textTransform: 'capitalize'
              }}>
                {chartType.replace('-', ' ')} Chart
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontWeight: '600',
              color: '#3b82f6',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              📋 Purpose
            </div>
            <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
              {chartInfo.purpose}
            </div>
          </div>

          {/* Axes Information */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontWeight: '600',
              color: '#8b5cf6',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              📐 Chart Elements
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#f8fafc' }}>X-Axis:</strong> {chartInfo.xAxis}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong style={{ color: '#f8fafc' }}>Y-Axis:</strong> {chartInfo.yAxis}
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>Data Points:</strong> {chartInfo.dataPoints}
              </div>
            </div>
          </div>

          {/* Interactions */}
          <div>
            <div style={{
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '8px',
              fontSize: '13px'
            }}>
              🖱️ How to Use
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '16px',
              fontSize: '12px',
              color: '#cbd5e1'
            }}>
              {chartInfo.interactions.map((interaction: string, index: number) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {interaction}
                </li>
              ))}
            </ul>
          </div>

          {/* AI Tip */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#3b82f6',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              💡 AI Tip
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Click on any chart element and then open the AI chat to get specific insights about that data point!
            </div>
          </div>

          {/* Arrow pointer */}
          <div style={{
            position: 'absolute',
            ...(position.includes('top') ? { top: '-8px' } : { bottom: '-8px' }),
            ...(position.includes('right') ? { right: '16px' } : { left: '16px' }),
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            ...(position.includes('top') 
              ? { borderBottom: '8px solid rgba(26, 31, 46, 0.98)' }
              : { borderTop: '8px solid rgba(26, 31, 46, 0.98)' }
            )
          }} />
        </div>
      )}

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
