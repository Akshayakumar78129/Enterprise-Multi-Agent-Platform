"use client";

import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, getShiftClickManager } from 'components/index';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CategoryAnalysisChartProps {
  data: Array<{
    category: string;
    totalItems: number;
    slowMovingItems: number;
    totalValue: number;
    avgTurnoverRate: number;
  }>;
  loading?: boolean;
}

export function CategoryAnalysisChart({ data = [], loading = false }: CategoryAnalysisChartProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    const labels = data.map(item => item.category);
    const totalItems = data.map(item => item.totalItems);
    const slowMovingItems = data.map(item => item.slowMovingItems);

    return {
      labels,
      datasets: [
        {
          label: 'Total Items',
          data: totalItems,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Slow Moving Items',
          data: slowMovingItems,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
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
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const dataItem = data[index];
            return [
              `Value: $${(dataItem?.totalValue || 0).toLocaleString()}`,
              `Avg Turnover: ${dataItem?.avgTurnoverRate?.toFixed(2) || 0} turns/year`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        title: {
          display: true,
          text: 'Number of Items',
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        ticks: {
          color: 'rgb(156, 163, 175)'
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        },
        title: {
          display: true,
          text: 'Product Category',
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
            id: `category-${dataItem.category}`,
            label: dataItem.category,
            value: `${dataItem.slowMovingItems}/${dataItem.totalItems} slow moving`,
            source: 'Category Analysis Chart',
            chartType: 'bar',
            metadata: {
              fromShiftClick: true,
              timestamp: Date.now(),
              dashboardContext: 'slow-moving-stock',
              avgTurnoverRate: dataItem.avgTurnoverRate
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
