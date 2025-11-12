import { Scatter, ChartOptions } from '@/lib/chartSetup';
import React, { useMemo } from 'react';
interface ProductData {
  productCategory: string;
  transactionCount: number;
  totalRevenue: number;
  avgPrice: number;
  growthRate: number;
  marginPercent: number;
  marketShare: number;
  quadrant: string;
}

interface ProductMatrixProps {
  data: ProductData[];
  loading?: boolean;
  onProductClick?: (product: ProductData, event: React.MouseEvent) => void;
}

export const ProductMatrix: React.FC<ProductMatrixProps> = ({
  data = [],
  loading = false,
  onProductClick
}) => {
  if (loading) {
    return (
      <div className="h-[500px] animate-pulse">
        <div className="h-full bg-muted/20 rounded-lg"></div>
      </div>
    );
  }

  const validData = data.filter(d =>
    d &&
    d.marginPercent !== undefined &&
    d.growthRate !== undefined &&
    d.totalRevenue !== undefined
  );

  if (validData.length === 0) {
    return (
      <div className="h-[500px] flex items-center justify-center text-muted-foreground">
        No product data available
      </div>
    );
  }

  const maxRevenue = Math.max(...validData.map(p => p.totalRevenue), 1);

  // Group products by quadrant
  const quadrantGroups = useMemo(() => {
    const groups: Record<string, ProductData[]> = {
      'High Performers': [],
      'Stable Products': [],
      'Growing Products': [],
      'Low Performers': []
    };

    validData.forEach(product => {
      const quadrant = product.quadrant || 'Low Performers';
      if (groups[quadrant]) {
        groups[quadrant].push(product);
      }
    });

    return groups;
  }, [validData]);

  // Calculate quadrant summaries
  const quadrantSummaries = useMemo(() => {
    return Object.entries(quadrantGroups).map(([quadrant, products]) => ({
      name: quadrant,
      count: products.length,
      totalRevenue: products.reduce((sum, p) => sum + p.totalRevenue, 0)
    }));
  }, [quadrantGroups]);

  // Prepare scatter plot datasets
  const chartData = {
    datasets: Object.entries(quadrantGroups).map(([quadrant, products]) => {
      const colors: Record<string, { bg: string; border: string }> = {
        'High Performers': { bg: 'rgba(59, 130, 246, 0.7)', border: 'rgb(37, 99, 235)' },    // Blue
        'Stable Products': { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(5, 150, 105)' },     // Emerald
        'Growing Products': { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(217, 119, 6)' },    // Amber
        'Low Performers': { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgb(220, 38, 38)' }        // Red
      };

      const color = colors[quadrant] || colors['Low Performers'];

      return {
        label: quadrant,
        data: products.map(p => ({
          x: p.marginPercent,
          y: p.growthRate,
          r: Math.max(5, Math.min(25, (p.totalRevenue / maxRevenue) * 25)),
          product: p
        })),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 2,
      };
    })
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            const product = context[0]?.raw?.product;
            return product?.productCategory || 'Unknown';
          },
          label: (context: any) => {
            const product = context.raw?.product;
            if (!product) return '';

            return [
              `Revenue: $${(product.totalRevenue / 1000).toFixed(1)}K`,
              `Growth: ${product.growthRate.toFixed(1)}%`,
              `Margin: ${product.marginPercent.toFixed(1)}%`,
              `Market Share: ${product.marketShare.toFixed(1)}%`,
              `Transactions: ${product.transactionCount.toLocaleString()}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Profit Margin (%)',
          font: {
            size: 13,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: true
        },
        ticks: {
          callback: (value) => `${value}%`
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Growth Rate (%)',
          font: {
            size: 13,
            weight: '600'
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          drawBorder: true
        },
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onProductClick) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const product = chartData.datasets[datasetIndex].data[index].product;
        onProductClick(product, event);
      }
    }
  };

  // Add quadrant divider lines as plugins
  const quadrantPlugin = {
    id: 'quadrantLines',
    afterDraw: (chart: any) => {
      const ctx = chart.ctx;
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      // Thresholds
      const marginThreshold = 20; // 20%
      const growthThreshold = 10;  // 10%

      ctx.save();

      // Vertical line (margin threshold)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const xPos = xScale.getPixelForValue(marginThreshold);
      ctx.moveTo(xPos, yScale.top);
      ctx.lineTo(xPos, yScale.bottom);
      ctx.stroke();

      // Horizontal line (growth threshold)
      ctx.beginPath();
      const yPos = yScale.getPixelForValue(growthThreshold);
      ctx.moveTo(xScale.left, yPos);
      ctx.lineTo(xScale.right, yPos);
      ctx.stroke();

      ctx.restore();
    }
  };

  return (
    <div className="h-[580px]">
      <Scatter
        data={chartData}
        options={options}
        plugins={[quadrantPlugin]}
      />
    </div>
  );
};
