import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const RegionalTimeSeriesExplorer = ({
  data,
  selectedRegions = [],
  dateRange,
  aggregation = 'month',
  onTimeRangeChange = null,
  onRegionToggle = null,
  onAggregationChange = null,
  onShowAIInsight = null,
  isLoading = false
}) => {
  const [metric, setMetric] = useState('totalSales');
  const [showTrend, setShowTrend] = useState(false);
  const [viewMode, setViewMode] = useState('lines'); // 'lines', 'area', 'bars'
  // Fallback internal selection when parent doesn't control selectedRegions
  const [internalSelected, setInternalSelected] = useState(selectedRegions || []);
  // Normalize selected list for this render
  const activeSelected = useMemo(() => (onRegionToggle ? selectedRegions : internalSelected) || [], [onRegionToggle, selectedRegions, internalSelected]);

  // Helper functions - defined before they're used
  const getMetricLabel = (metric) => {
    const labels = {
      totalSales: 'Total Sales',
      totalQuantity: 'Quantity Sold',
      transactionCount: 'Transactions',
      regionCount: 'Active Regions'
    };
    return labels[metric] || metric;
  };

  const getAggregationLabel = (agg) => {
    const labels = {
      day: 'Date',
      week: 'Week',
      month: 'Month',
      quarter: 'Quarter'
    };
    return labels[agg] || 'Period';
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value?.toFixed(0) || 0}`;
  };

  const calculateTrendLine = (xData, yData) => {
    if (!xData || !yData || xData.length < 2) return null;

    // Simple linear regression
    const n = xData.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = yData.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * yData[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const trendY = indices.map(x => slope * x + intercept);

    return {
      x: xData,
      y: trendY,
      type: 'scatter',
      mode: 'lines'
    };
  };

  const timeSeriesData = useMemo(() => {
    if (!data || !data.byPeriod || data.byPeriod.length === 0) {
      return { traces: [], layout: {} };
    }

    const colors = [
      '#00e0ff', // Electric Cyan
      '#e930ff', // Signal Magenta  
      '#5fd4d6', // Light cyan
      '#ff6b6b', // Coral red
      '#4ecdc4', // Teal
      '#45b7d1', // Sky blue
      '#f9ca24', // Yellow
      '#6c5ce7', // Purple
      '#a0e7e5', // Mint
      '#ffeaa7'  // Light yellow
    ];

    let traces = [];

    if (activeSelected.length === 0 || activeSelected.includes('overall')) {
      // Show overall trend
      const overallTrace = {
        x: data.byPeriod.map(d => d.period),
        y: data.byPeriod.map(d => d[metric] || 0),
        type: viewMode === 'bars' ? 'bar' : 'scatter',
        mode: viewMode === 'lines' ? 'lines+markers' : 'lines',
        name: 'Overall',
        line: { color: colors[0], width: 3 },
        marker: { color: colors[0], size: 6 },
        fill: viewMode === 'area' ? 'tonexty' : 'none',
        hovertemplate: `<b>Overall</b><br/>Period: %{x}<br/>${getMetricLabel(metric)}: %{y:,.0f}<extra></extra>`
      };
      traces.push(overallTrace);
    }

    // Add regional traces
    if (data.byRegion) {
      const filteredRegions = data.byRegion.filter(region => 
        activeSelected.includes(`${region.country}-${region.state}`) ||
        activeSelected.includes(region.country) ||
        activeSelected.includes(region.state)
      );

      filteredRegions.forEach((region, index) => {
        const colorIndex = (index + 1) % colors.length;
        const trace = {
          x: region.data.map(d => d.period),
          y: region.data.map(d => d[metric] || 0),
          type: viewMode === 'bars' ? 'bar' : 'scatter',
          mode: viewMode === 'lines' ? 'lines+markers' : 'lines',
          name: `${region.state}, ${region.country}`,
          line: { color: colors[colorIndex], width: 2 },
          marker: { color: colors[colorIndex], size: 4 },
          fill: viewMode === 'area' ? 'tonexty' : 'none',
          hovertemplate: `<b>${region.state}, ${region.country}</b><br/>Period: %{x}<br/>${getMetricLabel(metric)}: %{y:,.0f}<extra></extra>`
        };
        traces.push(trace);
      });
    }

    // Add trend lines if enabled
    if (showTrend && traces.length > 0) {
      traces.forEach((trace, index) => {
        const trendTrace = calculateTrendLine(trace.x, trace.y);
        if (trendTrace) {
          traces.push({
            ...trendTrace,
            name: `${trace.name} Trend`,
            line: { 
              color: trace.line.color, 
              width: 1, 
              dash: 'dash' 
            },
            showlegend: false,
            hoverinfo: 'skip'
          });
        }
      });
    }

    const layout = {
      title: {
        text: `Regional ${getMetricLabel(metric)} Trends`,
        font: { color: '#f7f9fb', size: 16 }
      },
      xaxis: {
        title: getAggregationLabel(aggregation),
        color: '#f7f9fb',
        gridcolor: '#3a4459',
        tickfont: { color: '#f7f9fb' }
      },
      yaxis: {
        title: getMetricLabel(metric),
        color: '#f7f9fb',
        gridcolor: '#3a4459',
        tickfont: { color: '#f7f9fb' },
        tickformat: metric.includes('Sales') || metric.includes('Profit') ? '$,.0f' : ',.0f'
      },
      paper_bgcolor: '#0a1224',
      plot_bgcolor: '#0a1224',
      font: { color: '#f7f9fb' },
      legend: {
        orientation: 'h',
        y: -0.2,
        font: { color: '#f7f9fb' }
      },
      hovermode: 'x unified',
      margin: { l: 60, r: 40, t: 60, b: 80 }
    };

    return { traces, layout };
  }, [data, activeSelected, metric, viewMode, showTrend, aggregation]);



  const getAvailableRegions = () => {
    if (!data?.byRegion) return [];
    return data.byRegion.map(region => ({
      key: `${region.country}-${region.state}`,
      label: `${region.state}, ${region.country}`,
      country: region.country,
      state: region.state
    }));
  };

  const toggleRegion = (regionKey) => {
    if (onRegionToggle) {
      onRegionToggle(regionKey);
    } else {
      // Fallback internal toggle so UI remains interactive without a parent handler
      setInternalSelected(prev => {
        const exists = prev.includes(regionKey);
        const next = exists ? prev.filter(k => k !== regionKey) : [...prev, regionKey];
        return next;
      });
    }
  };



  if (!data || (!data.byPeriod?.length && !data.byRegion?.length)) {
    return (
      <Card title="Regional Time Series Explorer" isLoading={isLoading}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          color: "#5891cb",
        }}>
          No time series data available
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Regional Time Series Explorer"
      subtitle={`${data.summary?.totalPeriods || 0} periods | ${data.summary?.totalRegions || 0} regions`}
      isLoading={isLoading}
    >
      {/* Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: '#232a36',
        borderRadius: '8px',
        border: '1px solid #3a4459'
      }}>
        {/* Metric Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 'bold' }}>
            Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0a1224',
              color: '#f7f9fb',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="totalSales">Total Sales</option>
            <option value="totalQuantity">Quantity</option>
            <option value="transactionCount">Transactions</option>
            {selectedRegions.includes('overall') && (
              <option value="regionCount">Active Regions</option>
            )}
          </select>
        </div>

        {/* Aggregation Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 'bold' }}>
            Time Period
          </label>
          <select
            value={aggregation}
            onChange={(e) => onAggregationChange && onAggregationChange(e.target.value)}
            style={{
              padding: '6px 8px',
              backgroundColor: '#0a1224',
              color: '#f7f9fb',
              border: '1px solid #3a4459',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
          </select>
        </div>

        {/* View Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 'bold' }}>
            View
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['lines', 'area', 'bars'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: viewMode === mode ? '#00e0ff' : '#0a1224',
                  color: viewMode === mode ? '#0a1224' : '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#f7f9fb', fontWeight: 'bold' }}>
            Options
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#f7f9fb' }}>
              <input
                type="checkbox"
                checked={showTrend}
                onChange={(e) => setShowTrend(e.target.checked)}
                style={{ accentColor: '#00e0ff' }}
              />
              Show Trends
            </label>
            <button
              onClick={() => toggleRegion('overall')}
              style={{
                padding: '4px 8px',
                backgroundColor: activeSelected.includes('overall') ? '#00e0ff' : '#0a1224',
                color: activeSelected.includes('overall') ? '#0a1224' : '#f7f9fb',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Overall
            </button>
          </div>
        </div>
      </div>

      {/* Region Selector */}
      {data.byRegion && data.byRegion.length > 0 && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#f7f9fb', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Select Regions to Compare
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {getAvailableRegions().slice(0, 20).map(region => (
              <button
                key={region.key}
                onClick={() => toggleRegion(region.key)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: activeSelected.includes(region.key) ? '#00e0ff' : '#0a1224',
                  color: activeSelected.includes(region.key) ? '#0a1224' : '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: '500px' }}>
        {timeSeriesData.traces.length > 0 ? (
          <Plot
            data={timeSeriesData.traces}
            layout={{
              ...timeSeriesData.layout,
              height: 500,
              autosize: true
            }}
            style={{ width: '100%', height: '100%' }}
            config={{
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              responsive: true
            }}
            onInitialized={(figure, graphDiv) => {
              graphDiv.on('plotly_click', (data) => {
                if (data.points && data.points.length > 0) {
                  const point = data.points[0];
                  const event = data.event; // Get the original event for shift key detection
                  
                  // Format the value based on metric type
                  const formattedValue = metric === 'profitMargin' || metric === 'growthRate' 
                    ? `${point.y.toFixed(1)}%`
                    : metric === 'customerCount' || metric === 'transactionCount'
                    ? point.y.toLocaleString()
                    : formatCurrency(point.y);
                  
                  // Call the global addAIInsightToChat for Shift+Click multi-selection
                  if (typeof window !== 'undefined' && window.addAIInsightToChat) {
                    window.addAIInsightToChat({
                      label: `${point.data.name} - ${point.x}`,
                      value: formattedValue,
                      chartType: 'Time Series',
                      metric: getMetricLabel(metric),
                      originalEvent: event,
                      metadata: {
                        traceName: point.data.name,
                        period: point.x,
                        rawValue: point.y,
                        aggregation,
                        pointIndex: point.pointIndex,
                        isOverall: point.data.name === 'Overall'
                      }
                    });
                    
                    console.log('📈 Time series point clicked:', {
                      trace: point.data.name,
                      period: point.x,
                      value: formattedValue,
                      shiftKey: event?.shiftKey
                    });
                  }
                  
                  // Create data point context for AI insight
                  const dataPointContext = {
                    traceName: point.data.name,
                    period: point.x,
                    value: point.y,
                    metric,
                    metricLabel: getMetricLabel(metric),
                    aggregation,
                    pointIndex: point.pointIndex,
                    isOverall: point.data.name === 'Overall',
                    regionInfo: point.data.name !== 'Overall' ? {
                      name: point.data.name,
                      type: 'region'
                    } : null
                  };
                  
                  // Pass the original event with Shift key state
                  if (onShowAIInsight) {
                    onShowAIInsight(data, 'chart', `${point.data.name}-${point.x}`, dataPointContext);
                  }
                }
              });
            }}
            onHover={(event) => {
              // Add cursor pointer on hover to indicate clickability
              if (event.event && event.event.target) {
                event.event.target.style.cursor = 'pointer';
              }
            }}
          />
        ) : (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            color: "#5891cb",
          }}>
            Select regions or enable overall view to see trends
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.summary && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459',
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '12px',
          color: '#f7f9fb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#00e0ff' }}>
              {data.summary.totalPeriods}
            </div>
            <div>Time Periods</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', color: '#00e0ff' }}>
              {data.summary.totalRegions}
            </div>
            <div>Regions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: data.summary.averageGrowth >= 0 ? '#5fd4d6' : '#e930ff' 
            }}>
              {data.summary.averageGrowth >= 0 ? '+' : ''}{data.summary.averageGrowth.toFixed(1)}%
            </div>
            <div>Avg Growth</div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RegionalTimeSeriesExplorer; 