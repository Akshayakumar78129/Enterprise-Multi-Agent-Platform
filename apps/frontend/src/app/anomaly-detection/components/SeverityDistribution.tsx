"use client";

import React from 'react';
import { Card, Skeleton } from 'components/index';

interface SeverityDistributionProps {
  data: Array<{
    severity_level: number;
    label: string;
    count: number;
    percentage: number;
    color?: string;
  }>;
  loading?: boolean;
}

export function SeverityDistribution({ data, loading }: SeverityDistributionProps) {
  if (loading) {
    return (
      <Card title="Severity Distribution" className="h-96">
        <Skeleton className="h-full" />
      </Card>
    );
  }

  // Reverse the array to show highest severity at top
  const reversedData = [...data].reverse();
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card title="Severity Distribution" description="Anomaly distribution by severity level">
      <div className="space-y-3">
        {reversedData.map((item) => (
          <div key={item.severity_level} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                Level {item.severity_level} - {item.label}
              </span>
              <span className="text-muted-foreground">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="relative h-8 bg-background rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-lg opacity-80 hover:opacity-100"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color || '#00e0ff'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Threshold for significant anomalies</span>
          <span className="font-medium">Level 3+</span>
        </div>
      </div>
    </Card>
  );
}