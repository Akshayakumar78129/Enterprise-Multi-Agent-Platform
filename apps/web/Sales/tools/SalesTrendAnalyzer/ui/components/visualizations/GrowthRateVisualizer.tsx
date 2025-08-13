import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Data } from 'plotly.js';
import { GrowthRateVisualizerProps, THEME } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const GrowthRateVisualizer: React.FC<GrowthRateVisualizerProps> = ({
  data,
  isLoading = false,
  timePeriod,
  onTimePeriodChange,
  onDataPointClick,
  onInfoIconClick
}) => {
  const chartData = useMemo((): Data[] | null => {
    if (!data?.length) return null;

    // Bar chart for growth rates
    const growthBars: Data = {
      x: data.map(d => d.period),
      y: data.map(d => d.growth_rate),
      type: 'bar',
      name: 'Growth Rate',
      marker: {
        color: data.map(d => d.growth_rate >= 0 ? THEME.colors.risk.green : THEME.colors.risk.red)
      }
    };

    // Line for average growth rate
    const avgLine: Data = {
      x: data.map(d => d.period),
      y: Array(data.length).fill(data[0].avg_growth_rate),
      type: 'scatter',
      mode: 'lines',
      name: 'Average Growth',
      line: {
        color: THEME.colors.text.secondary,
        width: 2,
        dash: 'dash'
      }
    };

    return [growthBars, avgLine];
  }, [data]);

  const layout = {
    width: THEME.dimensions.growthRateVisualizer.width,
    height: THEME.dimensions.growthRateVisualizer.height,
    paper_bgcolor: THEME.colors.midnightNavy,
    plot_bgcolor: THEME.colors.midnightNavy,
    margin: { t: 40, r: 20, b: 40, l: 60 },
    title: {
      text: 'Growth Rate Analysis',
      font: {
        color: THEME.colors.cloudWhite,
        size: 16
      }
    },
    xaxis: {
      title: {
        text: 'Period',
        font: {
          color: THEME.colors.cloudWhite
        }
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
        text: 'Growth Rate (%)',
        font: {
          color: THEME.colors.cloudWhite
        }
      },
      showgrid: true,
      gridcolor: THEME.colors.lightGraphite,
      gridwidth: 1,
      tickfont: {
        color: THEME.colors.cloudWhite
      },
      tickformat: '.1%'
    },
    showlegend: true,
    legend: {
      font: {
        color: THEME.colors.cloudWhite
      },
      bgcolor: 'rgba(0,0,0,0)'
    },
    bargap: 0.3
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  // Summary metrics
  const metrics = useMemo(() => {
    if (!data?.length) return null;

    return [
      {
        label: 'Average Growth',
        value: data[0].avg_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Highest Growth',
        value: data[0].max_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Lowest Growth',
        value: data[0].min_growth_rate,
        formatter: formatPercentage
      },
      {
        label: 'Latest Growth',
        value: data[data.length - 1].growth_rate,
        formatter: formatPercentage
      }
    ];
  }, [data]);

  if (!data?.length && !isLoading) {
    return (
      <Card title="Growth Rate Analysis" isLoading={isLoading}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '300px',
            color: THEME.colors.cloudWhite
          }}
        >
          No data available
        </div>
      </Card>
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
          📊 Growth Rate Analysis
        </h2>
        <p style={{
          color: THEME.colors.text.secondary,
          fontSize: THEME.typography.sizes.sm,
          margin: 0,
          fontWeight: THEME.typography.weights.medium
        }}>
          Period-over-period growth momentum and trends
        </p>
      </div>

      {/* Growth Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {metrics?.map((metric, index) => (
          <div
            key={index}
            className="glass-card"
            style={{
              padding: '20px 16px',
              borderRadius: '16px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: `${THEME.animations.scaleIn}`,
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            {/* Gradient Background for Positive Growth */}
            {metric.value >= 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                  borderRadius: '14px',
                  zIndex: -1
                }}
              />
            )}

            {/* Icon Badge */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: metric.value >= 0 
                  ? THEME.colors.risk.green 
                  : THEME.colors.risk.red,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                margin: '0 auto 12px',
                color: THEME.colors.text.white,
                boxShadow: `0 4px 12px ${metric.value >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              {metric.value >= 0 ? '📈' : '📉'}
            </div>

            {/* Metric Label */}
            <div style={{ 
              color: THEME.colors.text.secondary,
              fontSize: THEME.typography.sizes.xs,
              fontWeight: THEME.typography.weights.medium,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {metric.label}
            </div>

            {/* Metric Value */}
            <div
              style={{
                color: metric.value >= 0 
                  ? THEME.colors.risk.green 
                  : THEME.colors.risk.red,
                fontSize: THEME.typography.sizes.xl,
                fontWeight: THEME.typography.weights.extrabold,
                lineHeight: '1'
              }}
            >
              {metric.formatter(metric.value)}
            </div>

            {/* Trend Indicator */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: metric.value >= 0 
                ? THEME.colors.risk.green 
                : THEME.colors.risk.red,
              opacity: 0.6,
              animation: THEME.animations.float,
              animationDelay: `${index * 0.5}s`
            }} />
          </div>
        ))}
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
              Calculating growth rates...
            </p>
          </div>
        ) : !data?.length ? (
          <div style={{
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{
              color: THEME.colors.text.primary,
              fontSize: THEME.typography.sizes.lg,
              fontWeight: THEME.typography.weights.semibold,
              margin: '0 0 8px 0'
            }}>
              No Growth Data
            </h3>
            <p style={{
              color: THEME.colors.text.secondary,
              fontSize: THEME.typography.sizes.base,
              margin: 0
            }}>
              Need historical data to calculate growth rates
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
                    text: 'Growth Rate (%)',
                    font: { color: THEME.colors.text.secondary }
                  },
                  zeroline: true,
                  zerolinecolor: THEME.colors.text.secondary,
                  zerolinewidth: 2
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
                  filename: 'growth_rate_analysis',
                  height: 420,
                  width: 680,
                  scale: 1
                }
              }}
              onClick={(e) => {
                if (onDataPointClick && e.points?.[0] && data) {
                  // Get the clicked point data
                  const pointIndex = e.points[0].pointIndex;
                  const clickedDataPoint = data[pointIndex];
                  
                  if (clickedDataPoint) {
                    onDataPointClick({
                      ...clickedDataPoint,
                      metricName: 'growth_rate',
                      date: clickedDataPoint.period,
                      value: clickedDataPoint.growth_rate
                    }, e);
                  }
                }
              }}
              style={{ width: '100%', height: '400px' }}
            />
          </div>
        )}
      </div>

      {/* Info Icon */}
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
        left: '30px',
        width: '3px',
        height: '3px',
        borderRadius: '50%',
        background: THEME.colors.secondary40,
        animation: THEME.animations.float,
        animationDelay: '2s'
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

export default GrowthRateVisualizer; 