import React, { FC, useState } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { Select } from '../../../../../../ui-common/design-system/components/Select';
// import { DateRangePicker } from '../../../../../../ui-common/design-system/components/DateRangePicker'; // Assuming this component exists
import { DimensionOption, MetricOption } from '../../types';
// import { PillButton } from '../../../../../../ui-common/design-system/components/PillButton'; // Assuming this component exists

interface FilterControlsProps {
  dateRange: { startDate: string; endDate: string };
  selectedDimension: string | null;
  selectedMetric: string | null;
  availableDimensions: string[];
  availableMetrics: string[];
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
  onDimensionChange: (dimension: string) => void;
  onMetricChange: (metric: string) => void;
  onResetFilters: () => void;
  // Add other filter props as needed from spec (e.g. specific dimension filters)
}

export const FilterControls: FC<FilterControlsProps> = ({
  dateRange,
  selectedDimension,
  selectedMetric,
  availableDimensions,
  availableMetrics,
  onDateRangeChange,
  onDimensionChange,
  onMetricChange,
  onResetFilters,
}) => {
  const theme = useTheme();
  // Example for a generic filter panel state, expand as per spec
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Basic styling for pill-like buttons
  const pillStyle = (active: boolean) => ({
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    marginRight: theme.spacing[1],
    border: `1px solid ${active ? theme.colors.electricCyan : theme.colors.graphite}`,
    borderRadius: '16px',
    background: active ? theme.colors.electricCyan : theme.colors.midnight,
    color: active ? theme.colors.midnight : theme.colors.cloudWhite,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {/* Row 1: Dimension and Metric Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2], alignItems: 'center' }}>
        <div>
          <span style={{ color: theme.colors.cloudWhite, marginRight: theme.spacing[1] }}>Dimension:</span>
          {availableDimensions.map(dim => (
            <button 
              key={dim} 
              onClick={() => onDimensionChange(dim)} 
              style={pillStyle(selectedDimension === dim)}
            >
              {dim.charAt(0).toUpperCase() + dim.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
        <div>
          <span style={{ color: theme.colors.cloudWhite, marginRight: theme.spacing[1] }}>Metric:</span>
          {availableMetrics.map(met => (
            <button 
              key={met} 
              onClick={() => onMetricChange(met)} 
              style={pillStyle(selectedMetric === met)}
            >
              {met.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Time Period Selector and Other Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing[2], alignItems: 'center' }}>
        <div>
          <span style={{ color: theme.colors.cloudWhite, marginRight: theme.spacing[1] }}>Start Date:</span>
          <input 
            type="date" 
            value={dateRange.startDate} 
            onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
            style={{ padding: theme.spacing[1], background: theme.colors.graphite, color: theme.colors.cloudWhite, border: `1px solid ${theme.colors.graphiteDark}` }}
          />
        </div>
        <div>
          <span style={{ color: theme.colors.cloudWhite, marginRight: theme.spacing[1] }}>End Date:</span>
          <input 
            type="date" 
            value={dateRange.endDate} 
            onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
            style={{ padding: theme.spacing[1], background: theme.colors.graphite, color: theme.colors.cloudWhite, border: `1px solid ${theme.colors.graphiteDark}` }}
          />
        </div>
        {/* Placeholder for preset buttons from spec */}
        <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} variant="outline">
          {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
        </Button>
        <Button onClick={onResetFilters} variant="secondary">Reset Filters</Button>
      </div>

      {/* Advanced Filter Panel (Expandable Drawer) - Placeholder */}
      {showAdvancedFilters && (
        <div style={{ 
          padding: theme.spacing[3], 
          border: `1px solid ${theme.colors.graphite}`,
          borderRadius: '8px',
          marginTop: theme.spacing[2],
          background: theme.colors.graphiteDark 
        }}>
          <p style={{color: theme.colors.cloudWhite}}>Advanced Filter Options (e.g., filter chips, quick presets, builder) - To be implemented as per Spec 4.1</p>
          {/* Implement filter chips, presets, advanced builder here */}
        </div>
      )}
    </div>
  );
}; 