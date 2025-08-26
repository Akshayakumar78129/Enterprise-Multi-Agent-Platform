import React, { useState, useEffect } from 'react';
import EnhancedDateRangeFilter, { DateRangeConfig } from '../../../../shared/components/filters/EnhancedDateRangeFilter';

interface FilterState {
  dateRange: DateRangeConfig;
  segments: string[];
  valueCategories: string[];
  behaviorTypes: string[];
}

interface SegmentationFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableSegments?: string[];
  availableValueCategories?: string[];
  availableBehaviorTypes?: string[];
}

// Removed DATE_RANGES as we use EnhancedDateRangeFilter now

// Customer segments based on RFM and value
const CUSTOMER_SEGMENTS = [
  'Champions',
  'Loyal Customers',
  'Potential Loyalists',
  'New Customers',
  'At Risk',
  'Can\'t Lose Them',
  'Hibernating',
  'Lost'
];

// Value categories for segmentation
const VALUE_CATEGORIES = [
  'High Value',
  'Medium Value',
  'Low Value',
  'Growth Potential',
  'Declining Value'
];

// Behavior types for segmentation
const BEHAVIOR_TYPES = [
  'Frequent Buyers',
  'Big Spenders',
  'Window Shoppers',
  'Bargain Hunters',
  'Brand Advocates',
  'Seasonal Shoppers'
];

export default function SegmentationFilters({ 
  onFiltersChange,
  availableSegments = CUSTOMER_SEGMENTS,
  availableValueCategories = VALUE_CATEGORIES,
  availableBehaviorTypes = BEHAVIOR_TYPES
}: SegmentationFiltersProps) {
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
    valueCategories: [],
    behaviorTypes: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  
  // Remove the automatic useEffect completely - only trigger on user actions

  const handleDateRangeChange = (dateRange: DateRangeConfig) => {
    const newFilters = {
      ...filters,
      dateRange
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters); // Call only on user action
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

  const handleValueCategoryToggle = (category: string) => {
    const newFilters = {
      ...filters,
      valueCategories: filters.valueCategories.includes(category)
        ? filters.valueCategories.filter(c => c !== category)
        : [...filters.valueCategories, category]
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleBehaviorTypeToggle = (type: string) => {
    const newFilters = {
      ...filters,
      behaviorTypes: filters.behaviorTypes.includes(type)
        ? filters.behaviorTypes.filter(t => t !== type)
        : [...filters.behaviorTypes, type]
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
      valueCategories: [],
      behaviorTypes: []
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activeFilterCount = filters.segments.length + filters.valueCategories.length + 
    filters.behaviorTypes.length + (filters.dateRange.type !== 'month' ? 1 : 0);

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
            🎯 Segmentation Filters
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
              color: '#3b82f6',
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
              theme="segmentation"
            />
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
              👥 Customer Segments
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
                      ? 'rgba(139, 92, 246, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.segments.includes(segment)
                      ? 'rgba(139, 92, 246, 0.1)'
                      : 'transparent',
                    color: filters.segments.includes(segment)
                      ? '#8b5cf6'
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

          {/* Value Categories */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              💰 Value Categories
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableValueCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleValueCategoryToggle(category)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: filters.valueCategories.includes(category)
                      ? 'rgba(16, 185, 129, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.valueCategories.includes(category)
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'transparent',
                    color: filters.valueCategories.includes(category)
                      ? '#10b981'
                      : 'rgba(247, 249, 251, 0.8)',
                    fontSize: 13,
                    fontWeight: filters.valueCategories.includes(category) ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!filters.valueCategories.includes(category)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filters.valueCategories.includes(category)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Behavior Types */}
          <div>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              🎯 Behavior Types
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableBehaviorTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleBehaviorTypeToggle(type)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: filters.behaviorTypes.includes(type)
                      ? 'rgba(236, 72, 153, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.behaviorTypes.includes(type)
                      ? 'rgba(236, 72, 153, 0.1)'
                      : 'transparent',
                    color: filters.behaviorTypes.includes(type)
                      ? '#ec4899'
                      : 'rgba(247, 249, 251, 0.8)',
                    fontSize: 13,
                    fontWeight: filters.behaviorTypes.includes(type) ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!filters.behaviorTypes.includes(type)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!filters.behaviorTypes.includes(type)) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {type}
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