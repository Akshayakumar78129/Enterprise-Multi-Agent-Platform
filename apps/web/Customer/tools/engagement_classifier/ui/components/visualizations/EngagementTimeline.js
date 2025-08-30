import React, { useState } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";
import dynamic from "next/dynamic";

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const EngagementTimeline = ({ 
  timeline = [], 
  isLoading = false, 
  onPeriodClick = null,
  selectedPeriod = null,
  aggregationLevel = 'week'
}) => {
  const [viewMode, setViewMode] = useState('stacked'); // 'stacked' or 'lines'

  if (!timeline || timeline.length === 0) {
    return (
      <Card title="Engagement Activity Timeline" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "360px",
            color: "#5891cb",
          }}
        >
          No timeline data available
        </div>
      </Card>
    );
  }

  // Process timeline data for visualization
  const processTimelineData = () => {
    // Group data by time period
    const periods = [...new Set(timeline.map(item => item.time_period))];
    const sortedPeriods = periods.sort((a, b) => {
      const order = {
        'This Week': 1,
        'This Month': 2, 
        'Last 3 Months': 3,
        'Last 6 Months': 4,
        'Last Year': 5,
        'Over 1 Year': 6
      };
      return order[a] - order[b];
    });

    const highData = [];
    const mediumData = [];
    const lowData = [];

    sortedPeriods.forEach(period => {
      const periodData = timeline.filter(item => item.time_period === period);
      
      const high = periodData.find(item => item.engagement_level === 'High')?.customer_count || 0;
      const medium = periodData.find(item => item.engagement_level === 'Medium')?.customer_count || 0;
      const low = periodData.find(item => item.engagement_level === 'Low')?.customer_count || 0;

      highData.push(high);
      mediumData.push(medium);
      lowData.push(low);
    });

    return {
      periods: sortedPeriods,
      high: highData,
      medium: mediumData,
      low: lowData
    };
  };

  const { periods, high, medium, low } = processTimelineData();

  const renderStackedAreaChart = () => {
    const traces = [
      {
        x: periods,
        y: high,
        fill: 'tonexty',
        fillcolor: 'rgba(0, 224, 255, 0.7)',
        line: { color: '#00e0ff', width: 2 },
        mode: 'lines',
        name: 'High Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: medium,
        fill: 'tonexty',
        fillcolor: 'rgba(95, 212, 214, 0.7)',
        line: { color: '#5fd4d6', width: 2 },
        mode: 'lines',
        name: 'Medium Engagement',
        type: 'scatter',
        stackgroup: 'one'
      },
      {
        x: periods,
        y: low,
        fill: 'tonexty',
        fillcolor: 'rgba(233, 48, 255, 0.7)',
        line: { color: '#e930ff', width: 2 },
        mode: 'lines',
        name: 'Low Engagement',
        type: 'scatter',
        stackgroup: 'one'
      }
    ];

    return traces;
  };

  const renderLineChart = () => {
    const traces = [
      {
        x: periods,
        y: high,
        line: { color: '#00e0ff', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#00e0ff' },
        name: 'High Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: medium,
        line: { color: '#5fd4d6', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#5fd4d6' },
        name: 'Medium Engagement',
        type: 'scatter'
      },
      {
        x: periods,
        y: low,
        line: { color: '#e930ff', width: 3 },
        mode: 'lines+markers',
        marker: { size: 8, color: '#e930ff' },
        name: 'Low Engagement',
        type: 'scatter'
      }
    ];

    return traces;
  };

  const layout = {
    height: 360,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { 
      family: 'Inter, sans-serif', 
      color: '#f7f9fb',
      size: 12 
    },
    margin: { l: 60, r: 40, t: 40, b: 80 },
    xaxis: {
      title: 'Time Period',
      titlefont: { size: 14, color: '#f7f9fb' },
      tickfont: { size: 12, color: '#f7f9fb' },
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      showgrid: true,
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: 'Customer Count',
      titlefont: { size: 14, color: '#f7f9fb' },
      tickfont: { size: 12, color: '#f7f9fb' },
      gridcolor: 'rgba(58, 68, 89, 0.3)',
      showgrid: true,
      zeroline: false
    },
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(35, 42, 54, 0.8)',
      bordercolor: '#3a4459',
      borderwidth: 1,
      font: { color: '#f7f9fb', size: 11 }
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#232a36',
      bordercolor: '#3a4459',
      font: { color: '#f7f9fb' }
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  const handlePlotClick = (data) => {
    if (data.points && data.points.length > 0 && onPeriodClick) {
      const period = data.points[0].x;
      onPeriodClick(period);
    }
  };

  return (
    <Card 
      title="Engagement Activity Timeline" 
      subtitle="Customer distribution across engagement levels over time"
      isLoading={isLoading}
    >
      <div style={{ padding: '16px' }}>
        {/* View Mode Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            gap: '12px'
          }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'stacked' ? '#00e0ff' : '#232a36',
                color: viewMode === 'stacked' ? '#0a1224' : '#f7f9fb',
                border: `1px solid ${viewMode === 'stacked' ? '#00e0ff' : '#3a4459'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('stacked')}
            >
              Stacked View
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: viewMode === 'lines' ? '#00e0ff' : '#232a36',
                color: viewMode === 'lines' ? '#0a1224' : '#f7f9fb',
                border: `1px solid ${viewMode === 'lines' ? '#00e0ff' : '#3a4459'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('lines')}
            >
              Line View
            </button>
          </div>

          {/* Quick Period Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            fontSize: '12px'
          }}>
            {['This Week', 'This Month', 'Last 3 Months'].map(period => (
              <button
                key={period}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedPeriod === period ? '#e930ff' : 'transparent',
                  color: selectedPeriod === period ? '#f7f9fb' : '#5891cb',
                  border: `1px solid ${selectedPeriod === period ? '#e930ff' : '#3a4459'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => onPeriodClick && onPeriodClick(period)}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '360px' }}>
          <Plot
            data={viewMode === 'stacked' ? renderStackedAreaChart() : renderLineChart()}
            layout={layout}
            config={config}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Summary Statistics */}
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '16px',
          backgroundColor: '#232a36',
          borderRadius: '8px',
          border: '1px solid #3a4459'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#00e0ff',
              marginBottom: '4px'
            }}>
              {high.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              High Engagement Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#5fd4d6',
              marginBottom: '4px'
            }}>
              {medium.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              Medium Engagement Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#e930ff',
              marginBottom: '4px'
            }}>
              {low.reduce((sum, val) => sum + val, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#f7f9fb', opacity: 0.8 }}>
              Low Engagement Total
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EngagementTimeline; 