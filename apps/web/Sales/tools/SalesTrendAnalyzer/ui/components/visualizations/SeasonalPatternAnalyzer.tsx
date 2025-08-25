import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SeasonalPatternAnalyzerProps, THEME } from '../../types';
import { formatCurrency } from '../../utils/formatters';

// Dynamic import for Plotly
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const SeasonalPatternAnalyzer: React.FC<SeasonalPatternAnalyzerProps> = ({
  data,
  isLoading = false,
  timePeriod,
  onTimePeriodChange,
  onDataPointClick,
  onInfoIconClick,
  selectedPoints = new Set()
}) => {
  const chartData = useMemo(() => {
    if (!data?.length) return null;

    // Group data by year
    const yearGroups = data.reduce((acc, point) => {
      if (!acc[point.year]) {
        acc[point.year] = [];
      }
      acc[point.year].push(point);
      return acc;
    }, {} as Record<string, typeof data>);

    // Create a trace for each year with selection highlighting
    const traces: any[] = Object.entries(yearGroups).map(([year, points], idx) => {
      const paletteColor = THEME.colors.categorical[idx % THEME.colors.categorical.length];
      // Create marker colors and sizes based on selection state
      const markerColors = points.map(p => {
        // Use ID format consistent with selection manager: seasonal-YYYY-MM-metric
        const pointId = `seasonal-${year}-${String(p.month).padStart(2, '0')}-revenue`;
        return selectedPoints.has(pointId) ? THEME.colors.energyYellow : paletteColor;
      });
      
      const markerSizes = points.map(p => {
        const pointId = `seasonal-${year}-${String(p.month).padStart(2, '0')}-revenue`;
        return selectedPoints.has(pointId) ? 10 : 6;
      });
      
      const markerBorderColors = points.map(p => {
        const pointId = `seasonal-${year}-${String(p.month).padStart(2, '0')}-revenue`;
        return selectedPoints.has(pointId) ? THEME.colors.signalMagenta : 'transparent';
      });

      return {
        x: points.map(p => p.month),
        y: points.map(p => p.revenue),
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        name: year,
        line: {
          color: paletteColor,
          width: year === new Date().getFullYear().toString() ? 3 : 2
        },
        marker: {
          color: markerColors,
          size: markerSizes,
          line: {
            color: markerBorderColors,
            width: 2
          }
        }
      };
    });

    // Calculate average seasonal pattern
    const monthlyAverages = Array.from({ length: 12 }, (_, month) => {
      const monthStr = String(month + 1).padStart(2, '0');
      const monthData = data.filter(p => p.month === monthStr);
      return {
        month: monthStr,
        revenue: monthData.reduce((sum, p) => sum + p.revenue, 0) / monthData.length
      };
    });

    // Add average trace
    traces.push({
      x: monthlyAverages.map(m => m.month),
      y: monthlyAverages.map(m => m.revenue),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Average Pattern',
      line: {
        color: THEME.colors.text.secondary,
        width: 2,
        dash: 'dash'
      }
    });

    return traces;
  }, [data, selectedPoints]);

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 40, r: 20, b: 60, l: 60 },
    font: { 
      family: THEME.typography.fontFamily,
      color: THEME.colors.text.primary
    },
    xaxis: {
      title: {
        text: 'Month',
        font: { color: THEME.colors.text.secondary }
      },
      showgrid: true,
      gridcolor: THEME.colors.primary20,
      gridwidth: 1,
      tickfont: { color: THEME.colors.text.secondary },
      tickmode: 'array' as const,
      ticktext: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tickvals: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    },
    yaxis: {
      title: {
        text: 'Revenue',
        font: { color: THEME.colors.text.secondary }
      },
      showgrid: true,
      gridcolor: THEME.colors.primary20,
      gridwidth: 1,
      tickfont: { color: THEME.colors.text.secondary },
      tickformat: '$,.0f'
    },
    showlegend: true,
    legend: {
      font: { color: THEME.colors.text.primary },
      bgcolor: 'rgba(0,0,0,0)',
      bordercolor: 'rgba(0,0,0,0)',
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.2
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
          🔄 Seasonal Pattern Analyzer
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
          🔄 Seasonal Pattern Analyzer
        </h2>
        <p style={{
          color: THEME.colors.text.secondary,
          fontSize: THEME.typography.sizes.sm,
          margin: 0,
          fontWeight: THEME.typography.weights.medium
        }}>
          Year-over-year seasonal trends and patterns
        </p>
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
              Analyzing seasonal patterns...
            </p>
          </div>
        ) : !data?.length ? (
          <div style={{
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <h3 style={{
              color: THEME.colors.text.primary,
              fontSize: THEME.typography.sizes.lg,
              fontWeight: THEME.typography.weights.semibold,
              margin: '0 0 8px 0'
            }}>
              No Seasonal Data
            </h3>
            <p style={{
              color: THEME.colors.text.secondary,
              fontSize: THEME.typography.sizes.base,
              margin: 0
            }}>
              Need multiple years of data to analyze patterns
            </p>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Plot
              data={chartData}
              layout={layout}
              config={config}
              onClick={(event: any) => {
                if (onDataPointClick && event?.points?.[0]) {
                  const point = event.points[0];
                  const year = point.data.name;
                  const month = point.x;
                  const value = point.y;
                  
                  console.log('🔄 Seasonal click:', { year, month, value });
                  
                  // Handle Average Pattern clicks
                  if (year === 'Average Pattern') {
                    const formattedDate = `avg-${String(month).padStart(2, '0')}`;
                    const monthNames = [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    const monthName = monthNames[parseInt(month) - 1];
                    
                    // Calculate average vs current year for this month
                    const currentYearData = data.find(d => 
                      d.year === new Date().getFullYear().toString() && 
                      d.month === String(month).padStart(2, '0')
                    );
                    
                    const percentChange = currentYearData ? 
                      ((currentYearData.revenue - value) / value) * 100 : 0;
                    
                    onDataPointClick({
                      metricName: 'revenue',
                      date: formattedDate,
                      value: value,
                      period: `${monthName} Average`,
                      year: 'Average',
                      month: String(month).padStart(2, '0'),
                      previousValue: currentYearData?.revenue,
                      percentChange: percentChange,
                      isAverage: true
                    }, event);
                    
                    console.log('🔄 Average pattern click sent:', {
                      monthName,
                      averageValue: value,
                      currentYearValue: currentYearData?.revenue
                    });
                    return;
                  }
                  
                  // Handle actual year data clicks
                  const clickedDataPoint = data.find(d => 
                    d.year === year && d.month === String(month).padStart(2, '0')
                  );
                    
                  console.log('🔄 Found seasonal data point:', clickedDataPoint);
                  
                  if (clickedDataPoint) {
                    const formattedDate = `${year}-${String(month).padStart(2, '0')}`;
                    
                    // Calculate percentage change from same month previous year
                    const previousYearPoint = data.find(d => 
                      d.year === String(parseInt(year) - 1) && 
                      d.month === String(month).padStart(2, '0')
                    );
                    
                    const percentChange = previousYearPoint ? 
                      ((clickedDataPoint.revenue - previousYearPoint.revenue) / previousYearPoint.revenue) * 100 : 0;
                    
                    onDataPointClick({
                      metricName: 'revenue',
                      date: formattedDate,
                      value: clickedDataPoint.revenue,
                      period: formattedDate,
                      year: year,
                      month: String(month).padStart(2, '0'),
                      previousValue: previousYearPoint?.revenue,
                      percentChange: percentChange
                    }, event);
                    
                    console.log('🔄 Seasonal data point click sent:', {
                      year,
                      month: String(month).padStart(2, '0'),
                      value: clickedDataPoint.revenue,
                      percentChange: percentChange
                    });
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
        right: '30px',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: THEME.colors.primary20,
        animation: THEME.animations.float,
        animationDelay: '1s'
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

export default SeasonalPatternAnalyzer;