import React, { useState } from 'react';

export interface DateRangeConfig {
  type: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  label?: string;
}

interface EnhancedDateRangeFilterProps {
  value: DateRangeConfig;
  onChange: (config: DateRangeConfig) => void;
  minDate?: Date;
  maxDate?: Date;
  theme?: 'churn' | 'segmentation';
}

// Comprehensive date range presets
const DATE_PRESETS = [
  { type: 'day', label: 'Today', days: 1 },
  { type: 'week', label: 'Last 7 Days', days: 7 },
  { type: 'week', label: 'Last 14 Days', days: 14 },
  { type: 'month', label: 'Last 30 Days', days: 30 },
  { type: 'month', label: 'Last 60 Days', days: 60 },
  { type: 'quarter', label: 'Last 90 Days', days: 90 },
  { type: 'quarter', label: 'Last 180 Days', days: 180 },
  { type: 'year', label: 'Last 365 Days', days: 365 },
  { type: 'year', label: 'Last 2 Years', days: 730 },
  { type: 'year', label: 'Last 3 Years', days: 1095 },
  { type: 'year', label: 'Last 5 Years', days: 1825 },
  { type: 'all', label: 'All Time', days: -1 }
];

// Granularity options based on date range
const getGranularityOptions = (days: number) => {
  if (days <= 7) return ['daily', 'weekly'];
  if (days <= 30) return ['daily', 'weekly', 'monthly'];
  if (days <= 90) return ['weekly', 'monthly', 'quarterly'];
  if (days <= 365) return ['weekly', 'monthly', 'quarterly', 'yearly'];
  return ['monthly', 'quarterly', 'yearly'];
};

export default function EnhancedDateRangeFilter({
  value,
  onChange,
  minDate = new Date('2019-01-01'),
  maxDate = new Date(),
  theme = 'churn'
}: EnhancedDateRangeFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const themeColor = theme === 'churn' ? '#00e0ff' : '#667eea';
  const themeSecondary = theme === 'churn' ? '#7c3aed' : '#a78bfa';

  const handlePresetSelect = (preset: any) => {
    let startDate: Date;
    let endDate = new Date(maxDate);
    
    if (preset.days === -1) {
      // All time
      startDate = new Date(minDate);
    } else {
      // Calculate start date based on days
      startDate = new Date(endDate.getTime() - preset.days * 24 * 60 * 60 * 1000);
      // Ensure we don't go before minDate
      if (startDate < minDate) {
        startDate = new Date(minDate);
      }
    }
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const granularityOptions = getGranularityOptions(days);
    
    onChange({
      type: preset.type,
      granularity: granularityOptions.includes(value.granularity) ? value.granularity : granularityOptions[0] as any,
      startDate,
      endDate,
      label: preset.label
    });
  };

  const handleGranularityChange = (granularity: DateRangeConfig['granularity']) => {
    onChange({
      ...value,
      granularity
    });
  };

  const handleCustomDateApply = () => {
    // Use custom dates if set, otherwise use current values
    const startDateStr = customStartDate || formatDateForInput(value.startDate);
    const endDateStr = customEndDate || formatDateForInput(value.endDate);
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    if (start <= end) {
      const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      const granularityOptions = getGranularityOptions(days);
      
      onChange({
        type: 'custom',
        granularity: granularityOptions.includes(value.granularity) ? value.granularity : granularityOptions[0] as any,
        startDate: start,
        endDate: end,
        label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      });
      
      // Reset custom date state and close the expanded view
      setCustomStartDate('');
      setCustomEndDate('');
      setIsExpanded(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const days = Math.ceil((value.endDate.getTime() - value.startDate.getTime()) / (24 * 60 * 60 * 1000));
  const availableGranularities = getGranularityOptions(days);

  return (
    <div style={{
      background: 'rgba(30, 39, 56, 0.9)',
      borderRadius: 12,
      padding: 16,
      border: `1px solid ${themeColor}30`,
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? 16 : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <div>
            <div style={{
              fontSize: 12,
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: 2
            }}>
              Analysis Period
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: themeColor
            }}>
              {value.label || `${value.startDate.toLocaleDateString()} - ${value.endDate.toLocaleDateString()}`}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: themeColor,
            fontSize: 20,
            cursor: 'pointer',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }}
        >
          ▼
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          paddingTop: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'fadeIn 0.3s'
        }}>
          {/* Preset Date Ranges */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Quick Ranges
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8
            }}>
              {DATE_PRESETS.map((preset, index) => {
                const isSelected = value.type === preset.type && value.label === preset.label;
                return (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(preset)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: isSelected 
                        ? `linear-gradient(135deg, ${themeColor}, ${themeSecondary})`
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#fff' : 'rgba(247, 249, 251, 0.8)',
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = `${themeColor}60`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Range */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 12,
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Custom Range
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}>
              <input
                type="date"
                value={customStartDate || formatDateForInput(value.startDate)}
                onChange={(e) => setCustomStartDate(e.target.value)}
                min={formatDateForInput(minDate)}
                max={formatDateForInput(maxDate)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#f7f9fb',
                  fontSize: 13
                }}
              />
              <span style={{ color: 'rgba(247, 249, 251, 0.6)' }}>to</span>
              <input
                type="date"
                value={customEndDate || formatDateForInput(value.endDate)}
                onChange={(e) => setCustomEndDate(e.target.value)}
                min={formatDateForInput(minDate)}
                max={formatDateForInput(maxDate)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#f7f9fb',
                  fontSize: 13
                }}
              />
              <button
                onClick={handleCustomDateApply}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: `linear-gradient(135deg, ${themeColor}, ${themeSecondary})`,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Granularity Options */}
          <div>
            <div style={{
              fontSize: 12,
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Data Granularity
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              {availableGranularities.map((granularity) => {
                const isSelected = value.granularity === granularity;
                return (
                  <button
                    key={granularity}
                    onClick={() => handleGranularityChange(granularity as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: isSelected 
                        ? `linear-gradient(135deg, ${themeColor}, ${themeSecondary})`
                        : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#fff' : 'rgba(247, 249, 251, 0.8)',
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                  >
                    {granularity}
                  </button>
                );
              })}
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.5)',
              marginTop: 8,
              fontStyle: 'italic'
            }}>
              {value.granularity === 'daily' && 'Showing data points for each day'}
              {value.granularity === 'weekly' && 'Data aggregated by week'}
              {value.granularity === 'monthly' && 'Data aggregated by month'}
              {value.granularity === 'quarterly' && 'Data aggregated by quarter'}
              {value.granularity === 'yearly' && 'Data aggregated by year'}
            </div>
          </div>

          {/* Current Selection Summary */}
          <div style={{
            marginTop: 16,
            padding: 12,
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 8,
            border: `1px solid ${themeColor}20`
          }}>
            <div style={{
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.6)',
              marginBottom: 4
            }}>
              Current Selection
            </div>
            <div style={{
              fontSize: 13,
              color: '#f7f9fb',
              lineHeight: 1.5
            }}>
              <strong>{days}</strong> days of data 
              ({value.startDate.toLocaleDateString()} - {value.endDate.toLocaleDateString()})
              <br />
              Grouped by: <strong>{value.granularity}</strong>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.8);
          cursor: pointer;
        }
        
        input[type="date"]:focus {
          outline: none;
          border-color: ${themeColor}60 !important;
        }
      `}</style>
    </div>
  );
}