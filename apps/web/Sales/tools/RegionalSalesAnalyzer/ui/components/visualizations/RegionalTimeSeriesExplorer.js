import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import styles from "../../styles/RegionalSalesAnalyzerDashboard.module.css";

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
      '#fbbf24', // Gold (primary)
      '#00e0ff', // Electric Cyan
      '#e930ff', // Signal Magenta  
      '#5fd4d6', // Light cyan
      '#10b981', // Green
      '#3b82f6', // Blue
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#14b8a6'  // Teal
    ];

    let traces = [];

    if (activeSelected.length === 0 || activeSelected.includes('overall')) {
      // Show overall trend with gradient effect
      const overallTrace = {
        x: data.byPeriod.map(d => d.period),
        y: data.byPeriod.map(d => d[metric] || 0),
        type: viewMode === 'bars' ? 'bar' : 'scatter',
        mode: viewMode === 'lines' ? 'lines+markers' : 'lines',
        name: '🌐 Overall',
        line: { 
          color: colors[0], 
          width: 3,
          shape: 'spline'
        },
        marker: { 
          color: colors[0], 
          size: 8,
          line: {
            color: 'rgba(251, 191, 36, 0.2)',
            width: 2
          }
        },
        fill: viewMode === 'area' ? 'tonexty' : 'none',
        fillcolor: 'rgba(251, 191, 36, 0.1)',
        hovertemplate: `<b style="color: #fbbf24">🌐 Overall</b><br/><span style="color: #94a3b8">Period:</span> <b>%{x}</b><br/><span style="color: #94a3b8">${getMetricLabel(metric)}:</span> <b style="color: #fbbf24">%{y:,.0f}</b><extra></extra>`
      };
      traces.push(overallTrace);
    }

    // Add regional traces with enhanced styling
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
          name: `📍 ${region.state}, ${region.country}`,
          line: { 
            color: colors[colorIndex], 
            width: 2.5,
            shape: 'spline'
          },
          marker: { 
            color: colors[colorIndex], 
            size: 6,
            symbol: 'circle',
            line: {
              color: 'rgba(255, 255, 255, 0.2)',
              width: 1
            }
          },
          fill: viewMode === 'area' ? 'tonexty' : 'none',
          fillcolor: `rgba(${colorIndex * 30}, ${150 + colorIndex * 20}, ${200 - colorIndex * 15}, 0.1)`,
          hovertemplate: `<b style="color: ${colors[colorIndex]}">📍 ${region.state}, ${region.country}</b><br/><span style="color: #94a3b8">Period:</span> <b>%{x}</b><br/><span style="color: #94a3b8">${getMetricLabel(metric)}:</span> <b style="color: ${colors[colorIndex]}">%{y:,.0f}</b><extra></extra>`
        };
        traces.push(trace);
      });
    }

    // Add trend lines if enabled with dashed style
    if (showTrend && traces.length > 0) {
      traces.forEach((trace, index) => {
        const trendTrace = calculateTrendLine(trace.x, trace.y);
        if (trendTrace) {
          traces.push({
            ...trendTrace,
            name: `${trace.name} Trend`,
            line: { 
              color: trace.line.color, 
              width: 1.5, 
              dash: 'dot'
            },
            showlegend: false,
            hoverinfo: 'skip',
            opacity: 0.6
          });
        }
      });
    }

    const layout = {
      title: {
        text: `<b>📈 Regional ${getMetricLabel(metric)} Trends</b>`,
        font: { 
          color: '#fbbf24', 
          size: 18,
          family: 'Inter, sans-serif'
        }
      },
      xaxis: {
        title: getAggregationLabel(aggregation),
        color: '#94a3b8',
        gridcolor: 'rgba(148, 163, 184, 0.1)',
        tickfont: { color: '#cbd5e1' },
        showline: true,
        linecolor: 'rgba(148, 163, 184, 0.2)'
      },
      yaxis: {
        title: getMetricLabel(metric),
        color: '#94a3b8',
        gridcolor: 'rgba(148, 163, 184, 0.1)',
        tickfont: { color: '#cbd5e1' },
        tickformat: metric.includes('Sales') || metric.includes('Profit') ? '$,.0f' : ',.0f',
        showline: true,
        linecolor: 'rgba(148, 163, 184, 0.2)'
      },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'rgba(30, 41, 59, 0.2)',
      font: { 
        color: '#f8fafc',
        family: 'Inter, sans-serif'
      },
      legend: {
        orientation: 'h',
        y: -0.15,
        font: { color: '#cbd5e1' },
        bgcolor: 'rgba(30, 41, 59, 0.3)',
        bordercolor: 'rgba(148, 163, 184, 0.2)',
        borderwidth: 1
      },
      hovermode: 'closest',
      margin: { l: 70, r: 40, t: 80, b: 100 },
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#fbbf24',
        font: { 
          color: '#f8fafc',
          size: 14,
          family: 'Inter, sans-serif'
        },
        namelength: -1,
        align: 'left'
      }
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
      <div className={styles.glassBackground} style={{
        padding: "24px",
        animation: `${styles.fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 750ms both`
      }}>
        <h3 style={{
          color: "#fbbf24",
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "600",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          📈 Regional Time Series Explorer
        </h3>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          color: "#94a3b8",
        }}>
          {isLoading ? (
            <div className={styles.chartLoading}>
              <div style={{ marginTop: '40px' }}>Loading time series data...</div>
            </div>
          ) : (
            "No time series data available"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.glassBackground} style={{
      padding: "24px",
      animation: `${styles.fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 750ms both`
    }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{
          color: "#fbbf24",
          marginBottom: "8px",
          fontSize: "20px",
          fontWeight: "600",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          📈 Regional Time Series Explorer
        </h3>
        <p style={{
          color: "#94a3b8",
          fontSize: "14px",
          margin: 0
        }}>
          {`${data.summary?.totalPeriods || 0} periods | ${data.summary?.totalRegions || 0} regions | ${data.summary?.averageGrowth >= 0 ? '+' : ''}${data.summary?.averageGrowth?.toFixed(1) || 0}% growth`}
        </p>
      </div>

      {/* Controls with glassmorphism */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '24px',
        padding: '20px',
        background: 'rgba(30, 41, 59, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        animation: `${styles.fadeIn} 0.3s ease`
      }}>
        {/* Metric Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#f8fafc', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            📊 Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '140px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
            }}
          >
            <option value="totalSales">Total Sales</option>
            <option value="totalQuantity">Quantity</option>
            <option value="transactionCount">Transactions</option>
            {activeSelected.includes('overall') && (
              <option value="regionCount">Active Regions</option>
            )}
          </select>
        </div>

        {/* Aggregation Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#f8fafc', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⏱️ Time Period
          </label>
          <select
            value={aggregation}
            onChange={(e) => onAggregationChange && onAggregationChange(e.target.value)}
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              color: '#f8fafc',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '120px'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
            }}
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
          </select>
        </div>

        {/* View Mode with animated buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#f8fafc', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            👁️ View Mode
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { mode: 'lines', icon: '📉' },
              { mode: 'area', icon: '📊' },
              { mode: 'bars', icon: '📊' }
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 14px',
                  background: viewMode === mode 
                    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                    : 'rgba(30, 41, 59, 0.6)',
                  color: viewMode === mode ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${viewMode === mode ? 'rgba(251, 191, 36, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: viewMode === mode ? '600' : '400',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: viewMode === mode ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== mode) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                  }
                }}
              >
                <span>{icon}</span>
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Options with enhanced styling */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ 
            fontSize: '13px', 
            color: '#f8fafc', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⚙️ Options
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '13px', 
              color: '#f8fafc',
              cursor: 'pointer',
              padding: '8px 12px',
              background: showTrend ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
              borderRadius: '8px',
              border: `1px solid ${showTrend ? 'rgba(251, 191, 36, 0.3)' : 'transparent'}`,
              transition: 'all 0.3s ease'
            }}>
              <input
                type="checkbox"
                checked={showTrend}
                onChange={(e) => setShowTrend(e.target.checked)}
                style={{ 
                  accentColor: '#fbbf24',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              📈 Show Trends
            </label>
            <button
              onClick={() => toggleRegion('overall')}
              style={{
                padding: '8px 14px',
                background: activeSelected.includes('overall') 
                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
                  : 'rgba(30, 41, 59, 0.6)',
                color: activeSelected.includes('overall') ? '#0f172a' : '#f8fafc',
                border: `1px solid ${activeSelected.includes('overall') ? 'rgba(251, 191, 36, 0.5)' : 'rgba(148, 163, 184, 0.2)'}`,
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: activeSelected.includes('overall') ? '600' : '400',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: activeSelected.includes('overall') ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🌐 Overall
            </button>
          </div>
        </div>
      </div>

      {/* Region Selector with enhanced styling */}
      {data.byRegion && data.byRegion.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          animation: `${styles.fadeIn} 0.3s ease 0.1s both`
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#f8fafc', 
            fontWeight: '600',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📍 Select Regions to Compare
            <span style={{
              fontSize: '12px',
              color: '#94a3b8',
              fontWeight: '400'
            }}>
              ({activeSelected.filter(s => s !== 'overall').length} selected)
            </span>
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxHeight: '140px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {getAvailableRegions().slice(0, 20).map((region, index) => (
              <button
                key={region.key}
                onClick={() => toggleRegion(region.key)}
                style={{
                  padding: '6px 12px',
                  background: activeSelected.includes(region.key) 
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2))' 
                    : 'rgba(30, 41, 59, 0.6)',
                  color: activeSelected.includes(region.key) ? '#fbbf24' : '#cbd5e1',
                  border: `1px solid ${activeSelected.includes(region.key) ? 'rgba(251, 191, 36, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: activeSelected.includes(region.key) ? '600' : '400',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  animation: `${styles.fadeIn} 0.3s ease ${index * 0.02}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  if (!activeSelected.includes(region.key)) {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!activeSelected.includes(region.key)) {
                    e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.6)';
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  }
                }}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart Container with glassmorphism */}
      <div style={{ 
        height: '500px',
        padding: '20px',
        background: 'rgba(30, 41, 59, 0.3)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        marginBottom: '20px',
        animation: `${styles.fadeIn} 0.3s ease 0.2s both`
      }}>
        {timeSeriesData.traces.length > 0 ? (
          <Plot
            data={timeSeriesData.traces}
            layout={{
              ...timeSeriesData.layout,
              height: 460,
              autosize: true
            }}
            style={{ width: '100%', height: '100%' }}
            config={{
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
              responsive: true,
              displaylogo: false
            }}
            onInitialized={(figure, graphDiv) => {
              graphDiv.on('plotly_click', (data) => {
                if (data.points && data.points.length > 0) {
                  const point = data.points[0];
                  const event = data.event;
                  
                  const formattedValue = metric === 'profitMargin' || metric === 'growthRate' 
                    ? `${point.y.toFixed(1)}%`
                    : metric === 'customerCount' || metric === 'transactionCount'
                    ? point.y.toLocaleString()
                    : formatCurrency(point.y);
                  
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
                        isOverall: point.data.name.includes('Overall')
                      }
                    });
                  }
                  
                  const dataPointContext = {
                    traceName: point.data.name,
                    period: point.x,
                    value: point.y,
                    metric,
                    metricLabel: getMetricLabel(metric),
                    aggregation,
                    pointIndex: point.pointIndex,
                    isOverall: point.data.name.includes('Overall'),
                    regionInfo: !point.data.name.includes('Overall') ? {
                      name: point.data.name,
                      type: 'region'
                    } : null
                  };
                  
                  if (onShowAIInsight) {
                    onShowAIInsight(data, 'chart', `${point.data.name}-${point.x}`, dataPointContext);
                  }
                }
              });
            }}
            onHover={(event) => {
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
            color: "#94a3b8",
            fontSize: "14px"
          }}>
            Select regions or enable overall view to see trends
          </div>
        )}
      </div>

      {/* Summary Stats with enhanced styling */}
      {data.summary && (
        <div style={{
          padding: '16px',
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          animation: `${styles.fadeIn} 0.3s ease 0.3s both`
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
          }}>
            <div style={{ 
              fontSize: '24px',
              fontWeight: 'bold', 
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {data.summary.totalPeriods}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              📅 Time Periods
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
          }}>
            <div style={{ 
              fontSize: '24px',
              fontWeight: 'bold', 
              color: '#00e0ff'
            }}>
              {data.summary.totalRegions}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              📍 Regions
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = data.summary.averageGrowth >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
          }}>
            <div style={{ 
              fontSize: '24px',
              fontWeight: 'bold', 
              color: data.summary.averageGrowth >= 0 ? '#10b981' : '#ef4444'
            }}>
              {data.summary.averageGrowth >= 0 ? '+' : ''}{data.summary.averageGrowth.toFixed(1)}%
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              📈 Avg Growth
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalTimeSeriesExplorer;