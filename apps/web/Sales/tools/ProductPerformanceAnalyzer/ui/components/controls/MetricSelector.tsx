import React from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

type Metric = 'sales' | 'units' | 'margin' | 'price_bands';

interface MetricSelectorProps {
  selectedMetrics: Metric[];
  onMetricsChange: (metrics: Metric[]) => void;
}

/**
 * Component for selecting which metrics to display in the analyzer
 */
export const MetricSelector: React.FC<MetricSelectorProps> = ({
  selectedMetrics,
  onMetricsChange,
}) => {
  const theme = useTheme();
  
  const metrics: { id: Metric; label: string; icon: string }[] = [
    { id: 'sales', label: 'Sales', icon: '💰' },
    { id: 'units', label: 'Units', icon: '📦' },
    { id: 'margin', label: 'Margin', icon: '📈' },
    { id: 'price_bands', label: 'Price Bands', icon: '🏷️' },
  ];
  
  const toggleMetric = (metric: Metric) => {
    if (selectedMetrics.includes(metric)) {
      // Don't allow deselecting if it's the only selected metric
      if (selectedMetrics.length > 1) {
        onMetricsChange(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      onMetricsChange([...selectedMetrics, metric]);
    }
  };
  
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}
    >
      <div style={{ 
        color: theme.colors.cloudWhite,
        fontSize: '14px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        marginRight: '8px',
      }}>
        Metrics:
      </div>
      
      {metrics.map(metric => (
        <button
          key={metric.id}
          onClick={() => toggleMetric(metric.id)}
          style={{
            background: selectedMetrics.includes(metric.id) 
              ? theme.colors.electricCyan
              : theme.colors.midnight,
            color: selectedMetrics.includes(metric.id)
              ? theme.colors.midnight
              : theme.colors.cloudWhite,
            border: `1px solid ${selectedMetrics.includes(metric.id) 
              ? theme.colors.electricCyan
              : theme.colors.graphite}`,
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span>{metric.icon}</span>
          <span>{metric.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MetricSelector; 