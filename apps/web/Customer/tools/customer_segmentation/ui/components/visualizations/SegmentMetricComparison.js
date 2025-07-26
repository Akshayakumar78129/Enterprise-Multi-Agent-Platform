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

  // Process and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0 || !isClient) return { chartData: [], overallAverage: 0, statistics: {} };

    // Calculate overall average for the selected metric
    const validValues = data
      .map(segment => segment[selectedMetric])
      .filter(val => val !== undefined && val !== null && !isNaN(val));
    
    const overallAverage = validValues.length > 0 
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length 
      : 0;

    // Sort the data
    let sortedData = [...data];
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

    // Prepare chart data
    const chartData = sortedData.map(segment => {
      const rawValue = segment[selectedMetric] || 0;
      const displayValue = showPercentage 
        ? overallAverage > 0 ? (rawValue / overallAverage) * 100 : 0
        : rawValue;
      
      const isHighlighted = highlightedSegments.length === 0 || highlightedSegments.includes(segment.segment_name);
      
      return {
        segment_name: segment.segment_name,
        value: displayValue,
        rawValue: rawValue,
        customer_count: segment.customer_count || 0,
        color: getSegmentColor(segment.segment_name),
        opacity: isHighlighted ? 0.8 : 0.3
      };
    });

    // Calculate statistics
    const statistics = {
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      median: validValues.sort((a, b) => a - b)[Math.floor(validValues.length / 2)] || 0,
      standardDeviation: validValues.length > 1 ? Math.sqrt(
        validValues.reduce((sum, val) => sum + Math.pow(val - overallAverage, 2), 0) / (validValues.length - 1)
      ) : 0
    };

    return { chartData, overallAverage, statistics };
  }, [data, selectedMetric, showPercentage, sortBy, sortOrder, highlightedSegments, getSegmentColor, isClient]);

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
        '<extra></extra>',
      customdata: processedData.chartData.map(d => ({
        customer_count: d.customer_count,
        raw_value: d.rawValue
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
      text: 'Average (100%)',
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

  if (!data || data.length === 0) {
    return (
      <div 
        className="rounded-2xl border shadow-lg p-8 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #232a36 0%, #2c3341 100%)',
          border: '1px solid #3a4459',
          width: width,
          height: height
        }}
      >
        <div className="text-center">
          <div className="text-6xl mb-6 opacity-40">📊</div>
          <h3 className="text-cloud-white text-xl font-semibold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            No Comparison Data
          </h3>
          <p className="text-cloud-white/60">
            Segment comparison data is not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl border shadow-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #232a36 0%, #2c3341 100%)',
        border: '1px solid #3a4459'
      }}
    >
      {/* Header with controls */}
      <div 
        className="px-6 py-4 border-b"
        style={{ borderColor: '#3a4459' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-cloud-white font-bold text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              Segment Metric Comparison
            </h3>
            <p className="text-cloud-white/60 text-sm">
              Compare key metrics across {data.length} segments
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Metric Selector */}
          <div>
            <label className="text-cloud-white/70 text-sm font-medium mb-2 block">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => onMetricChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{
                background: '#1a2332',
                border: '1px solid #3a4459',
                color: '#f7f9fb'
              }}
            >
              {availableMetrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="text-cloud-white/70 text-sm font-medium mb-2 block">Display</label>
            <div 
              className="flex items-center rounded-lg p-1"
              style={{ background: '#1a2332' }}
            >
              <button
                onClick={() => onViewToggle?.(false)}
                className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  !showPercentage 
                    ? 'text-midnight-navy shadow-lg'
                    : 'text-cloud-white/60 hover:text-cloud-white'
                }`}
                style={!showPercentage ? {
                  background: 'linear-gradient(135deg, #00e0ff 0%, #0099cc 100%)'
                } : {}}
              >
                Absolute
              </button>
              <button
                onClick={() => onViewToggle?.(true)}
                className={`flex-1 px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  showPercentage 
                    ? 'text-midnight-navy shadow-lg'
                    : 'text-cloud-white/60 hover:text-cloud-white'
                }`}
                style={showPercentage ? {
                  background: 'linear-gradient(135deg, #00e0ff 0%, #0099cc 100%)'
                } : {}}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <div>
            <label className="text-cloud-white/70 text-sm font-medium mb-2 block">Sort by</label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => onSortChange?.(e.target.value, sortOrder)}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                style={{
                  background: '#1a2332',
                  border: '1px solid #3a4459',
                  color: '#f7f9fb'
                }}
              >
                <option value="value">Value</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <button
                onClick={() => onSortChange?.(sortBy, sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: '#00e0ff20',
                  color: '#00e0ff',
                  border: '1px solid #00e0ff40'
                }}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className="relative"
        style={{ 
          background: 'linear-gradient(135deg, #0a1224 0%, #1a2332 100%)'
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
                  <span className="text-cloud-white">
                    {formatValue(processedData.statistics.min, currentMetric.format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">Max:</span>
                  <span className="text-cloud-white">
                    {formatValue(processedData.statistics.max, currentMetric.format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">Avg:</span>
                  <span className="text-cloud-white">
                    {formatValue(processedData.overallAverage, currentMetric.format)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-white/60">StdDev:</span>
                  <span className="text-cloud-white">
                    {formatValue(processedData.statistics.standardDeviation, currentMetric.format)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentMetricComparison; 