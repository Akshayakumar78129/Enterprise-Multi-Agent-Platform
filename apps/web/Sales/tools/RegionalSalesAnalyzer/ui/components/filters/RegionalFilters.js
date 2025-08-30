import React, { useState, useEffect } from "react";
import styles from "../../styles/RegionalSalesAnalyzerDashboard.module.css";

const RegionalFilters = ({ onFiltersChange, currentFilters = {}, data = {} }) => {
  const [filters, setFilters] = useState({
    dateRange: currentFilters.dateRange || { start: '2017-01-01', end: '2021-12-31' },
    country: currentFilters.country || '',
    state: currentFilters.state || '',
    aggregation: currentFilters.aggregation || 'month'
  });

  const [isExpanded, setIsExpanded] = useState(true); // Start expanded
  const [hasChanges, setHasChanges] = useState(false);

  // Track if filters have been modified
  useEffect(() => {
    const filtersChanged = 
      filters.dateRange.start !== currentFilters.dateRange?.start ||
      filters.dateRange.end !== currentFilters.dateRange?.end ||
      filters.country !== (currentFilters.country || '') ||
      filters.state !== (currentFilters.state || '') ||
      filters.aggregation !== (currentFilters.aggregation || 'month');
    
    setHasChanges(filtersChanged);
  }, [filters, currentFilters]);

  const aggregationOptions = [
    { value: 'day', label: 'Daily', icon: '📅' },
    { value: 'week', label: 'Weekly', icon: '📆' },
    { value: 'month', label: 'Monthly', icon: '🗓️' },
    { value: 'quarter', label: 'Quarterly', icon: '📊' }
  ];

  // Get unique countries from data
  const getCountries = () => {
    if (!data?.availableRegions) return [];
    const countries = [...new Set(data.availableRegions.map(r => r.country))].filter(Boolean);
    return countries.sort();
  };

  // Get states for selected country
  const getStates = () => {
    if (!data?.availableRegions) return [];
    let states = data.availableRegions;
    
    if (filters.country) {
      states = states.filter(r => r.country === filters.country);
    }
    
    const uniqueStates = [...new Set(states.map(r => r.state))].filter(Boolean);
    return uniqueStates.sort();
  };

  // Handle filter changes (update local state only)
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // If country changes, reset state
    if (key === 'country' && value !== filters.country) {
      newFilters.state = '';
    }
    
    setFilters(newFilters);
  };
  
  // Apply filters when button is clicked
  const applyFilters = () => {
    console.log('🚀 Applying filters:', filters);
    onFiltersChange(filters);
    setHasChanges(false);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      dateRange: { start: '2017-01-01', end: '2021-12-31' },
      country: '',
      state: '',
      aggregation: 'month'
    };
    setFilters(clearedFilters);
    // Immediately apply cleared filters
    onFiltersChange(clearedFilters);
    setHasChanges(false);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    const defaultStart = '2017-01-01';
    const defaultEnd = '2021-12-31';
    
    if (filters.dateRange.start !== defaultStart || filters.dateRange.end !== defaultEnd) count++;
    if (filters.country) count++;
    if (filters.state) count++;
    if (filters.aggregation !== 'month') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={styles.glassBackground} style={{
      marginBottom: "24px",
      overflow: "hidden",
      position: "relative",
      minHeight: "auto",
      animation: `${styles.fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 150ms both`
    }}>
      
      {/* Filter Header */}
      <div 
        style={{
          padding: "20px 24px",
          borderBottom: isExpanded ? "1px solid rgba(148, 163, 184, 0.1)" : "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "all 0.3s ease"
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            🔍 Regional Filters
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              color: "#0f172a",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              animation: `${styles.pulse} 2s ease-in-out infinite`
            }}>
              {activeFilterCount} active
            </span>
          )}
          {hasChanges && (
            <span style={{
              background: "rgba(16, 185, 129, 0.2)",
              color: "#10b981",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              Unsaved changes
            </span>
          )}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              style={{
                background: "rgba(148, 163, 184, 0.1)",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                color: "#94a3b8",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              🗑️ Clear All
            </button>
          )}
          <span style={{
            color: "#fbbf24",
            transition: "transform 0.3s ease",
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
            fontSize: '16px'
          }}>▼</span>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div style={{ 
          padding: "24px",
          animation: `${styles.fadeIn} 0.3s ease`
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            
            {/* Date Range Filter */}
            <div style={{ gridColumn: "span 2" }}>
              <label style={{
                display: "block",
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                📅 Date Range
              </label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  type="date"
                  min="2017-01-01"
                  max="2021-12-31"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(251, 191, 36, 0.4)";
                    e.target.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    e.target.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
                  }}
                />
                <span style={{ color: "#94a3b8", fontSize: "14px" }}>to</span>
                <input
                  type="date"
                  min="2017-01-01"
                  max="2021-12-31"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "13px",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.3s ease"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(251, 191, 36, 0.4)";
                    e.target.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                    e.target.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
                  }}
                />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label style={{
                display: "block",
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                🌍 Country
              </label>
              <select
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  backdropFilter: "blur(10px)",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(251, 191, 36, 0.4)";
                  e.target.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  e.target.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
                }}
              >
                <option value="">All Countries</option>
                {getCountries().map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label style={{
                display: "block",
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                📍 State/Province
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                disabled={!filters.country && getStates().length === 0}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "13px",
                  backdropFilter: "blur(10px)",
                  cursor: filters.country || getStates().length > 0 ? "pointer" : "not-allowed",
                  opacity: filters.country || getStates().length > 0 ? 1 : 0.5,
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  if (filters.country || getStates().length > 0) {
                    e.target.style.borderColor = "rgba(251, 191, 36, 0.4)";
                    e.target.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  e.target.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
                }}
              >
                <option value="">
                  {filters.country ? "All States" : "Select Country First"}
                </option>
                {getStates().map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Time Aggregation */}
            <div>
              <label style={{
                display: "block",
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "10px"
              }}>
                📈 Time Aggregation
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {aggregationOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('aggregation', option.value)}
                    style={{
                      flex: "1 1 auto",
                      minWidth: "80px",
                      padding: "8px 12px",
                      background: filters.aggregation === option.value
                        ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                        : "rgba(30, 41, 59, 0.6)",
                      color: filters.aggregation === option.value ? "#0f172a" : "#f8fafc",
                      border: `1px solid ${filters.aggregation === option.value ? "rgba(251, 191, 36, 0.5)" : "rgba(148, 163, 184, 0.2)"}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: filters.aggregation === option.value ? "600" : "400",
                      transition: "all 0.3s ease",
                      backdropFilter: "blur(10px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px"
                    }}
                    onMouseEnter={(e) => {
                      if (filters.aggregation !== option.value) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filters.aggregation !== option.value) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.6)";
                      }
                    }}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Filters Button */}
            <div style={{
              display: "flex",
              alignItems: "flex-end",
              gridColumn: "span 1"
            }}>
              <button
                onClick={applyFilters}
                disabled={!hasChanges}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  background: hasChanges 
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "rgba(148, 163, 184, 0.2)",
                  border: "none",
                  borderRadius: "8px",
                  color: hasChanges ? "#ffffff" : "#64748b",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: hasChanges ? "pointer" : "not-allowed",
                  transition: "all 0.3s ease",
                  boxShadow: hasChanges ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                  opacity: hasChanges ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  if (hasChanges) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasChanges) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                  }
                }}
              >
                {hasChanges ? "✅ Apply Filters" : "No Changes"}
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          {activeFilterCount > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "12px",
              background: "rgba(30, 41, 59, 0.3)",
              borderRadius: "8px",
              border: "1px solid rgba(148, 163, 184, 0.1)",
              fontSize: "12px",
              color: "#94a3b8"
            }}>
              <strong style={{ color: "#f8fafc" }}>Active Filters:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                {(filters.dateRange.start !== '2017-01-01' || filters.dateRange.end !== '2021-12-31') && (
                  <span style={{
                    padding: "4px 8px",
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid rgba(251, 191, 36, 0.3)",
                    borderRadius: "12px",
                    color: "#fbbf24"
                  }}>
                    📅 {filters.dateRange.start} to {filters.dateRange.end}
                  </span>
                )}
                {filters.country && (
                  <span style={{
                    padding: "4px 8px",
                    background: "rgba(0, 224, 255, 0.1)",
                    border: "1px solid rgba(0, 224, 255, 0.3)",
                    borderRadius: "12px",
                    color: "#00e0ff"
                  }}>
                    🌍 {filters.country}
                  </span>
                )}
                {filters.state && (
                  <span style={{
                    padding: "4px 8px",
                    background: "rgba(233, 48, 255, 0.1)",
                    border: "1px solid rgba(233, 48, 255, 0.3)",
                    borderRadius: "12px",
                    color: "#e930ff"
                  }}>
                    📍 {filters.state}
                  </span>
                )}
                {filters.aggregation !== 'month' && (
                  <span style={{
                    padding: "4px 8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "12px",
                    color: "#10b981"
                  }}>
                    📈 {aggregationOptions.find(a => a.value === filters.aggregation)?.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegionalFilters;