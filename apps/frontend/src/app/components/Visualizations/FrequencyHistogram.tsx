"use client";

import React from 'react';
import { BarChart } from 'components';

interface FrequencyHistogramProps {
  data?: any;
  title?: string;
}

export default function FrequencyHistogram({ data, title = "Frequency Distribution" }: FrequencyHistogramProps) {
  // Generate sample data if none provided
  const chartData = data || {
    labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50+'],
    datasets: [{
      label: 'Frequency',
      data: [12, 19, 25, 15, 10, 5],
      backgroundColor: 'rgba(0, 224, 255, 0.8)'
    }]
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
      <div className="flex-1">
        <BarChart
          data={chartData}
          height={250}
          showLegend={false}
        />
      </div>
    </div>
  );
}