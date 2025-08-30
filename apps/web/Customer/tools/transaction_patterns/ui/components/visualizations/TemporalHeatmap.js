import React, { useState, useEffect, useRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";
import { handleChartClick } from "../../utils/chartSelectionHelper";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const TemporalHeatmap = ({
  data = [],
  isLoading = false,
  width = 600,
  height = 400,
  highlightCells = [],
  colorScale = null
}) => {
  const [plotData, setPlotData] = useState(null);
  const [keyPoints, setKeyPoints] = useState([]);
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

    // Compute key points
    const flatData = [];
    days.forEach(d => {
      hours.forEach(h => {
        const point = data.find(p => p.day === d && p.hour === h);
        flatData.push({ day: d, hour: h, count: point ? (point.transactionCount || 0) : 0 });
      });
    });
    const peak = flatData.reduce((a, b) => (b.count > a.count ? b : a), { day: 'Monday', hour: 0, count: 0 });
    const nonZero = flatData.filter(p => p.count > 0);
    const lull = nonZero.length ? nonZero.reduce((a, b) => (b.count < a.count ? b : a), nonZero[0]) : { day: peak.day, hour: peak.hour, count: peak.count };
    const weekendSet = new Set(['Saturday', 'Sunday']);
    const weekendTotal = flatData.filter(p => weekendSet.has(p.day)).reduce((s, p) => s + p.count, 0);
    const total = flatData.reduce((s, p) => s + p.count, 0) || 1;
    const weekendShare = ((weekendTotal / total) * 100).toFixed(1);
    // Top hour overall (sum across days)
    const hourSums = hours.map(h => ({ hour: h, sum: flatData.filter(p => p.hour === h).reduce((s, p) => s + p.count, 0) }));
    const topHour = hourSums.reduce((a, b) => (b.sum > a.sum ? b : a), { hour: 0, sum: 0 });

    setKeyPoints([
      `★ Peak traffic: ${peak.day} at ${peak.hour}:00 (${peak.count.toLocaleString()} tx)`,
      nonZero.length ? `Quietest active slot: ${lull.day} at ${lull.hour}:00 (${lull.count.toLocaleString()} tx)` : `All traffic concentrated around ${peak.hour}:00`,
      `Weekend share: ${weekendShare}% of all transactions`,
      `Top hour overall: ${topHour.hour}:00`
    ]);

    setPlotData([trace,]);
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

  // Add an annotation for the peak cell for quick visual cue
  const peakAnnotation = (() => {
    if (!data || data.length === 0) return [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peak = data.reduce((a, b) => ((b.transactionCount || 0) > (a.transactionCount || 0) ? b : a), data[0]);
    const x = `${peak.hour}:00`;
    const y = peak.day || 'Monday';
    return [
      {
        x,
        y,
        text: 'Peak',
        showarrow: true,
        arrowhead: 2,
        ax: 20,
        ay: -20,
        font: { color: '#00e0ff', size: 10 },
        bgcolor: 'rgba(0, 224, 255, 0.1)',
        bordercolor: '#00e0ff'
      }
    ];
  })();

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    responsive: true
  };

  const handlePlotClick = (event) => {
    if (!event.points || event.points.length === 0) return;
    
    const point = event.points[0];
    const day = point.y;
    const hour = parseInt(point.x.split(':')[0]);
    const value = point.z;
    
    // Find the actual data point to get avgAmount
    const dataPoint = data.find(d => d.day === day && d.hour === hour);
    const avgAmount = dataPoint?.avgAmount || 0;
    
    // Get the actual mouse event with coordinates
    const mouseEvent = event.event || {};
    // If no clientX/Y, try to get from the Plotly event
    if (!mouseEvent.clientX && event.event) {
      mouseEvent.clientX = event.event.pageX || event.event.x || window.innerWidth / 2;
      mouseEvent.clientY = event.event.pageY || event.event.y || window.innerHeight / 2;
    }
    
    // Use the chart selection helper for multi-select support
    handleChartClick({
      chartId: 'temporal-heatmap',
      chartType: 'Temporal Heatmap',
      label: `${day} ${hour}:00`,
      value: value,
      unit: ' transactions',
      metadata: {
        day,
        hour,
        avgAmount: avgAmount,
        formattedAvgAmount: `$${avgAmount.toFixed(2)}`
      }
    }, mouseEvent);
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
            layout={{ ...layout, annotations: peakAnnotation }}
            config={config}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      {keyPoints && keyPoints.length > 0 && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#d6e3f1',
          fontSize: 12
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: '#a5b4fc' }}>Key Points</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {keyPoints.map((kp, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{kp}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default TemporalHeatmap; 