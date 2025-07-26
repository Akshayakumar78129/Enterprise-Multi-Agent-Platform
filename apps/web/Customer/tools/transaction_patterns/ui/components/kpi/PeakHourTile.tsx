import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionStats } from '../../state/transactionSlice';
import { formatHour } from '../../utils/formatters';

interface PeakHourTileProps {
  className?: string;
}

export const PeakHourTile: React.FC<PeakHourTileProps> = ({ className }) => {
  const theme = useTheme();
  const stats = useSelector(selectTransactionStats);
  
  // Find peak hour with the most transactions
  const { peakHour, hourlyDistribution, currentHourIndicator } = useMemo(() => {
    if (!stats?.peakHours || stats.peakHours.length === 0) {
      return { 
        peakHour: null, 
        hourlyDistribution: [], 
        currentHourIndicator: null
      };
    }
    
    // Find the hour with the highest percentage
    const peak = stats.peakHours.reduce((max, current) => 
      (current.percentage > max.percentage) ? current : max
    , stats.peakHours[0]);
    
    // Create hourly distribution array (24 hours)
    const distribution = new Array(24).fill(0);
    stats.peakHours.forEach(hourData => {
      if (hourData.hour !== undefined) {
        distribution[hourData.hour] = hourData.percentage;
      }
    });
    
    // Current hour indicator position (for comparing "now" to peak)
    const currentHour = new Date().getHours();
    const currentPosition = (currentHour / 23) * 100; // 0-100% position
    
    return { 
      peakHour: peak.hour !== undefined ? formatHour(peak.hour) : null,
      hourlyDistribution: distribution,
      currentHourIndicator: currentPosition
    };
  }, [stats]);
  
  if (!stats || !peakHour) {
    return (
      <KpiTile
        title="Peak Transaction Hour"
        value="-"
        isLoading={true}
        className={className}
      />
    );
  }
  
  // Create a mini sparkline of hour distribution
  const HourSparkline = () => {
    // Get the maximum value for scaling
    const maxValue = Math.max(...hourlyDistribution);
    const width = 80;
    const height = 30;
    
    return (
      <div style={{ position: 'relative', width, height, marginTop: theme.spacing[1] }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Draw the distribution line */}
          <polyline
            points={hourlyDistribution.map((value, index) => {
              const x = (index / 23) * width;
              const y = height - (value / maxValue) * height;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={theme.colors.electricCyan}
            strokeWidth="1.5"
          />
          
          {/* Area under the line */}
          <path
            d={`
              M 0,${height}
              ${hourlyDistribution.map((value, index) => {
                const x = (index / 23) * width;
                const y = height - (value / maxValue) * height;
                return `L ${x},${y}`;
              }).join(' ')}
              L ${width},${height}
              Z
            `}
            fill={theme.colors.electricCyan}
            fillOpacity="0.2"
          />
          
          {/* Current hour indicator */}
          {currentHourIndicator !== null && (
            <line
              x1={currentHourIndicator * width / 100}
              y1="0"
              x2={currentHourIndicator * width / 100}
              y2={height}
              stroke={theme.colors.cloudWhite}
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          )}
        </svg>
        
        {/* Time labels */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '8px',
          color: theme.colors.cloudWhite,
          marginTop: '2px'
        }}>
          <span>12 AM</span>
          <span>12 PM</span>
          <span>11 PM</span>
        </div>
      </div>
    );
  };
  
  return (
    <KpiTile
      title="Peak Transaction Hour"
      value={peakHour}
      subValue={<HourSparkline />}
      className={className}
    />
  );
}; 