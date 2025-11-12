import React from 'react';
import { LineChart } from 'components';

interface TimeSeriesData {
  date: string;
  transactionCount: number;
  avgTransactionValue: number;
  totalAmount?: number;
}

interface DualAxisTimeSeriesProps {
  data: TimeSeriesData[];
  loading?: boolean;
  onDataPointClick?: (dataPoint: TimeSeriesData, event: React.MouseEvent) => void;
}

export const DualAxisTimeSeries: React.FC<DualAxisTimeSeriesProps> = ({
  data = [],
  loading = false,
  onDataPointClick
}) => {
  if (loading) {
    return (
      <div className="h-96 animate-pulse">
        <div className="h-full bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  // Transform data for LineChart component
  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Transaction Count',
        data: data.map(d => d.transactionCount),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        yAxisID: 'y1',
        tension: 0.3
      },
      {
        label: 'Avg Transaction Value ($)',
        data: data.map(d => d.avgTransactionValue),
        borderColor: 'rgb(251, 191, 36)',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        yAxisID: 'y2',
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Count')) {
              return `${label}: ${value.toLocaleString()}`;
            }
            return `${label}: $${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Transaction Count'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'  // Neutral gray instead of purple
        }
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Average Value ($)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onDataPointClick) {
        const index = elements[0].index;
        onDataPointClick(data[index], event);
      }
    }
  };

  return (
    <div className="h-[400px] w-full">
      <LineChart data={chartData} options={options} />
    </div>
  );
};