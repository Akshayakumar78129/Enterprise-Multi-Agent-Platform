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
import { handleChartClick as sendToSelectionManager } from '../../utils/chartSelectionHelper';

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
  segment: string | number;
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
  segments = [],
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

  // Generate default segments if none provided
  const segmentsToUse = React.useMemo(() => {
    if (segments && segments.length > 0) {
      return segments;
    }
    
    // Default segments data
    return [
      { segment: 'Champions', avgOrderValue: 450.25, purchaseFrequency: 8.5, customerLifetimeValue: 7500.50, recencyDays: 10.5, loyaltyScore: 92.3, engagementRate: 88.7 },
      { segment: 'Loyal', avgOrderValue: 320.75, purchaseFrequency: 6.3, customerLifetimeValue: 5200.25, recencyDays: 15.2, loyaltyScore: 85.6, engagementRate: 78.4 },
      { segment: 'Potential', avgOrderValue: 280.50, purchaseFrequency: 4.8, customerLifetimeValue: 3800.75, recencyDays: 20.3, loyaltyScore: 72.1, engagementRate: 65.9 },
      { segment: 'New', avgOrderValue: 180.25, purchaseFrequency: 2.2, customerLifetimeValue: 1500.50, recencyDays: 8.7, loyaltyScore: 58.4, engagementRate: 70.2 },
      { segment: 'At Risk', avgOrderValue: 220.75, purchaseFrequency: 3.5, customerLifetimeValue: 2800.25, recencyDays: 35.8, loyaltyScore: 45.3, engagementRate: 38.6 },
      { segment: 'Can\'t Lose', avgOrderValue: 380.50, purchaseFrequency: 5.7, customerLifetimeValue: 6200.75, recencyDays: 42.5, loyaltyScore: 68.9, engagementRate: 42.1 },
      { segment: 'Hibernating', avgOrderValue: 150.25, purchaseFrequency: 1.8, customerLifetimeValue: 1200.50, recencyDays: 55.3, loyaltyScore: 35.7, engagementRate: 25.4 },
      { segment: 'Lost', avgOrderValue: 120.75, purchaseFrequency: 1.2, customerLifetimeValue: 800.25, recencyDays: 75.9, loyaltyScore: 22.3, engagementRate: 15.8 }
    ];
  }, [segments]);

  const getMetricValues = () => {
    const values = segmentsToUse.map(s => s[selectedMetric] as number);
    if (showPercentage) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return values.map(v => ((v / avg) * 100).toFixed(1));
    }
    return values;
  };

  const barData = {
    labels: segmentsToUse.map(s => `${s.segment}`),
    datasets: [
      {
        label: metrics.find(m => m.key === selectedMetric)?.label || '',
        data: getMetricValues(),
        backgroundColor: segmentsToUse.map((_, i) => `${getSegmentColor(i)}80`),
        borderColor: segmentsToUse.map((_, i) => getSegmentColor(i)),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Debug logging
  console.log('SegmentMetricComparison - segmentsToUse:', segmentsToUse);
  console.log('SegmentMetricComparison - barData:', barData);

  const radarData = {
    labels: metrics.map(m => m.label),
    datasets: segmentsToUse.map((segment, i) => ({
      label: `${segment.segment}`,
      data: metrics.map(m => {
        const value = segment[m.key as keyof SegmentMetrics] as number;
        const max = Math.max(...segmentsToUse.map(s => s[m.key as keyof SegmentMetrics] as number));
        return (value / max) * 100;
      }),
      backgroundColor: `${getSegmentColor(i)}40`,
      borderColor: getSegmentColor(i),
      borderWidth: 3,
      pointBackgroundColor: getSegmentColor(i),
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointHoverBackgroundColor: getSegmentColor(i),
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 3,
    })),
  };

  const generateMetricInsight = (segmentIndex: number, metricKey: string) => {
    const segment = segmentsToUse[segmentIndex];
    const metric = metrics.find(m => m.key === metricKey);
    const value = segment[metricKey as keyof SegmentMetrics] as number;
    const allValues = segmentsToUse.map(s => s[metricKey as keyof SegmentMetrics] as number);
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
    if (!elements || elements.length === 0) return;
    
    try {
      // Get click coordinates from the event
      const rect = event.native?.target?.getBoundingClientRect();
      const x = event.native?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth / 2);
      const y = event.native?.clientY || (rect ? rect.top + rect.height / 2 : window.innerHeight / 2);
      
      const element = elements[0];
      const datasetIndex = element.datasetIndex;
      const index = element.index;
      
      const data = chartType === 'radar' ? radarData : barData;
      const dataset = data.datasets[datasetIndex];
      const metricLabel = chartType === 'radar' ? 
        (data.labels?.[index] || 'Unknown Metric') :
        metrics.find(m => m.key === selectedMetric)?.label || 'Unknown Metric';
      const segmentName = chartType === 'radar' ?
        dataset.label || 'Unknown Segment' :
        data.labels?.[index] || 'Unknown Segment';
      const value = dataset.data[index];
      
      // Send to ChartSelectionManager with proper coordinates
      sendToSelectionManager({
        chartId: 'segment-metric-comparison',
        chartType: chartType === 'radar' ? 'radar' : 'bar',
        label: `${segmentName} - ${metricLabel}`,
        value: value,
        index: index,
        metadata: {
          segment: segmentName,
          metric: metricLabel,
          datasetIndex,
          dataIndex: index
        }
      }, { clientX: x, clientY: y });
    } catch (error) {
      console.error('Error handling chart click:', error);
    }
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
          color: '#ffffff',
          padding: 15,
          font: {
            size: 13,
            weight: '500',
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 39, 56, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#f7f9fb',
        borderColor: 'rgba(0, 224, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.r || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1,
        },
        grid: {
          color: 'rgba(0, 224, 255, 0.1)',
          circular: true,
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 12,
            weight: '500',
          },
          padding: 10,
          backdropColor: 'rgba(30, 39, 56, 0.7)',
          backdropPadding: 4,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          backdropColor: 'rgba(30, 39, 56, 0.8)',
          backdropPadding: 3,
          font: {
            size: 10,
          },
          stepSize: 20,
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  // Always render the chart with data
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
      </div>

      <div style={{ 
        height: `${height}px`,
        width: '100%',
        position: 'relative',
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
        padding: '10px'
      }}>
        <Bar data={barData} options={barOptions} />
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