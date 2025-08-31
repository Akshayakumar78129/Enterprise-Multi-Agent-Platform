import React, { useState, useEffect, useRef } from 'react';
import styles from './ProductCategoryFilter.module.css';

const ProductCategoryFilter = ({ 
  selectedCategories = [], 
  onCategoryChange, 
  availableCategories = {},
  isLoading = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('hierarchy');
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

  // View modes
  const viewModes = {
    hierarchy: { label: 'Category Tree', icon: '🌳', description: 'Hierarchical view' },
    performance: { label: 'Performance', icon: '📊', description: 'Sorted by revenue' },
    alphabetical: { label: 'A-Z', icon: '🔤', description: 'Alphabetical order' }
  };

  // Default product categories with business context
  const defaultCategories = {
    // Sports & Recreation
    bikes: {
      id: 'bikes',
      label: 'Bicycles',
      icon: '🚴',
      parent: null,
      level: 0,
      revenue: 2500000,
      units: 15000,
      margin: 0.35,
      growth: 0.12,
      children: ['mountain_bikes', 'road_bikes', 'hybrid_bikes', 'electric_bikes']
    },
    mountain_bikes: {
      id: 'mountain_bikes',
      label: 'Mountain Bikes',
      icon: '🏔️',
      parent: 'bikes',
      level: 1,
      revenue: 1200000,
      units: 6000,
      margin: 0.38,
      growth: 0.15,
      children: []
    },
    road_bikes: {
      id: 'road_bikes',
      label: 'Road Bikes',
      icon: '🛣️',
      parent: 'bikes',
      level: 1,
      revenue: 800000,
      units: 4000,
      margin: 0.32,
      growth: 0.08,
      children: []
    },
    hybrid_bikes: {
      id: 'hybrid_bikes',
      label: 'Hybrid Bikes',
      icon: '🚲',
      parent: 'bikes',
      level: 1,
      revenue: 350000,
      units: 3500,
      margin: 0.30,
      growth: 0.10,
      children: []
    },
    electric_bikes: {
      id: 'electric_bikes',
      label: 'Electric Bikes',
      icon: '⚡',
      parent: 'bikes',
      level: 1,
      revenue: 150000,
      units: 1500,
      margin: 0.45,
      growth: 0.25,
      children: []
    },

    // Accessories
    accessories: {
      id: 'accessories',
      label: 'Accessories',
      icon: '🎒',
      parent: null,
      level: 0,
      revenue: 1800000,
      units: 45000,
      margin: 0.55,
      growth: 0.18,
      children: ['helmets', 'lights', 'locks', 'bags']
    },
    helmets: {
      id: 'helmets',
      label: 'Helmets',
      icon: '🪖',
      parent: 'accessories',
      level: 1,
      revenue: 600000,
      units: 12000,
      margin: 0.50,
      growth: 0.14,
      children: []
    },
    lights: {
      id: 'lights',
      label: 'Lights & Safety',
      icon: '💡',
      parent: 'accessories',
      level: 1,
      revenue: 450000,
      units: 15000,
      margin: 0.60,
      growth: 0.22,
      children: []
    },
    locks: {
      id: 'locks',
      label: 'Locks & Security',
      icon: '🔒',
      parent: 'accessories',
      level: 1,
      revenue: 400000,
      units: 10000,
      margin: 0.55,
      growth: 0.16,
      children: []
    },
    bags: {
      id: 'bags',
      label: 'Bags & Storage',
      icon: '🎒',
      parent: 'accessories',
      level: 1,
      revenue: 350000,
      units: 8000,
      margin: 0.58,
      growth: 0.20,
      children: []
    },

    // Components
    components: {
      id: 'components',
      label: 'Components',
      icon: '⚙️',
      parent: null,
      level: 0,
      revenue: 1200000,
      units: 25000,
      margin: 0.42,
      growth: 0.08,
      children: ['wheels', 'drivetrain', 'brakes', 'suspension']
    },
    wheels: {
      id: 'wheels',
      label: 'Wheels & Tires',
      icon: '🛞',
      parent: 'components',
      level: 1,
      revenue: 500000,
      units: 8000,
      margin: 0.40,
      growth: 0.06,
      children: []
    },
    drivetrain: {
      id: 'drivetrain',
      label: 'Drivetrain',
      icon: '🔗',
      parent: 'components',
      level: 1,
      revenue: 400000,
      units: 6000,
      margin: 0.45,
      growth: 0.10,
      children: []
    },
    brakes: {
      id: 'brakes',
      label: 'Brakes',
      icon: '🛑',
      parent: 'components',
      level: 1,
      revenue: 200000,
      units: 7000,
      margin: 0.38,
      growth: 0.05,
      children: []
    },
    suspension: {
      id: 'suspension',
      label: 'Suspension',
      icon: '🔧',
      parent: 'components',
      level: 1,
      revenue: 100000,
      units: 4000,
      margin: 0.48,
      growth: 0.12,
      children: []
    },

    // Apparel
    apparel: {
      id: 'apparel',
      label: 'Apparel',
      icon: '👕',
      parent: null,
      level: 0,
      revenue: 900000,
      units: 30000,
      margin: 0.65,
      growth: 0.15,
      children: ['jerseys', 'shorts', 'shoes', 'gloves']
    },
    jerseys: {
      id: 'jerseys',
      label: 'Jerseys',
      icon: '👔',
      parent: 'apparel',
      level: 1,
      revenue: 400000,
      units: 12000,
      margin: 0.70,
      growth: 0.18,
      children: []
    },
    shorts: {
      id: 'shorts',
      label: 'Shorts & Pants',
      icon: '🩳',
      parent: 'apparel',
      level: 1,
      revenue: 250000,
      units: 8000,
      margin: 0.65,
      growth: 0.12,
      children: []
    },
    shoes: {
      id: 'shoes',
      label: 'Cycling Shoes',
      icon: '👟',
      parent: 'apparel',
      level: 1,
      revenue: 200000,
      units: 6000,
      margin: 0.60,
      growth: 0.14,
      children: []
    },
    gloves: {
      id: 'gloves',
      label: 'Gloves',
      icon: '🧤',
      parent: 'apparel',
      level: 1,
      revenue: 50000,
      units: 4000,
      margin: 0.68,
      growth: 0.16,
      children: []
    }
  };

  // Merge available categories with defaults
  const categories = { ...defaultCategories, ...availableCategories };

  // Get categories based on current view
  const getFilteredCategories = () => {
    let categoryList = Object.values(categories);

    // Apply search filter
    if (searchTerm) {
      categoryList = categoryList.filter(category =>
        category.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply view-specific sorting
    switch (activeView) {
      case 'hierarchy':
        return categoryList.sort((a, b) => {
          if (a.level !== b.level) return a.level - b.level;
          return a.label.localeCompare(b.label);
        });
      case 'performance':
        return categoryList.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
      case 'alphabetical':
        return categoryList.sort((a, b) => a.label.localeCompare(b.label));
      default:
        return categoryList;
    }
  };

  const handleCategoryToggle = (category) => {
    const isSelected = selectedCategories.some(c => c.id === category.id);
    let newSelection;

    if (isSelected) {
      newSelection = selectedCategories.filter(c => c.id !== category.id);
    } else {
      newSelection = [...selectedCategories, category];
    }

    onCategoryChange(newSelection);
  };

  const handleSelectParentAndChildren = (category) => {
    const relatedCategories = [];
    
    // Add the category itself
    relatedCategories.push(category);
    
    // Add all children
    if (category.children && category.children.length > 0) {
      category.children.forEach(childId => {
        const childCategory = categories[childId];
        if (childCategory) {
          relatedCategories.push(childCategory);
        }
      });
    }
    
    // Add parent if this is a child category
    if (category.parent) {
      const parentCategory = categories[category.parent];
      if (parentCategory) {
        relatedCategories.push(parentCategory);
      }
    }

    const newSelection = [...selectedCategories];
    relatedCategories.forEach(cat => {
      if (!newSelection.some(s => s.id === cat.id)) {
        newSelection.push(cat);
      }
    });

    onCategoryChange(newSelection);
  };

  const handleClearAll = () => {
    onCategoryChange([]);
  };

  const getSelectedCount = () => selectedCategories.length;
  const getTotalRevenue = () => {
    return Object.values(categories).reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  };

  const getSelectedRevenue = () => {
    return selectedCategories.reduce((sum, cat) => sum + (cat.revenue || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={`${styles.productCategoryFilter} ${className}`}>
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
              <span>📦</span>
            )}
          </div>
          <div className={styles.triggerText}>
            <span className={styles.triggerLabel}>Product Categories</span>
            <span className={styles.triggerValue}>
              {getSelectedCount() === 0 
                ? 'All Categories' 
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
              <span className={styles.headerIcon}>📦</span>
              <span>Product Categories</span>
            </div>
            <div className={styles.headerStats}>
              <span className={styles.statItem}>
                <span className={styles.statValue}>{formatCurrency(getTotalRevenue())}</span>
                <span className={styles.statLabel}>Total Revenue</span>
              </span>
              {getSelectedCount() > 0 && (
                <span className={styles.statItem}>
                  <span className={styles.statValue}>{formatCurrency(getSelectedRevenue())}</span>
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
              placeholder="Search categories..."
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

          {/* View Mode Tabs */}
          <div className={styles.viewTabs}>
            {Object.entries(viewModes).map(([key, mode]) => (
              <button
                key={key}
                className={`${styles.viewTab} ${activeView === key ? styles.active : ''}`}
                onClick={() => setActiveView(key)}
                title={mode.description}
              >
                <span className={styles.viewIcon}>{mode.icon}</span>
                <span className={styles.viewLabel}>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={styles.actionButton}
              onClick={handleClearAll}
              disabled={getSelectedCount() === 0}
            >
              <span>✕</span>
              Clear All
            </button>
          </div>

          {/* Categories List */}
          <div className={styles.categoriesList}>
            {getFilteredCategories().length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📦</div>
                <div className={styles.emptyText}>
                  {searchTerm ? 'No categories match your search' : 'No categories available'}
                </div>
              </div>
            ) : (
              getFilteredCategories().map((category) => {
                const isSelected = selectedCategories.some(c => c.id === category.id);
                return (
                  <div
                    key={category.id}
                    className={`${styles.categoryItem} ${isSelected ? styles.selected : ''} ${styles[`level${category.level}`]}`}
                  >
                    <div className={styles.categoryMain} onClick={() => handleCategoryToggle(category)}>
                      <div className={styles.categoryCheckbox}>
                        <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
                          {isSelected && <span className={styles.checkmark}>✓</span>}
                        </div>
                      </div>
                      
                      <div className={styles.categoryIcon}>
                        {category.icon}
                      </div>
                      
                      <div className={styles.categoryContent}>
                        <div className={styles.categoryHeader}>
                          <span className={styles.categoryLabel}>{category.label}</span>
                          <div className={styles.categoryMetrics}>
                            <span className={styles.categoryRevenue}>
                              {formatCurrency(category.revenue || 0)}
                            </span>
                            <span className={styles.categoryGrowth} 
                                  style={{ color: (category.growth || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                              {(category.growth || 0) >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(category.growth || 0))}
                            </span>
                          </div>
                        </div>
                        <div className={styles.categoryDetails}>
                          <span className={styles.categoryUnits}>
                            {(category.units || 0).toLocaleString()} units
                          </span>
                          <span className={styles.categoryMargin}>
                            {formatPercentage(category.margin || 0)} margin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {(category.children?.length > 0 || category.parent) && (
                      <div className={styles.categoryActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleSelectParentAndChildren(category)}
                          title="Select related categories"
                        >
                          <span>🔗</span>
                        </button>
                      </div>
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
                ? 'Select categories to filter your analysis'
                : `${getSelectedCount()} categor${getSelectedCount() !== 1 ? 'ies' : 'y'} selected`
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

export default ProductCategoryFilter;