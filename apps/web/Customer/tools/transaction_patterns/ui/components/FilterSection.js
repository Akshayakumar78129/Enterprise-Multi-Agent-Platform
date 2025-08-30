import React, { useState } from 'react';
import styles from './FilterSection.module.css';

const FilterSection = ({ 
  filters, 
  onFiltersChange, 
  paymentMethods = [],
  isLoading = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters || {
    dateRange: {
      start: '2017-01-01',
      end: '2021-12-31'
    },
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
    anomalyOnly: false
  });

  // Predefined date ranges
  const datePresets = [
    { label: 'Last 7 Days', value: 7 },
    { label: 'Last 30 Days', value: 30 },
    { label: 'Last 90 Days', value: 90 },
    { label: 'Last Year', value: 365 },
    { label: 'All Time', value: 'all' }
  ];

  const handleDatePreset = (preset) => {
    const today = new Date();
    let startDate, endDate;
    
    endDate = today.toISOString().split('T')[0];
    
    if (preset.value === 'all') {
      startDate = '2017-01-01';
      endDate = '2021-12-31';
    } else {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - preset.value);
      startDate = pastDate.toISOString().split('T')[0];
    }
    
    const newFilters = {
      ...localFilters,
      dateRange: { start: startDate, end: endDate }
    };
    
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters };
    
    if (field === 'startDate') {
      newFilters.dateRange.start = value;
    } else if (field === 'endDate') {
      newFilters.dateRange.end = value;
    } else {
      newFilters[field] = value;
    }
    
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      dateRange: {
        start: '2017-01-01',
        end: '2021-12-31'
      },
      paymentMethod: '',
      minAmount: '',
      maxAmount: '',
      anomalyOnly: false
    };
    
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <div className={`${styles.filterSection} ${!isExpanded ? styles.collapsed : ''}`}>
      <div className={styles.filterHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.filterTitle}>🔍 Filters</h3>
          <button 
            className={styles.expandToggle}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <span className={`${styles.arrow} ${!isExpanded ? styles.arrowDown : ''}`}>
              ▼
            </span>
          </button>
        </div>
        <button 
          className={styles.resetButton}
          onClick={handleResetFilters}
          disabled={isLoading}
          style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none' }}
        >
          Reset All
        </button>
      </div>

      <div className={`${styles.filterContent} ${!isExpanded ? styles.hidden : ''}`}>
        {/* Date Range Section */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date Range</label>
          
          {/* Quick Presets */}
          <div className={styles.presetButtons}>
            {datePresets.map((preset, index) => (
              <button
                key={index}
                className={styles.presetButton}
                onClick={() => handleDatePreset(preset)}
                disabled={isLoading}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className={styles.dateInputs}>
            <div className={styles.dateField}>
              <label className={styles.fieldLabel}>From</label>
              <input
                type="date"
                value={localFilters.dateRange.start}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={styles.dateInput}
                disabled={isLoading}
              />
            </div>
            <div className={styles.dateField}>
              <label className={styles.fieldLabel}>To</label>
              <input
                type="date"
                value={localFilters.dateRange.end}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={styles.dateInput}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Payment Method Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Payment Method</label>
          <select
            value={localFilters.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className={styles.selectInput}
            disabled={isLoading}
          >
            <option value="">All Methods</option>
            {paymentMethods.map((method, index) => (
              <option key={index} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Range Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Transaction Amount</label>
          <div className={styles.rangeInputs}>
            <input
              type="number"
              placeholder="Min"
              value={localFilters.minAmount}
              onChange={(e) => handleInputChange('minAmount', e.target.value)}
              className={styles.amountInput}
              disabled={isLoading}
            />
            <span className={styles.rangeSeparator}>-</span>
            <input
              type="number"
              placeholder="Max"
              value={localFilters.maxAmount}
              onChange={(e) => handleInputChange('maxAmount', e.target.value)}
              className={styles.amountInput}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Anomaly Filter */}
        <div className={styles.filterGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={localFilters.anomalyOnly}
              onChange={(e) => handleInputChange('anomalyOnly', e.target.checked)}
              className={styles.checkbox}
              disabled={isLoading}
            />
            <span>Show Anomalies Only</span>
          </label>
        </div>

        {/* Apply Button */}
        <button
          className={styles.applyButton}
          onClick={handleApplyFilters}
          disabled={isLoading}
        >
          {isLoading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
};

export default FilterSection;