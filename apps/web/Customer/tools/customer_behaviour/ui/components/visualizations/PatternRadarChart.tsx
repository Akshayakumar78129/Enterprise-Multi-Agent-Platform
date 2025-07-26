import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BehaviourPattern } from '../../types';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PatternRadarChartProps {
  patterns: BehaviourPattern[];
  highlights?: { customer_id?: string };
  width?: number;
  height?: number;
}

const PatternRadarChart: React.FC<PatternRadarChartProps> = ({ patterns, highlights, width = 500, height = 400 }) => {
  // Example: plot frequency, recency, avg_order_value for each customer
  const categories = ['frequency', 'recency', 'avg_order_value'];
  const data = patterns.map(p => ({
    type: 'scatterpolar',
    r: [p.frequency, p.recency, p.avg_order_value],
    theta: categories,
    fill: 'toself',
    name: `Customer ${p.customer_id}`,
    line: { color: highlights?.customer_id === p.customer_id ? '#e930ff' : '#00e0ff' },
    opacity: highlights?.customer_id === p.customer_id ? 1 : 0.3,
  }));

  return (
    <Plot
      data={data}
      layout={{
        width,
        height,
        polar: {
          radialaxis: { visible: true, range: [0, Math.max(...patterns.map(p => Math.max(p.frequency, p.recency, p.avg_order_value)), 1)] }
        },
        showlegend: false,
        paper_bgcolor: '#232a36',
        plot_bgcolor: '#232a36',
        font: { family: 'inherit', color: '#f7f9fb' },
        margin: { t: 40, l: 20, r: 20, b: 20 },
        title: 'Customer Behaviour Radar',
      }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default PatternRadarChart; 