import React from 'react';
import { BarChart } from 'components';

interface DistributionBin {
  range: string;
  count: number;
  percentage: number;
  minAmount: number;
  maxAmount: number;
}

interface AmountDistributionProps {
  data: DistributionBin[];
  loading?: boolean;
  onBinClick?: (bin: DistributionBin, event: React.MouseEvent) => void;
}

export const AmountDistribution: React.FC<AmountDistributionProps> = ({
  data = [],
  loading = false,
  onBinClick
}) => {
  if (loading) {
    return (
      <div className="h-96 animate-pulse">
        <div className="h-full bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  // Transform data for BarChart component
  const chartData = {
    labels: data.map(d => d.range),
    datasets: [{
      label: 'Transaction Count',
      data: data.map(d => d.count),
      backgroundColor: data.map((_, index) => {
        const colors = [
          'rgba(59, 130, 246, 0.8)',   // Blue
          'rgba(16, 185, 129, 0.8)',   // Emerald
          'rgba(245, 158, 11, 0.8)',   // Amber
          'rgba(236, 72, 153, 0.8)',   // Pink
          'rgba(139, 92, 246, 0.8)'    // Purple (only one!)
        ];
        return colors[index % colors.length];
      }),
      borderColor: data.map((_, index) => {
        const colors = [
          'rgb(37, 99, 235)',    // Blue border
          'rgb(5, 150, 105)',    // Emerald border
          'rgb(217, 119, 6)',    // Amber border
          'rgb(219, 39, 119)',   // Pink border
          'rgb(124, 58, 237)'    // Purple border
        ];
        return colors[index % colors.length];
      }),
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const bin = data[context.dataIndex];
            return [
              `Count: ${bin.count.toLocaleString()}`,
              `Percentage: ${bin.percentage.toFixed(1)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Transaction Amount Range',
          font: {
            size: 13,
            weight: 'bold' as const
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Transactions',
          font: {
            size: 13,
            weight: 'bold' as const
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onBinClick) {
        const index = elements[0].index;
        onBinClick(data[index], event);
      }
    }
  };

  return (
    <div className="h-[500px] w-full">
      <BarChart data={chartData} options={options} />
    </div>
  );
};