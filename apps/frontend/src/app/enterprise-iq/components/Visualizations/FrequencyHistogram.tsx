"use client";

import React from 'react';
import { BarChart } from 'components';

interface FrequencyHistogramProps {
  data?: any;
  title?: string;
}

export default function FrequencyHistogram(props: FrequencyHistogramProps) {
  // Handle both direct props and data-wrapped props
  const actualData = props.data || props;
  const { title = "Frequency Distribution", labels, datasets } = actualData as any;

  // Process real data from backend - check for data in multiple formats
  const chartData = (() => {
    // First check if labels and datasets are passed directly (from backend body)
    if (labels && datasets) {
      console.log('FrequencyHistogram: Using direct labels and datasets');
      return {
        labels: labels || [],
        datasets: (datasets || []).map((dataset, index) => ({
          label: dataset?.label || `Dataset ${index + 1}`,
          data: dataset?.data || [],
          backgroundColor: dataset?.backgroundColor || `rgba(0, 224, 255, ${0.8 - index * 0.1})`
        }))
      };
    }

    // If actualData has the expected chart.js structure, use it
    if (actualData && actualData.labels && actualData.datasets) {
      console.log('FrequencyHistogram: Using actualData.labels and actualData.datasets');
      return {
        labels: actualData.labels || [],
        datasets: (actualData.datasets || []).map((dataset, index) => ({
          label: dataset?.label || `Dataset ${index + 1}`,
          data: dataset?.data || [],
          backgroundColor: dataset?.backgroundColor || `rgba(0, 224, 255, ${0.8 - index * 0.1})`
        }))
      };
    }

    // If actualData is an array of values, create chart structure
    if (actualData && Array.isArray(actualData) && actualData.length > 0) {
      return {
        labels: actualData.map((_, i) => `Bin ${i + 1}`),
        datasets: [{
          label: 'Frequency',
          data: actualData,
          backgroundColor: 'rgba(0, 224, 255, 0.8)'
        }]
      };
    }

    // If actualData is an object with data points
    if (actualData && typeof actualData === 'object' && !Array.isArray(actualData)) {
      const keys = Object.keys(actualData);
      const values = Object.values(actualData);

      if (keys.length > 0 && keys[0] !== 'title' && keys[0] !== 'data') {
        return {
          labels: keys,
          datasets: [{
            label: title || 'Values',
            data: values,
            backgroundColor: 'rgba(0, 224, 255, 0.8)'
          }]
        };
      }
    }

    // No valid data - show empty state
    console.warn('FrequencyHistogram: No valid data provided', actualData);
    return {
      labels: ['No Data Available'],
      datasets: [{
        label: 'Waiting for data...',
        data: [0],
        backgroundColor: 'rgba(128, 128, 128, 0.3)'
      }]
    };
  })();

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