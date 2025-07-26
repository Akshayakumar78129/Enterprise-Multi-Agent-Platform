import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PatternIntervalHistogramProps } from '../../types';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const PatternIntervalHistogram: React.FC<PatternIntervalHistogramProps> = ({ patterns, layoutProps, configProps }) => {
  // Ensure patterns is an array before mapping, default to empty array if undefined or not an array
  const safePatterns = Array.isArray(patterns) ? patterns : [];

  const recencies = useMemo(() => safePatterns.map(p => p.recency), [safePatterns]);
  const frequencies = useMemo(() => safePatterns.map(p => p.frequency), [safePatterns]);
  const monetaryValues = useMemo(() => safePatterns.map(p => p.monetary_value), [safePatterns]);

  // Default layout and config if not provided
  const defaultLayout = {
    width: 500,
    height: 400,
    title: 'Pattern Interval Histogram',
    barmode: 'stack',
    xaxis: { title: 'Value' },
    yaxis: { title: 'Count' },
    paper_bgcolor: '#1E293B', 
    plot_bgcolor: '#1E293B',
    font: { color: '#E2E8F0' }
  };

  const defaultProps = {
    displayModeBar: false,
  };

  return (
    <Plot
      data={[
        {
          x: recencies,
          type: 'histogram',
          name: 'Recency',
          marker: { color: '#00e0ff' }, // Electric Cyan
        },
        {
          x: frequencies,
          type: 'histogram',
          name: 'Frequency',
          marker: { color: '#e930ff' }, // Signal Magenta
        },
        {
          x: monetaryValues,
          type: 'histogram',
          name: 'Monetary Value',
          marker: { color: '#34D399' }, // A shade of green for contrast
        },
      ]}
      layout={{ ...defaultLayout, ...layoutProps }}
      config={{ ...defaultProps, ...configProps }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default PatternIntervalHistogram; 