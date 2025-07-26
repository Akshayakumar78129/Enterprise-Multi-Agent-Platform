import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const PerformanceExplorer = ({
  data = {},
  selectedKPIs = [],
  onKPISelect = null,
  dateRange = null,
  onDateRangeChange = null,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState("actual_vs_predicted"); // "actual_vs_predicted", "deviations", "multi_kpi"
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [zoomLevel, setZoomLevel] = useState("full");

  // Get available KPIs
  const availableKPIs = Object.keys(data);
  const currentKPI = selectedKPI || availableKPIs[0] || "daily_revenue";

  // Prepare chart data based on view mode
  const chartData = useMemo(() => {
    if (!data[currentKPI] || data[currentKPI].length === 0) {
      return { data: [], layout: {} };
    }

    const kpiData = data[currentKPI];
    const traces = [];

    if (viewMode === "actual_vs_predicted") {
      // Actual values line
      traces.push({
        x: kpiData.map(d => d.date),
        y: kpiData.map(d => d.actual),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Actual',
        line: { color: '#00e0ff', width: 3 },
        marker: { size: 6, color: '#00e0ff' },
        hovertemplate: '<b>Actual</b><br>Date: %{x}<br>Value: %{y:,.2f}<extra></extra>'
      });

      // Predicted values line
      if (kpiData.some(d => d.predicted !== undefined)) {
        traces.push({
          x: kpiData.map(d => d.date),
          y: kpiData.map(d => d.predicted || null),
          type: 'scatter',
          mode: 'lines',
          name: 'Predicted',
          line: { color: '#5fd4d6', width: 2, dash: 'dash' },
          hovertemplate: '<b>Predicted</b><br>Date: %{x}<br>Value: %{y:,.2f}<extra></extra>'
        });

        // Confidence interval (simulated)
        const upper = kpiData.map(d => (d.predicted || d.actual) * 1.1);
        const lower = kpiData.map(d => (d.predicted || d.actual) * 0.9);
        
        traces.push({
          x: kpiData.map(d => d.date),
          y: upper,
          type: 'scatter',
          mode: 'lines',
          line: { width: 0 },
          showlegend: false,
          hoverinfo: 'skip'
        });

        traces.push({
          x: kpiData.map(d => d.date),
          y: lower,
          type: 'scatter',
          mode: 'lines',
          fill: 'tonexty',
          fillcolor: 'rgba(0, 224, 255, 0.2)',
          line: { width: 0 },
          name: 'Confidence Interval',
          hoverinfo: 'skip'
        });
      }
    } else if (viewMode === "deviations") {
      // Deviation bars
      traces.push({
        x: kpiData.map(d => d.date),
        y: kpiData.map(d => d.deviation || 0),
        type: 'bar',
        name: 'Deviations',
        marker: {
          color: kpiData.map(d => {
            const dev = d.deviation || 0;
            if (dev > 0) return '#00e0ff';      // Positive deviation - Electric Cyan
            if (dev < 0) return '#e930ff';      // Negative deviation - Signal Magenta
            return '#3a4459';                   // No deviation - Graphite
          }),
          opacity: 0.8
        },
        hovertemplate: '<b>Deviation</b><br>Date: %{x}<br>Value: %{y:,.2f}<extra></extra>'
      });

      // Zero reference line
      traces.push({
        x: kpiData.map(d => d.date),
        y: kpiData.map(() => 0),
        type: 'scatter',
        mode: 'lines',
        name: 'Zero Line',
        line: { color: '#f7f9fb', width: 1, dash: 'dash' },
        showlegend: false,
        hoverinfo: 'skip'
      });
    } else if (viewMode === "multi_kpi") {
      // Multiple KPIs overlay
      selectedKPIs.forEach((kpiName, index) => {
        if (data[kpiName]) {
          const colors = ['#00e0ff', '#e930ff', '#ffa500', '#32cd32', '#ff69b4'];
          traces.push({
            x: data[kpiName].map(d => d.date),
            y: data[kpiName].map(d => d.actual),
            type: 'scatter',
            mode: 'lines+markers',
            name: formatKPIName(kpiName),
            line: { color: colors[index % colors.length], width: 2 },
            marker: { size: 4, color: colors[index % colors.length] },
            yaxis: index > 0 ? `y${index + 1}` : 'y',
            hovertemplate: `<b>${formatKPIName(kpiName)}</b><br>Date: %{x}<br>Value: %{y:,.2f}<extra></extra>`
          });
        }
      });
    }

    const layout = {
      title: {
        text: `${formatKPIName(currentKPI)} - ${viewMode.replace(/_/g, ' ').toUpperCase()}`,
        font: { color: '#f7f9fb', size: 16 }
      },
      xaxis: {
        title: 'Date',
        color: '#f7f9fb',
        gridcolor: 'rgba(58, 68, 89, 0.2)',
        type: 'date'
      },
      yaxis: {
        title: 'Value',
        color: '#f7f9fb',
        gridcolor: 'rgba(58, 68, 89, 0.2)'
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: { color: '#f7f9fb' },
      legend: {
        font: { color: '#f7f9fb' },
        bgcolor: 'rgba(26, 32, 56, 0.8)'
      },
      margin: { l: 60, r: 40, t: 60, b: 60 },
      hovermode: 'x unified'
    };

    return { data: traces, layout };
  }, [data, currentKPI, viewMode, selectedKPIs]);

  const handleKPISelection = (kpi) => {
    setSelectedKPI(kpi);
    if (onKPISelect) {
      onKPISelect([kpi]);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  if (isLoading) {
    return (
      <Card title="Performance Explorer" isLoading={true}>
        <div style={{ height: "480px" }} />
      </Card>
    );
  }

  if (availableKPIs.length === 0) {
    return (
      <Card title="Performance Explorer">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "480px",
            color: "#5891cb",
          }}
        >
          No performance data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Performance Explorer"
      subtitle={`${availableKPIs.length} KPIs available`}
    >
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* KPI Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            KPI:
          </label>
          <select
            value={currentKPI}
            onChange={(e) => handleKPISelection(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#232a36',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            {availableKPIs.map(kpi => (
              <option key={kpi} value={kpi}>
                {formatKPIName(kpi)}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            View:
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { value: 'actual_vs_predicted', label: 'Actual vs Predicted' },
              { value: 'deviations', label: 'Deviations' },
              { value: 'multi_kpi', label: 'Multi-KPI' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => handleViewModeChange(mode.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: viewMode === mode.value ? '#00e0ff' : '#232a36',
                  color: viewMode === mode.value ? '#0a1224' : '#f7f9fb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: "480px" }}>
        <Plot
          data={chartData.data}
          layout={{
            ...chartData.layout,
            width: undefined,
            height: 480,
            autosize: true
          }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            responsive: true
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Statistics Summary */}
      {data[currentKPI] && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'rgba(58, 68, 89, 0.2)',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#5891cb', fontSize: '12px' }}>Data Points</div>
            <div style={{ color: '#f7f9fb', fontSize: '16px', fontWeight: '600' }}>
              {data[currentKPI].length}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#5891cb', fontSize: '12px' }}>Avg Value</div>
            <div style={{ color: '#f7f9fb', fontSize: '16px', fontWeight: '600' }}>
              {(data[currentKPI].reduce((sum, d) => sum + d.actual, 0) / data[currentKPI].length).toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#5891cb', fontSize: '12px' }}>Date Range</div>
            <div style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '600' }}>
              {data[currentKPI].length > 0 ? 
                `${data[currentKPI][0].date.split('T')[0]} to ${data[currentKPI][data[currentKPI].length - 1].date.split('T')[0]}` 
                : 'N/A'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Helper function to format KPI names
function formatKPIName(kpiName) {
  return kpiName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

export default PerformanceExplorer; 