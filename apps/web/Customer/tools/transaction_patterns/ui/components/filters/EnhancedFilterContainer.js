import React, { useState, useEffect } from 'react';
import DateRangeFilter from './DateRangeFilter';
import CustomerSegmentFilter from './CustomerSegmentFilter';
import ProductCategoryFilter from './ProductCategoryFilter';
import FilterLoadingOverlay from './FilterLoadingOverlay';
import styles from './EnhancedFilterContainer.module.css';

const EnhancedFilterContainer = ({
  filters,
  onFiltersChange,
  onDateRangeChange,
  isLoading = false,
  availableSegments = {},
  availableCategories = {},
  className = '',
  showDateRange = true,
  showApply = false,
  minDate = '2017-01-01',
  maxDate = '2021-12-31',
  totalCustomersHint = 0,
  totalRevenueHint = 0,
}) => {
  const [activeFilters, setActiveFilters] = useState({
    dateRange: filters.dateRange || { start: '', end: '' },
    customerSegments: filters.customerSegments || [],
    productCategories: filters.productCategories || [],
    markets: filters.markets || [],
    monetary: filters.monetary || [],
    loyalty: filters.loyalty || [],
    countries: filters.countries || []
  });

  const [filterStats, setFilterStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    selectedCustomers: 0,
    selectedRevenue: 0,
    dateRangeDays: 0
  });

  // Update local state when props change
  useEffect(() => {
    setActiveFilters({
      dateRange: filters.dateRange || { start: '', end: '' },
      customerSegments: filters.customerSegments || [],
      productCategories: filters.productCategories || [],
      markets: filters.markets || [],
      monetary: filters.monetary || [],
      loyalty: filters.loyalty || [],
      countries: filters.countries || []
    });
  }, [filters]);

  // Calculate filter statistics
  useEffect(() => {
    const calculateStats = () => {
      // Calculate date range days
      let dateRangeDays = 0;
      if (activeFilters.dateRange.start && activeFilters.dateRange.end) {
        const startDate = new Date(activeFilters.dateRange.start);
        const endDate = new Date(activeFilters.dateRange.end);
        dateRangeDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Calculate customer stats
      const allSegments = Object.values(availableSegments).flat();
      const totalCustomersCalc = allSegments.reduce((sum, segment) => sum + (segment.count || 0), 0);
      const selectedCustomers = activeFilters.customerSegments.reduce((sum, segment) => sum + (segment.count || 0), 0);

      // Calculate revenue stats
      const allCategories = Object.values(availableCategories).flat();
      const totalRevenueCalc = allCategories.reduce((sum, category) => sum + (category.revenue || 0), 0);
      const selectedRevenue = activeFilters.productCategories.reduce((sum, category) => sum + (category.revenue || 0), 0);

      setFilterStats({
        totalCustomers: totalCustomersCalc || totalCustomersHint,
        totalRevenue: totalRevenueCalc || totalRevenueHint,
        selectedCustomers: selectedCustomers || totalCustomersCalc || totalCustomersHint,
        selectedRevenue: selectedRevenue || totalRevenueCalc || totalRevenueHint,
        dateRangeDays
      });
    };

    calculateStats();
  }, [activeFilters, availableSegments, availableCategories]);

  const handleDateRangeChange = (dateRange) => {
    const newFilters = { ...activeFilters, dateRange };
    setActiveFilters(newFilters);
    
    // Use onDateRangeChange if provided (performance-deviation pattern)
    if (onDateRangeChange) {
      onDateRangeChange(dateRange);
    } else {
      // Fallback to onFiltersChange
      onFiltersChange(newFilters);
    }
  };

  const handleCustomerSegmentChange = (segments) => {
    const newFilters = { ...activeFilters, customerSegments: segments };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  const handleProductCategoryChange = (categories) => {
    const newFilters = { ...activeFilters, productCategories: categories };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  // Additional segmentation filters derived from availableSegments
  const toggleItem = (list, item) => {
    const exists = list.some((x) => x.id === item.id);
    return exists ? list.filter((x) => x.id !== item.id) : [...list, item];
  };

  const handleMarketsChange = (item) => {
    const updated = toggleItem(activeFilters.markets, item);
    const newFilters = { ...activeFilters, markets: updated };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  const handleMonetaryChange = (item) => {
    const updated = toggleItem(activeFilters.monetary, item);
    const newFilters = { ...activeFilters, monetary: updated };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  const handleLoyaltyChange = (item) => {
    const updated = toggleItem(activeFilters.loyalty, item);
    const newFilters = { ...activeFilters, loyalty: updated };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  const handleCountriesChange = (item) => {
    const updated = toggleItem(activeFilters.countries, item);
    const newFilters = { ...activeFilters, countries: updated };
    setActiveFilters(newFilters);
    if (!showApply) onFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    const clearedFilters = {
      dateRange: { start: '', end: '' },
      customerSegments: [],
      productCategories: [],
      markets: [],
      monetary: [],
      loyalty: [],
      countries: []
    };
    setActiveFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.dateRange.start && activeFilters.dateRange.end) count++;
    if (activeFilters.customerSegments.length > 0) count++;
    if (activeFilters.productCategories.length > 0) count++;
    return count;
  };

  const hasActiveFilters = () => getActiveFilterCount() > 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`${styles.enhancedFilterContainer} ${className}`}>
      {/* Filter Header */}
      <div className={styles.filterHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitle}>
            <span className={styles.headerIcon}>🎛️</span>
            <span>Advanced Filters</span>
          </div>
          <div className={styles.headerSubtitle}>
            Refine your analysis with precision filtering
          </div>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.filterStats}>
            {filterStats.dateRangeDays > 0 && (
              <div className={styles.statItem}>
                <span className={styles.statValue}>{filterStats.dateRangeDays}</span>
                <span className={styles.statLabel}>Days</span>
              </div>
            )}
            <div className={styles.statItem}>
              <span className={styles.statValue}>{filterStats.selectedCustomers.toLocaleString()}</span>
              <span className={styles.statLabel}>Customers</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatCurrency(filterStats.selectedRevenue)}</span>
              <span className={styles.statLabel}>Revenue</span>
            </div>
          </div>
          
          {hasActiveFilters() && (
            <button
              className={styles.clearAllButton}
              onClick={handleClearAllFilters}
              title="Clear all filters"
            >
              <span className={styles.clearIcon}>🗑️</span>
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className={styles.filterControls}>
        {/* Date Range Filter */}
        {showDateRange && (
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>
              <span className={styles.labelIcon}>📅</span>
              <span>Date Range</span>
              {activeFilters.dateRange.start && activeFilters.dateRange.end && (
                <span className={styles.activeIndicator}>●</span>
              )}
            </div>
            <DateRangeFilter
              selectedRange={activeFilters.dateRange}
              onRangeChange={handleDateRangeChange}
              isLoading={isLoading}
              className={styles.filterComponent}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        )}

        {/* Customer Segment Filter */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>🎯</span>
            <span>Segments</span>
            {activeFilters.customerSegments.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <CustomerSegmentFilter
            selectedSegments={activeFilters.customerSegments}
            onSegmentChange={handleCustomerSegmentChange}
            availableSegments={availableSegments}
            isLoading={isLoading}
            className={styles.filterComponent}
          />
        </div>

        {/* Product Category Filter */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>📦</span>
            <span>Product Categories</span>
            {activeFilters.productCategories.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <ProductCategoryFilter
            selectedCategories={activeFilters.productCategories}
            onCategoryChange={handleProductCategoryChange}
            availableCategories={availableCategories}
            isLoading={isLoading}
            className={styles.filterComponent}
          />
        </div>

        {/* Market (from segmentCategories.market) */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>🏪</span>
            <span>Market</span>
            {activeFilters.markets.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <div className={styles.filterComponent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(availableSegments.market || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMarketsChange(item)}
                  className={styles.filterTag}
                  style={{
                    background: activeFilters.markets.some(m => m.id === item.id) ? 'rgba(233,48,255,0.15)' : 'rgba(51,65,85,0.8)',
                    borderColor: activeFilters.markets.some(m => m.id === item.id) ? 'rgba(233,48,255,0.35)' : 'rgba(148,163,184,0.2)'
                  }}
                  title={item.description || item.label}
                >
                  <span className={styles.tagText}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monetary */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>💰</span>
            <span>Monetary</span>
            {activeFilters.monetary.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <div className={styles.filterComponent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(availableSegments.monetary || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMonetaryChange(item)}
                  className={styles.filterTag}
                  style={{
                    background: activeFilters.monetary.some(m => m.id === item.id) ? 'rgba(16,185,129,0.15)' : 'rgba(51,65,85,0.8)',
                    borderColor: activeFilters.monetary.some(m => m.id === item.id) ? 'rgba(16,185,129,0.35)' : 'rgba(148,163,184,0.2)'
                  }}
                  title={item.description || item.label}
                >
                  <span className={styles.tagText}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loyalty */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>⭐</span>
            <span>Loyalty</span>
            {activeFilters.loyalty.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <div className={styles.filterComponent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(availableSegments.loyalty || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleLoyaltyChange(item)}
                  className={styles.filterTag}
                  style={{
                    background: activeFilters.loyalty.some(m => m.id === item.id) ? 'rgba(59,130,246,0.15)' : 'rgba(51,65,85,0.8)',
                    borderColor: activeFilters.loyalty.some(m => m.id === item.id) ? 'rgba(59,130,246,0.35)' : 'rgba(148,163,184,0.2)'
                  }}
                  title={item.description || item.label}
                >
                  <span className={styles.tagText}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Country */}
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>
            <span className={styles.labelIcon}>🌍</span>
            <span>Country</span>
            {activeFilters.countries.length > 0 && (
              <span className={styles.activeIndicator}>●</span>
            )}
          </div>
          <div className={styles.filterComponent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(availableSegments.geography || availableSegments.countries || []).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCountriesChange(item)}
                  className={styles.filterTag}
                  style={{
                    background: activeFilters.countries.some(m => m.id === item.id) ? 'rgba(100,116,139,0.2)' : 'rgba(51,65,85,0.8)',
                    borderColor: activeFilters.countries.some(m => m.id === item.id) ? 'rgba(100,116,139,0.4)' : 'rgba(148,163,184,0.2)'
                  }}
                  title={item.description || item.label}
                >
                  <span className={styles.tagText}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className={styles.activeFiltersSummary}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryIcon}>🔍</span>
            <span>Active Filters ({getActiveFilterCount()})</span>
          </div>
          
          <div className={styles.summaryTags}>
            {activeFilters.dateRange.start && activeFilters.dateRange.end && (
              <div className={styles.filterTag}>
                <span className={styles.tagIcon}>📅</span>
                <span className={styles.tagText}>
                  {activeFilters.dateRange.start} to {activeFilters.dateRange.end}
                </span>
                <button
                  className={styles.tagRemove}
                  onClick={() => handleDateRangeChange({ start: '', end: '' })}
                >
                  ✕
                </button>
              </div>
            )}
            
            {activeFilters.customerSegments.map((segment) => (
              <div key={segment.id} className={styles.filterTag}>
                <span className={styles.tagIcon}>🎯</span>
                <span className={styles.tagText}>{segment.label}</span>
                <button
                  className={styles.tagRemove}
                  onClick={() => {
                    const newSegments = activeFilters.customerSegments.filter(s => s.id !== segment.id);
                    handleCustomerSegmentChange(newSegments);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            
            {activeFilters.productCategories.map((category) => (
              <div key={category.id} className={styles.filterTag}>
                <span className={styles.tagIcon}>📦</span>
                <span className={styles.tagText}>{category.label}</span>
                <button
                  className={styles.tagRemove}
                  onClick={() => {
                    const newCategories = activeFilters.productCategories.filter(c => c.id !== category.id);
                    handleProductCategoryChange(newCategories);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <FilterLoadingOverlay message="Applying filters..." />
      )}

      {/* Filter Impact Preview */}
      {hasActiveFilters() && !isLoading && (
        <div className={styles.filterImpact}>
          <div className={styles.impactHeader}>
            <span className={styles.impactIcon}>📊</span>
            <span>Filter Impact</span>
          </div>
          
          <div className={styles.impactMetrics}>
            <div className={styles.impactItem}>
              <div className={styles.impactLabel}>Data Scope</div>
              <div className={styles.impactValue}>
                {((filterStats.selectedCustomers / Math.max(filterStats.totalCustomers, 1)) * 100).toFixed(1)}% of customers
              </div>
            </div>
            
            <div className={styles.impactItem}>
              <div className={styles.impactLabel}>Revenue Coverage</div>
              <div className={styles.impactValue}>
                {((filterStats.selectedRevenue / Math.max(filterStats.totalRevenue, 1)) * 100).toFixed(1)}% of total
              </div>
            </div>
            
            {filterStats.dateRangeDays > 0 && (
              <div className={styles.impactItem}>
                <div className={styles.impactLabel}>Time Period</div>
                <div className={styles.impactValue}>
                  {filterStats.dateRangeDays} day{filterStats.dateRangeDays !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFilterContainer;