// Glass Morphism Chart Configuration for Recharts
import React from 'react';

// Gradient Definitions for Charts
export const ChartGradients = () => (
  <defs>
    {/* Primary Gradient */}
    <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
    </linearGradient>
    
    {/* Success/Green Gradient */}
    <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.2} />
    </linearGradient>
    
    {/* Warning/Yellow Gradient */}
    <linearGradient id="gradientYellow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#eab308" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#eab308" stopOpacity={0.2} />
    </linearGradient>
    
    {/* Danger/Red Gradient */}
    <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
    </linearGradient>
    
    {/* Info/Orange Gradient */}
    <linearGradient id="gradientOrange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
    </linearGradient>
    
    {/* High Engagement Gradient */}
    <linearGradient id="gradientHigh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
    </linearGradient>
    
    {/* Medium Engagement Gradient */}
    <linearGradient id="gradientMedium" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#eab308" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#eab308" stopOpacity={0.3} />
    </linearGradient>
    
    {/* Low Engagement Gradient */}
    <linearGradient id="gradientLow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
    </linearGradient>
  </defs>
);

// Standard Enterprise IQ Tooltip Component
export const StandardTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#232a36',
        border: '1px solid #3a4459',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 16px 0 rgba(10, 18, 36, 0.2)',
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '400',
        fontSize: '14px',
        minWidth: '200px'
      }}>
        <div style={{ 
          marginBottom: '12px', 
          fontWeight: '600',
          color: '#f7f9fb',
          borderBottom: '1px solid #3a4459',
          paddingBottom: '8px'
        }}>
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '6px',
            color: '#f7f9fb'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              borderRadius: '50%',
              marginRight: '10px'
            }} />
            <span style={{ marginRight: '8px', flex: 1 }}>{entry.name}:</span>
            <span style={{ 
              fontWeight: '600',
              color: '#f7f9fb'
            }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Keep the old name for backward compatibility
export const GlassTooltip = StandardTooltip;

// Standard Chart Color Palette with Traffic Light Colors
export const chartColors = {
  primary: '#00e0ff',
  secondary: '#e930ff',
  success: '#22c55e',
  warning: '#f97316',
  danger: '#ef4444',
  info: '#00e0ff',
  high: '#22c55e',
  medium: '#f97316',
  low: '#ef4444',
  // Risk colors
  riskGreen: '#22c55e',
  riskYellow: '#eab308',
  riskOrange: '#f97316',
  riskRed: '#ef4444',
  // Additional colors
  lighterCyan: '#5fd4d6',
  teal: '#43cad0',
  mutedPurple: '#aa45dd',
  blueGray: '#3e7b97',
  gradient: {
    primary: 'url(#gradientPrimary)',
    green: 'url(#gradientGreen)',
    yellow: 'url(#gradientYellow)',
    red: 'url(#gradientRed)',
    orange: 'url(#gradientOrange)',
    high: 'url(#gradientHigh)',
    medium: 'url(#gradientMedium)',
    low: 'url(#gradientLow)'
  }
};

// Dark Theme Chart Configuration
export const defaultChartConfig = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  style: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'transparent'
  },
  grid: {
    stroke: 'rgba(255, 255, 255, 0.05)',
    strokeDasharray: '3 3'
  },
  axis: {
    stroke: 'rgba(255, 255, 255, 0.1)',
    tick: {
      fill: '#cbd5e1',
      fontSize: '11px',
      fontWeight: '600'
    },
    label: {
      fill: '#e2e8f0',
      fontSize: '12px',
      fontWeight: '600'
    }
  }
};

// Engagement Level Colors
export const getEngagementColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'high': return chartColors.success;
    case 'medium': return chartColors.warning;
    case 'low': return chartColors.danger;
    default: return chartColors.primary;
  }
};

// Engagement Level Gradient
export const getEngagementGradient = (level) => {
  switch (level?.toLowerCase()) {
    case 'high': return chartColors.gradient.high;
    case 'medium': return chartColors.gradient.medium;
    case 'low': return chartColors.gradient.low;
    default: return chartColors.gradient.primary;
  }
};

// Risk Level Colors
export const getRiskColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case 'low': return chartColors.success;
    case 'medium': return chartColors.warning;
    case 'high': return chartColors.danger;
    case 'critical': return '#dc2626';
    default: return chartColors.primary;
  }
};

// Plotly Dark Theme Configuration
export const plotlyDarkConfig = {
  displayModeBar: false,
  responsive: true,
  toImageButtonOptions: {
    format: 'png',
    filename: 'engagement-chart',
    height: 500,
    width: 700,
    scale: 1
  }
};

export const plotlyDarkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: {
    family: 'Inter, sans-serif',
    color: '#f7f9fb',
    size: 12
  },
  title: {
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb',
      size: 16,
      weight: 600
    }
  },
  xaxis: {
    gridcolor: 'rgba(0, 229, 255, 0.15)',
    linecolor: 'rgba(58, 68, 89, 0.5)',
    tickcolor: 'rgba(58, 68, 89, 0.5)',
    tickfont: {
      color: '#f7f9fb',
      size: 11,
      family: 'Inter, sans-serif'
    },
    title: {
      font: {
        color: '#f7f9fb',
        size: 12,
        family: 'Inter, sans-serif'
      }
    }
  },
  yaxis: {
    gridcolor: 'rgba(0, 229, 255, 0.15)',
    linecolor: 'rgba(58, 68, 89, 0.5)',
    tickcolor: 'rgba(58, 68, 89, 0.5)',
    tickfont: {
      color: '#f7f9fb',
      size: 11,
      family: 'Inter, sans-serif'
    },
    title: {
      font: {
        color: '#f7f9fb',
        size: 12,
        family: 'Inter, sans-serif'
      }
    }
  },
  legend: {
    font: {
      color: '#f7f9fb',
      size: 11,
      family: 'Inter, sans-serif'
    },
    bgcolor: '#232a36',
    bordercolor: '#3a4459',
    borderwidth: 1
  },
  hoverlabel: {
    bgcolor: '#232a36',
    bordercolor: '#3a4459',
    font: {
      color: '#f7f9fb',
      size: 12,
      family: 'Inter, sans-serif'
    }
  }
};

// Animated Number Counter Hook
export const useAnimatedCounter = (endValue, duration = 1000, startValue = 0) => {
  const [currentValue, setCurrentValue] = React.useState(startValue);
  
  React.useEffect(() => {
    if (endValue === startValue) return;
    
    const steps = 60;
    const increment = (endValue - startValue) / steps;
    let current = startValue;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= endValue) || (increment < 0 && current <= endValue)) {
        setCurrentValue(endValue);
        clearInterval(timer);
      } else {
        setCurrentValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [endValue, duration, startValue]);
  
  return currentValue;
};

export default {
  ChartGradients,
  GlassTooltip,
  chartColors,
  defaultChartConfig,
  getEngagementColor,
  getEngagementGradient,
  getRiskColor,
  useAnimatedCounter
};