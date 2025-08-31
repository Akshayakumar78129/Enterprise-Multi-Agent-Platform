import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { handleChartClick } from '../../utils/chartSelectionHelper';

const AmountDistributionHistogram = ({ data }) => {
  const [isApiReady, setIsApiReady] = useState(false);
  
  useEffect(() => {
    // Check if ChartSelectionManager API is available
    const checkApi = () => {
      if (window.chartSelectionAPI) {
        console.log('AmountDistribution: ChartSelectionManager API is ready');
        setIsApiReady(true);
      } else {
        console.log('AmountDistribution: Waiting for ChartSelectionManager API...');
        setTimeout(checkApi, 100);
      }
    };
    checkApi();
  }, []);
  
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
        console.log('AmountDistribution Click Event:', event);
        if (!event.points || event.points.length === 0) return;
        const point = event.points[0];
        const { x: binName, y: count } = point;
        
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
          chartId: 'amount-distribution',
          chartType: 'Amount Distribution',
          label: binName,
          value: count,
          unit: ' transactions',
          metadata: {
            binName,
            count,
            percentage: ((count / data.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)
          }
        }, mouseEvent);
      }}
    />
  );
};

export default AmountDistributionHistogram;
