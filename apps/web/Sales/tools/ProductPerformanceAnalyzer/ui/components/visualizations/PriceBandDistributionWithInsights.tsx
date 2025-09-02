import React from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface PriceBandDistributionWithInsightsProps {
  loading?: boolean;
  bands?: string[];
  distribution?: { [key: string]: number | { count: number; total_sales: number; avg_price: number } };
  onBandClick?: (bandData: any, bandName: string) => void;
}

/**
 * Enhanced Price Band Distribution with individual band AI Insights
 */
export const PriceBandDistributionWithInsights: React.FC<PriceBandDistributionWithInsightsProps> = ({
  loading = false,
  bands = ['$0-$50', '$50-$100', '$100-$200', '$200-$500', '$500+'],
  distribution = {
    '$0-$50': 25,
    '$50-$100': 30,
    '$100-$200': 20,
    '$200-$500': 15,
    '$500+': 10,
  },
  onBandClick
}) => {
  const theme = useTheme();

  // Helper function to extract numeric value from distribution data
  const getNumericValue = (value: any): number => {
    if (typeof value === 'number') {
      return value;
    } else if (value && typeof value === 'object' && 'count' in value) {
      return value.count;
    }
    return 0;
  };

  // Filter out empty or low-value bands (less than 1% of total or 0 items)
  const total = Object.values(distribution).reduce((sum, val) => sum + getNumericValue(val), 0);
  const threshold = total * 0.01; // 1% threshold
  
  const activeBands = bands.filter(band => {
    const value = getNumericValue(distribution[band] || 0);
    return value > 0 && value >= threshold;
  });

  // Use active bands if available, otherwise fall back to bands with any data
  const displayBands = activeBands.length > 0 ? activeBands : 
    bands.filter(band => getNumericValue(distribution[band] || 0) > 0);

  // If still no bands with data, show top 3 bands as placeholders
  const finalBands = displayBands.length > 0 ? displayBands : bands.slice(0, 3);

  // Calculate max value properly
  const maxValue = Math.max(...finalBands.map(band => getNumericValue(distribution[band] || 0)), 1);

  const getBandColor = (index: number) => {
    const colors = [
      'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
      'linear-gradient(135deg, #00ff88 0%, #00d466 100%)',
      'linear-gradient(135deg, #e930ff 0%, #c724d9 100%)',
      'linear-gradient(135deg, #ff9800 0%, #ff6b00 100%)',
      'linear-gradient(135deg, #ff5252 0%, #ff3838 100%)',
    ];
    return colors[index % colors.length];
  };

  const handleBandClick = (band: string, value: any, index: number) => {
    if (onBandClick) {
      const numericValue = getNumericValue(value);
      const total = Object.values(distribution).reduce((sum, val) => sum + getNumericValue(val), 0);
      
      onBandClick({
        band,
        value: numericValue,
        rawData: value,
        percentage: ((numericValue / total) * 100).toFixed(1),
        index,
        totalProducts: total,
        distribution
      }, `price_band_${band}`);
    }
  };

  if (loading) {
    return (
      <Card
        elevation="md"
        style={{
          background: theme.colors.midnight,
          border: `1px solid ${theme.colors.graphite}`,
          borderRadius: '12px',
          padding: theme.spacing[6],
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: theme.colors.mutedForeground }}>Loading price band data...</div>
      </Card>
    );
  }

  return (
    <Card
      elevation="md"
      style={{
        background: theme.colors.midnight,
        border: `1px solid ${theme.colors.graphite}`,
        borderRadius: '12px',
        padding: theme.spacing[6],
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        {/* Price Bands */}
        {finalBands.map((band, index) => {
          const rawValue = distribution[band] || 0;
          const value = getNumericValue(rawValue);
          const percentage = (value / maxValue) * 100;
          const total = Object.values(distribution).reduce((sum, val) => sum + getNumericValue(val), 0);
          const totalPercentage = ((value / total) * 100).toFixed(1);

          return (
            <div 
              key={band} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: theme.spacing[3],
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
              onClick={() => handleBandClick(band, rawValue, index)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.05)';
                e.currentTarget.style.transform = 'translateX(8px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* AI Insights Icon */}
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(0, 224, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                border: '1px solid rgba(0, 224, 255, 0.2)',
                opacity: 0,
                transition: 'all 0.3s ease',
              }}
              className="ai-icon"
              title="Click for AI Insights"
              >
                🤖
              </div>

              {/* Band Label */}
              <div style={{ 
                minWidth: '120px',
                color: theme.colors.lightCyan,
                fontWeight: 600,
                fontSize: '14px',
              }}>
                {band}
              </div>

              {/* Progress Bar Container */}
              <div style={{ 
                flex: 1,
                height: '32px',
                background: 'rgba(0, 224, 255, 0.05)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(0, 224, 255, 0.1)',
              }}>
                {/* Progress Bar Fill */}
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: getBandColor(index),
                  borderRadius: '16px',
                  transition: 'width 0.5s ease',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0, 224, 255, 0.3)',
                }}>
                  {/* Value Label Inside Bar */}
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}>
                    {value} products
                  </div>
                </div>
              </div>

              {/* Percentage */}
              <div style={{
                minWidth: '60px',
                textAlign: 'right',
                color: theme.colors.mutedForeground,
                fontSize: '14px',
                fontWeight: 600,
              }}>
                {totalPercentage}%
              </div>
            </div>
          );
        })}

        {/* Summary Stats */}
        <div style={{
          marginTop: theme.spacing[4],
          padding: theme.spacing[4],
          background: 'rgba(0, 224, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 224, 255, 0.1)',
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[3],
          }}>
            <div>
              <div style={{ 
                color: theme.colors.mutedForeground, 
                fontSize: '12px',
                marginBottom: '4px',
              }}>
                Total Products
              </div>
              <div style={{ 
                color: theme.colors.lightCyan,
                fontSize: '20px',
                fontWeight: 700,
              }}>
                {Object.values(distribution).reduce((sum, val) => sum + getNumericValue(val), 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ 
                color: theme.colors.mutedForeground, 
                fontSize: '12px',
                marginBottom: '4px',
              }}>
                Dominant Band
              </div>
              <div style={{ 
                color: theme.colors.lightCyan,
                fontSize: '20px',
                fontWeight: 700,
              }}>
                {finalBands.find(band => getNumericValue(distribution[band]) === maxValue) || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ 
                color: theme.colors.mutedForeground, 
                fontSize: '12px',
                marginBottom: '4px',
              }}>
                Price Diversity
              </div>
              <div style={{ 
                color: theme.colors.lightCyan,
                fontSize: '20px',
                fontWeight: 700,
              }}>
                {finalBands.length} Active
              </div>
            </div>
          </div>
        </div>

        {/* Hint Text */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(0, 224, 255, 0.4)',
          fontStyle: 'italic',
        }}>
          💡 Click on any price band for detailed AI insights
          {bands.length > finalBands.length && (
            <span style={{ marginLeft: '8px' }}>
              ({bands.length - finalBands.length} empty bands hidden)
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        div:hover .ai-icon {
          opacity: 1 !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
      `}</style>
    </Card>
  );
};