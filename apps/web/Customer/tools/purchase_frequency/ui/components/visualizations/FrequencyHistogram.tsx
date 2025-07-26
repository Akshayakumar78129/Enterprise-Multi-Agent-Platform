import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { FrequencyHistogramProps } from '../../types';

const FrequencyHistogram = forwardRef<any, FrequencyHistogramProps>(({
  data,
  meanFrequency,
  highThreshold,
  lowThreshold,
  width = 460,
  height = 300,
  colorScale = ['#0a1224', '#00e0ff'],
  onBarClick,
  onChartElementClick,
  componentId,
  highlightBins = [],
  focusRegion
}, ref) => {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [selectedBins, setSelectedBins] = useState<number[]>([]);
  const [dragStart, setDragStart] = useState<number | null>(null);
  
  // Reset selection when highlight bins change
  useEffect(() => {
    if (highlightBins && highlightBins.length > 0) {
      setSelectedBins(highlightBins);
    }
  }, [highlightBins]);

  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    highlightBin: (bin: number) => {
      setSelectedBins([bin]);
    },
    highlightBins: (bins: number[]) => {
      setSelectedBins(bins);
    },
    clearHighlights: () => {
      setSelectedBins([]);
    },
    setBinsFocus: (start: number, end: number) => {
      // Implement zooming logic
      console.log(`Focusing on bins ${start} to ${end}`);
    },
    resetView: () => {
      setSelectedBins([]);
      setHoveredBin(null);
    }
  }));

  // Calculate the maximum count for scaling
  const maxCount = Math.max(...data.map(d => d.count));
  
  // Calculate dimensions
  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Calculate bar dimensions
  const barWidth = innerWidth / data.length;
  const barSpacing = Math.min(4, barWidth * 0.2); // Space between bars, max 4px
  const actualBarWidth = barWidth - barSpacing;
  
  // Handle mouse events
  const handleBarMouseEnter = (bin: number) => {
    setHoveredBin(bin);
  };
  
  const handleBarMouseLeave = () => {
    setHoveredBin(null);
  };
  
  const handleBarClick = (bin: number, event: React.MouseEvent, barIndex: number) => {
    event.stopPropagation(); // Prevent background click
    
    if (event.ctrlKey || event.metaKey) {
      // Add to selection if Ctrl/Cmd key is pressed
      setSelectedBins(prev => 
        prev.includes(bin) 
          ? prev.filter(b => b !== bin) 
          : [...prev, bin]
      );
    } else {
      // Otherwise set as single selection
      setSelectedBins([bin]);
    }
    
    if (onBarClick) {
      onBarClick(bin);
    }

    // Send click data for laser functionality
    if (onChartElementClick) {
      const svgElement = event.currentTarget.closest('svg');
      const containerElement = event.currentTarget.closest('.frequency-histogram');
      
      if (svgElement && containerElement) {
        const svgRect = svgElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        
        // Calculate bar center coordinates relative to SVG
        const barCenterX = barIndex * barWidth + actualBarWidth / 2 + margin.left;
        const barHeight = (data[barIndex].count / maxCount) * innerHeight;
        const barCenterY = innerHeight - barHeight / 2 + margin.top;
        
        const pointData = {
          datasetIndex: 0,
          index: barIndex,
          bin: bin,
          label: `Frequency ${bin}`,
          value: data[barIndex].count,
          x: barCenterX, // SVG-relative coordinates
          y: barCenterY,
          chartLabel: 'Purchase Frequency Distribution'
        };

        onChartElementClick({
          event: event.nativeEvent,
          pointData: pointData,
          componentId: componentId || 'frequency-histogram',
          chartId: 'histogram',
          chartRect: svgRect,
          elementRect: containerRect
        });
      }
    }
  };
  
  const handleBarDoubleClick = () => {
    setSelectedBins([]);
  };
  
  // Handle drag selection
  const handleMouseDown = (bin: number) => {
    setDragStart(bin);
  };
  
  const handleMouseUp = (bin: number) => {
    if (dragStart !== null) {
      const start = Math.min(dragStart, bin);
      const end = Math.max(dragStart, bin);
      const selectedRange = Array.from(
        { length: end - start + 1 }, 
        (_, i) => start + i
      );
      setSelectedBins(selectedRange);
      setDragStart(null);
    }
  };

  // Generate gradient ID
  const gradientId = `frequency-histogram-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const handleBackgroundClick = (event: React.MouseEvent) => {
    // Only clear if clicking on SVG background, not on a bar
    if (event.target === event.currentTarget) {
      setSelectedBins([]);
      
      // Send background click to canvas to clear user selections
      if (onChartElementClick) {
        onChartElementClick({
          event: event.nativeEvent,
          pointData: null, // No point data indicates background click
          componentId: componentId || 'frequency-histogram',
          chartId: 'histogram'
        });
      }
    }
  };

  return (
    <div 
      className="frequency-histogram"
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
        Purchase Frequency Distribution
      </h3>
      
      <svg width={width - 32} height={height - 60} onClick={handleBackgroundClick}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorScale[1]} />
            <stop offset="100%" stopColor={colorScale[0]} />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* X Axis */}
          <line 
            x1={0} 
            y1={innerHeight} 
            x2={innerWidth} 
            y2={innerHeight} 
            stroke="#8893a7" 
            strokeWidth={1} 
          />
          
          {/* Y Axis */}
          <line 
            x1={0} 
            y1={0} 
            x2={0} 
            y2={innerHeight} 
            stroke="#8893a7" 
            strokeWidth={1} 
          />
          
          {/* X Axis Labels */}
          {data.map((d, i) => (
            <text 
              key={`x-label-${i}`}
              x={i * barWidth + actualBarWidth / 2}
              y={innerHeight + 20}
              textAnchor="middle"
              fill="#8893a7"
              fontSize={12}
            >
              {d.bin}
            </text>
          ))}
          
          {/* Y Axis Labels */}
          {[0, maxCount / 2, maxCount].map((tick, i) => (
            <text 
              key={`y-label-${i}`}
              x={-10}
              y={innerHeight - (tick / maxCount) * innerHeight}
              textAnchor="end"
              fill="#8893a7"
              fontSize={12}
              dominantBaseline="middle"
            >
              {Math.round(tick)}
            </text>
          ))}
          
          {/* Mean Line */}
          {data.map(d => d.bin).includes(Math.round(meanFrequency)) && (
            <line 
              x1={(data.findIndex(d => d.bin === Math.round(meanFrequency)) + 0.5) * barWidth}
              y1={0}
              x2={(data.findIndex(d => d.bin === Math.round(meanFrequency)) + 0.5) * barWidth}
              y2={innerHeight}
              stroke="#00e0ff"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          
          {/* High Threshold Line */}
          {data.map(d => d.bin).includes(Math.round(highThreshold)) && (
            <line 
              x1={(data.findIndex(d => d.bin === Math.round(highThreshold)) + 0.5) * barWidth}
              y1={0}
              x2={(data.findIndex(d => d.bin === Math.round(highThreshold)) + 0.5) * barWidth}
              y2={innerHeight}
              stroke="#e930ff"
              strokeWidth={2}
            />
          )}
          
          {/* Low Threshold Line */}
          {data.map(d => d.bin).includes(Math.round(lowThreshold)) && (
            <line 
              x1={(data.findIndex(d => d.bin === Math.round(lowThreshold)) + 0.5) * barWidth}
              y1={0}
              x2={(data.findIndex(d => d.bin === Math.round(lowThreshold)) + 0.5) * barWidth}
              y2={innerHeight}
              stroke="#8893a7"
              strokeWidth={2}
            />
          )}
          
          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.count / maxCount) * innerHeight;
            const isHighlighted = hoveredBin === d.bin || selectedBins.includes(d.bin);
            const color = d.segmentType === 'high' 
              ? '#e930ff' 
              : d.segmentType === 'low' 
                ? '#8893a7' 
                : 'url(#' + gradientId + ')';
                
            // Determine the opacity for filtering effect
            const opacity = selectedBins.length > 0 && !selectedBins.includes(d.bin) ? 0.4 : 1;
            
            return (
              <g key={`bar-${i}`}>
                <rect 
                  x={i * barWidth + barSpacing / 2}
                  y={innerHeight - barHeight}
                  width={actualBarWidth}
                  height={barHeight}
                  fill={isHighlighted ? '#00e0ff' : color}
                  stroke={isHighlighted ? '#00e0ff' : 'none'}
                  strokeWidth={isHighlighted ? 2 : 0}
                  opacity={opacity}
                  rx={2}
                  ry={2}
                  filter={isHighlighted ? 'drop-shadow(0 0 8px #00e0ff)' : undefined}
                  onMouseEnter={() => handleBarMouseEnter(d.bin)}
                  onMouseLeave={handleBarMouseLeave}
                  onClick={(e) => handleBarClick(d.bin, e, i)}
                  onDoubleClick={handleBarDoubleClick}
                  onMouseDown={() => handleMouseDown(d.bin)}
                  onMouseUp={() => handleMouseUp(d.bin)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                />
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Tooltip */}
      {hoveredBin !== null && (
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
            left: `${(data.findIndex(d => d.bin === hoveredBin) * barWidth) + margin.left + 16}px`,
            border: '1px solid #3a4459',
            zIndex: 10,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <strong>Frequency: {hoveredBin}</strong>
          <div>Customers: {data.find(d => d.bin === hoveredBin)?.count}</div>
          <div style={{ 
            fontSize: '12px', 
            opacity: 0.8,
            color: data.find(d => d.bin === hoveredBin)?.segmentType === 'high' 
              ? '#e930ff' 
              : data.find(d => d.bin === hoveredBin)?.segmentType === 'low' 
                ? '#8893a7' 
                : '#00e0ff' 
          }}>
            {data.find(d => d.bin === hoveredBin)?.segmentType === 'high' 
              ? 'High Frequency' 
              : data.find(d => d.bin === hoveredBin)?.segmentType === 'low' 
                ? 'Low Frequency' 
                : 'Medium Frequency'}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div 
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '12px',
          color: '#f7f9fb'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#e930ff', borderRadius: '2px' }} />
          <span>High</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            backgroundImage: `linear-gradient(to bottom, ${colorScale[1]}, ${colorScale[0]})`, 
            borderRadius: '2px' 
          }} />
          <span>Medium</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#8893a7', borderRadius: '2px' }} />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
});

FrequencyHistogram.displayName = 'FrequencyHistogram';

export default FrequencyHistogram; 