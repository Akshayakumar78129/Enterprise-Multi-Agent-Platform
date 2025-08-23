import React from 'react';
import Plot from 'react-plotly.js';

const ProductMatrixScatterPlot = ({ data, onInsight }) => {
  if (!data || data.length === 0) {
    return <div>No product data available.</div>;
  }

  const plotData = [{
    x: data.map(d => d.total_quantity),
    y: data.map(d => d.total_value),
    text: data.map(d => d.name),
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 12,
      color: data.map(d => d.total_value / d.total_quantity),
      colorscale: 'Viridis',
      showscale: true,
      colorbar: {
        title: 'Avg. Price',
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
      title: 'Total Quantity Sold',
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      type: 'log',
      autorange: true
    },
    yaxis: {
      title: 'Total Sales Value',
      gridcolor: 'rgba(148, 163, 184, 0.2)',
      type: 'log',
      autorange: true
    },
    margin: { l: 80, r: 30, b: 60, t: 30, pad: 4 },
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
        const { text: name, x: total_quantity, y: total_value } = point;
        const insight = {
          title: `Product Insights: ${name}`,
          subtitle: 'Performance analysis for this product',
          metrics: [
            { label: 'Total Quantity Sold', value: total_quantity.toLocaleString() },
            { label: 'Total Sales Value', value: `$${total_value.toLocaleString()}` },
          ],
          context: { name, total_quantity, total_value, source: 'productMatrix' },
        };
        onInsight(insight);
      }}
    />
  );
};

export default ProductMatrixScatterPlot;
