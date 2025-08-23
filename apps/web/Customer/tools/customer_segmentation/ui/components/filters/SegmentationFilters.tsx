import React, { useState, useEffect } from 'react';

interface FilterState {
  dateRange: {
    type: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    startDate: Date;
    endDate: Date;
  };
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

// Date ranges for segmentation analysis
const DATE_RANGES = {
  week: { label: 'Last 7 Days', days: 7 },
  month: { label: 'Last 30 Days', days: 30 },
  quarter: { label: 'Last 90 Days', days: 90 },
  year: { label: 'Last 365 Days', days: 365 }
};

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
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      type: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    },
    segments: [],
    valueCategories: [],
    behaviorTypes: []
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters]);

  const handleDateRangeChange = (type: 'week' | 'month' | 'quarter' | 'year') => {
    const days = DATE_RANGES[type].days;
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    setFilters(prev => ({
      ...prev,
      dateRange: { type, startDate, endDate }
    }));
  };

  const handleSegmentToggle = (segment: string) => {
    setFilters(prev => ({
      ...prev,
      segments: prev.segments.includes(segment)
        ? prev.segments.filter(s => s !== segment)
        : [...prev.segments, segment]
    }));
  };

  const handleValueCategoryToggle = (category: string) => {
    setFilters(prev => ({
      ...prev,
      valueCategories: prev.valueCategories.includes(category)
        ? prev.valueCategories.filter(c => c !== category)
        : [...prev.valueCategories, category]
    }));
  };

  const handleBehaviorTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      behaviorTypes: prev.behaviorTypes.includes(type)
        ? prev.behaviorTypes.filter(t => t !== type)
        : [...prev.behaviorTypes, type]
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        type: 'month',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      segments: [],
      valueCategories: [],
      behaviorTypes: []
    });
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
          {/* Date Range */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(247, 249, 251, 0.7)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              📅 Analysis Period
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(DATE_RANGES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleDateRangeChange(key as any)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: filters.dateRange.type === key 
                      ? 'rgba(59, 130, 246, 0.5)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    background: filters.dateRange.type === key
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'transparent',
                    color: filters.dateRange.type === key
                      ? '#3b82f6'
                      : 'rgba(247, 249, 251, 0.8)',
                    fontSize: 13,
                    fontWeight: filters.dateRange.type === key ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (filters.dateRange.type !== key) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filters.dateRange.type !== key) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                >
                  {value.label}
                </button>
              ))}
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.5)'
            }}>
              {filters.dateRange.startDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })} - {filters.dateRange.endDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
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