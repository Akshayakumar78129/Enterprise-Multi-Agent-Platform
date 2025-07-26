import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { SegmentQuadrantProps, CustomerSegment } from '../../types';

const SegmentQuadrant = forwardRef<any, SegmentQuadrantProps>(({
  data,
  width = 480,
  height = 480,
  onSegmentClick,
  onCustomerClick,
  onChartElementClick,
  componentId,
  highlightSegments = [],
  focusRegion
}, ref) => {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0.5, y: 0.5 });
  
  // Reset selection when highlight segments change from external source
  useEffect(() => {
    if (highlightSegments && highlightSegments.length > 0) {
      setSelectedSegments(highlightSegments);
    }
  }, [highlightSegments]);

  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    highlightSegment: (segment: string) => {
      setSelectedSegments([segment]);
      
      if (onSegmentClick) {
        onSegmentClick(segment);
      }
    },
    highlightSegments: (segments: string[]) => {
      setSelectedSegments(segments);
    },
    clearHighlights: () => {
      setSelectedSegments([]);
    },
    focusRegion: (region: { frequencyMin: number, frequencyMax: number, valueMin: number, valueMax: number }) => {
      const centerX = (region.frequencyMin + region.frequencyMax) / 2;
      const centerY = (region.valueMin + region.valueMax) / 2;
      
      // Normalize to 0-1 scale
      const maxFreq = Math.max(...data.map(d => d.frequency));
      const maxValue = Math.max(...data.map(d => d.monetary));
      
      setZoomCenter({ 
        x: centerX / maxFreq, 
        y: centerY / maxValue 
      });
      
      // Set zoom level based on region size
      const freqRange = region.frequencyMax - region.frequencyMin;
      const valueRange = region.valueMax - region.valueMin;
      const zoomX = maxFreq / freqRange;
      const zoomY = maxValue / valueRange;
      
      setZoomLevel(Math.min(zoomX, zoomY, 1.2)); // Cap at 120% zoom
    },
    resetView: () => {
      setSelectedSegments([]);
      setHoveredPoint(null);
      setZoomLevel(1);
      setZoomCenter({ x: 0.5, y: 0.5 });
    }
  }));

  // Calculate bounds for axes
  const maxFrequency = Math.max(...data.map(d => d.frequency)) * 1.1; // Add 10% padding
  const maxMonetary = Math.max(...data.map(d => d.monetary)) * 1.1;
  const maxRecency = Math.max(...data.map(d => d.recency));
  
  // Calculate chart dimensions
  const margin = { top: 40, right: 40, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Mapping functions to convert data values to pixel positions
  const xScale = (value: number) => (value / maxFrequency) * innerWidth;
  const yScale = (value: number) => innerHeight - (value / maxMonetary) * innerHeight;
  
  // Get segment color
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'champions':
        return '#00e0ff'; // Electric Cyan
      case 'loyal':
        return '#5fd4d6'; // Lighter cyan
      case 'big_spenders':
        return '#ae76fa'; // Purple
      case 'at_risk':
        return '#e930ff'; // Signal Magenta
      default:
        return '#3a4459'; // Graphite
    }
  };
  
  // Size based on recency
  const getPointSize = (recency: number) => {
    const baseSize = 8;
    const sizeRange = 16;
    return baseSize + (recency / maxRecency) * sizeRange;
  };
  
  // Calculate means for drawing quadrant lines
  const meanFrequency = data.reduce((sum, d) => sum + d.frequency, 0) / data.length;
  const meanMonetary = data.reduce((sum, d) => sum + d.monetary, 0) / data.length;
  
  // Group data by segment for legend
  const segments = Array.from(new Set(data.map(d => d.segment)));
  const segmentCounts = segments.reduce((acc, segment) => {
    acc[segment] = data.filter(d => d.segment === segment).length;
    return acc;
  }, {} as Record<string, number>);
  
  // Handle interactions
  const handlePointMouseEnter = (id: string) => {
    setHoveredPoint(id);
  };
  
  const handlePointMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  const handlePointClick = (event: React.MouseEvent, segment: string, customerId: string, customer: CustomerSegment) => {
    // Prevent event propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle segment selection
    setSelectedSegments(prev => 
      prev.includes(segment)
        ? prev.filter(s => s !== segment)
        : [...prev, segment]
    );
    
    // Call existing handlers
    if (onSegmentClick) {
      onSegmentClick(segment);
    }
    
    if (onCustomerClick) {
      onCustomerClick(customerId);
    }
    
    // Call laser pointer integration handler
    if (onChartElementClick) {
      // Get the SVG element and its bounding rect for coordinate calculation
      const svgElement = event.currentTarget.closest('svg');
      const chartContainer = event.currentTarget.closest('.segment-quadrant');
      
      if (svgElement && chartContainer) {
        const svgRect = svgElement.getBoundingClientRect();
        const chartRect = chartContainer.getBoundingClientRect();
        
        // Calculate the point position within the chart
        const x = xScale(customer.frequency);
        const y = yScale(customer.monetary);
        
        // Convert to page coordinates
        const pageX = svgRect.left + margin.left + x;
        const pageY = svgRect.top + margin.top + y;
        
        const clickData = {
          event: event,
          pointData: {
            id: customerId,
            label: `${segment} (ID: ${customerId})`,
            value: `F:${customer.frequency.toFixed(1)} M:$${customer.monetary.toFixed(0)} R:${customer.recency.toFixed(1)}`,
            x: x, // Chart-relative coordinates
            y: y,
            targetCoords: { x: pageX, y: pageY }, // Page-relative coordinates
            datasetIndex: 0,
            index: customerId,
            chartLabel: 'Customer Segment Quadrant'
          },
          componentId: componentId,
          chartId: 'segment-quadrant',
          chartRect: svgRect,
          elementRect: chartRect
        };
        
        console.log('SegmentQuadrant: Calling onChartElementClick with:', clickData);
        onChartElementClick(clickData);
      }
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 2)); // Cap at 2x zoom
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5)); // Minimum 0.5x zoom
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomCenter({ x: 0.5, y: 0.5 });
  };

  return (
    <div 
      className="segment-quadrant"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#232a36',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}
      onClick={(event) => {
        // Clear selections when clicking on background
        if (event.target === event.currentTarget && onChartElementClick) {
          onChartElementClick({
            event: event,
            pointData: null,
            componentId: componentId,
            chartId: 'segment-quadrant'
          });
        }
      }}
    >
      <h3 
        style={{
          margin: 0,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#f7f9fb'
        }}
      >
        Customer Segment Quadrant (RFM)
      </h3>
      
      <svg width={width - 32} height={height - 80}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* X and Y Axes */}
          <line 
            x1={0} 
            y1={innerHeight} 
            x2={innerWidth} 
            y2={innerHeight} 
            stroke="#8893a7" 
            strokeWidth={1} 
          />
          <line 
            x1={0} 
            y1={0} 
            x2={0} 
            y2={innerHeight} 
            stroke="#8893a7" 
            strokeWidth={1} 
          />
          
          {/* X Axis Label */}
          <text
            x={innerWidth / 2}
            y={innerHeight + 35}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
          >
            Purchase Frequency
          </text>
          
          {/* Y Axis Label */}
          <text
            x={-40}
            y={innerHeight / 2}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
            transform={`rotate(-90, -40, ${innerHeight / 2})`}
          >
            Average Transaction Value
          </text>
          
          {/* Quadrant Lines */}
          <line 
            x1={xScale(meanFrequency)} 
            y1={0} 
            x2={xScale(meanFrequency)} 
            y2={innerHeight} 
            stroke="#f7f9fb" 
            strokeWidth={1} 
            strokeOpacity={0.5} 
            strokeDasharray="4 4"
          />
          <line 
            x1={0} 
            y1={yScale(meanMonetary)} 
            x2={innerWidth} 
            y2={yScale(meanMonetary)} 
            stroke="#f7f9fb" 
            strokeWidth={1} 
            strokeOpacity={0.5} 
            strokeDasharray="4 4"
          />
          
          {/* Quadrant Labels */}
          <text
            x={xScale(meanFrequency / 2)}
            y={yScale(meanMonetary / 2)}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
            fontWeight={600}
            opacity={0.8}
          >
            At Risk
          </text>
          <text
            x={xScale(meanFrequency * 1.5)}
            y={yScale(meanMonetary / 2)}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
            fontWeight={600}
            opacity={0.8}
          >
            Loyal
          </text>
          <text
            x={xScale(meanFrequency / 2)}
            y={yScale(meanMonetary * 1.5)}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
            fontWeight={600}
            opacity={0.8}
          >
            Big Spenders
          </text>
          <text
            x={xScale(meanFrequency * 1.5)}
            y={yScale(meanMonetary * 1.5)}
            textAnchor="middle"
            fill="#f7f9fb"
            fontSize={14}
            fontWeight={600}
            opacity={0.8}
          >
            Champions
          </text>
          
          {/* Data Points */}
          {data.map(d => {
            const x = xScale(d.frequency);
            const y = yScale(d.monetary);
            const size = getPointSize(d.recency);
            const color = getSegmentColor(d.segment);
            
            const isHighlighted = 
              hoveredPoint === d.id || 
              selectedSegments.includes(d.segment);
              
            // Apply filtering: show faded if segments are selected and this one isn't
            const opacity = selectedSegments.length > 0 && !selectedSegments.includes(d.segment)
              ? 0.2 
              : 1;
            
            return (
              <g 
                key={`point-${d.id}`}
                transform={`translate(${x}, ${y})`}
                onClick={(event) => handlePointClick(event, d.segment, d.id, d)}
                onMouseEnter={() => handlePointMouseEnter(d.id)}
                onMouseLeave={handlePointMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={isHighlighted ? size + 4 : size}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={isHighlighted ? '#f7f9fb' : 'none'}
                  strokeWidth={2}
                  style={{ 
                    transition: 'all 0.2s ease',
                    filter: isHighlighted ? `drop-shadow(0 0 6px ${color})` : 'none'
                  }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Legend */}
      <div 
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: `${width - 120}px`
        }}
      >
        {segments.map(segment => (
          <div 
            key={`legend-${segment}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: selectedSegments.length > 0 && !selectedSegments.includes(segment) ? 0.5 : 1,
              cursor: 'pointer'
            }}
            onClick={(event) => {
              if (onSegmentClick) {
                onSegmentClick(segment);
              }
              setSelectedSegments(prev => 
                prev.includes(segment)
                  ? prev.filter(s => s !== segment)
                  : [...prev, segment]
              );
            }}
          >
            <div 
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: getSegmentColor(segment),
                borderRadius: '50%',
                border: selectedSegments.includes(segment) ? '1px solid #f7f9fb' : 'none'
              }}
            />
            <span style={{ fontSize: '12px', color: '#f7f9fb' }}>
              {segment.charAt(0).toUpperCase() + segment.slice(1).replace('_', ' ')} ({segmentCounts[segment]})
            </span>
          </div>
        ))}
      </div>
      
      {/* Zoom Controls */}
      <div 
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <button 
          onClick={handleZoomOut}
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3a4459',
            border: 'none',
            borderRadius: '4px',
            color: '#f7f9fb',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          -
        </button>
        <button 
          onClick={handleResetZoom}
          style={{
            padding: '0 6px',
            height: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3a4459',
            border: 'none',
            borderRadius: '4px',
            color: '#f7f9fb',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Reset
        </button>
        <button 
          onClick={handleZoomIn}
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#3a4459',
            border: 'none',
            borderRadius: '4px',
            color: '#f7f9fb',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>
      
      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div 
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(35, 42, 54, 0.9)',
            color: '#f7f9fb',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '14px',
            pointerEvents: 'none',
            top: '40px',
            right: '16px',
            border: '1px solid #3a4459',
            zIndex: 10,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {(() => {
            const customer = data.find(d => d.id === hoveredPoint);
            if (!customer) return null;
            
            return (
              <>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  color: getSegmentColor(customer.segment),
                  marginBottom: '4px'
                }}>
                  {customer.segment.charAt(0).toUpperCase() + customer.segment.slice(1).replace('_', ' ')}
                </div>
                <div>Customer ID: {customer.id}</div>
                <div>Frequency: {customer.frequency.toFixed(2)}</div>
                <div>Recency: {customer.recency.toFixed(2)}</div>
                <div>Value: ${customer.monetary.toFixed(2)}</div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
});

SegmentQuadrant.displayName = 'SegmentQuadrant';

export default SegmentQuadrant; 