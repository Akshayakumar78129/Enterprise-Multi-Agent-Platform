import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { handleChartClick } from '../../utils/chartSelectionHelper';

const ProductMatrixScatterPlot = ({ data }) => {
  const [isApiReady, setIsApiReady] = useState(false);
  
  useEffect(() => {
    // Check if ChartSelectionManager API is available
    const checkApi = () => {
      if (window.chartSelectionAPI) {
        console.log('ProductMatrix: ChartSelectionManager API is ready');
        setIsApiReady(true);
      } else {
        console.log('ProductMatrix: Waiting for ChartSelectionManager API...');
        setTimeout(checkApi, 100);
      }
    };
    checkApi();
  }, []);
  
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
        console.log('ProductMatrix Click Event:', event);
        if (!event.points || event.points.length === 0) return;
        const point = event.points[0];
        const { text: name, x: total_quantity, y: total_value } = point;
        
        // Get the actual mouse event with coordinates
        const mouseEvent = event.event || {};
        console.log('Original mouseEvent:', mouseEvent);
        
        // Plotly provides clientX/clientY which are viewport coordinates
        // We should use these directly, not pageX/pageY which include scroll
        if (!mouseEvent.clientX) {
          // Try to get from the original event
          if (event.event) {
            mouseEvent.clientX = event.event.clientX;
            mouseEvent.clientY = event.event.clientY;
            mouseEvent.shiftKey = event.event.shiftKey;
          }
          
          // If still no coordinates, get from the clicked element
          if (!mouseEvent.clientX || !mouseEvent.clientY) {
            const chartElement = event.event?.target || event.event?.srcElement;
            if (chartElement) {
              const rect = chartElement.getBoundingClientRect();
              mouseEvent.clientX = rect.left + rect.width / 2;
              mouseEvent.clientY = rect.top + rect.height / 2;
            } else {
              mouseEvent.clientX = window.innerWidth / 2;
              mouseEvent.clientY = window.innerHeight / 2;
            }
          }
        }
        
        console.log('Final mouseEvent:', mouseEvent);
        console.log('ChartSelectionAPI available?', !!window.chartSelectionAPI);
        
        // Use the chart selection helper for multi-select support
        handleChartClick({
          chartId: 'product-matrix',
          chartType: 'Product Matrix',
          label: name,
          value: total_value,
          unit: '',
          metadata: {
            productName: name,
            quantity: total_quantity,
            totalValue: total_value,
            avgPrice: total_value / total_quantity,
            formattedValue: `$${total_value.toLocaleString()}`,
            formattedQuantity: total_quantity.toLocaleString()
          }
        }, mouseEvent);
      }}
    />
  );
};

export default ProductMatrixScatterPlot;
