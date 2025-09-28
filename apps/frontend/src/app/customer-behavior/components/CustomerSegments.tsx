"use client";

import React from "react";
import { Card, BarChart, Skeleton } from "components/index";
import { useBehaviorContext } from "../context";

interface CustomerSegmentsProps {
  data: any[];
  loading: boolean;
}

export function CustomerSegments({ data, loading }: CustomerSegmentsProps) {
  const { selectionManager } = useBehaviorContext();

  if (loading) {
    return (
      <Card title="Customer Segments" description="Behavioral segmentation analysis">
        <Skeleton className="h-96" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card title="Customer Segments" description="Behavioral segmentation analysis">
        <div className="h-96 flex items-center justify-center text-muted-foreground">
          No segment data available
        </div>
      </Card>
    );
  }

  const segmentChartData = {
    labels: data.map(segment => segment.segment_name || segment.segment),
    datasets: [
      {
        label: 'Customer Count',
        data: data.map(segment => segment.customer_count),
        backgroundColor: [
          'rgba(0, 224, 255, 0.8)',
          'rgba(95, 212, 214, 0.8)',
          'rgba(88, 145, 203, 0.8)',
          'rgba(170, 69, 221, 0.8)',
          'rgba(233, 48, 255, 0.8)',
          'rgba(245, 158, 11, 0.8)'
        ],
        borderColor: '#1a1a1a',
        borderWidth: 1
      }
    ]
  };

  const handleSegmentClick = (elements: any, event: any) => {
    if (elements.length > 0) {
      const element = elements[0];
      const segment = data[element.index];

      selectionManager.addPoint({
        label: `Segment: ${segment.segment_name || segment.segment}`,
        value: `${segment.customer_count} customers`,
        source: 'Customer Segments',
        metadata: segment
      }, event?.native?.shiftKey || false);
    }
  };

  return (
    <>
      <Card
        title="Segment Distribution"
        description="Customer distribution across behavioral segments"
      >
        <div className="h-96">
          <BarChart
            data={segmentChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onClick: handleSegmentClick,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      const segment = data[context.dataIndex];
                      return [
                        `Customers: ${segment.customer_count}`,
                        `Avg CLV: $${segment.avg_clv?.toFixed(2) || 'N/A'}`,
                        `Avg Frequency: ${segment.avg_frequency?.toFixed(1) || 'N/A'} days`
                      ];
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(255, 255, 255, 0.05)' },
                  ticks: { color: '#888' }
                },
                x: {
                  grid: { display: false },
                  ticks: {
                    color: '#888',
                    maxRotation: 45,
                    minRotation: 45
                  }
                }
              }
            }}
          />
        </div>
      </Card>

      <Card
        title="Segment Details"
        description="Key metrics by customer segment"
        className="mt-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Segment</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Customers</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Avg CLV</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Avg Order</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Frequency</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((segment, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/50 hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    selectionManager.addPoint({
                      label: `Segment: ${segment.segment_name || segment.segment}`,
                      value: `${segment.customer_count} customers`,
                      source: 'Segment Details',
                      metadata: segment
                    }, e.shiftKey);
                  }}
                >
                  <td className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        idx === 0 ? 'bg-cyan-400' :
                        idx === 1 ? 'bg-purple-400' :
                        idx === 2 ? 'bg-pink-400' :
                        'bg-blue-400'
                      }`} />
                      <span className="font-medium">
                        {segment.segment_name || segment.segment}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-right">{segment.customer_count}</td>
                  <td className="p-3 text-right text-green-400">
                    ${segment.avg_clv?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="p-3 text-right">
                    ${segment.avg_order_value?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="p-3 text-right">
                    {segment.avg_frequency?.toFixed(1) || 'N/A'} days
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      segment.engagement_score > 0.7 ? 'bg-green-500/20 text-green-400' :
                      segment.engagement_score > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {segment.engagement_score ?
                        `${(segment.engagement_score * 100).toFixed(0)}%` :
                        'N/A'
                      }
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}