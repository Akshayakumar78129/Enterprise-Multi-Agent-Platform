import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface CostImpactProps {
  data: Array<{
    strategy: string;
    impact: number;
    impact_type: string;
  }>;
  onBarClick: (data: any, type: string) => void;
}

const CostImpactWaterfall: React.FC<CostImpactProps> = ({ data, onBarClick }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(247, 249, 251, 0.5)' }}>No cost impact data available</div>;
  }

  const x = data.map(d => d.strategy);
  const y = data.map(d => d.impact_type === 'baseline' ? d.impact : -d.impact);
  const text = data.map(d => `$${(d.impact / 1000).toFixed(1)}K`);

  const plotData = [{
    type: 'waterfall',
    x,
    y,
    text,
    textposition: 'outside',
    connector: { line: { color: 'rgba(0, 224, 255, 0.3)', width: 2, dash: 'dot' } },
    increasing: { marker: { color: 'rgba(0, 224, 255, 0.6)' } },
    decreasing: { marker: { color: 'rgba(93, 212, 214, 0.6)' } },
    totals: { marker: { color: 'rgba(0, 255, 136, 0.6)' } }
  }];

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#f7f9fb', family: 'Inter, sans-serif' },
    margin: { t: 40, r: 40, b: 100, l: 60 },
    xaxis: {
      gridcolor: 'rgba(58, 68, 89, 0.2)',
      tickangle: -45
    },
    yaxis: {
      title: 'Cost Impact ($)',
      gridcolor: 'rgba(58, 68, 89, 0.2)'
    },
    showlegend: false,
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
          onBarClick(event.points[0], 'cost_impact');
        }}
      />
    </div>
  );
};

export default CostImpactWaterfall;