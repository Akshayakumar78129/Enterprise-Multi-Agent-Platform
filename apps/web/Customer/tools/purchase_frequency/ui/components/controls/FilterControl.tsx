import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { FilterControlProps } from '../../types';

const FilterControl = forwardRef<any, FilterControlProps>(({
  segments,
  selectedSegments,
  onChange,
  isLoading = false
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    selectSegment: (segment: string) => {
      if (segments.includes(segment) && !selectedSegments.includes(segment)) {
        const newSelection = [...selectedSegments, segment];
        onChange(newSelection);
      }
    },
    deselectSegment: (segment: string) => {
      if (selectedSegments.includes(segment)) {
        const newSelection = selectedSegments.filter(s => s !== segment);
        onChange(newSelection);
      }
    },
    clearAll: () => {
      onChange([]);
    },
    selectAll: () => {
      onChange([...segments]);
    },
    toggle: () => {
      setIsExpanded(prev => !prev);
    }
  }));

  // Handle segment toggle
  const handleSegmentToggle = (segment: string) => {
    let newSelection: string[];
    
    if (selectedSegments.includes(segment)) {
      newSelection = selectedSegments.filter(s => s !== segment);
    } else {
      newSelection = [...selectedSegments, segment];
    }
    
    onChange(newSelection);
  };
  
  // Clear all selections
  const handleClearAll = () => {
    onChange([]);
  };
  
  // Select all segments
  const handleSelectAll = () => {
    onChange([...segments]);
  };
  
  // Filter segments based on search term
  const filteredSegments = searchTerm
    ? segments.filter(segment => 
        segment.toLowerCase().includes(searchTerm.toLowerCase()))
    : segments;
  
  // Format segment name for display
  const formatSegmentName = (segment: string) => {
    return segment
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Determine if all segments are selected
  const allSelected = selectedSegments.length === segments.length;
  
  // Function to get segment color
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

  return (
    <div 
      className="filter-control"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#232a36',
        borderRadius: '8px',
        padding: '12px',
        color: '#f7f9fb'
      }}
    >
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ fontWeight: 600, fontSize: '14px' }}>
          Customer Segments
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Selected count badge */}
          {selectedSegments.length > 0 && (
            <div 
              style={{
                backgroundColor: '#00e0ff',
                color: '#0a1224',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              {selectedSegments.length} selected
            </div>
          )}
          
          {/* Toggle button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              backgroundColor: '#3a4459',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#f7f9fb',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={isLoading}
          >
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>
      
      {/* Selected segments pills (shown when collapsed) */}
      {!isExpanded && selectedSegments.length > 0 && (
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '8px'
          }}
        >
          {selectedSegments.map(segment => (
            <div 
              key={`pill-${segment}`}
              style={{
                backgroundColor: `${getSegmentColor(segment)}33`,
                border: `1px solid ${getSegmentColor(segment)}`,
                borderRadius: '16px',
                padding: '2px 8px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{formatSegmentName(segment)}</span>
              <button
                onClick={() => handleSegmentToggle(segment)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#f7f9fb',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Expanded filter panel */}
      {isExpanded && (
        <div 
          style={{
            marginTop: '12px',
            borderTop: '1px solid #3a4459',
            paddingTop: '12px'
          }}
        >
          {/* Search and controls */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              gap: '8px'
            }}
          >
            <input
              type="text"
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: '#0a1224',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '6px 8px',
                color: '#f7f9fb',
                fontSize: '14px',
                flexGrow: 1
              }}
            />
            
            <button
              onClick={allSelected ? handleClearAll : handleSelectAll}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '6px 10px',
                color: '#f7f9fb',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {allSelected ? 'Clear All' : 'Select All'}
            </button>
          </div>
          
          {/* Segment list */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          >
            {filteredSegments.map(segment => (
              <label
                key={`checkbox-${segment}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: selectedSegments.includes(segment) 
                    ? `${getSegmentColor(segment)}22`
                    : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSegments.includes(segment)}
                  onChange={() => handleSegmentToggle(segment)}
                  style={{
                    accentColor: getSegmentColor(segment)
                  }}
                />
                <span 
                  style={{
                    fontSize: '13px',
                    color: selectedSegments.includes(segment)
                      ? getSegmentColor(segment)
                      : '#f7f9fb'
                  }}
                >
                  {formatSegmentName(segment)}
                </span>
              </label>
            ))}
            
            {filteredSegments.length === 0 && (
              <div 
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '12px',
                  color: '#8893a7',
                  fontSize: '14px'
                }}
              >
                No segments found
              </div>
            )}
          </div>
          
          {/* Apply button */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '12px'
            }}
          >
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                backgroundColor: '#00e0ff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 16px',
                color: '#0a1224',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

FilterControl.displayName = 'FilterControl';

export default FilterControl; 