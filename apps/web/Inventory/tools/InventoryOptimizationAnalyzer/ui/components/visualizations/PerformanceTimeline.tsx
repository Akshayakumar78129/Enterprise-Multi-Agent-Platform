import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface PerformanceTimelineProps {
  data: Array<{
    date: string;
    health_score: number;
    inventory_value: number;
    stockout_risk_items: number;
    total_holding_cost: number;
  }>;
  metric: string;
  onPointClick: (data: any, type: string) => void;
}

const PerformanceTimeline: React.FC<PerformanceTimelineProps> = ({ data, metric, onPointClick }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(247, 249, 251, 0.5)' }}>No timeline data available</div>;
  }

  const x = data.map(d => d.date);
  let y, yTitle;

  switch (metric) {
    case 'inventory_value':
      y = data.map(d => d.inventory_value);
      yTitle = 'Inventory Value ($)';
      break;
    case 'stockout_risk':
      y = data.map(d => d.stockout_risk_items);
      yTitle = 'Stockout Risk Items';
      break;
    case 'holding_cost':
      y = data.map(d => d.total_holding_cost);
      yTitle = 'Holding Cost ($)';
      break;
    default:
      y = data.map(d => d.health_score);
      yTitle = 'Health Score (%)';
  }

  const plotData = [{
    type: 'scatter',
    mode: 'lines+markers',
    x,
    y,
    line: { color: '#00e0ff', width: 3 },
    marker: { color: '#00e0ff', size: 8 },
    fill: 'tozeroy',
    fillcolor: 'rgba(0, 224, 255, 0.1)'
  }];

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#f7f9fb', family: 'Inter, sans-serif' },
    margin: { t: 40, r: 40, b: 60, l: 60 },
    xaxis: {
      gridcolor: 'rgba(58, 68, 89, 0.2)',
      tickangle: -45
    },
    yaxis: {
      title: yTitle,
      gridcolor: 'rgba(58, 68, 89, 0.2)'
    },
    hovermode: 'closest'
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={{ displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
        onClick={(event) => {
          onPointClick(event.points[0], 'timeline');
        }}
      />
    </div>
  );
};

export default PerformanceTimeline;