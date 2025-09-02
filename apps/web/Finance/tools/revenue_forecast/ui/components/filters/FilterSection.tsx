import React, { useState } from 'react';
import styles from './FilterSection.module.css';

interface FilterSectionProps {
  filters: {
    startDate: string;
    endDate: string;
    segment: string;
    product: string;
    region: string;
    customer_type: string;
    revenue_type: string;
    forecast_horizon: string;
    confidence_level: number;
    scenario: string;
    comparison_period: string;
  };
  onFilterChange: (filters: any) => void;
  segments: Array<{ id: string; name: string; revenue: number }>;
  products: Array<{ id: string; name: string; category: string }>;
  regions: Array<{ id: string; name: string; country: string }>;
  customerTypes: Array<{ id: string; type: string; count: number }>;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  onFilterChange,
  segments,
  products,
  regions,
  customerTypes
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'scenarios'>('basic');

  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      startDate: '2021-01-01',
      endDate: '2021-12-31',
      segment: 'all',
      product: 'all',
      region: 'all',
      customer_type: 'all',
      revenue_type: 'all',
      forecast_horizon: '12_months',
      confidence_level: 80,
      scenario: 'base',
      comparison_period: 'previous_year'
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const forecastHorizons = [
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '12_months', label: '12 Months' },
    { value: '24_months', label: '24 Months' },
    { value: '36_months', label: '36 Months' }
  ];

  const revenueTypes = [
    { value: 'all', label: 'All Revenue' },
    { value: 'recurring', label: 'Recurring Revenue' },
    { value: 'transactional', label: 'Transactional Revenue' },
    { value: 'subscription', label: 'Subscription Revenue' },
    { value: 'license', label: 'License Revenue' },
    { value: 'services', label: 'Services Revenue' }
  ];

  const scenarios = [
    { value: 'base', label: 'Base Case' },
    { value: 'optimistic', label: 'Optimistic' },
    { value: 'pessimistic', label: 'Pessimistic' },
    { value: 'aggressive_growth', label: 'Aggressive Growth' },
    { value: 'recession', label: 'Recession' },
    { value: 'market_expansion', label: 'Market Expansion' }
  ];

  const comparisonPeriods = [
    { value: 'previous_year', label: 'Previous Year' },
    { value: 'previous_quarter', label: 'Previous Quarter' },
    { value: 'previous_month', label: 'Previous Month' },
    { value: 'budget', label: 'Budget' },
    { value: 'forecast', label: 'Previous Forecast' }
  ];

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader}>
        <h3 className={styles.filterTitle}>
          <span className={styles.filterIcon}>🎯</span>
          Revenue Forecast Filters
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
          {/* Tab Navigation */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Filters
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'advanced' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced Settings
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'scenarios' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('scenarios')}
            >
              Scenarios
            </button>
          </div>

          {/* Basic Filters Tab */}
          {activeTab === 'basic' && (
            <>
              {/* Date Range - Separate Row */}
              <div className={styles.dateRangeRow}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Forecast Period</label>
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
              </div>

              {/* Segment Filters Grid */}
              <div className={styles.filterGrid}>
                {/* Segment Filter */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Business Segment</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.segment}
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                >
                  <option value="all">All Segments</option>
                  {segments.map(segment => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name} (${(segment.revenue / 1000000).toFixed(1)}M)
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Product Line</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.product}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                >
                  <option value="all">All Products</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Region</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name} - {region.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Type Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Customer Type</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.customer_type}
                  onChange={(e) => handleFilterChange('customer_type', e.target.value)}
                >
                  <option value="all">All Customers</option>
                  {customerTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.type} ({type.count} customers)
                    </option>
                  ))}
                </select>
              </div>

              {/* Revenue Type Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Revenue Type</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.revenue_type}
                  onChange={(e) => handleFilterChange('revenue_type', e.target.value)}
                >
                  {revenueTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              </div>
            </>
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <div className={styles.filterGrid}>
              {/* Forecast Horizon */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Forecast Horizon</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.forecast_horizon}
                  onChange={(e) => handleFilterChange('forecast_horizon', e.target.value)}
                >
                  {forecastHorizons.map(horizon => (
                    <option key={horizon.value} value={horizon.value}>
                      {horizon.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Confidence Level */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Confidence Level: {localFilters.confidence_level}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={localFilters.confidence_level}
                  onChange={(e) => handleFilterChange('confidence_level', parseInt(e.target.value))}
                  className={styles.rangeInput}
                />
                <div className={styles.rangeLabels}>
                  <span>50%</span>
                  <span>95%</span>
                </div>
              </div>

              {/* Comparison Period */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Compare Against</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.comparison_period}
                  onChange={(e) => handleFilterChange('comparison_period', e.target.value)}
                >
                  {comparisonPeriods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Growth Rate Adjustment */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Growth Rate Adjustment
                </label>
                <div className={styles.adjustmentControls}>
                  <button 
                    className={styles.adjustButton}
                    onClick={() => handleFilterChange('growth_adjustment', -5)}
                  >
                    -5%
                  </button>
                  <button 
                    className={styles.adjustButton}
                    onClick={() => handleFilterChange('growth_adjustment', 0)}
                  >
                    Reset
                  </button>
                  <button 
                    className={styles.adjustButton}
                    onClick={() => handleFilterChange('growth_adjustment', 5)}
                  >
                    +5%
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <div className={styles.filterGrid}>
              {/* Scenario Selection */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Forecast Scenario</label>
                <select
                  className={styles.selectInput}
                  value={localFilters.scenario}
                  onChange={(e) => handleFilterChange('scenario', e.target.value)}
                >
                  {scenarios.map(scenario => (
                    <option key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scenario Description */}
              <div className={styles.scenarioDescription}>
                <h4>Scenario Parameters:</h4>
                {localFilters.scenario === 'base' && (
                  <p>Standard growth assumptions based on historical trends and current pipeline</p>
                )}
                {localFilters.scenario === 'optimistic' && (
                  <p>20% higher conversion rates, 15% price increase acceptance, new market entry</p>
                )}
                {localFilters.scenario === 'pessimistic' && (
                  <p>10% customer churn, 5% price pressure, delayed product launches</p>
                )}
                {localFilters.scenario === 'aggressive_growth' && (
                  <p>Double sales force, 50% marketing increase, M&A contribution included</p>
                )}
                {localFilters.scenario === 'recession' && (
                  <p>20% demand reduction, 15% price cuts, extended sales cycles</p>
                )}
                {localFilters.scenario === 'market_expansion' && (
                  <p>3 new regions, 2 new product lines, partnership revenue included</p>
                )}
              </div>
            </div>
          )}

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
              Reset All
            </button>
          </div>

          {/* Quick Presets */}
          <div className={styles.presets}>
            <span className={styles.presetsLabel}>Quick Presets:</span>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const q1_2021 = {
                  ...localFilters,
                  startDate: '2021-01-01',
                  endDate: '2021-03-31',
                  forecast_horizon: '3_months'
                };
                setLocalFilters(q1_2021);
                onFilterChange(q1_2021);
              }}
            >
              Q1 2021
            </button>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const year2021 = {
                  ...localFilters,
                  startDate: '2021-01-01',
                  endDate: '2021-12-31',
                  forecast_horizon: '12_months'
                };
                setLocalFilters(year2021);
                onFilterChange(year2021);
              }}
            >
              Year 2021
            </button>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const year2020 = {
                  ...localFilters,
                  startDate: '2020-01-01',
                  endDate: '2020-12-31',
                  forecast_horizon: '12_months'
                };
                setLocalFilters(year2020);
                onFilterChange(year2020);
              }}
            >
              Year 2020
            </button>
            <button 
              className={styles.presetButton}
              onClick={() => {
                const allData = {
                  ...localFilters,
                  startDate: '2019-01-01',
                  endDate: '2021-12-31',
                  forecast_horizon: '36_months'
                };
                setLocalFilters(allData);
                onFilterChange(allData);
              }}
            >
              All Data (2019-2021)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;