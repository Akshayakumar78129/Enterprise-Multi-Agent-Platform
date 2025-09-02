import React, { FC, useState } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { Button } from '../../../../../../ui-common/design-system/components/Button';

interface ComprehensiveFiltersProps {
  dateRange: { startDate: string; endDate: string };
  selectedDimension: string | null;
  selectedMetric: string | null;
  selectedRegion?: string;
  selectedCategory?: string;
  selectedChannel?: string;
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
  onDimensionChange: (dimension: string) => void;
  onMetricChange: (metric: string) => void;
  onRegionChange?: (region: string) => void;
  onCategoryChange?: (category: string) => void;
  onChannelChange?: (channel: string) => void;
  onResetFilters: () => void;
}

export const ComprehensiveFilters: FC<ComprehensiveFiltersProps> = ({
  dateRange,
  selectedDimension,
  selectedMetric,
  selectedRegion = 'all',
  selectedCategory = 'all',
  selectedChannel = 'all',
  onDateRangeChange,
  onDimensionChange,
  onMetricChange,
  onRegionChange,
  onCategoryChange,
  onChannelChange,
  onResetFilters,
}) => {
  const theme = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Available options
  const dimensions = [
    { value: 'category', label: 'Category' },
    { value: 'product', label: 'Product' },
    { value: 'region', label: 'Region' },
    { value: 'channel', label: 'Channel' },
    { value: 'customer', label: 'Customer' },
    { value: 'time', label: 'Time Series' },
  ];

  const metrics = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'units_sold', label: 'Units Sold' },
    { value: 'averageOrderValue', label: 'Avg Order Value' },
    { value: 'grossMargin', label: 'Gross Margin' },
    { value: 'conversionRate', label: 'Conversion Rate' },
  ];

  const regions = [
    { value: 'all', label: 'All Regions' },
    { value: 'north', label: 'North' },
    { value: 'south', label: 'South' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'central', label: 'Central' },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'books', label: 'Books & Media' },
    { value: 'food', label: 'Food & Beverage' },
  ];

  const channels = [
    { value: 'all', label: 'All Channels' },
    { value: 'online', label: 'Online' },
    { value: 'retail', label: 'Retail Store' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'mobile', label: 'Mobile App' },
    { value: 'social', label: 'Social Commerce' },
  ];

  const datePresets = [
    { label: 'All Time', start: '2017-01-01', end: '2021-12-31' },
    { label: 'Last Year', start: '2021-01-01', end: '2021-12-31' },
    { label: 'Last Quarter', start: '2021-10-01', end: '2021-12-31' },
    { label: 'Last Month', start: '2021-12-01', end: '2021-12-31' },
    { label: '2020', start: '2020-01-01', end: '2020-12-31' },
    { label: '2019', start: '2019-01-01', end: '2019-12-31' },
  ];

  const buttonStyle = (isActive: boolean) => ({
    padding: '6px 14px',
    background: isActive 
      ? 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)' 
      : 'transparent',
    color: isActive ? theme.colors.midnight : theme.colors.cloudWhite,
    border: `1px solid ${isActive ? '#00e0ff' : theme.colors.graphite}`,
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap' as const,
  });

  const selectStyle = {
    padding: '6px 12px',
    background: theme.colors.midnight,
    color: theme.colors.cloudWhite,
    border: `1px solid ${theme.colors.graphite}`,
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '120px',
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
          <span style={{ fontSize: '18px' }}>🎯</span>
          <span style={{ 
            color: theme.colors.cloudWhite, 
            fontSize: '16px',
            fontWeight: 600 
          }}>
            Filters & Analysis Controls
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              ...buttonStyle(false),
              padding: '6px 16px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
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
      </div>

      {/* Primary Filters Row 1: Date Presets */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          color: 'rgba(247, 249, 251, 0.7)', 
          fontSize: '12px',
          display: 'block',
          marginBottom: '8px'
        }}>
          Quick Date Selection
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {datePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onDateRangeChange({ 
                startDate: preset.start, 
                endDate: preset.end 
              })}
              style={buttonStyle(
                dateRange.startDate === preset.start && 
                dateRange.endDate === preset.end
              )}
              onMouseEnter={(e) => {
                if (!(dateRange.startDate === preset.start && dateRange.endDate === preset.end)) {
                  e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                  e.currentTarget.style.borderColor = '#00e0ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!(dateRange.startDate === preset.start && dateRange.endDate === preset.end)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = theme.colors.graphite;
                }
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Filters Row 2: Dimension & Metric */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div>
          <label style={{ 
            color: 'rgba(247, 249, 251, 0.7)', 
            fontSize: '12px',
            display: 'block',
            marginBottom: '8px'
          }}>
            Analysis Dimension
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {dimensions.map((dim) => (
              <button
                key={dim.value}
                onClick={() => onDimensionChange(dim.value)}
                style={buttonStyle(selectedDimension === dim.value)}
                onMouseEnter={(e) => {
                  if (selectedDimension !== dim.value) {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = '#00e0ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDimension !== dim.value) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = theme.colors.graphite;
                  }
                }}
              >
                {dim.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ 
            color: 'rgba(247, 249, 251, 0.7)', 
            fontSize: '12px',
            display: 'block',
            marginBottom: '8px'
          }}>
            Performance Metric
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {metrics.map((met) => (
              <button
                key={met.value}
                onClick={() => onMetricChange(met.value)}
                style={buttonStyle(selectedMetric === met.value)}
                onMouseEnter={(e) => {
                  if (selectedMetric !== met.value) {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = '#00e0ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedMetric !== met.value) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = theme.colors.graphite;
                  }
                }}
              >
                {met.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div style={{
          paddingTop: '16px',
          borderTop: '1px solid rgba(0, 224, 255, 0.1)',
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* Region Filter */}
            <div>
              <label style={{ 
                color: 'rgba(247, 249, 251, 0.7)', 
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Region Filter
              </label>
              <select 
                value={selectedRegion} 
                onChange={(e) => onRegionChange?.(e.target.value)}
                style={selectStyle}
              >
                {regions.map(region => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label style={{ 
                color: 'rgba(247, 249, 251, 0.7)', 
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Category Filter
              </label>
              <select 
                value={selectedCategory} 
                onChange={(e) => onCategoryChange?.(e.target.value)}
                style={selectStyle}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Filter */}
            <div>
              <label style={{ 
                color: 'rgba(247, 249, 251, 0.7)', 
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Sales Channel
              </label>
              <select 
                value={selectedChannel} 
                onChange={(e) => onChannelChange?.(e.target.value)}
                style={selectStyle}
              >
                {channels.map(channel => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            <div>
              <label style={{ 
                color: 'rgba(247, 249, 251, 0.7)', 
                fontSize: '12px',
                display: 'block',
                marginBottom: '8px'
              }}>
                Custom Date Range
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="date" 
                  value={dateRange.startDate} 
                  min="2017-01-01"
                  max="2021-12-31"
                  onChange={(e) => onDateRangeChange({ 
                    ...dateRange, 
                    startDate: e.target.value 
                  })}
                  style={{ ...selectStyle, fontSize: '12px' }}
                />
                <input 
                  type="date" 
                  value={dateRange.endDate} 
                  min="2017-01-01"
                  max="2021-12-31"
                  onChange={(e) => onDateRangeChange({ 
                    ...dateRange, 
                    endDate: e.target.value 
                  })}
                  style={{ ...selectStyle, fontSize: '12px' }}
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          <div style={{
            padding: '12px',
            background: 'rgba(0, 224, 255, 0.05)',
            border: '1px solid rgba(0, 224, 255, 0.2)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#00e0ff',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span>📊 Active Filters:</span>
            <span style={{ color: theme.colors.cloudWhite }}>
              {selectedDimension} by {selectedMetric}
              {selectedRegion !== 'all' && ` | Region: ${selectedRegion}`}
              {selectedCategory !== 'all' && ` | Category: ${selectedCategory}`}
              {selectedChannel !== 'all' && ` | Channel: ${selectedChannel}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};