import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import styles from './NPVPortfolioChart.module.css';

interface AgingBucket {
  range: string;
  amount: number;
  npvAdjustedAmount: number;
  count: number;
  percentOfTotal: number;
  valueErosion: number;
  color: string;
}

interface NPVPortfolioChartProps {
  data: AgingBucket[];
  wacc: number;
  onChartClick: (data: any, type: string) => void;
}

const NPVPortfolioChart: React.FC<NPVPortfolioChartProps> = ({ data, wacc, onChartClick }) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>NPV-Adjusted AR Portfolio Analysis</h3>
        <div className={styles.noData}>No data available</div>
      </div>
    );
  }

  const chartData = data.map((bucket, index) => ({
    name: bucket.range,
    grossValue: bucket.amount,
    npvAdjusted: bucket.npvAdjustedAmount,
    valueErosion: bucket.valueErosion,
    carryingCost: bucket.amount * (wacc / 100) * (index * 30 / 365),
    color: bucket.color,
    count: bucket.count,
    percentOfTotal: bucket.percentOfTotal
  }));

  const totalValueLost = chartData.reduce((sum, item) => sum + item.valueErosion + item.carryingCost, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{data.name}</div>
          <div className={styles.tooltipContent}>
            <div>Gross Value: ${(data.grossValue / 1000).toFixed(0)}K</div>
            <div style={{ color: '#00e0ff' }}>NPV Adjusted: ${(data.npvAdjusted / 1000).toFixed(0)}K</div>
            <div style={{ color: '#e930ff' }}>Value Erosion: -${(data.valueErosion / 1000).toFixed(0)}K</div>
            <div style={{ color: '#ffc145' }}>Carrying Cost: -${(data.carryingCost / 1000).toFixed(0)}K</div>
            <div>Count: {data.count} customers</div>
            <div>Percent of Total: {data.percentOfTotal.toFixed(1)}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (index: number) => {
    if (index === 0) return '#00e0ff'; // 0-30 days - Value creating
    if (index === 1) return '#5fd4d6'; // 31-45 days - Break-even
    if (index === 2) return '#ffc145'; // 46-60 days - Value eroding
    return '#e930ff'; // 60+ days - Value destroying
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>NPV-Adjusted AR Portfolio Analysis</h3>
        <div className={styles.waccIndicator}>
          WACC: {wacc}%
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a36" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#8892a8', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: '#8892a8', fontSize: 11 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
            
            <Bar 
              dataKey="grossValue" 
              name="Gross AR Value"
              fill="#5fd4d6"
              opacity={0.6}
            />
            <Bar 
              dataKey="npvAdjusted" 
              name="NPV Adjusted"
              onMouseEnter={(_, index) => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={(data) => onChartClick(data, 'npv_bucket')}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(index)}
                  opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Total Economic Value Lost</div>
          <div className={styles.metricValue} style={{ color: '#e930ff' }}>
            ${(totalValueLost / 1000000).toFixed(2)}M
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>Daily Value Erosion</div>
          <div className={styles.metricValue} style={{ color: '#ffc145' }}>
            ${(totalValueLost / 30 / 1000).toFixed(0)}K
          </div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>ROIC Impact</div>
          <div className={styles.metricValue} style={{ color: '#00e0ff' }}>
            -2.3%
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#00e0ff' }}></div>
          <span>Value Creating (0-30 days)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#5fd4d6' }}></div>
          <span>Break-even (31-45 days)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#ffc145' }}></div>
          <span>Value Eroding (46-60 days)</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#e930ff' }}></div>
          <span>Value Destroying (60+ days)</span>
        </div>
      </div>
    </div>
  );
};

export default NPVPortfolioChart;