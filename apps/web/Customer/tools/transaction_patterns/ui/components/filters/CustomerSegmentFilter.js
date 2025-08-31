import React, { useState, useEffect, useRef } from 'react';
import styles from './CustomerSegmentFilter.module.css';

const CustomerSegmentFilter = ({ 
  selectedSegments = [], 
  onSegmentChange, 
  availableSegments = {},
  isLoading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Segment categories with business context
  const segmentCategories = {
    all: { label: 'All Segments', icon: '🎯', color: '#00e0ff' },
    market: { label: 'Market Channel', icon: '🏪', color: '#e930ff' },
    monetary: { label: 'Value Tier', icon: '💰', color: '#fbbf24' },
    loyalty: { label: 'Loyalty Status', icon: '⭐', color: '#10b981' },
    geography: { label: 'Geographic', icon: '🌍', color: '#8b5cf6' }
  };

  // Default segments structure
  const defaultSegments = {
    market: [
      { id: 'discounters', label: 'Discounters', description: 'Price-focused retail chains', count: 0 },
      { id: 'general_sports', label: 'General Sports Shops', description: 'Multi-sport retail stores', count: 0 },
      { id: 'specialty_bike', label: 'Specialty Bike Shops', description: 'Dedicated cycling retailers', count: 0 },
      { id: 'clubs_resorts', label: 'Clubs & Resorts', description: 'Hospitality and recreation', count: 0 },
      { id: 'department_stores', label: 'Department Stores', description: 'Large format retailers', count: 0 },
      { id: 'wholesalers', label: 'Wholesalers', description: 'B2B distribution partners', count: 0 }
    ],
    monetary: [
      { id: 'top', label: 'Top Tier', description: 'Highest value customers', count: 0, color: '#10b981' },
      { id: 'big', label: 'Big Spenders', description: 'High value customers', count: 0, color: '#3b82f6' },
      { id: 'medium', label: 'Medium Value', description: 'Regular customers', count: 0, color: '#f59e0b' },
      { id: 'small', label: 'Small Value', description: 'Lower spend customers', count: 0, color: '#ef4444' },
      { id: 'inactive', label: 'Inactive', description: 'Dormant customers', count: 0, color: '#6b7280' }
    ],
    loyalty: [
      { id: 'champion', label: 'Champions', description: 'High value, high frequency', count: 0, color: '#10b981' },
      { id: 'loyal', label: 'Loyal Customers', description: 'Regular repeat buyers', count: 0, color: '#3b82f6' },
      { id: 'potential', label: 'Potential Loyalists', description: 'Recent high-value customers', count: 0, color: '#8b5cf6' },
      { id: 'new', label: 'New Customers', description: 'Recent acquisitions', count: 0, color: '#06b6d4' },
      { id: 'at_risk', label: 'At Risk', description: 'Declining engagement', count: 0, color: '#f59e0b' },
      { id: 'hibernating', label: 'Hibernating', description: 'Low recent activity', count: 0, color: '#ef4444' }
    ],
    geography: [
      { id: 'north_america', label: 'North America', description: 'US and Canada', count: 0 },
      { id: 'europe', label: 'Europe', description: 'European markets', count: 0 },
      { id: 'asia_pacific', label: 'Asia Pacific', description: 'APAC region', count: 0 },
      { id: 'latin_america', label: 'Latin America', description: 'Central and South America', count: 0 },
      { id: 'other', label: 'Other Regions', description: 'Emerging markets', count: 0 }
    ]
  };

  // Merge available segments with defaults
  const segments = { ...defaultSegments, ...availableSegments };

  // Filter segments based on search and category
  const getFilteredSegments = () => {
    const categorySegments = activeCategory === 'all' 
      ? Object.values(segments).flat()
      : segments[activeCategory] || [];

    return categorySegments.filter(segment =>
      segment.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSegmentToggle = (segment) => {
    const isSelected = selectedSegments.some(s => s.id === segment.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedSegments.filter(s => s.id !== segment.id);
    } else {
      newSelection = [...selectedSegments, { ...segment, category: activeCategory }];
    }

    onSegmentChange(newSelection);
  };

  const handleClearAll = () => {
    onSegmentChange([]);
  };

  const handleSelectAll = () => {
    const filteredSegments = getFilteredSegments();
    const newSegments = filteredSegments.map(segment => ({
      ...segment,
      category: activeCategory
    }));
    onSegmentChange(newSegments);
  };

  const getSelectedCount = () => selectedSegments.length;
  const getTotalCustomers = () => {
    return Object.values(segments).flat().reduce((sum, segment) => sum + (segment.count || 0), 0);
  };

  const getSelectedCustomers = () => {
    return selectedSegments.reduce((sum, segment) => sum + (segment.count || 0), 0);
  };

  return (
    <div className={`${styles.customerSegmentFilter} ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        className={`${styles.trigger} ${isOpen ? styles.active : ''} ${isLoading ? styles.loading : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <div className={styles.triggerContent}>
          <div className={styles.triggerIcon}>
            {isLoading ? (
              <div className={styles.spinner} />
            ) : (
              <span>🎯</span>
            )}
          </div>
          <div className={styles.triggerText}>
            <span className={styles.triggerLabel}>Customer Segments</span>
            <span className={styles.triggerValue}>
              {getSelectedCount() === 0 
                ? 'All Segments' 
                : `${getSelectedCount()} Selected`
              }
            </span>
          </div>
          <div className={styles.triggerArrow}>
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 12 12" 
              fill="none"
              className={isOpen ? styles.rotated : ''}
            >
              <path 
                d="M3 4.5L6 7.5L9 4.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {getSelectedCount() > 0 && (
          <div className={styles.selectedBadge}>
            {getSelectedCount()}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {/* Header */}
          <div className={styles.dropdownHeader}>
            <div className={styles.headerTitle}>
              <span className={styles.headerIcon}>🎯</span>
              <span>Customer Segmentation</span>
            </div>
            <div className={styles.headerStats}>
              <span className={styles.statItem}>
                <span className={styles.statValue}>{getTotalCustomers().toLocaleString()}</span>
                <span className={styles.statLabel}>Total Customers</span>
              </span>
              {getSelectedCount() > 0 && (
                <span className={styles.statItem}>
                  <span className={styles.statValue}>{getSelectedCustomers().toLocaleString()}</span>
                  <span className={styles.statLabel}>Selected</span>
                </span>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <div className={styles.searchIcon}>🔍</div>
            <input
              type="text"
              placeholder="Search segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button
                className={styles.searchClear}
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className={styles.categoryTabs}>
            {Object.entries(segmentCategories).map(([key, category]) => (
              <button
                key={key}
                className={`${styles.categoryTab} ${activeCategory === key ? styles.active : ''}`}
                onClick={() => setActiveCategory(key)}
                style={{ '--category-color': category.color }}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
                {key !== 'all' && (
                  <span className={styles.categoryCount}>
                    {segments[key]?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.actionButton}
              onClick={handleSelectAll}
              disabled={getFilteredSegments().length === 0}
            >
              <span>✓</span>
              Select All
            </button>
            <button
              className={styles.actionButton}
              onClick={handleClearAll}
              disabled={getSelectedCount() === 0}
            >
              <span>✕</span>
              Clear All
            </button>
          </div>

          {/* Segments List */}
          <div className={styles.segmentsList}>
            {getFilteredSegments().length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyText}>
                  {searchTerm ? 'No segments match your search' : 'No segments available'}
                </div>
              </div>
            ) : (
              getFilteredSegments().map((segment) => {
                const isSelected = selectedSegments.some(s => s.id === segment.id);
                return (
                  <div
                    key={segment.id}
                    className={`${styles.segmentItem} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleSegmentToggle(segment)}
                  >
                    <div className={styles.segmentCheckbox}>
                      <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                        {isSelected && <span className={styles.checkmark}>✓</span>}
                      </div>
                    </div>
                    
                    <div className={styles.segmentContent}>
                      <div className={styles.segmentHeader}>
                        <span className={styles.segmentLabel}>{segment.label}</span>
                        {segment.count > 0 && (
                          <span className={styles.segmentCount}>
                            {segment.count.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className={styles.segmentDescription}>
                        {segment.description}
                      </div>
                    </div>

                    {segment.color && (
                      <div 
                        className={styles.segmentColorIndicator}
                        style={{ backgroundColor: segment.color }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={styles.dropdownFooter}>
            <div className={styles.footerText}>
              {getSelectedCount() === 0 
                ? 'Select segments to filter your analysis'
                : `${getSelectedCount()} segment${getSelectedCount() !== 1 ? 's' : ''} selected`
              }
            </div>
            <button
              className={styles.applyButton}
              onClick={() => setIsOpen(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSegmentFilter;