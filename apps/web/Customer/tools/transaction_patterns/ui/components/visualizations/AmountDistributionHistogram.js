import React from 'react';
import Plot from 'react-plotly.js';

const AmountDistributionHistogram = ({ data, onInsight }) => {
  if (!data || data.length === 0) {
    return <div>No transaction amount data available.</div>;
  }

  const plotData = [{
    x: data.map(d => d.binName),
    y: data.map(d => d.count),
    type: 'bar',
    marker: {
      color: 'rgba(251, 191, 36, 0.6)',
      line: {
        color: 'rgba(251, 191, 36, 1)',
        width: 1,
      },
    },
  }];

  const layout = {
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: {
      color: '#f8fafc',
      family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    },
    xaxis: {
      title: 'Transaction Amount Bins',
      gridcolor: 'rgba(148, 163, 184, 0.2)',
    },
    yaxis: {
      title: 'Number of Transactions',
      gridcolor: 'rgba(148, 163, 184, 0.2)',
    },
    margin: { l: 60, r: 30, b: 80, t: 30, pad: 4 },
    hovermode: 'closest',
  };

  return (
    <Plot
      data={plotData}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      config={{ displayModeBar: false, responsive: true }}
      onClick={(event) => {
        if (!onInsight || !event.points || event.points.length === 0) return;
        const point = event.points[0];
        const { x: binName, y: count } = point;
        const insight = {
          title: `Distribution Insights: ${binName}`,
          subtitle: 'Analysis for this transaction amount range',
          metrics: [
            { label: 'Number of Transactions', value: count.toLocaleString() },
          ],
          context: { binName, count, source: 'amountDistribution' },
        };
        onInsight(insight);
      }}
    />
  );
};

export default AmountDistributionHistogram;
