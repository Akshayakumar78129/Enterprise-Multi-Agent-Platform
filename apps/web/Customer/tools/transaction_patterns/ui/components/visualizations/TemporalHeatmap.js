import React, { useState, useEffect, useRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const TemporalHeatmap = ({
  data = [],
  isLoading = false,
  width = 600,
  height = 400,
  onCellClick = null,
  highlightCells = [],
  colorScale = null
}) => {
  const [plotData, setPlotData] = useState(null);
  const plotRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Prepare data for heatmap
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Create matrix for heatmap
    const matrix = days.map(day => 
      hours.map(hour => {
        const point = data.find(d => d.day === day && d.hour === hour);
        return point ? point.transactionCount : 0;
      })
    );

    // Custom text for hover
    const hoverText = days.map(day => 
      hours.map(hour => {
        const point = data.find(d => d.day === day && d.hour === hour);
        if (!point || point.transactionCount === 0) {
          return `${day} ${hour}:00<br>No transactions`;
        }
        const avgAmount = point.avgAmount || 0;
        return `${day} ${hour}:00<br>Transactions: ${point.transactionCount}<br>Avg Amount: $${avgAmount.toFixed(2)}`;
      })
    );

    const defaultColorScale = [
      [0, '#0a1224'],      // Midnight Navy
      [0.3, '#1a2b42'],    // Darker blue
      [0.6, '#2d4a66'],    // Medium blue  
      [0.8, '#4a7c8a'],    // Blue-cyan
      [1, '#00e0ff']       // Electric Cyan
    ];

    const trace = {
      z: matrix,
      x: hours.map(h => `${h}:00`),
      y: days,
      type: 'heatmap',
      colorscale: colorScale || defaultColorScale,
      hoverongaps: false,
      hovertemplate: '%{text}<extra></extra>',
      text: hoverText,
      showscale: true,
      colorbar: {
        title: {
          text: "Transaction Count",
          font: { color: '#f7f9fb', size: 12 }
        },
        tickfont: { color: '#f7f9fb' },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: '#00e0ff',
        borderwidth: 1
      }
    };

    setPlotData([trace]);
  }, [data, colorScale]);

  const layout = {
    title: {
      text: 'Transaction Density by Day and Hour',
      font: { color: '#f7f9fb', size: 16 },
      x: 0.05
    },
    width: width,
    height: height,
    margin: { l: 80, r: 60, t: 60, b: 60 },
    paper_bgcolor: '#232a36',
    plot_bgcolor: '#232a36',
    font: { color: '#f7f9fb' },
    xaxis: {
      title: 'Hour of Day',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: 'Day of Week',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false
    }
  };

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    responsive: true
  };

  const handlePlotClick = (event) => {
    if (!onCellClick || !event.points || event.points.length === 0) return;
    
    const point = event.points[0];
    const day = point.y;
    const hour = parseInt(point.x.split(':')[0]);
    
    onCellClick(day, hour);
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Transaction Heatmap" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No temporal data available
        </div>
      </Card>
    );
  }

  const maxTransactions = Math.max(...data.map(d => d.transactionCount));
  const totalTransactions = data.reduce((sum, d) => sum + d.transactionCount, 0);

  return (
    <Card
      title="Transaction Heatmap"
      subtitle={`${totalTransactions.toLocaleString()} total transactions • Peak: ${maxTransactions} transactions`}
      isLoading={isLoading}
    >
      <div style={{ width: '100%', height: '100%' }}>
        {plotData && (
          <Plot
            ref={plotRef}
            data={plotData}
            layout={layout}
            config={config}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </Card>
  );
};

export default TemporalHeatmap; 