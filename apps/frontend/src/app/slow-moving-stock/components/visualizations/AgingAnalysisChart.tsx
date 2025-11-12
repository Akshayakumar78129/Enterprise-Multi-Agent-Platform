"use client";

import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, getShiftClickManager } from 'components/index';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AgingAnalysisChartProps {
  data: Array<{
    agingPeriod: string;
    itemCount: number;
    totalValue: number;
  }>;
  loading?: boolean;
}

export function AgingAnalysisChart({ data = [], loading = false }: AgingAnalysisChartProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    const labels = data.map(item => item.agingPeriod);
    const itemCounts = data.map(item => item.itemCount);
    const values = data.map(item => item.totalValue / 1000); // Convert to thousands

    return {
      labels,
      datasets: [
        {
          label: 'Item Count',
          data: itemCounts,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Total Value ($K)',
          data: values,
          backgroundColor: 'rgba(251, 191, 36, 0.8)',
          borderColor: 'rgba(251, 191, 36, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        title: {
          display: true,
          text: 'Item Count',
          color: 'rgb(156, 163, 175)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Value ($K)',
          color: 'rgb(156, 163, 175)'
        }
      },
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const index = elements[0].index;
        const dataItem = data[index];
        if (dataItem) {
          shiftClickManager.addPoint({
            id: `aging-${dataItem.agingPeriod}`,
            label: `Aging: ${dataItem.agingPeriod}`,
            value: `${dataItem.itemCount} items, $${(dataItem.totalValue / 1000).toFixed(1)}K`,
            source: 'Stock Aging Analysis Chart',
            chartType: 'bar',
            metadata: {
              fromShiftClick: true,
              timestamp: Date.now(),
              dashboardContext: 'slow-moving-stock',
              agingPeriod: dataItem.agingPeriod
            }
          }, event.native);
        }
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
