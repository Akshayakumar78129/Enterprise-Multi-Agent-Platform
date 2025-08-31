import React, { useState, useEffect } from 'react';
import EnhancedDateRangeFilter, { DateRangeConfig } from '../../../../shared/components/filters/EnhancedDateRangeFilter';

interface FilterState {
  dateRange: DateRangeConfig;
  segments: string[];
  productCategories: string[];
  riskLevels: string[];
}

interface DashboardFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableSegments?: string[];
  availableCategories?: string[];
}

// Removed DATE_RANGES as we use EnhancedDateRangeFilter now

const CUSTOMER_SEGMENTS = [
  'Enterprise',
  'Mid-Market', 
  'Small Business',
  'Startup',
  'Government',
  'Non-Profit'
];

const PRODUCT_CATEGORIES = [
  'Core Platform',
  'Analytics Suite',
  'API Services',
  'Professional Services',
  'Support Packages',
  'Add-ons'
];

const RISK_LEVELS = [
  'Very High',
  'High',
  'Medium',
  'Low'
];

export default function DashboardFilters({ 
  onFiltersChange,
  availableSegments = CUSTOMER_SEGMENTS,
  availableCategories = PRODUCT_CATEGORIES
}: DashboardFiltersProps) {
  // Use dates that match the database (2019-2021)
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      type: 'year',
      granularity: 'monthly',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-12-31'),
      label: 'Year 2021'
    },
    segments: [],
    productCategories: [],
    riskLevels: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Remove auto-trigger on mount
  useEffect(() => {
    if (isInitialized) {
      onFiltersChange(filters);
    } else {
      setIsInitialized(true);
    }
  }, [filters, isInitialized]);

  const handleDateRangeChange = (dateRange: DateRangeConfig) => {
    const newFilters = {
      ...filters,
      dateRange
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters); // Call directly on user action
  };

  const handleSegmentToggle = (segment: string) => {
    const newFilters = {
      ...filters,
      segments: filters.segments.includes(segment)
        ? filters.segments.filter(s => s !== segment)
        : [...filters.segments, segment]
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoryToggle = (category: string) => {
    const newFilters = {
      ...filters,
      productCategories: filters.productCategories.includes(category)
        ? filters.productCategories.filter(c => c !== category)
        : [...filters.productCategories, category]
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRiskLevelToggle = (level: string) => {
    const newFilters = {
      ...filters,
      riskLevels: filters.riskLevels.includes(level)
        ? filters.riskLevels.filter(l => l !== level)
        : [...filters.riskLevels, level]
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      dateRange: {
        type: 'year',
        granularity: 'monthly',
        startDate: new Date('2021-01-01'),
        endDate: new Date('2021-12-31'),
        label: 'Year 2021'
      },
      segments: [],
      productCategories: [],
      riskLevels: []
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activeFilterCount = filters.segments.length + filters.productCategories.length + 
    filters.riskLevels.length + (filters.dateRange.type !== 'month' ? 1 : 0);

  return (
    <div style={{
      background: 'rgba(30, 39, 56, 0.8)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? 16 : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#f7f9fb'
          }}>
            🎯 Filters
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600
            }}>
              {activeFilterCount} active
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                padding: '4px 12px',
                color: 'rgba(247, 249, 251, 0.7)',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.currentTarget.style.color = '#f7f9fb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'rgba(247, 249, 251, 0.7)';
              }}
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e0ff',
              fontSize: 20,
              cursor: 'pointer',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.3s'
            }}
          >
            ▼
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
          {/* Enhanced Date Range */}
          <div style={{ marginBottom: 20 }}>
            <EnhancedDateRangeFilter
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              minDate={new Date('2019-01-01')}
              maxDate={new Date('2021-12-31')}
              theme="churn"
            />
          </div>

          {/* Risk Levels */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              🚨 Risk Levels
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RISK_LEVELS.map(level => {
                const getRiskColor = () => {
                  switch(level) {
                    case 'Very High': return '#ff1744';
                    case 'High': return '#ff9800';
                    case 'Medium': return '#ffd600';
                    case 'Low': return '#00e676';
                    default: return '#7c3aed';
                  }
                };
                const color = getRiskColor();
                
                return (
                  <button
                    key={level}
                    onClick={() => handleRiskLevelToggle(level)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: filters.riskLevels.includes(level)
                        ? `${color}80`
                        : 'rgba(255, 255, 255, 0.1)',
                      background: filters.riskLevels.includes(level)
                        ? `${color}20`
                        : 'transparent',
                      color: filters.riskLevels.includes(level)
                        ? color
                        : 'rgba(247, 249, 251, 0.8)',
                      fontSize: 13,
                      fontWeight: filters.riskLevels.includes(level) ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!filters.riskLevels.includes(level)) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!filters.riskLevels.includes(level)) {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Segments */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              👥 Customer Segments (Select to enable individual customer filtering)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableSegments.map(segment => (
                <button
                  key={segment}
                  onClick={() => handleSegmentToggle(segment)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: filters.segments.includes(segment)
                      ? 'rgba(124, 58, 237, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.segments.includes(segment)
                      ? 'rgba(124, 58, 237, 0.1)'
                      : 'transparent',
                    color: filters.segments.includes(segment)
                      ? '#7c3aed'
                      : 'rgba(247, 249, 251, 0.8)',
                    fontSize: 13,
                    fontWeight: filters.segments.includes(segment) ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!filters.segments.includes(segment)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filters.segments.includes(segment)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {segment}
                </button>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              📦 Product Categories
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: filters.productCategories.includes(category)
                      ? 'rgba(0, 230, 118, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.productCategories.includes(category)
                      ? 'rgba(0, 230, 118, 0.1)'
                      : 'transparent',
                    color: filters.productCategories.includes(category)
                      ? '#00e676'
                      : 'rgba(247, 249, 251, 0.8)',
                    fontSize: 13,
                    fontWeight: filters.productCategories.includes(category) ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!filters.productCategories.includes(category)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filters.productCategories.includes(category)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}