import React from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface ActionPriorityProps {
  data: Array<{
    action_name: string;
    financial_impact: number;
    effort_score: number;
    affected_items: number;
    quadrant: string;
  }>;
  onBubbleClick: (data: any, type: string) => void;
}

const ActionPriorityMatrix: React.FC<ActionPriorityProps> = ({ data, onBubbleClick }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(247, 249, 251, 0.5)' }}>No priority actions available</div>;
  }

  const colorMap = {
    'Quick Win': 'rgba(0, 255, 136, 0.6)',
    'Major Project': 'rgba(93, 212, 214, 0.6)',
    'Fill-In': 'rgba(170, 69, 221, 0.6)',
    'Consider Later': 'rgba(233, 48, 255, 0.6)'
  };

  const plotData = [{
    type: 'scatter',
    mode: 'markers+text',
    x: data.map(d => d.effort_score),
    y: data.map(d => d.financial_impact),
    text: data.map(d => d.action_name.split(' - ')[1]),
    textposition: 'top center',
    marker: {
      size: data.map(d => Math.sqrt(d.affected_items) * 5),
      color: data.map(d => colorMap[d.quadrant] || 'rgba(0, 224, 255, 0.6)'),
      line: { color: '#00e0ff', width: 1 }
    },
    hovertemplate: '<b>%{text}</b><br>Impact: $%{y:,.0f}<br>Effort: %{x}<br>Items: %{marker.size}<extra></extra>'
  }];

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: '#f7f9fb', family: 'Inter, sans-serif' },
    margin: { t: 40, r: 40, b: 60, l: 80 },
    xaxis: {
      title: 'Implementation Effort →',
      gridcolor: 'rgba(58, 68, 89, 0.2)',
      range: [0, 5]
    },
    yaxis: {
      title: 'Financial Impact ($) →',
      gridcolor: 'rgba(58, 68, 89, 0.2)'
    },
    hovermode: 'closest',
    annotations: [
      { x: 1, y: 0.95, xref: 'paper', yref: 'paper', text: 'Quick Wins', showarrow: false, font: { color: '#00ff88' } },
      { x: 0, y: 0.95, xref: 'paper', yref: 'paper', text: 'Major Projects', showarrow: false, font: { color: '#5fd4d6' } },
      { x: 1, y: 0.05, xref: 'paper', yref: 'paper', text: 'Fill-Ins', showarrow: false, font: { color: '#aa45dd' } },
      { x: 0, y: 0.05, xref: 'paper', yref: 'paper', text: 'Consider Later', showarrow: false, font: { color: '#e930ff' } }
    ]
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Plot
        data={plotData}
        layout={layout}
        config={{ displayModeBar: false }}
        style={{ width: '100%', height: '100%' }}
        onClick={(event) => {
          onBubbleClick(event.points[0], 'priority_matrix');
        }}
      />
    </div>
  );
};

export default ActionPriorityMatrix;