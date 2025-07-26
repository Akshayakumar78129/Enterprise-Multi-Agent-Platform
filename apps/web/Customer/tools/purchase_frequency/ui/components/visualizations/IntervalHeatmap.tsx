import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { IntervalHeatmapProps } from '../../types';

const IntervalHeatmap = forwardRef<any, IntervalHeatmapProps>(({
  data,
  dateRange,
  width = 500,
  height = 320,
  colorScale = ['#0a1224', '#3a4459', '#00e0ff'],
  onCellClick,
  onChartElementClick,
  componentId,
  onDateRangeChange,
  highlightCells = [],
  focusRegion
}, ref) => {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Array<{ day: string; hour: number }>>([]);
  
  // Reset selection when highlightCells change from external source
  useEffect(() => {
    if (highlightCells && highlightCells.length > 0) {
      setSelectedCells(highlightCells);
    }
  }, [highlightCells]);

  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    highlightCell: (day: string, hour: number) => {
      setSelectedCells([{ day, hour }]);
    },
    highlightCells: (cells: Array<{ day: string; hour: number }>) => {
      setSelectedCells(cells);
    },
    clearHighlights: () => {
      setSelectedCells([]);
    },
    focusRegion: (region: { startDay: string; endDay: string; startHour: number; endHour: number }) => {
      console.log(`Focus on region from ${region.startDay} ${region.startHour}h to ${region.endDay} ${region.endHour}h`);
      // Implementation would involve zooming or highlighting the area
    },
    resetView: () => {
      setSelectedCells([]);
      setHoveredCell(null);
    }
  }));

  // Calculate dimensions for cells
  const cellSize = 48;
  const cellMargin = 4;
  const totalCellSize = cellSize + cellMargin;
  
  // Group data by day and hour for faster lookup
  const dataMap = new Map();
  data.forEach(d => {
    if (!dataMap.has(d.day)) {
      dataMap.set(d.day, new Map());
    }
    dataMap.get(d.day).set(d.hour, d);
  });
  
  // Get unique days and hours
  const days = Array.from(new Set(data.map(d => d.day)));
  const hours = Array.from(new Set(data.map(d => d.hour))).sort((a, b) => a - b);
  
  // Calculate the maximum value for color scaling
  const maxValue = Math.max(...data.map(d => d.volume));
  
  // Helper function to get color based on value
  const getColor = (value: number) => {
    if (value === 0) return colorScale[0];
    const ratio = value / maxValue;
    
    if (ratio < 0.33) {
      // Interpolate between first and second color
      return interpolateColor(colorScale[0], colorScale[1], ratio * 3);
    } else if (ratio < 0.66) {
      // Interpolate between second and third color
      return interpolateColor(colorScale[1], colorScale[2], (ratio - 0.33) * 3);
    } else {
      // Interpolate to full intensity of third color
      return interpolateColor(colorScale[2], colorScale[2], (ratio - 0.66) * 3);
    }
  };
  
  // Color interpolation helper
  const interpolateColor = (color1: string, color2: string, ratio: number) => {
    // Convert hex to RGB
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);
    
    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);
    
    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Handle cell interactions
  const handleCellClick = (day: string, hour: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent background click
    
    const cell = { day, hour };
    // Toggle selection if cell is already selected, otherwise set as new selection
    setSelectedCells(prev => 
      prev.some(c => c.day === day && c.hour === hour)
        ? prev.filter(c => !(c.day === day && c.hour === hour))
        : [cell]
    );
    
    if (onCellClick) {
      onCellClick(day, hour);
    }

    // Send click data for laser functionality
    if (onChartElementClick) {
      const containerElement = event.currentTarget.closest('.interval-heatmap');
      
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        
        // Calculate cell center coordinates
        const dayIndex = days.indexOf(day);
        const hourIndex = hours.indexOf(hour);
        const cellCenterX = 80 + (hourIndex * totalCellSize) + (cellSize / 2);
        const cellCenterY = 40 + (dayIndex * totalCellSize) + (cellSize / 2);
        
        const pointData = {
          datasetIndex: 0,
          index: dayIndex * hours.length + hourIndex,
          day: day,
          hour: hour,
          label: `${day} at ${hour}:00`,
          value: dataMap.get(day)?.get(hour)?.volume || 0,
          x: cellCenterX + 16, // Account for container padding
          y: cellCenterY + 40, // Account for title height
          chartLabel: 'Purchase Interval Analysis'
        };

        onChartElementClick({
          event: event.nativeEvent,
          pointData: pointData,
          componentId: componentId || 'interval-heatmap',
          chartId: 'heatmap',
          chartRect: containerRect,
          elementRect: containerRect
        });
      }
    }
  };
  
  const handleCellMouseEnter = (day: string, hour: number) => {
    setHoveredCell({ day, hour });
  };
  
  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };
  
  // Check if cell is within the last 90 days (for recency indicator)
  const isRecent = (day: string): boolean => {
    // This is a placeholder - in a real implementation, you would check against actual dates
    // For now, let's assume some days are recent for demonstration purposes
    return ['Monday', 'Tuesday'].includes(day);
  };
  
  // Calculate dimensions to fit the data
  const adjustedWidth = Math.max(width, (hours.length * totalCellSize) + 80);
  const adjustedHeight = Math.max(height, (days.length * totalCellSize) + 60);
  
  return (
    <div 
      className="interval-heatmap"
      style={{
        width: `${adjustedWidth}px`,
        height: `${adjustedHeight}px`,
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
        Purchase Interval Analysis
      </h3>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${hours.length}, ${totalCellSize}px)`,
          gridTemplateRows: `40px repeat(${days.length}, ${totalCellSize}px)`,
          overflowX: 'auto',
          padding: '4px'
        }}
      >
        {/* Top-left empty cell */}
        <div 
          style={{
            gridColumn: 1,
            gridRow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#8893a7'
          }}
        >
          Day / Hour
        </div>
        
        {/* Hour labels (top row) */}
        {hours.map((hour, i) => (
          <div 
            key={`hour-${hour}`}
            style={{
              gridColumn: i + 2,
              gridRow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            {hour}:00
          </div>
        ))}
        
        {/* Day labels (first column) */}
        {days.map((day, i) => (
          <div 
            key={`day-${day}`}
            style={{
              gridColumn: 1,
              gridRow: i + 2,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingRight: '12px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            {day}
          </div>
        ))}
        
        {/* Heatmap cells */}
        {days.map((day, dayIndex) => (
          hours.map((hour, hourIndex) => {
            const cellData = dataMap.get(day)?.get(hour);
            const value = cellData?.value || 0;
            const color = getColor(value);
            
            const isHighlighted = 
              hoveredCell?.day === day && hoveredCell?.hour === hour ||
              selectedCells.some(c => c.day === day && c.hour === hour);
              
            const isRecencyHighlighted = isRecent(day);
            
            // Calculate cell position
            const cellStyle: React.CSSProperties = {
              gridColumn: hourIndex + 2,
              gridRow: dayIndex + 2,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: color,
              borderRadius: '4px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: isHighlighted ? 'scale(1.08)' : 'scale(1)',
              boxShadow: isHighlighted ? '0 0 12px rgba(0, 224, 255, 0.6)' : 'none',
              border: isRecencyHighlighted ? '2px solid #e930ff' : 'none'
            };
            
            // Apply highlight styles
            if (isHighlighted) {
              cellStyle.border = '2px solid #00e0ff';
              cellStyle.zIndex = 10;
            }
            
            return (
              <div
                key={`cell-${day}-${hour}`}
                style={cellStyle}
                onClick={(event) => handleCellClick(day, hour, event)}
                onMouseEnter={() => handleCellMouseEnter(day, hour)}
                onMouseLeave={handleCellMouseLeave}
              />
            );
          })
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredCell !== null && dataMap.get(hoveredCell.day)?.get(hoveredCell.hour) && (
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
            left: '100px',
            border: '1px solid #3a4459',
            zIndex: 20,
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          <strong>{hoveredCell.day} at {hoveredCell.hour}:00</strong>
          <div>Density: {(dataMap.get(hoveredCell.day)?.get(hoveredCell.hour)?.value || 0).toFixed(2)}</div>
          {dataMap.get(hoveredCell.day)?.get(hoveredCell.hour)?.transactionCount && (
            <div>Transactions: {dataMap.get(hoveredCell.day)?.get(hoveredCell.hour)?.transactionCount}</div>
          )}
          {dataMap.get(hoveredCell.day)?.get(hoveredCell.hour)?.avgTransactionValue && (
            <div>Avg Value: ${dataMap.get(hoveredCell.day)?.get(hoveredCell.hour)?.avgTransactionValue.toFixed(2)}</div>
          )}
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
          gap: '8px',
          fontSize: '12px',
          color: '#f7f9fb'
        }}
      >
        <span>Low</span>
        <div 
          style={{
            width: '100px',
            height: '12px',
            background: `linear-gradient(to right, ${colorScale[0]}, ${colorScale[1]}, ${colorScale[2]})`,
            borderRadius: '2px'
          }}
        />
        <span>High</span>
        <div 
          style={{
            marginLeft: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <div style={{ width: '12px', height: '12px', border: '2px solid #e930ff', borderRadius: '2px' }} />
          <span>Recent (90d)</span>
        </div>
      </div>
    </div>
  );
});

IntervalHeatmap.displayName = 'IntervalHeatmap';

export default IntervalHeatmap; 