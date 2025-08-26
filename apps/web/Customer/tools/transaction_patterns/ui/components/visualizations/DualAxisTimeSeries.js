import React, { useState, useEffect, useRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";
import { handleUniversalChartClick } from "../../../../shared/utils/universalChartHelper";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const DualAxisTimeSeries = ({
  data = [],
  isLoading = false,
  width = 800,
  height = 400,
  onDataPointClick = null,
  highlightDateRange = null
}) => {
  const [plotData, setPlotData] = useState(null);
  const [keyPoints, setKeyPoints] = useState([]);
  const plotRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare traces
    const volumeTrace = {
      x: sortedData.map(d => d.date),
      y: sortedData.map(d => d.transaction_count),
      type: 'bar',
      name: 'Transaction Volume',
      marker: {
        color: '#00e0ff',
        opacity: 0.7,
        line: {
          color: '#00e0ff',
          width: 1
        }
      },
      hovertemplate: 
        '<b>%{x}</b><br>' +
        'Volume: %{y:,} transactions<br>' +
        '<extra></extra>',
      yaxis: 'y'
    };

    const valueTrace = {
      x: sortedData.map(d => d.date),
      y: sortedData.map(d => d.avg_amount),
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Average Value',
      line: {
        color: '#e930ff',
        width: 3
      },
      marker: {
        color: '#e930ff',
        size: 6,
        line: {
          color: '#ffffff',
          width: 1
        }
      },
      hovertemplate: 
        '<b>%{x}</b><br>' +
        'Avg Value: $%{y:,.2f}<br>' +
        '<extra></extra>',
      yaxis: 'y2'
    };

    // Add highlight overlay if specified
    const traces = [volumeTrace, valueTrace];
    
    if (highlightDateRange) {
      const highlightTrace = {
        x: [highlightDateRange.start, highlightDateRange.end, highlightDateRange.end, highlightDateRange.start],
        y: [0, 0, Math.max(...sortedData.map(d => d.transaction_count)), Math.max(...sortedData.map(d => d.transaction_count))],
        fill: 'toself',
        fillcolor: 'rgba(233, 48, 255, 0.1)',
        line: { color: 'rgba(233, 48, 255, 0.3)' },
        mode: 'lines',
        name: 'Highlighted Period',
        showlegend: false,
        hoverinfo: 'skip'
      };
      traces.unshift(highlightTrace);
    }

    // Compute key points
    const maxVolIdx = sortedData.reduce((maxIdx, d, i) => d.transaction_count > sortedData[maxIdx].transaction_count ? i : maxIdx, 0);
    const maxVol = sortedData[maxVolIdx];
    // Simple moving average for avg_amount to detect recent high/low
    const window = 5;
    const sma = sortedData.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = sortedData.slice(start, i + 1).map(x => x.avg_amount);
      return slice.reduce((s, v) => s + v, 0) / slice.length;
    });
    const lastN = Math.min(20, sortedData.length);
    const recent = sma.slice(-lastN);
    const recentHigh = Math.max(...recent);
    const recentLow = Math.min(...recent);
    const recentHighIdx = sma.lastIndexOf(recentHigh);
    const recentLowIdx = sma.lastIndexOf(recentLow);
    const trend = (() => {
      const first = sortedData[0].avg_amount;
      const last = sortedData[sortedData.length - 1].avg_amount;
      const pct = first ? ((last - first) / first) * 100 : 0;
      if (pct > 5) return `Avg value trending up (+${pct.toFixed(1)}%)`;
      if (pct < -5) return `Avg value trending down (${pct.toFixed(1)}%)`;
      return 'Avg value stable';
    })();

    setKeyPoints([
      `★ Max volume: ${maxVol.date} (${maxVol.transaction_count.toLocaleString()} tx)`,
      `Recent high avg value: $${sortedData[recentHighIdx].avg_amount.toFixed(2)} on ${sortedData[recentHighIdx].date}`,
      `Recent low avg value: $${sortedData[recentLowIdx].avg_amount.toFixed(2)} on ${sortedData[recentLowIdx].date}`,
      trend
    ]);

    setPlotData(traces);
  }, [data, highlightDateRange]);

  const layout = {
    title: {
      text: 'Transaction Volume and Average Value Over Time',
      font: { color: '#f7f9fb', size: 16 },
      x: 0.05
    },
    width: width,
    height: height,
    margin: { l: 80, r: 80, t: 60, b: 60 },
    paper_bgcolor: '#232a36',
    plot_bgcolor: '#232a36',
    font: { color: '#f7f9fb' },
    
    xaxis: {
      title: 'Date',
      tickfont: { color: '#f7f9fb' },
      titlefont: { color: '#f7f9fb' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false,
      type: 'date'
    },
    
    yaxis: {
      title: 'Transaction Count',
      titlefont: { color: '#00e0ff' },
      tickfont: { color: '#00e0ff' },
      gridcolor: '#3a4a5c',
      showgrid: true,
      zeroline: false,
      side: 'left'
    },
    
    yaxis2: {
      title: 'Average Transaction Value ($)',
      titlefont: { color: '#e930ff' },
      tickfont: { color: '#e930ff' },
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      zeroline: false
    },
    
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: '#3a4a5c',
      borderwidth: 1,
      font: { color: '#f7f9fb' }
    },
    
    hovermode: 'x unified'
  };

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    responsive: true
  };

  const handlePlotClick = (event) => {
    if (!event.points || event.points.length === 0) return;
    
    const point = event.points[0];
    const clickedDate = point.x;
    const dataPoint = data.find(d => d.date === clickedDate);
    
    if (dataPoint) {
      // Use universal chart click handler for shift-click support
      const value = point.data.name === 'Transaction Volume' 
        ? dataPoint.transaction_count 
        : dataPoint.avg_amount;
      
      const unit = point.data.name === 'Transaction Volume' 
        ? ' transactions'
        : '';
      
      handleUniversalChartClick({
        chartId: 'dual-axis-time-series',
        chartType: 'time-series',
        label: `${clickedDate} - ${point.data.name}`,
        value: value,
        unit: unit,
        metadata: dataPoint
      }, event.event);
      
      // Also call original handler if provided
      if (onDataPointClick) {
        onDataPointClick(dataPoint);
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card title="Time Series Analysis" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
            color: "#5891cb",
          }}
        >
          No time series data available
        </div>
      </Card>
    );
  }

  const totalTransactions = data.reduce((sum, d) => sum + d.transaction_count, 0);
  const avgValue = data.reduce((sum, d) => sum + d.avg_amount, 0) / data.length;
  const dateRange = data.length > 0 ? `${data[0].date} to ${data[data.length - 1].date}` : '';

  return (
    <Card
      title="Time Series Analysis"
      subtitle={`${totalTransactions.toLocaleString()} transactions • $${avgValue.toFixed(2)} avg value • ${dateRange}`}
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

export default DualAxisTimeSeries; 