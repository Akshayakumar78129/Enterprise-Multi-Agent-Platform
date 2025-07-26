import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { DateRangePickerProps } from '../../types';

const DateRangePicker = forwardRef<any, DateRangePickerProps>(({
  dateRange,
  onChange,
  presets = [
    { 
      label: 'Last 30 Days', 
      range: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      } 
    },
    { 
      label: 'Last 90 Days', 
      range: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      } 
    },
    { 
      label: 'This Year', 
      range: {
        start: `${new Date().getFullYear()}-01-01`,
        end: new Date().toISOString().split('T')[0]
      } 
    },
    { 
      label: 'Last Year', 
      range: {
        start: `${new Date().getFullYear() - 1}-01-01`,
        end: `${new Date().getFullYear() - 1}-12-31`
      } 
    }
  ],
  isLoading = false
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  
  // Expose methods for external control (for AI)
  useImperativeHandle(ref, () => ({
    setDateRange: (start: string, end: string) => {
      const newRange = { start, end };
      setLocalDateRange(newRange);
      onChange(newRange);
    },
    selectPreset: (presetName: string) => {
      const preset = presets.find(p => p.label === presetName);
      if (preset) {
        setLocalDateRange(preset.range);
        onChange(preset.range);
      }
    },
    openPicker: () => {
      setIsOpen(true);
    },
    closePicker: () => {
      setIsOpen(false);
    }
  }));

  // Handle date change
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newRange = {
      ...localDateRange,
      [field]: value
    };
    setLocalDateRange(newRange);
  };
  
  // Apply changes
  const handleApply = () => {
    onChange(localDateRange);
    setIsOpen(false);
  };
  
  // Close dropdown without applying
  const handleCancel = () => {
    setLocalDateRange(dateRange);
    setIsOpen(false);
  };
  
  // Apply preset
  const handlePresetClick = (preset: { label: string; range: { start: string; end: string } }) => {
    setLocalDateRange(preset.range);
    onChange(preset.range);
    setIsOpen(false);
  };
  
  // Format date range for display
  const formatDateRange = (range: { start: string; end: string }) => {
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <div 
      className="date-range-picker"
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
          Date Range
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            backgroundColor: '#3a4459',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            color: '#f7f9fb',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          disabled={isLoading}
        >
          <span style={{ opacity: isLoading ? 0.7 : 1 }}>
            {formatDateRange(dateRange)}
          </span>
          <span>▼</span>
        </button>
      </div>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 100,
            backgroundColor: '#232a36',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '4px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            width: '300px',
            border: '1px solid #3a4459'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>Start Date</div>
            <input 
              type="date"
              value={localDateRange.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              style={{
                backgroundColor: '#0a1224',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '8px',
                color: '#f7f9fb',
                width: '100%'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '4px', fontSize: '14px' }}>End Date</div>
            <input 
              type="date"
              value={localDateRange.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              style={{
                backgroundColor: '#0a1224',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '8px',
                color: '#f7f9fb',
                width: '100%'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', fontSize: '14px' }}>Presets</div>
            <div 
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              {presets.map((preset, i) => (
                <button
                  key={`preset-${i}`}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    backgroundColor: '#3a4459',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: '#f7f9fb',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          <div 
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '12px'
            }}
          >
            <button
              onClick={handleCancel}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #3a4459',
                borderRadius: '4px',
                padding: '6px 12px',
                color: '#f7f9fb',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleApply}
              style={{
                backgroundColor: '#00e0ff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
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

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker; 