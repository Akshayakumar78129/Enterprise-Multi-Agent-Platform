import React, { useState } from 'react';
import styles from './FilterSection.module.css';

interface FilterSectionProps {
  filters: {
    startDate: string;
    endDate: string;
    warehouseId: string;
    category: string;
    metric: string;
  };
  onFilterChange: (filters: any) => void;
  warehouses: Array<{ id: string; name: string; type: string }>;
  categories: Array<{ category: string; item_count: number }>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  onFilterChange,
  warehouses,
  categories
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      warehouseId: 'all',
      category: 'all',
      metric: 'health_score'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const metrics = [
    { value: 'health_score', label: 'Health Score' },
    { value: 'inventory_value', label: 'Inventory Value' },
    { value: 'stock_coverage', label: 'Stock Coverage' },
    { value: 'holding_cost', label: 'Holding Cost' },
    { value: 'stockout_risk', label: 'Stockout Risk' }
  ];

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>
          <span className={styles.filterIcon}>🔍</span>
          Dashboard Filters
        </h3>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.filterContent}>
          <div className={styles.filterGrid}>
            {/* Date Range */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date Range</label>
              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={localFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <span className={styles.dateSeparator}>to</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={localFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Warehouse Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Warehouse</label>
              <select
                className={styles.selectInput}
                value={localFilters.warehouseId}
                onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Category</label>
              <select
                className={styles.selectInput}
                value={localFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.item_count} items)
                  </option>
                ))}
              </select>
            </div>

            {/* Metric Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Performance Metric</label>
              <select
                className={styles.selectInput}
                value={localFilters.metric}
                onChange={(e) => handleFilterChange('metric', e.target.value)}
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button 
              className={styles.applyButton}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </button>
            <button 
              className={styles.resetButton}
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>

          {/* Quick Presets */}
          <div className={styles.presets}>
            <span className={styles.presetsLabel}>Quick Presets:</span>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const last30Days = {
                  ...localFilters,
                  startDate: '2025-04-11',
                  endDate: '2025-05-11'
                };
                setLocalFilters(last30Days);
                onFilterChange(last30Days);
              }}
            >
              Last 30 Days
            </button>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const last90Days = {
                  ...localFilters,
                  startDate: '2025-02-11',
                  endDate: '2025-05-11'
                };
                setLocalFilters(last90Days);
                onFilterChange(last90Days);
              }}
            >
              Last 90 Days
            </button>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const yearToDate = {
                  ...localFilters,
                  startDate: '2025-01-01',
                  endDate: '2025-12-31'
                };
                setLocalFilters(yearToDate);
                onFilterChange(yearToDate);
              }}
            >
              Year 2025
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;