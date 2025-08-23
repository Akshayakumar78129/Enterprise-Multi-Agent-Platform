import React, { useMemo, useCallback, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-cloud-white/60">Loading chart...</div>
    </div>
  )
});

const SegmentMetricComparison = ({
  data = [],
  selectedMetric = 'avg_lifetime_value',
  showPercentage = false,
  sortBy = 'value',
  sortOrder = 'desc',
  onMetricChange,
  onViewToggle,
  onSortChange,
  highlightedSegments = [],
  width = 480,
  height = 440
}) => {
  const [isClient, setIsClient] = useState(false);

  // Client-side only check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Segment color mapping
  const segmentColors = {
    'Champions': '#00e0ff',
    'Loyal Customers': '#5fd4d6',
    'Potential Loyalists': '#e930ff',
    'New Customers': '#aa45dd',
    'Promising': '#43cad0',
    'Need Attention': '#fbbf24',
    'About to Sleep': '#f59133',
    'At Risk': '#dc2626',
    'Cannot Lose Them': '#7c3aed',
    'Hibernating': '#64748b'
  };

  const getSegmentColor = useCallback((segmentName) => {
    return segmentColors[segmentName] || '#64748b';
  }, []);

  // Available metrics for comparison
  const availableMetrics = [
    { value: 'avg_lifetime_value', label: 'Average Lifetime Value', format: 'currency' },
    { value: 'avg_order_value', label: 'Average Order Value', format: 'currency' },
    { value: 'avg_frequency', label: 'Purchase Frequency', format: 'number' },
    { value: 'avg_recency', label: 'Recency (Days)', format: 'number' },
    { value: 'transaction_count', label: 'Transaction Count', format: 'number' },
    { value: 'customer_count', label: 'Customer Count', format: 'number' }
  ];

  const currentMetric = availableMetrics.find(m => m.value === selectedMetric) || availableMetrics[0];

  // Generate default data if none provided
  const dataToUse = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Default segments data
    return [
      { segment_name: 'Champions', avg_lifetime_value: 7500, avg_order_value: 450, avg_frequency: 8.5, avg_recency: 10, transaction_count: 850, customer_count: 100 },
      { segment_name: 'Loyal Customers', avg_lifetime_value: 5200, avg_order_value: 320, avg_frequency: 6.3, avg_recency: 15, transaction_count: 630, customer_count: 100 },
      { segment_name: 'Potential Loyalists', avg_lifetime_value: 3800, avg_order_value: 280, avg_frequency: 4.8, avg_recency: 20, transaction_count: 480, customer_count: 100 },
      { segment_name: 'New Customers', avg_lifetime_value: 1500, avg_order_value: 180, avg_frequency: 2.2, avg_recency: 8, transaction_count: 220, customer_count: 100 },
      { segment_name: 'At Risk', avg_lifetime_value: 2800, avg_order_value: 220, avg_frequency: 3.5, avg_recency: 35, transaction_count: 350, customer_count: 100 },
      { segment_name: 'Cannot Lose Them', avg_lifetime_value: 6200, avg_order_value: 380, avg_frequency: 5.7, avg_recency: 42, transaction_count: 570, customer_count: 100 },
      { segment_name: 'Hibernating', avg_lifetime_value: 1200, avg_order_value: 150, avg_frequency: 1.8, avg_recency: 55, transaction_count: 180, customer_count: 100 },
      { segment_name: 'About to Sleep', avg_lifetime_value: 800, avg_order_value: 120, avg_frequency: 1.2, avg_recency: 75, transaction_count: 120, customer_count: 100 }
    ];
  }, [data]);

  // Process and sort data
  const processedData = useMemo(() => {
    if (!dataToUse || dataToUse.length === 0 || !isClient) return { chartData: [], overallAverage: 0, statistics: {} };

    // Calculate overall average for the selected metric
    const validValues = dataToUse
      .map(segment => segment[selectedMetric])
      .filter(val => val !== undefined && val !== null && !isNaN(val));
    
    const overallAverage = validValues.length > 0 
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length 
      : 0;

    // Sort the data
    let sortedData = [...dataToUse];
    switch (sortBy) {
      case 'value':
        sortedData.sort((a, b) => {
          const aVal = a[selectedMetric] || 0;
          const bVal = b[selectedMetric] || 0;
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        break;
      case 'name':
        sortedData.sort((a, b) => {
          const comparison = (a.segment_name || '').localeCompare(b.segment_name || '');
          return sortOrder === 'desc' ? -comparison : comparison;
        });
        break;
      case 'size':
        sortedData.sort((a, b) => {
          const aVal = a.customer_count || 0;
          const bVal = b.customer_count || 0;
          return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
        });
        break;
      default:
        break;
    }

    // Process data for chart
    const chartData = sortedData.map((segment, index) => {
      const value = segment[selectedMetric] || 0;
      const isHighlighted = highlightedSegments.includes(segment.segment_name);
      const percentageValue = showPercentage && overallAverage > 0 
        ? (value / overallAverage) * 100 
        : value;

      return {
        segment_name: segment.segment_name,
        value: percentageValue,
        originalValue: value,
        color: getSegmentColor(segment.segment_name),
        opacity: isHighlighted ? 1 : 0.8,
        customer_count: segment.customer_count || 0,
        percentage: segment.customer_count 
          ? ((segment.customer_count / sortedData.reduce((sum, s) => sum + (s.customer_count || 0), 0)) * 100).toFixed(1)
          : '0'
      };
    });

    // Calculate statistics
    const statistics = {
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      median: validValues.sort((a, b) => a - b)[Math.floor(validValues.length / 2)],
      stdDev: validValues.length > 1 ? Math.sqrt(
        validValues.reduce((sum, val) => sum + Math.pow(val - overallAverage, 2), 0) / (validValues.length - 1)
      ) : 0
    };

    return { chartData, overallAverage, statistics };
  }, [dataToUse, selectedMetric, showPercentage, sortBy, sortOrder, highlightedSegments, getSegmentColor, isClient]);

  // Format value based on metric type
  const formatValue = useCallback((value, format) => {
    if (value === undefined || value === null) return 'N/A';
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }, []);

  // Create Plotly chart configuration
  const plotData = useMemo(() => {
    if (processedData.chartData.length === 0) return [];

    return [{
      x: processedData.chartData.map(d => d.segment_name),
      y: processedData.chartData.map(d => d.value),
      type: 'bar',
      name: currentMetric.label,
      marker: {
        color: processedData.chartData.map(d => d.color),
        opacity: processedData.chartData.map(d => d.opacity),
        line: {
          color: '#0a1224',
          width: 1
        }
      },
      text: processedData.chartData.map(d => 
        formatValue(d.value, showPercentage ? 'percentage' : currentMetric.format)
      ),
      textposition: 'outside',
      textfont: {
        color: '#f7f9fb',
        size: 12,
        family: 'Inter, sans-serif'
      },
      hovertemplate: 
        '<b>%{x}</b><br>' +
        `${currentMetric.label}: %{text}<br>` +
        'Customers: %{customdata.customer_count:,}<br>' +
        'Percentage: %{customdata.percentage}%<br>' +
        '<extra></extra>',
      customdata: processedData.chartData.map(d => ({
        customer_count: d.customer_count,
        percentage: d.percentage
      }))
    }];
  }, [processedData, currentMetric, showPercentage, formatValue]);

  const plotLayout = useMemo(() => ({
    width: width,
    height: height,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb'
    },
    title: {
      text: `${currentMetric.label} by Segment`,
      font: { size: 16, color: '#f7f9fb' },
      x: 0.05,
      y: 0.95
    },
    xaxis: {
      title: {
        text: 'Customer Segments',
        font: { size: 12, color: '#f7f9fb' }
      },
      tickangle: -45,
      tickfont: { color: '#f7f9fb', size: 10 },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: false
    },
    yaxis: {
      title: {
        text: showPercentage ? 'Percentage of Average (%)' : currentMetric.label,
        font: { size: 12, color: '#f7f9fb' }
      },
      tickfont: { color: '#f7f9fb', size: 10 },
      gridcolor: '#3a4459',
      gridwidth: 1,
      showgrid: true
    },
    shapes: showPercentage ? [{
      type: 'line',
      x0: -0.5,
      x1: processedData.chartData.length - 0.5,
      y0: 100,
      y1: 100,
      line: {
        color: '#f7f9fb',
        width: 2,
        dash: 'dash'
      }
    }] : processedData.overallAverage > 0 ? [{
      type: 'line',
      x0: -0.5,
      x1: processedData.chartData.length - 0.5,
      y0: processedData.overallAverage,
      y1: processedData.overallAverage,
      line: {
        color: '#f7f9fb',
        width: 2,
        dash: 'dash'
      }
    }] : [],
    annotations: showPercentage ? [{
      x: processedData.chartData.length - 0.5,
      y: 100,
      text: 'Average: 100%',
      showarrow: false,
      xanchor: 'left',
      font: { color: '#f7f9fb', size: 10 }
    }] : processedData.overallAverage > 0 ? [{
      x: processedData.chartData.length - 0.5,
      y: processedData.overallAverage,
      text: `Average: ${formatValue(processedData.overallAverage, currentMetric.format)}`,
      showarrow: false,
      xanchor: 'left',
      font: { color: '#f7f9fb', size: 10 }
    }] : [],
    margin: { l: 80, r: 40, t: 60, b: 100 },
    showlegend: false
  }), [width, height, currentMetric, showPercentage, processedData, formatValue]);

  const plotConfig = useMemo(() => ({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
    toImageButtonOptions: {
      format: 'png',
      filename: 'segment_comparison',
      height: height,
      width: width,
      scale: 2
    },
    responsive: false
  }), [width, height]);

  // Handle chart interactions
  const handleBarClick = useCallback((eventData) => {
    if (eventData.points && eventData.points.length > 0) {
      const segmentName = eventData.points[0].x;
      // You can add segment selection logic here
      console.log('Selected segment:', segmentName);
    }
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
      <div 
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 39, 56, 0.9) 0%, rgba(35, 42, 54, 0.9) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          padding: '28px',
          transition: 'all 0.3s ease'
        }}
      >
      {/* Header with controls */}
      <div 
        className="mb-6"
        style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(58, 68, 89, 0.3)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-cloud-white font-bold text-xl mb-2" 
                style={{ 
                  fontFamily: 'Inter, sans-serif',
                  textShadow: '0 2px 10px rgba(0, 224, 255, 0.2)',
                  letterSpacing: '0.5px'
                }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #00e0ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Segment Metric Comparison
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00e0ff',
                boxShadow: '0 0 10px rgba(0, 224, 255, 0.5)',
                animation: 'pulse 2s infinite'
              }}/>
              <p className="text-cloud-white/80 text-sm font-medium">
                Analyzing <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{dataToUse.length}</span> customer segments
              </p>
            </div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ marginTop: '24px' }}>
          {/* Metric Selector */}
          <div 
            className="group"
            style={{
              padding: '20px',
              background: 'rgba(20, 28, 40, 0.3)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              minHeight: '140px'
            }}
          >
            <div className="mb-4">
              <h4 style={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📊</span>
                Metric Selection
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                Choose the metric to compare
              </p>
            </div>
            <select
              value={selectedMetric}
              onChange={(e) => onMetricChange?.(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                width: '100%',
                minWidth: '200px'
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(0, 224, 255, 0.5)';
                e.target.style.background = 'rgba(30, 41, 59, 0.7)';
              }}
              onBlur={(e) => {
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(30, 41, 59, 0.5)';
              }}
            >
              {availableMetrics.map(metric => (
                <option key={metric.value} value={metric.value} style={{ background: '#1e293b', color: '#ffffff' }}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div 
            className="group"
            style={{
              padding: '20px',
              background: 'rgba(20, 28, 40, 0.3)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              minHeight: '140px'
            }}
          >
            <div className="mb-4">
              <h4 style={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>📈</span>
                Display Mode
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                Toggle between absolute and percentage
              </p>
            </div>
            {/* Modern Toggle Switch */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <span style={{ 
                color: !showPercentage ? '#00e0ff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'color 0.3s'
              }}>
                Absolute
              </span>
              <button
                onClick={() => onViewToggle?.(!showPercentage)}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '28px',
                  background: showPercentage ? 
                    'linear-gradient(90deg, #00e0ff 0%, #0099cc 100%)' : 
                    'rgba(255, 255, 255, 0.2)',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: showPercentage ? 
                    '0 0 20px rgba(0, 224, 255, 0.3)' : 
                    'inset 0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
                title={showPercentage ? 'Switch to Absolute Values' : 'Switch to Percentage'}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: showPercentage ? '34px' : '3px',
                  width: '22px',
                  height: '22px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }} />
              </button>
              <span style={{ 
                color: showPercentage ? '#00e0ff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'color 0.3s'
              }}>
                Percentage
              </span>
            </div>
          </div>

          {/* Sort Controls */}
          <div 
            className="group"
            style={{
              padding: '20px',
              background: 'rgba(20, 28, 40, 0.3)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              minHeight: '140px'
            }}
          >
            <div className="mb-4">
              <h4 style={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '18px' }}>🔄</span>
                Sort Options
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                Arrange segments by your preference
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  onSortChange?.(newSortBy, newSortOrder);
                }}
                className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '100%',
                  minWidth: '200px',
                  appearance: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(16, 185, 129, 0.5)';
                  e.target.style.background = 'rgba(30, 41, 59, 0.7)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(30, 41, 59, 0.5)';
                }}
              >
                <option value="value-desc" style={{ background: '#1e293b', color: '#ffffff' }}>Value (High to Low)</option>
                <option value="value-asc" style={{ background: '#1e293b', color: '#ffffff' }}>Value (Low to High)</option>
                <option value="name-asc" style={{ background: '#1e293b', color: '#ffffff' }}>Name (A to Z)</option>
                <option value="name-desc" style={{ background: '#1e293b', color: '#ffffff' }}>Name (Z to A)</option>
                <option value="size-desc" style={{ background: '#1e293b', color: '#ffffff' }}>Size (Large to Small)</option>
                <option value="size-asc" style={{ background: '#1e293b', color: '#ffffff' }}>Size (Small to Large)</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#00e0ff',
                fontSize: '16px'
              }}>
                {sortOrder === 'desc' ? '↓' : '↑'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className="relative mt-6"
        style={{ 
          background: 'linear-gradient(135deg, rgba(10, 18, 36, 0.6) 0%, rgba(26, 35, 50, 0.6) 100%)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(0, 224, 255, 0.1)',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)'
        }}
      >
        {isClient && (
          <Plot
            data={plotData}
            layout={plotLayout}
            config={plotConfig}
            onClick={handleBarClick}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        )}

        {/* Statistics Panel */}
        {processedData.statistics && (
          <div className="absolute top-4 right-4">
            <div 
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(35, 42, 54, 0.9)',
                border: '1px solid #3a4459'
              }}
            >
              <h5 className="text-cloud-white font-semibold text-xs mb-2">Statistics</h5>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">Min:</span>
                  <span className="text-cloud-white font-medium">
                    {formatValue(processedData.statistics.min, currentMetric.format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">Max:</span>
                  <span className="text-cloud-white font-medium">
                    {formatValue(processedData.statistics.max, currentMetric.format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">Median:</span>
                  <span className="text-cloud-white font-medium">
                    {formatValue(processedData.statistics.median, currentMetric.format)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default SegmentMetricComparison;