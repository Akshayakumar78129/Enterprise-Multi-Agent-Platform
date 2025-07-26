import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../theme';
import { Card } from '../Card';

/**
 * KpiTile Component
 * 
 * A specialized card component for displaying key performance indicators (KPIs)
 * with value, label, comparison, and trend information.
 */
export const KpiTile = ({
  value,
  label,
  icon = null,
  trend = null,
  trendValue = null,
  trendLabel = 'vs previous period',
  trendDirection = 'neutral',
  isLoading = false,
  onClick = null,
  className = '',
  style = {},
  variant = 'default',
  formatter = (val) => val,
  size = 'md',
  subtitle = null,
}) => {
  const theme = useTheme();
  
  // Size configurations
  const sizes = {
    sm: {
      valueSize: theme.typography.fontSize.xl,
      labelSize: theme.typography.fontSize.xs,
      trendSize: theme.typography.fontSize.xs,
    },
    md: {
      valueSize: theme.typography.fontSize['3xl'],
      labelSize: theme.typography.fontSize.sm,
      trendSize: theme.typography.fontSize.xs,
    },
    lg: {
      valueSize: theme.typography.fontSize['4xl'],
      labelSize: theme.typography.fontSize.base,
      trendSize: theme.typography.fontSize.sm,
    },
  };
  
  // Get trend color based on direction
  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up-good':
      case 'down-good':
        return theme.colors.success;
      case 'up-bad':
      case 'down-bad':
        return theme.colors.error;
      default:
        return theme.colors.cloudWhite;
    }
  };
  
  // Get trend arrow based on direction
  const getTrendArrow = () => {
    if (trendDirection.startsWith('up')) {
      return '↑';
    } else if (trendDirection.startsWith('down')) {
      return '↓';
    } else {
      return '→';
    }
  };
  
  // Custom body style for KPI tile
  const kpiBodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing[4],
  };
  
  return (
    <Card
      variant={variant}
      isLoading={isLoading}
      onClick={onClick}
      className={`enterprise-iq-kpi-tile ${className}`}
      style={style}
      bodyStyle={kpiBodyStyle}
      fullHeight
    >
      {/* Header with icon and label */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: theme.spacing[2],
        color: theme.colors.cloudWhite,
        opacity: 0.8, 
      }}>
        {icon && (
          <span style={{ marginRight: theme.spacing[2] }}>
            {icon}
          </span>
        )}
        <div style={{ 
          fontSize: sizes[size].labelSize,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {label}
        </div>
      </div>
      
      {/* Main value */}
      <div style={{ 
        fontSize: sizes[size].valueSize,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.cloudWhite,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      }}>
        {formatter(value)}
      </div>
      
      {/* Subtitle (if provided) */}
      {subtitle && (
        <div style={{ 
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.cloudWhite,
          opacity: 0.7,
          marginTop: theme.spacing[1],
        }}>
          {subtitle}
        </div>
      )}
      
      {/* Trend information */}
      {(trend || trendValue) && (
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          marginTop: theme.spacing[2],
          fontSize: sizes[size].trendSize,
          color: getTrendColor(),
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {trend && (
            <span style={{ marginRight: theme.spacing[1] }}>
              {getTrendArrow()} {trend}
            </span>
          )}
          {trendValue && (
            <span>
              {trendValue} {trendLabel}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

KpiTile.propTypes = {
  /** Main KPI value */
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  /** KPI label/title */
  label: PropTypes.string.isRequired,
  /** Optional icon to display next to the label */
  icon: PropTypes.node,
  /** Trend text (e.g., "+15.2%") */
  trend: PropTypes.string,
  /** Additional trend value */
  trendValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Label for the trend value */
  trendLabel: PropTypes.string,
  /** Direction of the trend, which determines its color */
  trendDirection: PropTypes.oneOf(['up-good', 'up-bad', 'down-good', 'down-bad', 'neutral']),
  /** Whether the tile is in a loading state */
  isLoading: PropTypes.bool,
  /** Click handler for the tile */
  onClick: PropTypes.func,
  /** Additional CSS class names */
  className: PropTypes.string,
  /** Custom styles for the tile */
  style: PropTypes.object,
  /** Visual variant of the tile */
  variant: PropTypes.oneOf(['default', 'interactive', 'anomaly']),
  /** Optional formatter function for the value */
  formatter: PropTypes.func,
  /** Size of the KPI tile */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Optional subtitle */
  subtitle: PropTypes.node,
};

export default KpiTile; 