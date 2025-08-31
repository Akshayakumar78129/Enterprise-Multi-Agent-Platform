import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

interface DateRange {
  start: string;
  end: string;
}

interface PurchaseFrequencyDateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  isLoading?: boolean;
  minDate?: string;
  maxDate?: string;
  compact?: boolean;
  className?: string;
}

interface DatePreset {
  label: string;
  value: () => DateRange;
  description?: string;
  icon?: string;
}

export const PurchaseFrequencyDateRangeFilter: React.FC<PurchaseFrequencyDateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
  isLoading = false,
  minDate = '2017-01-01',
  maxDate = '2021-12-31',
  compact = false,
  className
}) => {
  const [localStart, setLocalStart] = useState(dateRange.start);
  const [localEnd, setLocalEnd] = useState(dateRange.end);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedRange, setAppliedRange] = useState(dateRange);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        setIsOpen(false);
        handleReset();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleApply();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, localStart, localEnd]);

  // Sync with parent changes
  useEffect(() => {
    setLocalStart(dateRange.start);
    setLocalEnd(dateRange.end);
    setAppliedRange(dateRange);
  }, [dateRange]);

  // Date validation
  const isValidRange = useMemo(() => {
    if (!localStart || !localEnd) return false;
    const start = new Date(localStart);
    const end = new Date(localEnd);
    const min = new Date(minDate);
    const max = new Date(maxDate);
    
    return !isNaN(start.getTime()) && 
           !isNaN(end.getTime()) && 
           start <= end &&
           start >= min &&
           end <= max;
  }, [localStart, localEnd, minDate, maxDate]);

  // Calculate days in range
  const daysInRange = useMemo(() => {
    if (!isValidRange) return 0;
    const start = new Date(localStart);
    const end = new Date(localEnd);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [localStart, localEnd, isValidRange]);

  // Date presets
  const datePresets: DatePreset[] = useMemo(() => {
    const today = new Date();
    const maxDateObj = new Date(maxDate);
    const currentDate = today < maxDateObj ? today : maxDateObj;
    
    return [
      {
        label: 'Last 30 Days',
        icon: '📅',
        description: 'Recent purchase patterns',
        value: () => {
          const end = new Date(currentDate);
          const start = new Date(end);
          start.setDate(start.getDate() - 29);
          return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          };
        }
      },
      {
        label: 'Last 90 Days',
        icon: '📊',
        description: 'Quarterly analysis',
        value: () => {
          const end = new Date(currentDate);
          const start = new Date(end);
          start.setDate(start.getDate() - 89);
          return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          };
        }
      },
      {
        label: 'This Year',
        icon: '📈',
        description: 'Current year data',
        value: () => {
          const currentYear = currentDate.getFullYear();
          return {
            start: `${currentYear}-01-01`,
            end: `${currentYear}-12-31`
          };
        }
      },
      {
        label: 'Last Year',
        icon: '📉',
        description: 'Previous year comparison',
        value: () => {
          const lastYear = currentDate.getFullYear() - 1;
          return { 
            start: `${lastYear}-01-01`, 
            end: `${lastYear}-12-31` 
          };
        }
      },
      {
        label: 'Complete Dataset',
        icon: '🗄️',
        description: 'Full date range',
        value: () => ({ start: minDate, end: maxDate })
      }
    ];
  }, [minDate, maxDate]);

  const handleApply = useCallback(() => {
    if (!isValidRange) {
      setError('Please select a valid date range within the available data period.');
      return;
    }
    
    setError(null);
    const newRange = { start: localStart, end: localEnd };
    setAppliedRange(newRange);
    onDateRangeChange(newRange);
    setIsOpen(false);
  }, [localStart, localEnd, isValidRange, onDateRangeChange]);

  const handlePresetClick = useCallback((preset: DatePreset) => {
    const range = preset.value();
    setLocalStart(range.start);
    setLocalEnd(range.end);
    setError(null);
    setAppliedRange(range);
    onDateRangeChange(range);
    setIsOpen(false);
  }, [onDateRangeChange]);

  const handleReset = useCallback(() => {
    // Reset to the complete dataset (original default range)
    const defaultRange = { start: minDate, end: maxDate };
    setLocalStart(defaultRange.start);
    setLocalEnd(defaultRange.end);
    setError(null);
    setAppliedRange(defaultRange);
    onDateRangeChange(defaultRange);
    setIsOpen(false);
  }, [minDate, maxDate, onDateRangeChange]);

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get range description
  const getRangeDescription = () => {
    if (!isValidRange) return 'Invalid range';
    
    const dayText = daysInRange === 1 ? 'day' : 'days';
    const years = Math.round(daysInRange / 365 * 10) / 10;
    
    if (daysInRange < 32) {
      return `${daysInRange} ${dayText}`;
    } else if (daysInRange < 366) {
      const months = Math.round(daysInRange / 30);
      return `~${months} month${months === 1 ? '' : 's'}`;
    } else {
      return `~${years} year${years === 1 ? '' : 's'}`;
    }
  };

  // Elite styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1600
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#1A1F26',
    border: `2px solid ${isOpen ? '#2563EB' : 'transparent'}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    minWidth: compact ? 280 : 320,
    boxShadow: isOpen ? '0 8px 32px rgba(37, 99, 235, 0.2)' : 'none'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: '#1A1F26',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 1650,
    overflow: 'hidden'
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#242A33',
    border: '1px solid transparent',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#F8FAFC',
    fontSize: '14px',
    width: '140px',
    outline: 'none',
    transition: 'border-color 200ms ease-out'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 200ms ease-out',
    outline: 'none'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#2563EB',
    color: '#F8FAFC',
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#94A3B8',
    border: '1px solid rgba(148, 163, 184, 0.2)'
  };

  return (
    <div style={containerStyle} className={className}>
      <div
        ref={triggerRef}
        style={triggerStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#242A33';
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = '#1A1F26';
            e.currentTarget.style.borderColor = 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '16px' }}>📅</span>
          <div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#F8FAFC',
              lineHeight: '1.4'
            }}>
              {formatDisplayDate(appliedRange.start)} → {formatDisplayDate(appliedRange.end)}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#94A3B8',
              lineHeight: '1.4'
            }}>
              {getRangeDescription()}
            </div>
          </div>
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#94A3B8',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms ease-out'
        }}>
          ▼
        </div>
      </div>

      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle}>
          <div style={{ padding: '16px' }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#F8FAFC',
              marginBottom: '16px'
            }}>
              Select Date Range
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#94A3B8',
                marginBottom: '12px'
              }}>
                Quick Presets
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {datePresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetClick(preset)}
                    style={{
                      ...secondaryButtonStyle,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                    }}
                  >
                    <span>{preset.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        {preset.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#94A3B8',
                marginBottom: '12px'
              }}>
                Custom Range
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    color: '#94A3B8',
                    marginBottom: '4px'
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={localStart}
                    onChange={(e) => setLocalStart(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    style={inputStyle}
                  />
                </div>
                <div style={{ 
                  color: '#94A3B8', 
                  fontSize: '14px',
                  marginTop: '20px'
                }}>
                  →
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '12px', 
                    color: '#94A3B8',
                    marginBottom: '4px'
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    min={minDate}
                    max={maxDate}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '6px',
                color: '#DC2626',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleReset}
                style={secondaryButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                disabled={!isValidRange}
                style={{
                  ...primaryButtonStyle,
                  opacity: isValidRange ? 1 : 0.5,
                  cursor: isValidRange ? 'pointer' : 'not-allowed'
                }}
                onMouseOver={(e) => {
                  if (isValidRange) {
                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                  }
                }}
                onMouseOut={(e) => {
                  if (isValidRange) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }
                }}
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};