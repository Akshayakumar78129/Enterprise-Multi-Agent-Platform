import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KpiTile } from '../../../../../../ui-common/design-system/components/KpiTile';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { selectTransactionStats } from '../../state/transactionSlice';
import { formatPercentage } from '../../utils/formatters';

interface PaymentMethodTileProps {
  className?: string;
}

export const PaymentMethodTile: React.FC<PaymentMethodTileProps> = ({ className }) => {
  const theme = useTheme();
  const stats = useSelector(selectTransactionStats);
  
  const { topMethod, topPercentage, paymentDistribution } = useMemo(() => {
    if (!stats?.paymentDistribution || stats.paymentDistribution.length === 0) {
      return { 
        topMethod: null, 
        topPercentage: 0,
        paymentDistribution: []
      };
    }
    
    // Sort by percentage (highest first)
    const sortedMethods = [...stats.paymentDistribution].sort((a, b) => 
      b.percentage - a.percentage
    );
    
    return {
      topMethod: sortedMethods[0].method,
      topPercentage: sortedMethods[0].percentage,
      paymentDistribution: sortedMethods
    };
  }, [stats]);
  
  if (!stats || !topMethod) {
    return (
      <KpiTile
        title="Top Payment Method"
        value="-"
        isLoading={true}
        className={className}
      />
    );
  }
  
  // Create a mini pie chart
  const MiniPieChart = () => {
    const size = 50;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 5;
    
    // Generate color shades based on the electricCyan theme color
    const generateColorShades = (baseColor: string, count: number) => {
      // For simplicity, we'll just use opacity variations
      return Array.from({ length: count }, (_, i) => {
        const opacity = 0.3 + (0.7 * (i / (count - 1)));
        return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
      });
    };
    
    const colors = generateColorShades(theme.colors.electricCyan, paymentDistribution.length);
    
    // Create pie slices
    let startAngle = 0;
    const slices = paymentDistribution.map((method, index) => {
      const angle = method.percentage * 2 * Math.PI;
      const endAngle = startAngle + angle;
      
      // Calculate SVG arc path
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      // Determine if the arc is large or small
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      // Create SVG path for the slice
      const path = `
        M ${centerX} ${centerY}
        L ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
      
      const slice = (
        <path
          key={index}
          d={path}
          fill={colors[index]}
          stroke={theme.colors.graphite}
          strokeWidth="1"
        />
      );
      
      startAngle = endAngle;
      return slice;
    });
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices}
        </svg>
      </div>
    );
  };
  
  // Optional: Payment method icon component (simplified for this implementation)
  const PaymentIcon = () => {
    const getIconForMethod = (method: string) => {
      const methodLower = method.toLowerCase();
      if (methodLower.includes('credit') || methodLower.includes('card')) {
        return '💳';
      } else if (methodLower.includes('cash')) {
        return '💵';
      } else if (methodLower.includes('digital') || methodLower.includes('wallet')) {
        return '📱';
      } else if (methodLower.includes('transfer')) {
        return '🏦';
      }
      return '💰'; // Default
    };
    
    return (
      <span style={{ fontSize: '24px', marginRight: theme.spacing[2] }}>
        {getIconForMethod(topMethod)}
      </span>
    );
  };
  
  return (
    <KpiTile
      title="Top Payment Method"
      value={topMethod}
      subValue={formatPercentage(topPercentage)}
      icon={<div style={{ display: 'flex', alignItems: 'center' }}>
        <PaymentIcon />
        <MiniPieChart />
      </div>}
      className={className}
    />
  );
}; 