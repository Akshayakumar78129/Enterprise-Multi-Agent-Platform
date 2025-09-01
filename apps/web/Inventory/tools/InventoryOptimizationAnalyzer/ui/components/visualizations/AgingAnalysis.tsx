import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface AgingAnalysisProps {
  data: Array<{
    age_bucket: string;
    item_count: number;
    total_units: number;
    total_value: number;
  }>;
  onBarClick: (data: any, type: string) => void;
}

const AgingAnalysis: React.FC<AgingAnalysisProps> = ({ data, onBarClick }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(247, 249, 251, 0.5)' }}>No aging data available</div>;
  }

  const colorScale = [
    'rgba(0, 224, 255, 0.8)',
    'rgba(93, 212, 214, 0.8)',
    'rgba(255, 193, 69, 0.8)',
    'rgba(212, 93, 121, 0.8)',
    'rgba(233, 48, 255, 0.8)'
  ];

  const plotData = [{
    type: 'bar',
    x: data.map(d => d.age_bucket),
    y: data.map(d => d.total_value),
    text: data.map(d => `$${(d.total_value / 1000).toFixed(1)}K<br>${d.item_count} items`),
    textposition: 'outside',
    marker: {
      color: data.map((_, i) => colorScale[i % colorScale.length]),
      line: { color: '#00e0ff', width: 1 }
    },
    hovertemplate: '<b>%{x}</b><br>Value: $%{y:,.0f}<br>Items: %{text}<extra></extra>'
  }];

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#f7f9fb', family: 'Inter, sans-serif' },
    margin: { t: 40, r: 40, b: 80, l: 80 },
    xaxis: {
      title: 'Age Bucket',
      gridcolor: 'rgba(58, 68, 89, 0.2)'
    },
    yaxis: {
      title: 'Inventory Value ($)',
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
          onBarClick(event.points[0], 'aging');
        }}
      />
    </div>
  );
};

export default AgingAnalysis;