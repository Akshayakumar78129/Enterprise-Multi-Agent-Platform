import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { RegularityChartProps } from '../../types';

const RegularityChart = forwardRef<any, RegularityChartProps>(({
  data,
  previousPeriodData,
  width = 380,
  height = 260,
  showComparison = false,
  onAxisClick
}, ref) => {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  
  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    highlightAxis: (timeframe: string) => {
      setSelectedAxis(timeframe);
    },
    clearHighlights: () => {
      setSelectedAxis(null);
    },
    showComparison: (show: boolean) => {
      // This would be handled through props in a real implementation
      console.log(`Setting comparison mode to ${show}`);
    },
    resetView: () => {
      setSelectedAxis(null);
      setHoveredAxis(null);
    }
  }));

  // Calculate chart dimensions
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const centerX = innerWidth / 2;
  const centerY = innerHeight / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  // Number of axes (spokes)
  const axisCount = data.length;
  const angleStep = (Math.PI * 2) / axisCount;
  
  // Calculate points for the radar shape
  const calculatePoints = (chartData: typeof data) => {
    return chartData.map((d, i) => {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const distance = (d.percentage / 100) * radius;
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
      return { x, y, timeframe: d.timeframe, percentage: d.percentage, angle };
    });
  };
  
  const dataPoints = calculatePoints(data);
  const previousDataPoints = previousPeriodData ? calculatePoints(previousPeriodData) : [];
  
  // Create the polygon points string for SVG
  const polygonPoints = dataPoints.map(point => `${point.x},${point.y}`).join(' ');
  const previousPolygonPoints = previousDataPoints.map(point => `${point.x},${point.y}`).join(' ');
  
  // Handle interactions
  const handleAxisMouseEnter = (timeframe: string) => {
    setHoveredAxis(timeframe);
  };
  
  const handleAxisMouseLeave = () => {
    setHoveredAxis(null);
  };
  
  const handleAxisClick = (timeframe: string) => {
    setSelectedAxis(prev => prev === timeframe ? null : timeframe);
    
    if (onAxisClick) {
      onAxisClick(timeframe);
    }
  };

  return (
    <div 
      className="regularity-chart"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#232a36',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}
    >
      <h3 
        style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#f7f9fb'
        }}
      >
        Purchase Regularity Chart
      </h3>
      
      <svg width={innerWidth} height={innerHeight}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Background Grid Circles */}
          {[0.25, 0.5, 0.75, 1].map((level, i) => (
            <circle
              key={`grid-circle-${i}`}
              cx={centerX}
              cy={centerY}
              r={radius * level}
              fill="none"
              stroke="#f7f9fb"
              strokeWidth={1}
              strokeOpacity={0.2}
            />
          ))}
          
          {/* Axes (Spokes) */}
          {dataPoints.map((point, i) => {
            const isHighlighted = 
              hoveredAxis === point.timeframe || 
              selectedAxis === point.timeframe;
              
            return (
              <line
                key={`axis-${i}`}
                x1={centerX}
                y1={centerY}
                x2={centerX + radius * Math.cos(point.angle)}
                y2={centerY + radius * Math.sin(point.angle)}
                stroke={isHighlighted ? '#00e0ff' : '#f7f9fb'}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.9 : 0.2}
                style={{ transition: 'all 0.2s ease' }}
                onClick={() => handleAxisClick(point.timeframe)}
                onMouseEnter={() => handleAxisMouseEnter(point.timeframe)}
                onMouseLeave={handleAxisMouseLeave}
                cursor="pointer"
              />
            );
          })}
          
          {/* Axis Labels */}
          {dataPoints.map((point, i) => {
            const labelX = centerX + (radius + 15) * Math.cos(point.angle);
            const labelY = centerY + (radius + 15) * Math.sin(point.angle);
            const isHighlighted = 
              hoveredAxis === point.timeframe || 
              selectedAxis === point.timeframe;
              
            return (
              <text
                key={`label-${i}`}
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isHighlighted ? '#00e0ff' : '#f7f9fb'}
                fontSize={13}
                fontWeight={isHighlighted ? 600 : 400}
                style={{ transition: 'all 0.2s ease' }}
                onClick={() => handleAxisClick(point.timeframe)}
                onMouseEnter={() => handleAxisMouseEnter(point.timeframe)}
                onMouseLeave={handleAxisMouseLeave}
                cursor="pointer"
              >
                {point.timeframe}
              </text>
            );
          })}
          
          {/* Previous Period Data (if available and comparison is shown) */}
          {showComparison && previousPeriodData && (
            <polygon
              points={previousPolygonPoints}
              fill="#e930ff"
              fillOpacity={0.4}
              stroke="#e930ff"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}
          
          {/* Main Data Shape */}
          <polygon
            points={polygonPoints}
            fill="#00e0ff"
            fillOpacity={0.6}
            stroke="#00e0ff"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          
          {/* Data Points */}
          {dataPoints.map((point, i) => {
            const isHighlighted = 
              hoveredAxis === point.timeframe || 
              selectedAxis === point.timeframe;
              
            return (
              <circle
                key={`point-${i}`}
                cx={point.x}
                cy={point.y}
                r={isHighlighted ? 6 : 4}
                fill={isHighlighted ? '#00e0ff' : '#232a36'}
                stroke="#00e0ff"
                strokeWidth={2}
                style={{ 
                  transition: 'all 0.2s ease',
                  filter: isHighlighted ? 'drop-shadow(0 0 4px #00e0ff)' : 'none'
                }}
                onClick={() => handleAxisClick(point.timeframe)}
                onMouseEnter={() => handleAxisMouseEnter(point.timeframe)}
                onMouseLeave={handleAxisMouseLeave}
                cursor="pointer"
              />
            );
          })}
          
          {/* Previous Period Points (if available and comparison is shown) */}
          {showComparison && previousPeriodData && previousDataPoints.map((point, i) => (
            <circle
              key={`prev-point-${i}`}
              cx={point.x}
              cy={point.y}
              r={3}
              fill="#232a36"
              stroke="#e930ff"
              strokeWidth={2}
            />
          ))}
        </g>
      </svg>
      
      {/* Tooltip */}
      {hoveredAxis && (
        <div 
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(35, 42, 54, 0.9)',
            color: '#f7f9fb',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '14px',
            pointerEvents: 'none',
            top: '40px',
            right: '16px',
            border: '1px solid #3a4459',
            zIndex: 10,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <strong>{hoveredAxis}</strong>
          <div>
            Current: {data.find(d => d.timeframe === hoveredAxis)?.percentage.toFixed(1)}%
          </div>
          {showComparison && previousPeriodData && (
            <div style={{ color: '#e930ff' }}>
              Previous: {previousPeriodData.find(d => d.timeframe === hoveredAxis)?.percentage.toFixed(1)}%
            </div>
          )}
        </div>
      )}
      
      {/* Legend (when comparison is active) */}
      {showComparison && previousPeriodData && (
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#f7f9fb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#00e0ff', opacity: 0.6, borderRadius: '2px' }} />
            <span>Current</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#e930ff', opacity: 0.4, borderRadius: '2px' }} />
            <span>Previous</span>
          </div>
        </div>
      )}
    </div>
  );
});

RegularityChart.displayName = 'RegularityChart';

export default RegularityChart; 