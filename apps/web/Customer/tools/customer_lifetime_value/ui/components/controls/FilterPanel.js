import React, { useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';

const FilterPanel = ({ 
  onFiltersChange = null,
  availableSegments = [],
  availableRegions = [],
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    segments: [],
    regions: [],
    valueRange: { min: 0, max: 100000 },
    customerType: 'All',
    ...initialFilters
  });

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: { start: '', end: '' },
      segments: [],
      regions: [],
      valueRange: { min: 0, max: 100000 },
      customerType: 'All'
    };
    setFilters(defaultFilters);
    
    if (onFiltersChange) {
      onFiltersChange(defaultFilters);
    }
  };

  return (
    <Card title="Filters" className="filter-panel">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px'
      }}>
        {/* Date Range Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#f7f9fb',
            marginBottom: '8px'
          }}>
            Date Range
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value
              })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#1e2738',
                color: '#f7f9fb',
                fontSize: '14px'
              }}
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value
              })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #3a4459',
                backgroundColor: '#1e2738',
                color: '#f7f9fb',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Customer Type Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#f7f9fb',
            marginBottom: '8px'
          }}>
            Customer Type
          </label>
          <select
            value={filters.customerType}
            onChange={(e) => handleFilterChange('customerType', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#1e2738',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            <option value="All">All Types</option>
            {availableSegments.map(segment => (
              <option key={segment} value={segment}>{segment}</option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#f7f9fb',
            marginBottom: '8px'
          }}>
            Region
          </label>
          <select
            value={filters.regions.length > 0 ? filters.regions[0] : 'All'}
            onChange={(e) => {
              const value = e.target.value;
              handleFilterChange('regions', value === 'All' ? [] : [value]);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#1e2738',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            <option value="All">All Regions</option>
            {availableRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Value Range Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#f7f9fb',
            marginBottom: '8px'
          }}>
            LTV Range: ${filters.valueRange.min.toLocaleString()} - ${filters.valueRange.max.toLocaleString()}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.valueRange.min}
              onChange={(e) => handleFilterChange('valueRange', {
                ...filters.valueRange,
                min: parseInt(e.target.value)
              })}
              style={{ width: '100%' }}
            />
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.valueRange.max}
              onChange={(e) => handleFilterChange('valueRange', {
                ...filters.valueRange,
                max: parseInt(e.target.value)
              })}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px'
        }}>
          <button
            onClick={resetFilters}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#5891cb',
              border: '1px solid #3a4459',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reset
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Apply
          </button>
        </div>

        {/* Active Filters Summary */}
        {(filters.customerType !== 'All' || 
          filters.regions.length > 0 || 
          filters.valueRange.min > 0 || 
          filters.valueRange.max < 100000) && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#1e2738',
            borderRadius: '8px',
            border: '1px solid #3a4459'
          }}>
            <h5 style={{
              margin: '0 0 8px 0',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5891cb'
            }}>
              Active Filters:
            </h5>
            <div style={{ fontSize: '11px', color: '#f7f9fb' }}>
              {filters.customerType !== 'All' && (
                <div>Type: {filters.customerType}</div>
              )}
              {filters.regions.length > 0 && (
                <div>Region: {filters.regions.join(', ')}</div>
              )}
              {(filters.valueRange.min > 0 || filters.valueRange.max < 100000) && (
                <div>
                  Value: ${filters.valueRange.min.toLocaleString()} - ${filters.valueRange.max.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FilterPanel; 