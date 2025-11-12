"use client";

import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card, getShiftClickManager } from 'components/index';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TurnoverDistributionChartProps {
  data: Array<{
    category: string;
    itemCount: number;
    totalValue: number;
  }>;
  loading?: boolean;
}

export function TurnoverDistributionChart({ data = [], loading = false }: TurnoverDistributionChartProps) {
  const shiftClickManager = getShiftClickManager();

  const chartData = useMemo(() => {
    const labels = data.map(item => item.category);
    const values = data.map(item => item.itemCount);

    return {
      labels,
      datasets: [
        {
          label: 'Item Count',
          data: values,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // green - Fast
            'rgba(59, 130, 246, 0.8)',  // blue - Medium
            'rgba(251, 191, 36, 0.8)',  // yellow - Slow
            'rgba(239, 68, 68, 0.8)',   // red - Very Slow
          ],
          borderColor: [
            'rgba(34, 197, 94, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(251, 191, 36, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            if (datasets.length > 0) {
              return chart.data.labels?.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const value = datasets[0].data[i];
                const dataItem = data[i];
                return {
                  text: `${label}: ${value} items ($${(dataItem?.totalValue / 1000).toFixed(1)}K)`,
                  fillStyle: datasets[0].backgroundColor?.[i] as string,
                  hidden: false,
                  index: i
                };
              }) || [];
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: (context) => {
            const dataItem = data[context.dataIndex];
            return [
              `Items: ${dataItem?.itemCount?.toLocaleString() || 0}`,
              `Value: $${(dataItem?.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            ];
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && event?.native?.shiftKey) {
        const index = elements[0].index;
        const dataItem = data[index];
        if (dataItem) {
          shiftClickManager.addPoint({
            id: `turnover-${dataItem.category}`,
            label: dataItem.category,
            value: `${dataItem.itemCount} items`,
            source: 'Turnover Distribution Chart',
            chartType: 'doughnut',
            metadata: {
              fromShiftClick: true,
              timestamp: Date.now(),
              dashboardContext: 'slow-moving-stock',
              totalValue: dataItem.totalValue
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
        <Doughnut data={chartData} options={options} />
      </div>
    </Card>
  );
}
