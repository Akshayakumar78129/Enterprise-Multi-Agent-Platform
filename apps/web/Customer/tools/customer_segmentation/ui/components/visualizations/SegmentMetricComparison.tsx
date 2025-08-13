import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { segmentationTheme, getSegmentColor } from '../../styles/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

interface SegmentMetrics {
  segment: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  customerLifetimeValue: number;
  recencyDays: number;
  loyaltyScore: number;
  engagementRate: number;
}

interface SegmentMetricComparisonProps {
  segments: SegmentMetrics[];
  width?: number;
  height?: number;
}

const SegmentMetricComparison: React.FC<SegmentMetricComparisonProps> = ({
  segments,
  width = 760,
  height = 440,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof SegmentMetrics>('avgOrderValue');
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [showPercentage, setShowPercentage] = useState(false);

  const metrics = [
    { key: 'avgOrderValue', label: 'Average Order Value', icon: '💰' },
    { key: 'purchaseFrequency', label: 'Purchase Frequency', icon: '📊' },
    { key: 'customerLifetimeValue', label: 'Customer Lifetime Value', icon: '💎' },
    { key: 'recencyDays', label: 'Recency (Days)', icon: '📅' },
    { key: 'loyaltyScore', label: 'Loyalty Score', icon: '⭐' },
    { key: 'engagementRate', label: 'Engagement Rate', icon: '📈' },
  ];

  const getMetricValues = () => {
    const values = segments.map(s => s[selectedMetric] as number);
    if (showPercentage) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return values.map(v => ((v / avg) * 100).toFixed(1));
    }
    return values;
  };

  const barData = {
    labels: segments.map(s => `Segment ${s.segment}`),
    datasets: [
      {
        label: metrics.find(m => m.key === selectedMetric)?.label || '',
        data: getMetricValues(),
        backgroundColor: segments.map((_, i) => `${getSegmentColor(i)}80`),
        borderColor: segments.map((_, i) => getSegmentColor(i)),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const radarData = {
    labels: metrics.map(m => m.label),
    datasets: segments.map((segment, i) => ({
      label: `Segment ${segment.segment}`,
      data: metrics.map(m => {
        const value = segment[m.key as keyof SegmentMetrics] as number;
        const max = Math.max(...segments.map(s => s[m.key as keyof SegmentMetrics] as number));
        return (value / max) * 100;
      }),
      backgroundColor: `${getSegmentColor(i)}30`,
      borderColor: getSegmentColor(i),
      borderWidth: 2,
      pointBackgroundColor: getSegmentColor(i),
    })),
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: segmentationTheme.colors.bgGlass,
        titleColor: segmentationTheme.colors.textPrimary,
        bodyColor: segmentationTheme.colors.textSecondary,
        borderColor: segmentationTheme.colors.accentCyan,
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: segmentationTheme.colors.textSecondary,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: segmentationTheme.colors.textSecondary,
          callback: function(value: any) {
            if (showPercentage) return `${value}%`;
            return value;
          },
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: segmentationTheme.colors.textPrimary,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: segmentationTheme.colors.bgGlass,
        titleColor: segmentationTheme.colors.textPrimary,
        bodyColor: segmentationTheme.colors.textSecondary,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: segmentationTheme.colors.textSecondary,
          font: {
            size: 11,
          },
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        background: segmentationTheme.gradients.container,
        backdropFilter: segmentationTheme.effects.backdropBlur,
        WebkitBackdropFilter: segmentationTheme.effects.backdropBlur,
        borderRadius: segmentationTheme.borderRadius.xl,
        border: `1px solid rgba(0, 224, 255, 0.2)`,
        boxShadow: segmentationTheme.effects.glassShadow,
        padding: segmentationTheme.spacing.xl,
        marginBottom: segmentationTheme.spacing.xl,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: segmentationTheme.spacing.lg,
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: segmentationTheme.colors.textPrimary,
            marginBottom: segmentationTheme.spacing.xs,
          }}>
            Cross-Segment Analysis
          </h3>
          <p style={{
            fontSize: '14px',
            color: segmentationTheme.colors.textTertiary,
          }}>
            Compare key metrics across different customer segments
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: segmentationTheme.spacing.md,
          alignItems: 'center',
        }}>
          <div style={{
            display: 'flex',
            gap: segmentationTheme.spacing.xs,
            background: segmentationTheme.colors.bgSecondary,
            borderRadius: segmentationTheme.borderRadius.md,
            padding: '4px',
          }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                background: chartType === 'bar' ? segmentationTheme.gradients.primary : 'transparent',
                border: 'none',
                borderRadius: segmentationTheme.borderRadius.sm,
                color: segmentationTheme.colors.textPrimary,
                padding: '6px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: segmentationTheme.animation.fast,
              }}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('radar')}
              style={{
                background: chartType === 'radar' ? segmentationTheme.gradients.primary : 'transparent',
                border: 'none',
                borderRadius: segmentationTheme.borderRadius.sm,
                color: segmentationTheme.colors.textPrimary,
                padding: '6px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: segmentationTheme.animation.fast,
              }}
            >
              Radar
            </button>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: segmentationTheme.spacing.sm,
            fontSize: '13px',
            color: segmentationTheme.colors.textSecondary,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={showPercentage}
              onChange={(e) => setShowPercentage(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Show as %
          </label>
        </div>
      </div>

      {chartType === 'bar' && (
        <div style={{
          display: 'flex',
          gap: segmentationTheme.spacing.sm,
          marginBottom: segmentationTheme.spacing.lg,
          flexWrap: 'wrap',
        }}>
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key as keyof SegmentMetrics)}
              style={{
                background: selectedMetric === metric.key 
                  ? segmentationTheme.gradients.primary 
                  : segmentationTheme.colors.bgSecondary,
                border: `1px solid ${
                  selectedMetric === metric.key 
                    ? segmentationTheme.colors.accentCyan 
                    : 'transparent'
                }`,
                borderRadius: segmentationTheme.borderRadius.md,
                color: segmentationTheme.colors.textPrimary,
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: segmentationTheme.animation.fast,
                display: 'flex',
                alignItems: 'center',
                gap: segmentationTheme.spacing.xs,
              }}
            >
              <span style={{ fontSize: '16px' }}>{metric.icon}</span>
              {metric.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ height: `${height}px` }}>
        {chartType === 'bar' ? (
          <Bar data={barData} options={barOptions} />
        ) : (
          <Radar data={radarData} options={radarOptions} />
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${segmentationTheme.colors.accentPurple}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
    </motion.div>
  );
};

export default SegmentMetricComparison;