import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './RevenueGrowthDecomposition.module.css';

interface RevenueGrowthDecompositionProps {
  data?: any;
  onDataClick?: (data: any, chartType: string) => void;
}

const RevenueGrowthDecomposition: React.FC<RevenueGrowthDecompositionProps> = ({ data, onDataClick }) => {
  const [viewMode, setViewMode] = useState<'waterfall' | 'stacked' | 'quality'>('waterfall');

  // Use only database data - NO MOCK DATA
  const waterfallData = data?.waterfall || [];

  // Calculate cumulative values for waterfall
  let cumulative = 0;
  const processedData = waterfallData.map((item: any, index: number) => {
    if (index === 0) {
      cumulative = item.value;
      return { ...item, start: 0, end: item.value };
    } else if (index === waterfallData.length - 1) {
      return { ...item, start: 0, end: cumulative };
    } else {
      const start = cumulative;
      cumulative += item.value;
      return {
        ...item,
        start: item.value < 0 ? cumulative : start,
        end: item.value < 0 ? start : cumulative,
        absoluteValue: Math.abs(item.value)
      };
    }
  });

  // Revenue quality score from database
  const qualityMetrics = data?.qualityMetrics || {
    organic_growth: 0,
    predictability: 0,
    concentration: 0,
    recurring_percentage: 0,
    overall_score: 0
  };

  // Competitive benchmark data from database
  const benchmarkData = data?.benchmarks || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          <p className={styles.tooltipValue}>
            ${Math.abs(data.value / 1000000).toFixed(1)}M
            {data.type === 'organic' && ' (Organic)'}
            {data.type === 'inorganic' && ' (Inorganic)'}
            {data.type === 'negative' && ' (Negative)'}
          </p>
          {data.type !== 'base' && (
            <p className={styles.tooltipPercentage}>
              {((data.value / waterfallData[0].value) * 100).toFixed(1)}% of base
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (onDataClick) {
      onDataClick({
        ...data,
        viewMode,
        context: 'growth_decomposition'
      }, 'revenue_growth');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === 'waterfall' ? styles.active : ''}`}
            onClick={() => setViewMode('waterfall')}
          >
            Waterfall
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'stacked' ? styles.active : ''}`}
            onClick={() => setViewMode('stacked')}
          >
            Components
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === 'quality' ? styles.active : ''}`}
            onClick={() => setViewMode('quality')}
          >
            Quality Score
          </button>
        </div>
      </div>

      {viewMode === 'waterfall' && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 224, 255, 0.1)" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
              />
              <YAxis 
                tick={{ fill: 'rgba(247, 249, 251, 0.7)', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="absoluteValue" 
                stackId="stack"
                onClick={handleBarClick}
                cursor="pointer"
              >
                {processedData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar 
                dataKey="start" 
                stackId="stack" 
                fill="transparent"
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Growth Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard} onClick={() => handleBarClick({ metric: 'total_growth', value: data?.totalGrowth })}>
              <span className={styles.cardLabel}>Total Growth</span>
              <span className={styles.cardValue}>{data?.totalGrowth ? `+${data.totalGrowth.toFixed(0)}%` : '0%'}</span>
              <span className={styles.cardSubtext}>YoY</span>
            </div>
            <div className={styles.summaryCard} onClick={() => handleBarClick({ metric: 'organic_growth', value: data?.organicGrowth })}>
              <span className={styles.cardLabel}>Organic</span>
              <span className={styles.cardValue}>{data?.organicGrowth ? `+${data.organicGrowth.toFixed(0)}%` : '0%'}</span>
              <span className={styles.cardSubtext}>Core business</span>
            </div>
            <div className={styles.summaryCard} onClick={() => handleBarClick({ metric: 'inorganic_growth', value: data?.inorganicGrowth })}>
              <span className={styles.cardLabel}>Inorganic</span>
              <span className={styles.cardValue}>{data?.inorganicGrowth ? `+${data.inorganicGrowth.toFixed(0)}%` : '0%'}</span>
              <span className={styles.cardSubtext}>M&A / FX</span>
            </div>
            <div className={styles.summaryCard} onClick={() => handleBarClick({ metric: 'quality_score', value: qualityMetrics.overall_score })}>
              <span className={styles.cardLabel}>Quality Score</span>
              <span className={styles.cardValue}>{qualityMetrics.overall_score}/100</span>
              <span className={styles.cardSubtext}>Sustainable</span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'stacked' && (
        <div className={styles.chartContainer}>
          <div className={styles.componentBreakdown}>
            {waterfallData.slice(1, -1).map((item: any, index: number) => (
              <div 
                key={index} 
                className={styles.componentBar}
                onClick={() => handleBarClick(item)}
              >
                <div className={styles.componentHeader}>
                  <span className={styles.componentName}>{item.name}</span>
                  <span className={styles.componentValue}>
                    ${Math.abs(item.value / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className={styles.componentProgress}>
                  <div 
                    className={styles.componentFill}
                    style={{
                      width: `${Math.abs(item.value) / 200000}%`,
                      background: item.color
                    }}
                  />
                </div>
                <span className={styles.componentPercentage}>
                  {item.value > 0 ? '+' : ''}{((item.value / waterfallData[0].value) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'quality' && (
        <div className={styles.chartContainer}>
          <div className={styles.qualityScoreContainer}>
            <div className={styles.qualityScore}>
              <div className={styles.scoreCircle}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="rgba(0, 224, 255, 0.1)"
                    strokeWidth="15"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="75"
                    fill="none"
                    stroke="url(#qualityGradient)"
                    strokeWidth="15"
                    strokeDasharray={`${qualityMetrics.overall_score * 4.71} 471`}
                    strokeDashoffset="0"
                    transform="rotate(-90 90 90)"
                  />
                  <defs>
                    <linearGradient id="qualityGradient">
                      <stop offset="0%" stopColor="#00e0ff" />
                      <stop offset="100%" stopColor="#e930ff" />
                    </linearGradient>
                  </defs>
                  <text x="90" y="85" textAnchor="middle" fill="#f7f9fb" fontSize="36" fontWeight="700">
                    {qualityMetrics.overall_score}
                  </text>
                  <text x="90" y="105" textAnchor="middle" fill="rgba(247, 249, 251, 0.6)" fontSize="14">
                    Quality Score
                  </text>
                </svg>
              </div>
              
              <div className={styles.qualityMetrics}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Organic Growth</span>
                  <div className={styles.metricBar}>
                    <div 
                      className={styles.metricFill}
                      style={{ width: `${qualityMetrics.organic_growth}%` }}
                    />
                  </div>
                  <span className={styles.metricValue}>{qualityMetrics.organic_growth}%</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Predictability</span>
                  <div className={styles.metricBar}>
                    <div 
                      className={styles.metricFill}
                      style={{ width: `${qualityMetrics.predictability}%` }}
                    />
                  </div>
                  <span className={styles.metricValue}>{qualityMetrics.predictability}%</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Low Concentration</span>
                  <div className={styles.metricBar}>
                    <div 
                      className={styles.metricFill}
                      style={{ width: `${qualityMetrics.concentration}%` }}
                    />
                  </div>
                  <span className={styles.metricValue}>{qualityMetrics.concentration}%</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Recurring %</span>
                  <div className={styles.metricBar}>
                    <div 
                      className={styles.metricFill}
                      style={{ width: `${qualityMetrics.recurring_percentage}%` }}
                    />
                  </div>
                  <span className={styles.metricValue}>{qualityMetrics.recurring_percentage}%</span>
                </div>
              </div>
            </div>

            <div className={styles.valuationImpact}>
              <h4>Valuation Impact</h4>
              <div className={styles.impactGrid}>
                <div className={styles.impactItem} onClick={() => handleBarClick({ metric: 'growth_rate', value: data?.totalGrowth })}>
                  <span className={styles.impactLabel}>Growth Rate</span>
                  <span className={styles.impactValue}>{data?.totalGrowth?.toFixed(0) || 0}%</span>
                </div>
                <div className={styles.impactItem} onClick={() => handleBarClick({ metric: 'quality_score', value: qualityMetrics.overall_score })}>
                  <span className={styles.impactLabel}>Quality Score</span>
                  <span className={styles.impactValue}>{qualityMetrics.overall_score}/100</span>
                </div>
                <div className={styles.impactItem} onClick={() => handleBarClick({ metric: 'revenue_multiple', value: data?.revenueMultiple })}>
                  <span className={styles.impactLabel}>Revenue Multiple</span>
                  <span className={styles.impactValue}>{data?.revenueMultiple?.toFixed(1) || 0}x</span>
                </div>
                <div className={styles.impactItem} onClick={() => handleBarClick({ metric: 'enterprise_value', value: data?.enterpriseValue })}>
                  <span className={styles.impactLabel}>Enterprise Value</span>
                  <span className={styles.impactValue}>${(data?.enterpriseValue / 1000000000)?.toFixed(2) || 0}B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueGrowthDecomposition;