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
import { createChartJsClickHandler } from '../../utils/chartSelectionHelper';

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
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [aiInsightContent, setAiInsightContent] = useState<any>(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });

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

  const generateMetricInsight = (segmentIndex: number, metricKey: string) => {
    const segment = segments[segmentIndex];
    const metric = metrics.find(m => m.key === metricKey);
    const value = segment[metricKey as keyof SegmentMetrics] as number;
    const allValues = segments.map(s => s[metricKey as keyof SegmentMetrics] as number);
    const avgValue = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    
    const performance = value > avgValue * 1.2 ? 'high' : value < avgValue * 0.8 ? 'low' : 'average';
    const emoji = performance === 'high' ? '🚀' : performance === 'low' ? '⚠️' : '📊';
    
    return {
      emoji,
      title: `Segment ${segment.segment} - ${metric?.label}`,
      subtitle: `Value: ${value.toFixed(2)}`,
      summary: `This segment shows ${performance} performance with ${value.toFixed(2)} compared to average of ${avgValue.toFixed(2)}. ${value === maxValue ? 'This is the highest performing segment!' : value === minValue ? 'This segment needs attention.' : ''}`,
      details: [
        `📊 Current Value: ${value.toFixed(2)}`,
        `📈 Average: ${avgValue.toFixed(2)}`,
        `⬆️ Maximum: ${maxValue.toFixed(2)}`,
        `⬇️ Minimum: ${minValue.toFixed(2)}`,
        `💹 Performance: ${((value / avgValue) * 100).toFixed(1)}% of average`
      ],
      questions: [
        'What drives this metric performance?',
        'How can we improve this segment?',
        'Show trend analysis',
        'Compare with best performer'
      ],
      actions: [
        'Export detailed analysis',
        'Create improvement plan',
        'Set performance alerts',
        'Schedule review meeting'
      ]
    };
  };

  const handleChartClick = (event: any, elements: any[]) => {
    // Use the chartSelectionHelper for consistent handling
    const chartRef = { data: getChartData() };
    const clickHandler = createChartJsClickHandler(
      'segment-metric-comparison',
      chartType,
      chartRef
    );
    clickHandler(event, elements);
    
    // AI insights are now handled by ChartSelectionManager
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
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
    onClick: handleChartClick,
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

      {/* AI Insight Popup removed - using ChartSelectionManager instead */}
      {false && (
        <div
          style={{
            position: 'fixed',
            left: insightPosition.x,
            top: insightPosition.y,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1e2738, #2a3447)',
            border: '2px solid rgba(124, 58, 237, 0.5)',
            borderRadius: 12,
            padding: 20,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
            zIndex: 1001,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f7f9fb', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                {aiInsightContent.emoji} {aiInsightContent.title}
              </div>
              {aiInsightContent.subtitle && (
                <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.7)' }}>
                  {aiInsightContent.subtitle}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAIInsight(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(247, 249, 251, 0.6)',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f7f9fb'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.6)'}
            >
              ×
            </button>
          </div>
          
          <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.9)', marginBottom: 12 }}>
            {aiInsightContent.summary}
          </div>
          
          {aiInsightContent.details && (
            <div style={{ marginBottom: 12 }}>
              {aiInsightContent.details.map((detail: string, idx: number) => (
                <div key={idx} style={{ fontSize: 12, color: 'rgba(247, 249, 251, 0.8)', marginBottom: 4 }}>
                  {detail}
                </div>
              ))}
            </div>
          )}
          
          {/* Key Questions */}
          {aiInsightContent.questions && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 6,
              padding: 8,
              marginBottom: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(139, 92, 246, 0.9)', marginBottom: 6 }}>
                💡 Key Questions
              </div>
              {aiInsightContent.questions.map((question: string, idx: number) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: 11, 
                    color: 'rgba(247, 249, 251, 0.8)', 
                    marginBottom: 3,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                      (window as any).addAIInsightToChat({
                        label: `${aiInsightContent.title} - Question`,
                        value: question,
                        actionType: 'question'
                      });
                    }
                    setShowAIInsight(false);
                  }}
                >
                  • {question}
                </div>
              ))}
            </div>
          )}
          
          {/* Recommended Actions */}
          {aiInsightContent.actions && (
            <div style={{
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: 6,
              padding: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#00e676', marginBottom: 6 }}>
                ⚡ Recommended Actions
              </div>
              {aiInsightContent.actions.map((action: string, idx: number) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: 11, 
                    color: 'rgba(247, 249, 251, 0.8)', 
                    marginBottom: 3,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 230, 118, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                      (window as any).addAIInsightToChat({
                        label: `${aiInsightContent.title} - Action`,
                        value: `Execute: ${action}`,
                        actionType: 'execute'
                      });
                    }
                    setShowAIInsight(false);
                  }}
                >
                  • {action}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.6)', marginTop: 12, textAlign: 'center' }}>
            Press <strong>Shift+Click</strong> for multi-selection
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SegmentMetricComparison;