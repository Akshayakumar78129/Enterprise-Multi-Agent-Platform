import React, { FC } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Button } from '../../../../../../ui-common/design-system/components/Button';

interface DateFilterControlsProps {
  dateRange: { startDate: string; endDate: string };
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
  onResetFilters: () => void;
}

export const DateFilterControls: FC<DateFilterControlsProps> = ({
  dateRange,
  onDateRangeChange,
  onResetFilters,
}) => {
  const theme = useTheme();

  // Quick date presets for 2017-2021 data
  const datePresets = [
    { label: 'All Data', start: '2017-01-01', end: '2021-12-31' },
    { label: '2021', start: '2021-01-01', end: '2021-12-31' },
    { label: '2020', start: '2020-01-01', end: '2020-12-31' },
    { label: '2019', start: '2019-01-01', end: '2019-12-31' },
    { label: '2018', start: '2018-01-01', end: '2018-12-31' },
    { label: '2017', start: '2017-01-01', end: '2017-12-31' },
    { label: 'Last 2 Years', start: '2020-01-01', end: '2021-12-31' },
    { label: 'Pre-COVID', start: '2017-01-01', end: '2019-12-31' },
  ];

  const inputStyle = {
    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
    background: theme.colors.midnight,
    color: theme.colors.cloudWhite,
    border: `1px solid ${theme.colors.graphite}`,
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const presetButtonStyle = (isActive: boolean) => ({
    padding: `${theme.spacing[1]}px ${theme.spacing[3]}px`,
    background: isActive 
      ? 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)' 
      : 'transparent',
    color: isActive ? theme.colors.midnight : theme.colors.cloudWhite,
    border: `1px solid ${isActive ? '#00e0ff' : theme.colors.graphite}`,
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
  });

  const isPresetActive = (preset: { start: string; end: string }) => {
    return dateRange.startDate === preset.start && dateRange.endDate === preset.end;
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
      border: '1px solid rgba(0, 224, 255, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📅</span>
          <span style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: '16px',
            fontWeight: 600 
          }}>
            Date Range Selection
          </span>
          <span style={{ 
            color: 'rgba(247, 249, 251, 0.6)',
            fontSize: '12px',
            fontStyle: 'italic',
            marginLeft: '8px'
          }}>
            (Available data: 2017-2021)
          </span>
        </div>
        <Button 
          onClick={onResetFilters} 
          variant="secondary"
          style={{
            padding: '6px 16px',
            fontSize: '12px',
            background: 'rgba(255, 82, 82, 0.1)',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            color: '#ff5252',
          }}
        >
          Reset All
        </Button>
      </div>

      {/* Quick Presets */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        marginBottom: '20px' 
      }}>
        {datePresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onDateRangeChange({ 
              startDate: preset.start, 
              endDate: preset.end 
            })}
            style={presetButtonStyle(isPresetActive(preset))}
            onMouseEnter={(e) => {
              if (!isPresetActive(preset)) {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                e.currentTarget.style.borderColor = '#00e0ff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPresetActive(preset)) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = theme.colors.graphite;
              }
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center',
        flexWrap: 'wrap' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: 'rgba(247, 249, 251, 0.7)', 
            fontSize: '14px',
            minWidth: '40px'
          }}>
            From:
          </span>
          <input 
            type="date" 
            value={dateRange.startDate} 
            min="2017-01-01"
            max="2021-12-31"
            onChange={(e) => onDateRangeChange({ 
              ...dateRange, 
              startDate: e.target.value 
            })}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00e0ff';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 224, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.graphite;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ 
            color: 'rgba(247, 249, 251, 0.7)', 
            fontSize: '14px',
            minWidth: '40px' 
          }}>
            To:
          </span>
          <input 
            type="date" 
            value={dateRange.endDate} 
            min="2017-01-01"
            max="2021-12-31"
            onChange={(e) => onDateRangeChange({ 
              ...dateRange, 
              endDate: e.target.value 
            })}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00e0ff';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 224, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.colors.graphite;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Current Selection Display */}
        <div style={{
          marginLeft: 'auto',
          padding: '8px 16px',
          background: 'rgba(0, 224, 255, 0.1)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#00e0ff',
        }}>
          {(() => {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return `${days} days selected`;
          })()}
        </div>
      </div>
    </div>
  );
};