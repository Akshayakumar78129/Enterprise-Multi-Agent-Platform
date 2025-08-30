import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectAnomalyStats } from '../../state/anomalySlice';
import { formatPercentage } from '../../utils/formatters';

interface AnomalyRateTileProps {
  threshold?: number;
  className?: string;
}

export const AnomalyRateTile: React.FC<AnomalyRateTileProps> = ({ 
  threshold = 0.1, // Default threshold of 10%
  className
}) => {
  const theme = useTheme();
  const anomalyStats = useSelector(selectAnomalyStats);
  
  const { variant, progressColor } = useMemo(() => {
    if (!anomalyStats) return { variant: 'default', progressColor: theme.colors.electricCyan };
    
    // If anomaly rate exceeds threshold, use 'anomaly' variant
    return anomalyStats.anomalyRate > threshold 
      ? { variant: 'anomaly', progressColor: theme.colors.signalMagenta }
      : { variant: 'default', progressColor: theme.colors.electricCyan };
  }, [anomalyStats, threshold, theme]);
  
  if (!anomalyStats) {
    return (
      <KpiTile
        title="Anomaly Rate"
        value="-"
        isLoading={true}
        className={className}
      />
    );
  }
  
  const { anomalyRate } = anomalyStats;
  
  // Create a circular progress indicator
  const CircularProgress = () => {
    const percentage = anomalyRate * 100;
    const circumference = 2 * Math.PI * 20; // Radius 20
    const strokeDashoffset = circumference * (1 - percentage / 100);
    
    return (
      <div style={{ position: 'relative', width: 50, height: 50 }}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          {/* Background circle */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={theme.colors.graphiteDark}
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={progressColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 25 25)"
            strokeLinecap="round"
          />
          {/* Percentage text */}
          <text
            x="25"
            y="25"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={theme.colors.cloudWhite}
            fontSize="12"
            fontWeight="bold"
          >
            {Math.round(percentage)}%
          </text>
        </svg>
      </div>
    );
  };
  
  return (
    <KpiTile
      title="Anomaly Rate"
      value={formatPercentage(anomalyRate)}
      variant={variant}
      icon={<CircularProgress />}
      className={className}
    />
  );
}; 