import React, { forwardRef, useImperativeHandle } from 'react';
import { KPITileProps } from '../../types';

// Import shared UI components
// In a real implementation, these would be imported from the common UI library
// Example: import { Card, TrendIndicator } from '../../../../../../../../Project/ui-common/design-system/components';

const KPITile = forwardRef<any, KPITileProps>(({
  title,
  value,
  previousValue,
  format = 'number',
  trend,
  isCritical = false,
  showSpark = false,
  width = 120,
  height = 120,
  onClick
}, ref) => {
  // Ref-based imperative controls
  useImperativeHandle(ref, () => ({
    highlight: () => {
      // Implementation would animate a highlight effect
      console.log(`Highlighting ${title} KPI`);
    },
    pulse: () => {
      // Implementation would add a pulse animation
      console.log(`Pulsing ${title} KPI`);
    },
    reset: () => {
      // Reset any animations or highlights
      console.log(`Resetting ${title} KPI`);
    }
  }));

  // Format the value based on type
  const formattedValue = formatValue(value, format);
  
  // Calculate trend percentage if previousValue is provided
  const trendPercentage = calculateTrend(value, previousValue);
  
  // Default to provided trend or calculated value
  const displayTrend = trend ?? trendPercentage;
  
  // Determine color scheme based on trend and critical status
  const baseColor = isCritical ? '#e930ff' : '#00e0ff';
  const trendColor = displayTrend && displayTrend > 0 ? '#00e0ff' : '#e930ff';

  return (
    <div 
      className="kpi-tile"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#232a36',
        borderRadius: '20px',
        color: '#f7f9fb',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <h3 
        className="kpi-title"
        style={{ 
          margin: 0, 
          fontSize: '14px', 
          fontWeight: 500,
          opacity: 0.8,
          marginBottom: '4px'
        }}
      >
        {title}
      </h3>
      
      <div 
        className="kpi-value"
        style={{ 
          fontSize: '32px', 
          fontWeight: 600,
          lineHeight: 1.1,
          color: '#f7f9fb'
        }}
      >
        {formattedValue}
      </div>
      
      {displayTrend !== undefined && (
        <div 
          className="kpi-trend"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            marginTop: '8px',
            color: trendColor
          }}
        >
          {displayTrend > 0 ? '↑' : '↓'} 
          <span style={{ marginLeft: '2px' }}>
            {Math.abs(displayTrend).toFixed(1)}%
          </span>
        </div>
      )}
      
      {showSpark && (
        <div 
          className="kpi-sparkline"
          style={{ 
            position: 'absolute',
            bottom: '8px',
            left: '12px',
            right: '12px',
            height: '24px'
          }}
        >
          {/* Placeholder for sparkline */}
          <div 
            style={{
              height: '100%',
              background: `linear-gradient(90deg, 
                ${baseColor}22 0%, 
                ${baseColor}88 50%, 
                ${baseColor}44 100%
              )`,
              borderRadius: '4px'
            }}
          />
        </div>
      )}
    </div>
  );
});

KPITile.displayName = 'KPITile';

// Helper function to format values based on type
function formatValue(value: number | string, format: string): string {
  if (typeof value === 'string') {
    return value;
  }
  
  switch (format) {
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    case 'number':
    default:
      return value.toLocaleString();
  }
}

// Helper function to calculate trend percentage
function calculateTrend(current: number | string, previous?: number | string): number | undefined {
  if (previous === undefined || typeof current === 'string' || typeof previous === 'string') {
    return undefined;
  }
  
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return ((current - previous) / previous) * 100;
}

export default KPITile; 