import React, { useState, useEffect, useRef } from "react";
import { handleChartClick } from '../../utils/chartSelectionHelper';
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const DualAxisTimeSeries = ({
  data = [],
  isLoading = false,
  width = 800,
  height = 400,
  onDataPointClick = null,
  highlightDateRange = null,
  selectedPoints = [] // array of { chartId, index, label }
}) => {
  const [plotData, setPlotData] = useState(null);
  const [keyPoints, setKeyPoints] = useState([]);
  const plotRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare traces with selection highlighting (match other charts)
    const normalizeDateStr = (val) => {
      if (!val) return '';
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      const s = String(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
      return s.slice(0, 10);
    };
    const selectedLabels = new Set((selectedPoints||[])
      .filter(p => p.chartId === 'time_series')
      .map(p => normalizeDateStr(p.label))
    );

    const volumeTrace = {
      x: sortedData.map(d => d.date),
      y: sortedData.map(d => d.transaction_count),
      type: 'bar',
      name: 'Transaction Volume',
      marker: {
        color: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 'rgba(57,255,20,0.85)' : '#00e0ff'),
        opacity: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 0.95 : 0.7),
        line: {
          color: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 'rgba(57,255,20,1)' : '#00e0ff'),
          width: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 2 : 1)
        }
      },
      hoverinfo: 'skip',
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
        color: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 'rgba(57,255,20,1)' : '#e930ff'),
        size: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 9 : 6),
        line: {
          color: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? '#39ff14' : '#ffffff'),
          width: sortedData.map(d => selectedLabels.has(normalizeDateStr(d.date)) ? 2 : 1)
        }
      },
      hoverinfo: 'skip',
      yaxis: 'y2'
    };

    // Prepare traces and keep highlight as a non-interactive layout shape
    const traces = [volumeTrace, valueTrace];

    // Compute key points (robust against missing/NaN values)
    const safeNumber = (v, def = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : def;
    };

    const maxVolIdx = sortedData.reduce((maxIdx, d, i) => {
      const curr = safeNumber(d.transaction_count, 0);
      const maxVal = safeNumber(sortedData[maxIdx]?.transaction_count, 0);
      return curr > maxVal ? i : maxIdx;
    }, 0);
    const maxVol = sortedData[maxVolIdx];

    // Simple moving average for avg_amount to detect recent high/low
    const windowSize = 5;
    const sma = sortedData.map((d, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const slice = sortedData.slice(start, i + 1).map(x => safeNumber(x.avg_amount, 0));
      const sum = slice.reduce((s, v) => s + v, 0);
      const count = slice.length || 1;
      return sum / count;
    });

    const lastN = Math.min(20, sortedData.length);
    const recentSlice = sma.slice(-lastN).filter(Number.isFinite);
    let recentHighIdx = -1;
    let recentLowIdx = -1;
    if (recentSlice.length > 0) {
      const recentHigh = Math.max(...recentSlice);
      const recentLow = Math.min(...recentSlice);
      recentHighIdx = sma.lastIndexOf(recentHigh);
      recentLowIdx = sma.lastIndexOf(recentLow);
    }

    const trend = (() => {
      const first = safeNumber(sortedData[0]?.avg_amount, 0);
      const last = safeNumber(sortedData[sortedData.length - 1]?.avg_amount, 0);
      const pct = first ? ((last - first) / first) * 100 : 0;
      if (pct > 5) return `Avg value trending up (+${pct.toFixed(1)}%)`;
      if (pct < -5) return `Avg value trending down (${pct.toFixed(1)}%)`;
      return 'Avg value stable';
    })();

    const kp = [];
    if (maxVol && Number.isFinite(safeNumber(maxVol.transaction_count))) {
      kp.push(`★ Max volume: ${maxVol.date} (${safeNumber(maxVol.transaction_count).toLocaleString()} tx)`);
    }
    if (recentHighIdx >= 0 && sortedData[recentHighIdx]) {
      const amt = safeNumber(sortedData[recentHighIdx].avg_amount, 0);
      kp.push(`Recent high avg value: $${amt.toFixed(2)} on ${sortedData[recentHighIdx].date}`);
    }
    if (recentLowIdx >= 0 && sortedData[recentLowIdx]) {
      const amt = safeNumber(sortedData[recentLowIdx].avg_amount, 0);
      kp.push(`Recent low avg value: $${amt.toFixed(2)} on ${sortedData[recentLowIdx].date}`);
    }
    kp.push(trend);

    setKeyPoints(kp);

    setPlotData(traces);
  }, [data, highlightDateRange, selectedPoints]);

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
    
    hovermode: 'closest',
    clickmode: 'event+select',
    shapes: (highlightDateRange ? [{
      type: 'rect',
      xref: 'x', yref: 'paper',
      x0: highlightDateRange.start,
      x1: highlightDateRange.end,
      y0: 0, y1: 1,
      fillcolor: 'rgba(233,48,255,0.08)',
      line: { color: 'rgba(233,48,255,0.25)', width: 1 },
      layer: 'below'
    }] : [])
  };

  const config = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    responsive: true
  };

  // Local mini insight shown atop the chart
  const [miniInsight, setMiniInsight] = useState(null); // { title, bullets: string[] }



  const handlePlotClick = (event) => {
    if (!event.points || event.points.length === 0) return;

    // Only enable Shift+Click. Normal clicks do nothing.
    const nativeEvt = event?.event || event?.nativeEvent || event;
    const shift = !!(event?.event?.shiftKey || event?.shiftKey || event?.nativeEvent?.shiftKey || event?.points?.[0]?.event?.shiftKey);
    if (!shift) return;

    const point = event.points[0];
    const rawX = point.x;

    // Normalize to YYYY-MM-DD for robust selection matching
    const normalizeDateStr = (val) => {
      if (!val) return '';
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      const s = String(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
      return s;
    };
    const clickedDate = normalizeDateStr(rawX);
    const dataPoint = data.find(d => normalizeDateStr(d.date) === clickedDate);
    if (!dataPoint) return;

    // Build 2-3 concise bullets (shown only on Shift+Click)
    const bullets = [];
    bullets.push(`Transactions: ${(dataPoint.transaction_count||0).toLocaleString()}`);
    bullets.push(`Avg value: $${(dataPoint.avg_amount||0).toFixed(2)}`);

    const idx = data.findIndex(d => normalizeDateStr(d.date) === clickedDate);
    if (idx >= 6) {
      const slice = data.slice(idx - 6, idx + 1);
      const start = slice[0].transaction_count;
      const end = slice[6].transaction_count;
      if (start > 0) {
        const pct = ((end - start) / start) * 100;
        if (pct > 15) bullets.push(`Trend: up ${Math.round(pct)}% (7d)`);
        else if (pct < -15) bullets.push(`Trend: down ${Math.round(Math.abs(pct))}% (7d)`);
      }
    }

    setMiniInsight({ title: `Activity on ${clickedDate}`, bullets: bullets.slice(0,3) });

    // Use chartSelectionHelper for multi-selection
    try {
      handleChartClick({
        chartId: 'time_series',
        chartType: 'bar+line',
        label: clickedDate,
        value: dataPoint.transaction_count,
        unit: ' tx',
        index: idx,
        metadata: { avg_amount: dataPoint.avg_amount }
      }, nativeEvt, true);
    } catch {}

    // Notify parent only on Shift+Click
    if (onDataPointClick) {
      const enriched = { ...dataPoint, _index: idx };
      onDataPointClick(enriched, nativeEvt);
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
          Loading data or no records in selected range
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
      tooltip="Displays transaction volume and average amounts over time.\nBlue line shows transaction count, orange shows average values. Click points for detailed insights."
    >
      <div 
        data-type="chart" 
        data-title="Time Series Analysis" 
        data-value={`${totalTransactions.toLocaleString()} transactions analyzed`}
        style={{ width: '100%', height: '100%' }}
      >
        {plotData && (
          <Plot
            ref={plotRef}
            data={plotData}
            layout={layout}
            config={config}
            onClick={(event) => {
              if (!event.points || event.points.length === 0) return;
              const isShiftClick = !!(event?.event?.shiftKey);
              if (isShiftClick) {
                handlePlotClick(event);
                return;
              }
              // Regular click: no selection, keep existing mini insight logic via handlePlotClick if needed
            }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
        {miniInsight && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 12,
            background: 'rgba(35,42,54,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '8px 10px',
            color: '#dbe7ff',
            fontSize: 12,
            zIndex: 5,
            maxWidth: 320
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#a5b4fc' }}>{miniInsight.title}</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {miniInsight.bullets.map((b, i)=>(<li key={i} style={{ marginBottom: 2 }}>{b}</li>))}
            </ul>
          </div>
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