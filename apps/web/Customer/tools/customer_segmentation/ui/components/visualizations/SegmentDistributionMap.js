import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of Plotly to prevent SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const SegmentDistributionMap = ({
  data = [],
  selectedSegments = [],
  onSegmentFilter = () => {},
  onCustomerSelect = () => {},
  selectedCustomer = null,
  width = 760,
  height = 560,
  viewMode = 'overview',
  performanceMode = false
}) => {
  const [segmentGroups, setSegmentGroups] = useState({});
  const [selectedAxis, setSelectedAxis] = useState({
    x: 'rfm_rl_score',
    y: 'lifetime_value'
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isClient, setIsClient] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Segment colors matching Enterprise IQ design
  const segmentColors = {
    'Champions': '#00e0ff',
    'Loyal Customers': '#e930ff', 
    'Potential Loyalists': '#5fd4d6',
    'New Customers': '#aa45dd',
    'Promising': '#43cad0',
    'Need Attention': '#fbbf24',
    'About to Sleep': '#f59e0b',
    'At Risk': '#ef4444',
    'Cannot Lose Them': '#dc2626',
    'Hibernating': '#6b7280',
    'Lost': '#374151'
  };

  // Process and group data by segments
  const processedData = useMemo(() => {
    if (!data.length) return { groupedData: {}, allData: [] };

    const tempSegmentGroups = {};
    const validData = data.filter(customer => 
      customer && 
      typeof customer[selectedAxis.x] === 'number' && 
      typeof customer[selectedAxis.y] === 'number' &&
      !isNaN(customer[selectedAxis.x]) && 
      !isNaN(customer[selectedAxis.y])
    );

    validData.forEach(customer => {
      const segmentName = customer.segment_name || 'Unknown';
      if (!tempSegmentGroups[segmentName]) {
        tempSegmentGroups[segmentName] = [];
      }
      tempSegmentGroups[segmentName].push(customer);
    });

    setSegmentGroups(tempSegmentGroups);
    return { groupedData: tempSegmentGroups, allData: validData };
  }, [data, selectedAxis]);

  // Prepare plot data
  const plotData = useMemo(() => {
    if (!Object.keys(segmentGroups).length) return [];

    return Object.entries(segmentGroups).map(([segmentName, customers]) => {
      const isSelected = selectedSegments.length === 0 || selectedSegments.includes(segmentName);
      const segmentColor = segmentColors[segmentName] || '#b0b8c9';
      
      return {
        x: customers.map(c => c[selectedAxis.x]),
        y: customers.map(c => c[selectedAxis.y]),
        mode: 'markers',
        type: performanceMode ? 'scattergl' : 'scatter',
        name: segmentName,
        text: customers.map(c => 
          `${c.customer_name}<br>` +
          `Segment: ${c.segment_name}<br>` +
          `${selectedAxis.x}: ${c[selectedAxis.x]}<br>` +
          `${selectedAxis.y}: ${c[selectedAxis.y]}<br>` +
          `Lifetime Value: $${c.lifetime_value?.toFixed(2) || 'N/A'}`
        ),
        hovertemplate: '%{text}<extra></extra>',
        marker: {
          size: performanceMode && data.length > 2000 ? 4 : data.length > 1000 ? 6 : 8,
          color: segmentColor,
          opacity: isSelected ? (data.length > 2000 ? 0.5 : 0.7) : 0.2,
          line: data.length > 2000 ? {} : {
            width: isSelected ? 1 : 0,
            color: '#0a1224'
          }
        },
        visible: true,
        customdata: customers.map(c => ({ customer: c, segment: segmentName }))
      };
    });
  }, [segmentGroups, selectedSegments, selectedAxis, performanceMode, data.length]);

  // Plot layout configuration
  const plotLayout = useMemo(() => ({
    width: width,
    height: height - 80, // Account for header
    plot_bgcolor: '#1e2738',
    paper_bgcolor: 'transparent',
    font: {
      family: 'Inter, sans-serif',
      color: '#f7f9fb'
    },
    margin: { t: 20, r: 20, b: 60, l: 80 },
    xaxis: {
      title: {
        text: selectedAxis.x.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        font: { size: 14, color: '#b0b8c9' }
      },
      gridcolor: '#3a4459',
      gridwidth: 1,
      zeroline: false,
      tickfont: { color: '#b0b8c9', size: 12 }
    },
    yaxis: {
      title: {
        text: selectedAxis.y.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        font: { size: 14, color: '#b0b8c9' }
      },
      gridcolor: '#3a4459',
      gridwidth: 1,
      zeroline: false,
      tickfont: { color: '#b0b8c9', size: 12 }
    },
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(30, 39, 56, 0.8)',
      bordercolor: '#3a4459',
      borderwidth: 1,
      font: { size: 11, color: '#f7f9fb' }
    },
    hovermode: 'closest',
    dragmode: 'pan'
  }), [selectedAxis, width, height]);

  // Plot configuration
  const plotConfig = useMemo(() => ({
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'segment_distribution',
      height: height,
      width: width,
      scale: 1
    }
  }), [width, height]);

  // Handle plot clicks
  const handlePlotClick = useCallback((event) => {
    if (event.points && event.points.length > 0) {
      const point = event.points[0];
      const customerData = point.customdata;
      
      // Check if shift key is pressed
      if (event.event?.shiftKey) {
        // Shift+click: Use ChartSelectionManager for multi-selection
        const selectionAPI = window.chartSelectionAPI;
        if (selectionAPI && customerData) {
          const selectionPoint = {
            chartId: 'segment-distribution-map',
            chartType: 'scatter',
            dataIndex: point.pointIndex,
            label: customerData.segment || 'Unknown',
            value: point.y || 0,
            unit: '',
            coordinates: { 
              x: event.event?.clientX || 0, 
              y: event.event?.clientY || 0 
            },
            metadata: {
              customer: customerData.customer,
              x: point.x,
              y: point.y,
              segment: customerData.segment
            }
          };
          selectionAPI.addPoint(selectionPoint);
        }
      } else {
        // Regular click: Original behavior
        if (customerData && customerData.customer) {
          onCustomerSelect(customerData.customer, event.event);
        }
      }
    }
  }, [onCustomerSelect]);

  // Handle axis change
  const handleAxisChange = useCallback((axis, value) => {
    setSelectedAxis(prev => ({ ...prev, [axis]: value }));
  }, []);

  // Available axis options
  const axisOptions = [
    { value: 'rfm_rl_score', label: 'RFM Score' },
    { value: 'lifetime_value', label: 'Lifetime Value' },
    { value: 'avg_order_value', label: 'Avg Order Value' },
    { value: 'transaction_count', label: 'Transaction Count' },
    { value: 'days_since_last_activity', label: 'Days Since Last Activity' },
    { value: 'current_year_sales', label: 'Current Year Sales' }
  ];

  // Don't render on server side
  if (!isClient) {
    return (
      <div style={{
        width: width,
        height: height,
        background: 'linear-gradient(135deg, #232a36, #2c3341)',
        borderRadius: '16px',
        border: '1px solid #3a4459',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#b0b8c9'
      }}>
        Loading visualization...
      </div>
    );
  }

  return (
    <div style={{
      width: width,
      height: height,
      background: 'linear-gradient(135deg, #232a36, #2c3341)',
      borderRadius: '16px',
      border: '1px solid #3a4459',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #3a4459',
        background: 'rgba(10, 18, 36, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: '#f7f9fb',
              fontFamily: 'Inter, sans-serif'
            }}>
              Segment Distribution Map
            </h3>
            <div style={{
              fontSize: '12px',
              color: '#b0b8c9',
              marginTop: '4px'
            }}>
              {Object.keys(segmentGroups).length} segments • {data.length} customers
              {performanceMode && (
                <span style={{ color: '#00e0ff', marginLeft: '8px' }}>
                  • WebGL Optimized
                </span>
              )}
            </div>
          </div>

          {/* Axis Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#b0b8c9' }}>X:</label>
              <select
                value={selectedAxis.x}
                onChange={(e) => handleAxisChange('x', e.target.value)}
                style={{
                  background: '#1e2738',
                  color: '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {axisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: '#b0b8c9' }}>Y:</label>
              <select
                value={selectedAxis.y}
                onChange={(e) => handleAxisChange('y', e.target.value)}
                style={{
                  background: '#1e2738',
                  color: '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {axisOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedSegments.length > 0 && (
              <button
                onClick={() => onSegmentFilter([])}
                style={{
                  background: 'rgba(233, 48, 255, 0.2)',
                  color: '#e930ff',
                  border: '1px solid #e930ff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plot Container */}
      <div style={{ 
        width: '100%', 
        height: height - 80,
        position: 'relative'
      }}>
        {plotData.length > 0 ? (
          <Plot
            data={plotData}
            layout={plotLayout}
            config={plotConfig}
            onClick={handlePlotClick}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#b0b8c9',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
              <div>No segment data available</div>
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                Please ensure your data contains valid segments
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SegmentDistributionMap; 