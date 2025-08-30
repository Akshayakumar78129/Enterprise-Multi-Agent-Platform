import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface DateRange {
  start: string;
  end: string;
}

interface TransactionDateRangeFilterProps {
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

interface DatabaseDateRange {
  minDate: string;
  maxDate: string;
  totalRecords: number;
  uniqueCustomers: number;
}

export const TransactionDateRangeFilter: React.FC<TransactionDateRangeFilterProps> = ({
  dateRange,
  onDateRangeChange,
  isLoading = false,
  minDate = '2017-01-01',
  maxDate = '2021-12-31',
  compact = false,
  className
}) => {
  const theme = useTheme();
  const [localStart, setLocalStart] = useState(dateRange.start);
  const [localEnd, setLocalEnd] = useState(dateRange.end);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedRange, setAppliedRange] = useState(dateRange);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic database range state
  const [dbDateRange, setDbDateRange] = useState<DatabaseDateRange | null>(null);
  const [isLoadingDateRange, setIsLoadingDateRange] = useState(true);

  // Fetch actual date range from database on component mount
  useEffect(() => {
    const fetchActualDateRange = async () => {
      try {
        setIsLoadingDateRange(true);
        console.log('🔍 Fetching actual date range from database...');
        
        const response = await fetch('/api/transaction-patterns/date-range', { headers: { Accept: 'application/json' } });
        if (!response.ok) {
          console.warn(`⚠️ Date range endpoint returned ${response.status}. Falling back to defaults.`);
          setDbDateRange({
            minDate: minDate,
            maxDate: maxDate,
            totalRecords: 0,
            uniqueCustomers: 0
          });
          return;
        }

        let data: any = null;
        try {
          data = await response.json();
        } catch (e) {
          console.warn('⚠️ Date range response is not valid JSON. Falling back to defaults.');
          setDbDateRange({
            minDate: minDate,
            maxDate: maxDate,
            totalRecords: 0,
            uniqueCustomers: 0
          });
          return;
        }
        
        if (data?.success && data?.dateRange) {
          console.log('✅ Received actual date range:', data.dateRange);
          setDbDateRange(data.dateRange);
        } else {
          console.warn('⚠️ Unexpected date range payload. Using fallback.');
          setDbDateRange({
            minDate: minDate,
            maxDate: maxDate,
            totalRecords: 0,
            uniqueCustomers: 0
          });
        }
      } catch (error) {
        console.error('❌ Error fetching date range:', error);
        // Use fallback if fetch fails
        setDbDateRange({
          minDate: minDate,
          maxDate: maxDate,
          totalRecords: 0,
          uniqueCustomers: 0
        });
      } finally {
        setIsLoadingDateRange(false);
      }
    };

    fetchActualDateRange();
  }, [minDate, maxDate]);

  // Use dynamic date range if available, otherwise use props
  const actualMinDate = dbDateRange?.minDate || minDate;
  const actualMaxDate = dbDateRange?.maxDate || maxDate;

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

  // Date validation using actual database range
  const isValidRange = useMemo(() => {
    if (!localStart || !localEnd || !dbDateRange) return false;
    const start = new Date(localStart);
    const end = new Date(localEnd);
    const min = new Date(actualMinDate);
    const max = new Date(actualMaxDate);
    
    return !isNaN(start.getTime()) && 
           !isNaN(end.getTime()) && 
           start <= end &&
           start >= min &&
           end <= max;
  }, [localStart, localEnd, actualMinDate, actualMaxDate, dbDateRange]);

  // Calculate days in range
  const daysInRange = useMemo(() => {
    if (!isValidRange) return 0;
    const start = new Date(localStart);
    const end = new Date(localEnd);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }, [localStart, localEnd, isValidRange]);

  // Date presets with intelligent calculations using actual database range
  const datePresets: DatePreset[] = useMemo(() => {
    if (!dbDateRange) return [];
    
    const today = new Date();
    const dbMaxDate = new Date(actualMaxDate);
    const dbMinDate = new Date(actualMinDate);
    const currentDate = today < dbMaxDate ? today : dbMaxDate; // Use today or latest data date
    
    return [
      {
        label: 'Last 30 Days',
        icon: '📅',
        description: 'Recent transaction trends',
        value: () => {
          const end = new Date(currentDate);
          const start = new Date(end);
          start.setDate(start.getDate() - 29);
          return {
            start: Math.max(dbMinDate.getTime(), start.getTime()) === start.getTime() 
              ? start.toISOString().split('T')[0] 
              : actualMinDate,
            end: end.toISOString().split('T')[0]
          };
        }
      },
      {
        label: 'Last 90 Days',
        icon: '📊',
        description: 'Quarterly patterns',
        value: () => {
          const end = new Date(currentDate);
          const start = new Date(end);
          start.setDate(start.getDate() - 89);
          return {
            start: Math.max(dbMinDate.getTime(), start.getTime()) === start.getTime() 
              ? start.toISOString().split('T')[0] 
              : actualMinDate,
            end: end.toISOString().split('T')[0]
          };
        }
      },
      {
        label: 'This Year',
        icon: '📈',
        description: 'Current year analysis',
        value: () => {
          const currentYear = currentDate.getFullYear();
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31);
          
          return {
            start: Math.max(dbMinDate.getTime(), yearStart.getTime()) === yearStart.getTime() 
              ? yearStart.toISOString().split('T')[0] 
              : actualMinDate,
            end: Math.min(dbMaxDate.getTime(), yearEnd.getTime()) === yearEnd.getTime() 
              ? yearEnd.toISOString().split('T')[0] 
              : actualMaxDate
          };
        }
      },
      {
        label: 'Last Year',
        icon: '�',
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
        label: '2021 (Peak Year)',
        icon: '🚀',
        description: 'Highest transaction volume',
        value: () => ({ start: '2021-01-01', end: '2021-12-31' })
      },
      {
        label: '2020 (COVID Impact)',
        icon: '🦠',
        description: 'Pandemic period analysis',
        value: () => ({ start: '2020-01-01', end: '2020-12-31' })
      },
      {
        label: 'Complete Dataset',
        icon: '🗄️',
        description: `Full range (${dbDateRange.totalRecords.toLocaleString()} transactions)`,
        value: () => ({ start: actualMinDate, end: actualMaxDate })
      }
    ];
  }, [actualMinDate, actualMaxDate, dbDateRange]);

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
    // Reset to complete dataset range instead of just reverting changes
    if (dbDateRange) {
      setLocalStart(actualMinDate);
      setLocalEnd(actualMaxDate);
      setError(null);
      const completeRange = { start: actualMinDate, end: actualMaxDate };
      setAppliedRange(completeRange);
      onDateRangeChange(completeRange);
      setIsOpen(false);
    } else {
      // Fallback to applied range if db range not loaded yet
      setLocalStart(appliedRange.start);
      setLocalEnd(appliedRange.end);
      setError(null);
    }
  }, [actualMinDate, actualMaxDate, dbDateRange, appliedRange, onDateRangeChange]);

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

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1600
  };

  const triggerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
    backgroundColor: theme.colors.graphite,
    border: `2px solid ${isOpen ? theme.colors.electricCyan : theme.colors.graphiteDark}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: compact ? 280 : 320,
    boxShadow: isOpen ? `0 0 20px ${theme.colors.electricCyan}20` : theme.shadows.sm
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: theme.spacing[1],
    backgroundColor: theme.colors.graphite,
    border: `1px solid ${theme.colors.electricCyan}`,
    borderRadius: '12px',
    boxShadow: `0 8px 32px rgba(0, 224, 255, 0.2)`,
    zIndex: 1650,
    overflow: 'hidden'
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.colors.graphiteDark,
    border: `1px solid ${theme.colors.graphiteDark}`,
    borderRadius: '6px',
    padding: `${theme.spacing[2]}px`,
    color: theme.colors.cloudWhite,
    fontSize: theme.typography.fontSize.sm,
    width: '140px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const buttonStyle: React.CSSProperties = {
    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    outline: 'none'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: theme.colors.electricCyan,
    color: theme.colors.midnight,
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: theme.colors.cloudWhite,
    border: `1px solid ${theme.colors.graphiteDark}`
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Trigger */}
      <div 
        ref={triggerRef}
        style={triggerStyle}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Date range selector. Current range: ${formatDisplayDate(appliedRange.start)} to ${formatDisplayDate(appliedRange.end)}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <div>
            <div style={{ 
              color: theme.colors.cloudWhite, 
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium 
            }}>
              {formatDisplayDate(appliedRange.start)} - {formatDisplayDate(appliedRange.end)}
            </div>
            <div style={{ 
              color: theme.colors.neutral, 
              fontSize: theme.typography.fontSize.xs 
            }}>
              {getRangeDescription()} • Transaction Patterns
            </div>
          </div>
        </div>
        <div style={{ 
          transform: `rotate(${isOpen ? 180 : 0}deg)`, 
          transition: 'transform 0.2s ease',
          color: theme.colors.electricCyan 
        }}>
          ▼
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle} role="dialog" aria-label="Date range selection panel">
          {/* Header */}
          <div style={{ 
            padding: theme.spacing[3],
            borderBottom: `1px solid ${theme.colors.graphiteDark}`,
            backgroundColor: theme.colors.midnight 
          }}>
            <h3 style={{ 
              margin: 0,
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.md,
              fontWeight: theme.typography.fontWeight.semiBold 
            }}>
              Select Date Range
            </h3>
            <p style={{ 
              margin: `${theme.spacing[1]}px 0 0 0`,
              color: theme.colors.neutral,
              fontSize: theme.typography.fontSize.xs 
            }}>
              Available data: {formatDisplayDate(actualMinDate)} to {formatDisplayDate(actualMaxDate)} • ESC to cancel, Ctrl+Enter to apply
              {dbDateRange && (
                <span style={{ color: theme.colors.electricCyan }}>
                  • {dbDateRange.totalRecords.toLocaleString()} records • {dbDateRange.uniqueCustomers.toLocaleString()} customers
                </span>
              )}
            </p>
          </div>

          {/* Quick Presets */}
          <div style={{ 
            padding: theme.spacing[3],
            borderBottom: `1px solid ${theme.colors.graphiteDark}` 
          }}>
            <h4 style={{ 
              margin: `0 0 ${theme.spacing[2]}px 0`,
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium 
            }}>
              Quick Selection
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: theme.spacing[2] 
            }}>
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    ...secondaryButtonStyle,
                    padding: theme.spacing[2],
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.graphiteDark
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.graphiteDark;
                    e.currentTarget.style.borderColor = theme.colors.electricCyan;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = theme.colors.graphiteDark;
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: theme.spacing[1],
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.cloudWhite 
                  }}>
                    {preset.icon} {preset.label}
                  </div>
                  {preset.description && (
                    <div style={{ 
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.neutral,
                      marginTop: theme.spacing[1] 
                    }}>
                      {preset.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div style={{ padding: theme.spacing[3] }}>
            <h4 style={{ 
              margin: `0 0 ${theme.spacing[2]}px 0`,
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium 
            }}>
              Custom Range
            </h4>
            
            <div style={{ 
              display: 'flex', 
              gap: theme.spacing[2], 
              alignItems: 'flex-end',
              marginBottom: theme.spacing[3] 
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing[1],
                  color: theme.colors.cloudWhite,
                  fontSize: theme.typography.fontSize.xs 
                }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  min={actualMinDate}
                  max={actualMaxDate}
                  style={{
                    ...inputStyle,
                    borderColor: error ? theme.colors.error : theme.colors.graphiteDark
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: theme.spacing[1],
                  color: theme.colors.cloudWhite,
                  fontSize: theme.typography.fontSize.xs 
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  min={actualMinDate}
                  max={actualMaxDate}
                  style={{
                    ...inputStyle,
                    borderColor: error ? theme.colors.error : theme.colors.graphiteDark
                  }}
                />
              </div>
            </div>

            {/* Range Info */}
            {isValidRange && (
              <div style={{
                padding: `${theme.spacing[2]}px`,
                backgroundColor: theme.colors.midnight,
                borderRadius: '6px',
                marginBottom: theme.spacing[3],
                border: `1px solid ${theme.colors.electricCyan}20`
              }}>
                <div style={{ 
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.electricCyan 
                }}>
                  Range: {getRangeDescription()} ({daysInRange.toLocaleString()} days)
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: `${theme.spacing[2]}px`,
                backgroundColor: `${theme.colors.error}10`,
                border: `1px solid ${theme.colors.error}40`,
                borderRadius: '6px',
                marginBottom: theme.spacing[3]
              }}>
                <div style={{ 
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.error 
                }}>
                  {error}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              gap: theme.spacing[2], 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={handleReset}
                disabled={isLoadingDateRange}
                style={{
                  ...secondaryButtonStyle,
                  opacity: isLoadingDateRange ? 0.5 : 1,
                  cursor: isLoadingDateRange ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isLoadingDateRange) {
                    e.currentTarget.style.backgroundColor = theme.colors.graphiteDark;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoadingDateRange) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title="Reset to complete dataset range"
              >
                {isLoadingDateRange ? 'Loading...' : 'Reset to Full Range'}
              </button>
              <button
                onClick={handleApply}
                disabled={!isValidRange || isLoading}
                style={{
                  ...primaryButtonStyle,
                  opacity: (!isValidRange || isLoading) ? 0.5 : 1,
                  cursor: (!isValidRange || isLoading) ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (isValidRange && !isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.electricCyan;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.electricCyan}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (isValidRange && !isLoading) {
                    e.currentTarget.style.backgroundColor = theme.colors.electricCyan;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {isLoading ? 'Applying...' : 'Apply Range'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
