import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const LTVTimeProjection = ({ data = [] }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Process data for plotting
    const processedData = data.map(item => ({
      month: item.month,
      monthlyRevenue: item.monthly_revenue || 0,
      projectedLTV: item.projected_ltv || 0,
      cumulativeRevenue: item.cumulative_revenue || 0,
      activeCustomers: item.active_customers || 0
    }));

    return [
      {
        x: processedData.map(d => d.month),
        y: processedData.map(d => d.projectedLTV),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Monthly LTV Projection',
        line: {
          color: '#00e0ff',
          width: 3,
          shape: 'spline'
        },
        marker: {
          color: '#00e0ff',
          size: 6,
          line: {
            color: '#00e0ff',
            width: 2
          }
        },
        fill: 'tonexty',
        fillcolor: 'rgba(0, 224, 255, 0.1)',
        yaxis: 'y1'
      },
      {
        x: processedData.map(d => d.month),
        y: processedData.map(d => d.cumulativeRevenue),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Cumulative Revenue',
        line: {
          color: '#e930ff',
          width: 2,
          shape: 'spline'
        },
        marker: {
          color: '#e930ff',
          size: 5,
          line: {
            color: '#e930ff',
            width: 1
          }
        },
        yaxis: 'y2'
      }
    ];
  }, [data]);

  const layout = useMemo(() => ({
    title: {
      text: '',
      font: { color: '#f7f9fb', size: 16 }
    },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    font: { color: '#f7f9fb', family: 'Inter, sans-serif' },
    showlegend: true,
    legend: {
      x: 0,
      y: 1.1,
      orientation: 'h',
      font: { color: '#f7f9fb', size: 12 },
      bgcolor: 'transparent'
    },
    xaxis: {
      title: {
        text: 'Time Period',
        font: { color: '#9ca3af', size: 12 }
      },
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      tickfont: { color: '#9ca3af', size: 11 },
      showgrid: true,
      zeroline: false
    },
    yaxis: {
      title: {
        text: 'LTV Projection ($)',
        font: { color: '#00e0ff', size: 12 }
      },
      side: 'left',
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      tickfont: { color: '#9ca3af', size: 11 },
      showgrid: true,
      zeroline: false,
      tickformat: '$,.0f'
    },
    yaxis2: {
      title: {
        text: 'Cumulative Revenue ($)',
        font: { color: '#e930ff', size: 12 }
      },
      side: 'right',
      overlaying: 'y',
      gridcolor: 'rgba(58, 68, 89, 0.1)',
      tickfont: { color: '#9ca3af', size: 11 },
      showgrid: false,
      zeroline: false,
      tickformat: '$,.0s'
    },
    margin: { t: 40, r: 80, b: 60, l: 80 },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: 'rgba(35, 42, 54, 0.95)',
      bordercolor: '#3a4459',
      font: { color: '#f7f9fb', size: 11 }
    }
  }), []);

  const config = {
    displayModeBar: false,
    responsive: true
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        backgroundColor: '#232a36', 
        borderRadius: '16px', 
        padding: '20px',
        height: '340px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h3 style={{ color: '#f7f9fb', marginBottom: '10px' }}>LTV Time Projection</h3>
        <div style={{ color: '#6b7280' }}>No time projection data available</div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#232a36', 
      borderRadius: '16px', 
      padding: '20px',
      height: '340px'
    }}>
      <h3 style={{ 
        color: '#f7f9fb', 
        margin: '0 0 20px 0', 
        fontSize: '18px',
        fontWeight: '600'
      }}>
        LTV Time Projection
      </h3>
      <div style={{ height: 'calc(100% - 60px)', position: 'relative' }}>
        <Plot
          data={chartData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};

export default LTVTimeProjection; 