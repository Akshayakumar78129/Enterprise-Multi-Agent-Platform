import React from 'react';
import { Card } from './Card';

export interface KpiTileProps {
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  trendValue?: string | null;
  trendLabel?: string;
  trendDirection?: string;
  variant?: 'default' | 'interactive' | 'anomaly';
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  trendValue,
  trendLabel,
  trendDirection = 'neutral',
  variant = 'default',
  isLoading = false,
  onClick,
  className
}) => {
  // Some theme constants for styling
  const colors = {
    default: {
      background: '#232a36',
      border: '#3a4459',
      text: '#f7f9fb',
      highlight: '#00e0ff'
    },
    interactive: {
      background: '#232a36',
      border: '#00e0ff',
      text: '#f7f9fb',
      highlight: '#00e0ff'
    },
    anomaly: {
      background: '#232a36',
      border: '#e930ff',
      text: '#f7f9fb',
      highlight: '#e930ff'
    }
  };

  const getTrendColor = () => {
    if (trendDirection.includes('good')) return '#00C853';
    if (trendDirection.includes('bad')) return '#FF5252';
    return '#757575';
  };

  const getTrendIcon = () => {
    if (trendDirection.includes('up')) return '↑';
    if (trendDirection.includes('down')) return '↓';
    return '→';
  };

  // Card styles
  const selectedColors = colors[variant] || colors.default;
  const cardStyle = {
    padding: '16px',
    backgroundColor: selectedColors.background,
    borderColor: selectedColors.border,
    color: selectedColors.text,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'transform 0.2s ease',
    transform: 'scale(1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    height: '100%'
  };

  return (
    <div
      className={className}
      style={cardStyle}
      onClick={onClick}
      onMouseOver={onClick ? (e) => e.currentTarget.style.transform = 'scale(1.02)' : undefined}
      onMouseOut={onClick ? (e) => e.currentTarget.style.transform = 'scale(1)' : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', color: selectedColors.text, opacity: 0.85 }}>
          {label}
        </div>
        {icon && <div>{icon}</div>}
      </div>

      {isLoading ? (
        <div style={{ height: '24px', width: '80%', backgroundColor: '#3a4459', marginBottom: '8px' }} />
      ) : (
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: selectedColors.text
        }}>
          {value}
        </div>
      )}

      {subValue && (
        <div style={{ 
          fontSize: '14px', 
          color: selectedColors.text, 
          opacity: 0.7, 
          marginBottom: '8px' 
        }}>
          {subValue}
        </div>
      )}

      {trendValue && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          fontSize: '14px',
          color: getTrendColor()
        }}>
          <span style={{ marginRight: '4px' }}>{getTrendIcon()}</span>
          <span>{trendValue}</span>
          {trendLabel && (
            <span style={{ marginLeft: '4px', opacity: 0.7 }}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}; 