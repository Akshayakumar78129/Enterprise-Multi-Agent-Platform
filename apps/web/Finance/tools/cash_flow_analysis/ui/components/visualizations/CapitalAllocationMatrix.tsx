import React, { useMemo } from 'react';
import { CapitalAllocationData, formatCurrency } from '../../api/cashFlowApi';
import styles from './CapitalAllocationMatrix.module.css';

interface CapitalAllocationMatrixProps {
  data: CapitalAllocationData[];
  onSectorClick?: (data: CapitalAllocationData, chartType: string) => void;
}

const CapitalAllocationMatrix: React.FC<CapitalAllocationMatrixProps> = ({ data, onSectorClick }) => {
  const getColor = (type: string, index: number) => {
    const colors = {
      growth: '#00ff88',
      operations: '#00e0ff',
      returns: '#e930ff',
      other: '#ffd600'
    };
    return colors[type as keyof typeof colors] || `hsl(${index * 60}, 70%, 60%)`;
  };

  const { chartData, totalAmount } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], totalAmount: 0 };
    
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    
    // Create donut chart segments
    let cumulativeAngle = 0;
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 140;
    const innerRadius = 80;
    
    const chartData = data.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const angle = (item.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      
      // Calculate path for donut segment
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + outerRadius * Math.cos(startAngleRad);
      const y1 = centerY + outerRadius * Math.sin(startAngleRad);
      const x2 = centerX + outerRadius * Math.cos(endAngleRad);
      const y2 = centerY + outerRadius * Math.sin(endAngleRad);
      
      const x3 = centerX + innerRadius * Math.cos(endAngleRad);
      const y3 = centerY + innerRadius * Math.sin(endAngleRad);
      const x4 = centerX + innerRadius * Math.cos(startAngleRad);
      const y4 = centerY + innerRadius * Math.sin(startAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');
      
      // Label position
      const labelAngle = startAngle + angle / 2;
      const labelRadius = (outerRadius + innerRadius) / 2;
      const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
      const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
      
      cumulativeAngle += angle;
      
      return {
        ...item,
        pathData,
        labelX,
        labelY,
        angle,
        color: getColor(item.allocation_type, index)
      };
    });
    
    return { chartData, totalAmount: total };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Capital Allocation Efficiency Matrix</h3>
          <p className={styles.subtitle}>Strategic Capital Deployment Optimization</p>
        </div>
        <div className={styles.emptyState}>
          <p>No capital allocation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Capital Allocation Efficiency Matrix</h3>
        <p className={styles.subtitle}>Strategic Capital Deployment Optimization</p>
      </div>

      <div className={styles.content}>
        {/* Donut Chart */}
        <div className={styles.chartSection}>
          <svg className={styles.chart} viewBox="0 0 400 400">
            {/* Chart segments */}
            {chartData.map((segment, index) => (
              <g key={`${segment.category}-${index}`}>
                {/* Segment path */}
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  className={styles.segment}
                  onClick={() => onSectorClick?.(segment, 'capital_allocation')}
                />
                
                {/* Percentage label */}
                {segment.percentage > 5 && (
                  <text
                    x={segment.labelX}
                    y={segment.labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={styles.percentageLabel}
                    fill="#0a1224"
                    fontWeight="700"
                  >
                    {segment.percentage.toFixed(0)}%
                  </text>
                )}
              </g>
            ))}
            
            {/* Center circle with total */}
            <circle
              cx="200"
              cy="200"
              r="70"
              fill="rgba(0, 224, 255, 0.1)"
              stroke="rgba(0, 224, 255, 0.3)"
              strokeWidth="2"
            />
            
            <text
              x="200"
              y="190"
              textAnchor="middle"
              className={styles.totalLabel}
              fill="rgba(247, 249, 251, 0.6)"
            >
              Total Allocation
            </text>
            
            <text
              x="200"
              y="210"
              textAnchor="middle"
              className={styles.totalValue}
              fill="#00e0ff"
            >
              {formatCurrency(totalAmount, true)}
            </text>
          </svg>
        </div>

        {/* Details Panel */}
        <div className={styles.detailsPanel}>
          <h4 className={styles.detailsTitle}>Allocation Breakdown</h4>
          <div className={styles.allocationList}>
            {chartData.map((item, index) => (
              <div 
                key={`${item.category}-${index}`}
                className={styles.allocationItem}
                onClick={() => onSectorClick?.(item, 'capital_allocation')}
              >
                <div className={styles.itemHeader}>
                  <div 
                    className={styles.colorDot}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={styles.categoryName}>
                    {item.category.length > 20 ? 
                      `${item.category.substring(0, 20)}...` : 
                      item.category}
                  </span>
                  <span className={styles.percentage}>
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className={styles.itemDetails}>
                  <div className={styles.detailRow}>
                    <span>Amount:</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Transactions:</span>
                    <span>{item.transaction_count.toLocaleString()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Avg Size:</span>
                    <span>{formatCurrency(item.avg_size)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span>Active Days:</span>
                    <span>{item.active_days}</span>
                  </div>
                </div>
                
                {/* Efficiency bar */}
                <div className={styles.efficiencyBar}>
                  <div className={styles.efficiencyLabel}>Efficiency</div>
                  <div className={styles.efficiencyTrack}>
                    <div 
                      className={styles.efficiencyFill}
                      style={{
                        width: `${Math.min((item.avg_size / 50000) * 100, 100)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className={styles.summaryStats}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{chartData.length}</div>
          <div className={styles.statLabel}>Categories</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {chartData.reduce((sum, item) => sum + item.transaction_count, 0).toLocaleString()}
          </div>
          <div className={styles.statLabel}>Total Transactions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {formatCurrency(chartData.reduce((sum, item) => sum + item.avg_size, 0) / chartData.length || 0, true)}
          </div>
          <div className={styles.statLabel}>Avg Transaction</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {Math.max(...chartData.map(item => item.active_days))}
          </div>
          <div className={styles.statLabel}>Peak Activity Days</div>
        </div>
      </div>
    </div>
  );
};

export default CapitalAllocationMatrix;