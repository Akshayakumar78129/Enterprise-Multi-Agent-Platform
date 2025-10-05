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
          'rgba(139, 92, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(196, 181, 253, 0.8)',
          'rgba(221, 214, 254, 0.8)',
          'rgba(237, 233, 254, 0.8)'
        ];
        return colors[index % colors.length];
      }),
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Transactions'
        },
        grid: {
          color: 'rgba(139, 92, 246, 0.1)'
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
    <div>
      <div className="h-80">
        <BarChart data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Total Transactions</div>
          <div className="text-lg font-semibold">
            {data.reduce((sum, bin) => sum + bin.count, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Most Common Range</div>
          <div className="text-lg font-semibold">
            {data.reduce((max, bin) => bin.count > max.count ? bin : max, data[0])?.range || 'N/A'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Distribution Spread</div>
          <div className="text-lg font-semibold">
            {data.length} bins
          </div>
        </div>
      </div>
    </div>
  );
};