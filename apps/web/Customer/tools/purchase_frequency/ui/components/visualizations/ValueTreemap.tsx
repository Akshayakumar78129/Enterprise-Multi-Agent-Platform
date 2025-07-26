import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { ValueTreemapProps } from '../../types';

const ValueTreemap = forwardRef<any, ValueTreemapProps>(({
  data,
  width = 380,
  height = 300,
  onSegmentClick,
  onChartElementClick,
  componentId,
  highlightSegments = []
}, ref) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  
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
    resetView: () => {
      setSelectedSegments([]);
      setHoveredSegment(null);
    }
  }));

  // Simple treemap layout algorithm
  const calculateTreemap = (items: typeof data, totalWidth: number, totalHeight: number) => {
    // Sort by value (percentage) descending
    const sortedItems = [...items].sort((a, b) => b.percentage - a.percentage);
    
    // Calculate total percentage
    const totalPercentage = sortedItems.reduce((sum, item) => sum + item.percentage, 0);
    
    // Layout algorithm
    const layout: Array<{
      segment: string;
      count: number; 
      percentage: number;
      avgValue: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    
    // Very simple layout - split into columns based on percentage
    let currentX = 0;
    
    sortedItems.forEach(item => {
      const relativeSize = item.percentage / totalPercentage;
      const rectWidth = Math.max(totalWidth * relativeSize, 40); // Minimum width
      
      layout.push({
        ...item,
        x: currentX,
        y: 0,
        width: rectWidth,
        height: totalHeight
      });
      
      currentX += rectWidth;
    });
    
    return layout;
  };

  // Calculate treemap layout
  const chartMargin = { top: 10, right: 10, bottom: 10, left: 10 };
  const innerWidth = width - chartMargin.left - chartMargin.right;
  const innerHeight = height - chartMargin.top - chartMargin.bottom - 40; // Account for title
  
  const treemapLayout = calculateTreemap(data, innerWidth, innerHeight);
  
  // Get segment color
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'premium':
        return '#00e0ff'; // Electric Cyan
      case 'standard':
        return '#5fd4d6'; // Lighter cyan
      case 'budget':
        return '#ae76fa'; // Purple
      case 'occasional':
        return '#e930ff'; // Signal Magenta
      default:
        return '#3a4459'; // Graphite
    }
  };
  
  // Handle interactions
  const handleSegmentMouseEnter = (segment: string) => {
    setHoveredSegment(segment);
  };
  
  const handleSegmentMouseLeave = () => {
    setHoveredSegment(null);
  };
  
  const handleSegmentClick = (segment: string, event: React.MouseEvent, item: any) => {
    event.stopPropagation(); // Prevent background click
    
    // Toggle segment selection
    setSelectedSegments(prev => 
      prev.includes(segment)
        ? prev.filter(s => s !== segment)
        : [...prev, segment]
    );
    
    if (onSegmentClick) {
      onSegmentClick(segment);
    }

    // Send click data for laser functionality
    if (onChartElementClick) {
      const containerElement = event.currentTarget.closest('.value-treemap');
      
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        
        // Calculate center of the clicked segment
        const segmentCenterX = item.x + (item.width / 2);
        const segmentCenterY = item.y + (item.height / 2);
        
        const pointData = {
          datasetIndex: 0,
          index: treemapLayout.findIndex(layoutItem => layoutItem.segment === segment),
          segment: segment,
          label: `${segment.charAt(0).toUpperCase() + segment.slice(1)} Segment`,
          value: item.percentage,
          x: segmentCenterX + chartMargin.left + 16, // Account for container padding
          y: segmentCenterY + chartMargin.top + 40, // Account for title height
          chartLabel: 'Value Segment Treemap'
        };

        onChartElementClick({
          event: event.nativeEvent,
          pointData: pointData,
          componentId: componentId || 'value-treemap',
          chartId: 'treemap',
          chartRect: containerRect,
          elementRect: containerRect
        });
      }
    }
  };

  return (
    <div 
      className="value-treemap"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        backgroundColor: '#232a36',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
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
        Value Segment Treemap
      </h3>
      
      <div 
        style={{
          position: 'relative',
          width: `${innerWidth}px`,
          height: `${innerHeight}px`,
          margin: `${chartMargin.top}px ${chartMargin.right}px ${chartMargin.bottom}px ${chartMargin.left}px`
        }}
      >
        {/* Treemap Cells */}
        {treemapLayout.map((item, i) => {
          const isHighlighted = 
            hoveredSegment === item.segment || 
            selectedSegments.includes(item.segment);
            
          // Apply filtering: show faded if segments are selected and this one isn't
          const opacity = selectedSegments.length > 0 && !selectedSegments.includes(item.segment)
            ? 0.4
            : 1;
            
          const baseColor = getSegmentColor(item.segment);
          
          return (
            <div
              key={`segment-${i}`}
              style={{
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width - 4}px`, // Add gap between cells
                height: `${item.height - 4}px`,
                backgroundColor: baseColor,
                opacity: opacity,
                borderRadius: '8px',
                padding: '12px',
                color: '#f7f9fb',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isHighlighted ? `0 0 12px ${baseColor}88` : 'none',
                border: isHighlighted ? `2px solid ${baseColor}` : 'none',
                cursor: 'pointer',
                zIndex: isHighlighted ? 10 : 1
              }}
              onMouseEnter={() => handleSegmentMouseEnter(item.segment)}
              onMouseLeave={handleSegmentMouseLeave}
              onClick={(event) => handleSegmentClick(item.segment, event, item)}
            >
              <div 
                style={{ 
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '4px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }}
              >
                {item.segment.charAt(0).toUpperCase() + item.segment.slice(1)}
              </div>
              
              <div 
                style={{ 
                  fontSize: '14px',
                  opacity: 0.9,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                }}
              >
                {item.percentage.toFixed(1)}% of customers
              </div>
              
              <div 
                style={{ 
                  fontSize: '14px',
                  opacity: 0.9,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                }}
              >
                Avg: ${item.avgValue.toFixed(2)}
              </div>
              
              {/* Only show count if space permits */}
              {item.width > 100 && (
                <div 
                  style={{ 
                    fontSize: '12px',
                    opacity: 0.7,
                    marginTop: '8px',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                  }}
                >
                  {item.count.toLocaleString()} customers
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend/Controls */}
      <div 
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
          color: '#f7f9fb'
        }}
      >
        {data.map(item => (
          <div 
            key={`legend-${item.segment}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: selectedSegments.length > 0 && !selectedSegments.includes(item.segment) ? 0.6 : 1,
              cursor: 'pointer'
            }}
            onClick={(event) => handleSegmentClick(item.segment, event, item)}
          >
            <div 
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: getSegmentColor(item.segment),
                borderRadius: '2px',
                border: selectedSegments.includes(item.segment) ? '1px solid #f7f9fb' : 'none'
              }}
            />
            <span>
              {item.segment.charAt(0).toUpperCase() + item.segment.slice(1)}
            </span>
          </div>
        ))}
      </div>
      
      {/* Tooltip (for smaller cells where content might not fit) */}
      {hoveredSegment && treemapLayout.some(item => item.segment === hoveredSegment && item.width < 100) && (
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
            zIndex: 20,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {(() => {
            const segment = data.find(d => d.segment === hoveredSegment);
            if (!segment) return null;
            
            return (
              <>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  color: getSegmentColor(segment.segment),
                  marginBottom: '4px'
                }}>
                  {segment.segment.charAt(0).toUpperCase() + segment.segment.slice(1)}
                </div>
                <div>{segment.percentage.toFixed(1)}% of customers</div>
                <div>Avg Value: ${segment.avgValue.toFixed(2)}</div>
                <div>{segment.count.toLocaleString()} customers</div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
});

ValueTreemap.displayName = 'ValueTreemap';

export default ValueTreemap; 