import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Data } from 'plotly.js';
import { TimeSeriesExplorerProps, THEME, SalesDataPoint, TimePeriod } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const GRANULARITY_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const TimeSeriesExplorer: React.FC<TimeSeriesExplorerProps> = ({
  data,
  isLoading = false,
  filters,
  onFilterChange,
  onDataPointClick,
  onInfoIconClick,
  selectedPoints = new Set()
}) => {
  const chartData = useMemo((): Data[] | null => {
    if (!data?.length) return null;

    const formatValue = filters.metric === 'revenue' ? formatCurrency : formatNumber;
    
    // Create marker colors and sizes based on selection state
    const markerColors = data.map(d => {
      const pointId = `timeseries-${d.period}-${filters.metric}`;
      return selectedPoints.has(pointId) ? THEME.colors.energyYellow : THEME.colors.primary;
    });
    
    const markerSizes = data.map(d => {
      const pointId = `timeseries-${d.period}-${filters.metric}`;
      return selectedPoints.has(pointId) ? 11 : 6;
    });
    
    // Main series with dynamic marker styling for selections
    const mainSeries: Data = {
      x: data.map(d => d.period),
      y: data.map(d => Number(d[filters.metric])),
      type: 'scatter',
      mode: 'lines+markers',
      name: filters.metric.toUpperCase(),
      line: {
        color: THEME.colors.primary, // Electric Cyan for primary series
        width: 3
      },
      marker: {
        color: markerColors,
        size: markerSizes,
        line: {
          color: selectedPoints.size > 0 ? 
            data.map(d => {
              const pointId = `timeseries-${d.period}-${filters.metric}`;
              return selectedPoints.has(pointId) ? THEME.colors.signalMagenta : 'transparent';
            }) : 'transparent',
          width: 2
        }
      }
    };

    // Moving average
    const windowSize = 3;
    const movingAvg = data.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      return window.reduce((sum, d) => sum + Number(d[filters.metric]), 0) / window.length;
    });

    const movingAvgSeries: Data = {
      x: data.map(d => d.period),
      y: movingAvg,
      type: 'scatter',
      mode: 'lines',
      name: 'Moving Average',
      line: {
        color: THEME.colors.cloudWhite,
        width: 2,
        dash: 'dash' as const
      }
    };

    return [mainSeries, movingAvgSeries];
  }, [data, filters.metric, selectedPoints]);

  const layout = {
    height: THEME.dimensions.timeSeriesExplorer.height,
    paper_bgcolor: THEME.colors.midnightNavy,
    plot_bgcolor: THEME.colors.midnightNavy,
    margin: { t: 40, r: 20, b: 40, l: 60 },
    title: {
      text: `${filters.metric.toUpperCase()} Over Time`,
      font: {
        color: THEME.colors.cloudWhite,
        size: 16
      }
    },
    xaxis: {
      title: {
        text: 'Period'
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      }
    },
    yaxis: {
      title: {
        text: filters.metric.toUpperCase()
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      },
      tickformat: filters.metric === 'revenue' ? '$,.0f' : ',d'
    },
    showlegend: true,
    legend: {
      font: {
        color: THEME.colors.cloudWhite
      }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  if (!data?.length && !isLoading) {
    return (
      <div
        className="glass-card"
        style={{
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <h2
          className="gradient-text"
          style={{
            fontSize: THEME.typography.sizes.xl,
            fontWeight: THEME.typography.weights.bold,
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          📈 Time Series Explorer
        </h2>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            color: THEME.colors.text.secondary
          }}
        >
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: '20px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header with Gradient Text */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          className="gradient-text"
          style={{
            fontSize: THEME.typography.sizes.xl,
            fontWeight: THEME.typography.weights.bold,
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          📊 Time Series Explorer
        </h2>
        <p style={{
          color: THEME.colors.text.secondary,
          fontSize: THEME.typography.sizes.sm,
          margin: 0,
          fontWeight: THEME.typography.weights.medium
        }}>
          Interactive trend analysis with AI insights
        </p>
      </div>

      {/* Filter Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Time Period Selector */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ 
            color: THEME.colors.text.secondary, 
            fontSize: THEME.typography.sizes.sm,
            fontWeight: THEME.typography.weights.medium
          }}>
            Period:
          </span>
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ timePeriod: option.value as TimePeriod })}
              className="glass-card"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: THEME.typography.sizes.sm,
                fontWeight: THEME.typography.weights.medium,
                background: filters.timePeriod === option.value 
                  ? THEME.colors.primaryGradient 
                  : 'rgba(255, 255, 255, 0.1)',
                color: filters.timePeriod === option.value 
                  ? THEME.colors.text.white 
                  : THEME.colors.text.primary,
                transition: THEME.animations.smooth,
                boxShadow: filters.timePeriod === option.value
                  ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (filters.timePeriod !== option.value) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (filters.timePeriod !== option.value) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{
        position: 'relative',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ 
              width: '40px',
              height: '40px',
              border: `3px solid ${THEME.colors.primary}`,
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{
              color: THEME.colors.text.secondary,
              fontSize: THEME.typography.sizes.base,
              margin: 0
            }}>
              Loading trend data...
            </p>
          </div>
        ) : !data?.length ? (
          <div style={{
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
            <h3 style={{
              color: THEME.colors.text.primary,
              fontSize: THEME.typography.sizes.lg,
              fontWeight: THEME.typography.weights.semibold,
              margin: '0 0 8px 0'
            }}>
              No Data Available
            </h3>
            <p style={{
              color: THEME.colors.text.secondary,
              fontSize: THEME.typography.sizes.base,
              margin: 0
            }}>
              Select a date range to view trend analysis
            </p>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Plot
              data={chartData}
              layout={{
                ...layout,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { 
                  family: THEME.typography.fontFamily,
                  color: THEME.colors.text.primary
                },
                title: {
                  text: '',
                  font: { 
                    color: THEME.colors.text.primary,
                    size: parseInt(THEME.typography.sizes.lg)
                  }
                },
                xaxis: {
                  ...layout.xaxis,
                  gridcolor: THEME.colors.primary20,
                  tickfont: { color: THEME.colors.text.secondary },
                  title: {
                    text: 'Period',
                    font: { color: THEME.colors.text.secondary }
                  }
                },
                yaxis: {
                  ...layout.yaxis,
                  gridcolor: THEME.colors.primary20,
                  tickfont: { color: THEME.colors.text.secondary },
                  title: {
                    text: filters.metric.toUpperCase(),
                    font: { color: THEME.colors.text.secondary }
                  }
                },
                legend: {
                  font: { color: THEME.colors.text.primary },
                  bgcolor: 'rgba(0,0,0,0)',
                  bordercolor: 'rgba(0,0,0,0)'
                },
                hovermode: 'x unified',
                hoverlabel: {
                  bgcolor: THEME.glass.background,
                  bordercolor: THEME.colors.primary,
                  font: { 
                    color: THEME.colors.text.primary,
                    family: THEME.typography.fontFamily
                  }
                }
              }}
              config={{
                ...config,
                toImageButtonOptions: {
                  format: 'png',
                  filename: 'sales_trend_analysis',
                  height: 480,
                  width: 760,
                  scale: 1
                }
              }}
              onClick={(e) => {
                if (onDataPointClick && e.points?.[0]) {
                  const point = data[e.points[0].pointIndex];
                  if (point) {
                    onDataPointClick({
                      ...point,
                      metricName: filters.metric,
                      date: point.period,
                      value: Number(point[filters.metric])
                    }, e);
                  }
                }
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}
      </div>

      {/* Info Icon with Tooltip */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '60px' // Moved away from edge to prevent off-screen issues
      }}>
        <div
          title="Click for chart explanation"
          onClick={onInfoIconClick}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: THEME.colors.primary20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = THEME.colors.primary40;
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = THEME.colors.primary20;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ℹ️
        </div>
      </div>

      {/* Floating Pattern Elements */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: THEME.colors.secondary20,
        animation: THEME.animations.float
      }} />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TimeSeriesExplorer; 