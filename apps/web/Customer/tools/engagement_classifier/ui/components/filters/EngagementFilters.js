import React, { useState, useEffect } from "react";
import ErrorBoundary from "../ErrorBoundary";

const EngagementFilters = ({ onFiltersChange, currentFilters = {} }) => {
  const [filters, setFilters] = useState({
    dateRange: currentFilters.dateRange || 'all',
    customStartDate: currentFilters.startDate || '',
    customEndDate: currentFilters.endDate || '',
    engagementLevels: currentFilters.engagementLevels || [],
    loyaltyStatus: currentFilters.loyaltyStatus || [],
    rfmScoreMin: currentFilters.rfmScoreMin || 0,
    rfmScoreMax: currentFilters.rfmScoreMax || 10,
    minTransactions: currentFilters.minTransactions || '',
    minLTVAmount: currentFilters.minLTVAmount || '',
    showActiveFiltersOnly: false
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [aiAssistant, setAiAssistant] = useState({
    visible: false,
    filterType: '',
    explanation: ''
  });

  // Predefined date ranges - based on actual database data (2018-2021)
  const dateRanges = [
    { value: 'all', label: 'All Time (2018-2021)' },
    { value: '2021', label: '2021' },
    { value: '2020', label: '2020' },
    { value: '2019', label: '2019' },
    { value: '2018', label: '2018' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const engagementLevels = [
    { value: 'High', label: 'High Engagement', color: '#00e0ff' },
    { value: 'Medium', label: 'Medium Engagement', color: '#5fd4d6' },
    { value: 'Low', label: 'Low Engagement', color: '#e930ff' }
  ];

  const loyaltyStatuses = [
    { value: 'Active', label: 'Active' },
    { value: 'Active, Loyal', label: 'Active, Loyal' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Active, New', label: 'Active, New' },
    { value: 'Prospect', label: 'Prospect' },
    { value: 'Lost', label: 'Lost' }
  ];

  // Convert filters to API format
  const convertFiltersToAPI = (filterState) => {
    const apiFilters = {};

    // Date range conversion
    if (filterState.dateRange === 'custom' && filterState.customStartDate && filterState.customEndDate) {
      apiFilters.startDate = filterState.customStartDate;
      apiFilters.endDate = filterState.customEndDate;
    } else if (filterState.dateRange !== 'all') {
      // Handle year-based filters (2018-2021)
      const year = filterState.dateRange;
      if (['2018', '2019', '2020', '2021'].includes(year)) {
        apiFilters.startDate = `${year}-01-01`;
        apiFilters.endDate = `${year}-12-31`;
      }
    }

    // Other filters
    if (filterState.engagementLevels.length > 0) {
      apiFilters.engagementLevels = filterState.engagementLevels;
    }
    if (filterState.loyaltyStatus.length > 0) {
      apiFilters.loyaltyStatus = filterState.loyaltyStatus;
    }
    if (filterState.minTransactions) {
      apiFilters.minTransactions = parseInt(filterState.minTransactions);
    }
    if (filterState.minLTVAmount) {
      apiFilters.minLTVAmount = parseFloat(filterState.minLTVAmount);
    }
    if (filterState.rfmScoreMin > 0 || filterState.rfmScoreMax < 10) {
      apiFilters.rfmScoreMin = filterState.rfmScoreMin;
      apiFilters.rfmScoreMax = filterState.rfmScoreMax;
    }

    return apiFilters;
  };

  // Update filters and notify parent
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    const apiFilters = convertFiltersToAPI(newFilters);
    console.log('🔍 Filter Update:', {
      newFilters: newFilters,
      apiFilters: apiFilters,
      engagementLevels: apiFilters.engagementLevels
    });
    onFiltersChange(apiFilters);
  };

  // Generate AI explanation for filters
  const generateAIExplanation = (filterType) => {
    let explanation = '';
    
    switch (filterType) {
      case 'dateRange':
        explanation = 'Date Range Filter\n\n' +
          'This filter allows you to analyze customer engagement within specific time periods.\n\n' +
          'Use cases:\n' +
          '• Compare seasonal engagement patterns\n' +
          '• Measure campaign effectiveness\n' +
          '• Track year-over-year growth\n\n' +
          'Tip: Use custom date ranges to align with specific marketing campaigns.';
        break;
      case 'engagementLevels':
        explanation = 'Customer Segments Filter\n\n' +
          'This filter lets you focus on specific engagement segments:\n' +
          '• High: Customers active within 30 days\n' +
          '• Medium: Customers active within 31-90 days\n' +
          '• Low: Customers inactive for 90+ days\n\n' +
          'Use cases:\n' +
          '• Target specific segments with tailored campaigns\n' +
          '• Analyze conversion rates between segments\n' +
          '• Identify at-risk customers';
        break;
      case 'loyaltyStatus':
        explanation = 'Loyalty Status Filter\n\n' +
          'This filter segments customers by their loyalty classification:\n' +
          '• Active: Recently engaged customers\n' +
          '• Active, Loyal: Repeat customers with consistent engagement\n' +
          '• Active, New: First-time or recently acquired customers\n' +
          '• Inactive: Previously active but currently disengaged\n' +
          '• Prospect: Potential customers who haven\'t converted\n' +
          '• Lost: Previously active customers with no recent activity\n\n' +
          'Use this to create targeted retention or win-back campaigns.';
        break;
      case 'rfmScore':
        explanation = 'RFM Score Filter\n\n' +
          'RFM (Recency, Frequency, Monetary) scoring is a customer segmentation technique:\n' +
          '• 0-3: Low-value customers\n' +
          '• 4-6: Medium-value customers\n' +
          '• 7-10: High-value customers\n\n' +
          'Use this filter to identify your most valuable customers or find those with growth potential.';
        break;
      case 'transactions':
        explanation = 'Minimum Transactions Filter\n\n' +
          'This filter shows only customers who have completed at least the specified number of transactions.\n\n' +
          'Use cases:\n' +
          '• Identify repeat customers\n' +
          '• Analyze high-frequency shoppers\n' +
          '• Create loyalty programs for customers above transaction thresholds';
        break;
      case 'customerValue':
        explanation = 'Minimum Customer Value Filter\n\n' +
          'This filter shows only customers with a lifetime value (LTV) above the specified amount.\n\n' +
          'Use cases:\n' +
          '• Focus on high-value customers\n' +
          '• Create VIP segments for premium offerings\n' +
          '• Analyze purchasing patterns of top spenders';
        break;
      default:
        explanation = 'Advanced Filters\n\n' +
          'These filters help you segment your customer base for targeted analysis and marketing campaigns.\n\n' +
          'Click on specific filter sections for more detailed information and use cases.';
    }
    
    return explanation;
  };

  // Show AI assistant for a specific filter
  const showAiAssistant = (filterType, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setAiAssistant({
      visible: true,
      filterType,
      explanation: generateAIExplanation(filterType)
    });
  };

  // Handle individual filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    updateFilters(newFilters);
  };

  const handleArrayFilterToggle = (key, value) => {
    const currentArray = filters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      engagementLevels: [],
      loyaltyStatus: [],
      rfmScoreMin: 0,
      rfmScoreMax: 10,
      minTransactions: '',
      minLTVAmount: '',
      showActiveFiltersOnly: false
    };
    updateFilters(clearedFilters);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.engagementLevels.length > 0) count++;
    if (filters.loyaltyStatus.length > 0) count++;
    if (filters.minTransactions) count++;
    if (filters.minLTVAmount) count++;
    if (filters.rfmScoreMin > 0 || filters.rfmScoreMax < 10) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="pyramid-glass-bg" style={{
      marginBottom: "24px",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* AI Assistant Box */}
      {aiAssistant.visible && (
        <ErrorBoundary>
          {/* This div is rendered at the document level */}
          <div 
            id="filter-assistant-portal"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              pointerEvents: 'none' // Let clicks pass through the container
            }}
          >
            {/* The actual assistant popup */}
            <div 
              style={{
                width: '320px',
                backgroundColor: '#0a1224',
                border: '1px solid #3a4459',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                maxHeight: '240px',
                overflow: 'auto',
                pointerEvents: 'auto' // Make this element clickable
              }}
              onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching backdrop
            >
              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAiAssistant(prev => ({ ...prev, visible: false }));
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#f7f9fb',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  borderRadius: '4px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '1'}
                onMouseLeave={(e) => e.target.style.opacity = '0.7'}
              >
                ✕
              </button>

              {/* AI Assistant Content */}
              <div style={{
                fontSize: '12px',
                lineHeight: '1.4',
                color: '#f7f9fb',
                whiteSpace: 'pre-line',
                paddingRight: '18px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#00e0ff'
                }}>
                  🤖 AI Assistant
                </div>
                {aiAssistant.explanation}
              </div>
            </div>
          </div>
          
          {/* Semi-transparent backdrop */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setAiAssistant(prev => ({ ...prev, visible: false }));
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9998
            }}
          />
        </ErrorBoundary>
      )}
      
      {/* Filter Header */}
      <div 
        style={{
          padding: "16px 24px",
          borderBottom: isExpanded ? "1px solid #3a4459" : "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{
            color: "#00e0ff",
            margin: 0,
            fontSize: "18px",
            fontWeight: "600"
          }}>
            🔍 Advanced Filters
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              backgroundColor: "#e930ff",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: "600"
            }}>
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div style={{
          color: "#5891cb",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <button
            onClick={(e) => showAiAssistant('general', e)}
            style={{
              background: "none",
              border: "1px solid #00e0ff",
              color: "#00e0ff",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>🤖</span> Help
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              style={{
                background: "none",
                border: "1px solid #5891cb",
                color: "#5891cb",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Clear All
            </button>
          )}
          <span>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div style={{ padding: "24px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            
            {/* Date Range Filter */}
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <label style={{
                  display: "block",
                  color: "#f7f9fb",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  📅 Date Range
                </label>
                <button
                  onClick={(e) => showAiAssistant('dateRange', e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00e0ff",
                    padding: "2px",
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                  🤖
                </button>
              </div>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "#1a1f2e",
                  border: "1px solid #3a4459",
                  borderRadius: "6px",
                  color: "#f7f9fb",
                  fontSize: "14px"
                }}
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              
              {filters.dateRange === 'custom' && (
                <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                  <input
                    type="date"
                    min="2018-01-01"
                    max="2021-12-31"
                    value={filters.customStartDate}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: "#1a1f2e",
                      border: "1px solid #3a4459",
                      borderRadius: "4px",
                      color: "#f7f9fb",
                      fontSize: "12px"
                    }}
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    min="2018-01-01"
                    max="2021-12-31"
                    value={filters.customEndDate}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      backgroundColor: "#1a1f2e",
                      border: "1px solid #3a4459",
                      borderRadius: "4px",
                      color: "#f7f9fb",
                      fontSize: "12px"
                    }}
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>

            {/* Engagement Levels Filter */}
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <label style={{
                  display: "block",
                  color: "#f7f9fb",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  🎯 Customer Segments
                </label>
                <button
                  onClick={(e) => showAiAssistant('engagementLevels', e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00e0ff",
                    padding: "2px",
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                  🤖
                </button>
              </div>
              <select
                value={filters.engagementLevels.length > 0 ? filters.engagementLevels[0] : 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    handleFilterChange('engagementLevels', []);
                  } else {
                    handleFilterChange('engagementLevels', [value]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "#1a1f2e",
                  border: "1px solid #3a4459",
                  borderRadius: "6px",
                  color: "#f7f9fb",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Engagement Levels</option>
                {engagementLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>



            {/* Loyalty Status Filter */}
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <label style={{
                  display: "block",
                  color: "#f7f9fb",
                  fontSize: "14px",
                  fontWeight: "500"
                }}>
                  🏷️ Loyalty Status
                </label>
                <button
                  onClick={(e) => showAiAssistant('loyaltyStatus', e)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#00e0ff",
                    padding: "2px",
                    fontSize: "14px",
                    cursor: "pointer",
                    opacity: 0.7
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                >
                  🤖
                </button>
              </div>
              <select
                value={filters.loyaltyStatus.length > 0 ? filters.loyaltyStatus[0] : 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    handleFilterChange('loyaltyStatus', []);
                  } else {
                    handleFilterChange('loyaltyStatus', [value]);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  backgroundColor: "#1a1f2e",
                  border: "1px solid #3a4459",
                  borderRadius: "6px",
                  color: "#f7f9fb",
                  fontSize: "14px"
                }}
              >
                <option value="all">All Loyalty Statuses</option>
                {loyaltyStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Metrics Column - RFM, Min Transactions, Min Customer Value */}
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* RFM Score Range */}
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <label style={{
                      display: "block",
                      color: "#f7f9fb",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      📊 RFM Score Range: {filters.rfmScoreMin} - {filters.rfmScoreMax}
                    </label>
                    <button
                      onClick={(e) => showAiAssistant('rfmScore', e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00e0ff",
                        padding: "2px",
                        fontSize: "14px",
                        cursor: "pointer",
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                      🤖
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.rfmScoreMin}
                      onChange={(e) => handleFilterChange('rfmScoreMin', parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#00e0ff" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={filters.rfmScoreMax}
                      onChange={(e) => handleFilterChange('rfmScoreMax', parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#00e0ff" }}
                    />
                  </div>
                </div>

                {/* Minimum Transactions */}
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <label style={{
                      display: "block",
                      color: "#f7f9fb",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      🛒 Min Transactions
                    </label>
                    <button
                      onClick={(e) => showAiAssistant('transactions', e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00e0ff",
                        padding: "2px",
                        fontSize: "14px",
                        cursor: "pointer",
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                      🤖
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g., 5"
                    value={filters.minTransactions}
                    onChange={(e) => handleFilterChange('minTransactions', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "#1a1f2e",
                      border: "1px solid #3a4459",
                      borderRadius: "6px",
                      color: "#f7f9fb",
                      fontSize: "14px"
                    }}
                  />
                </div>

                {/* Minimum LTV Amount */}
                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <label style={{
                      display: "block",
                      color: "#f7f9fb",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}>
                      💰 Min Customer Value ($)
                    </label>
                    <button
                      onClick={(e) => showAiAssistant('customerValue', e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#00e0ff",
                        padding: "2px",
                        fontSize: "14px",
                        cursor: "pointer",
                        opacity: 0.7
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '1'}
                      onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                    >
                      🤖
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g., 1000"
                    value={filters.minLTVAmount}
                    onChange={(e) => handleFilterChange('minLTVAmount', e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "#1a1f2e",
                      border: "1px solid #3a4459",
                      borderRadius: "6px",
                      color: "#f7f9fb",
                      fontSize: "14px"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .pyramid-glass-bg {
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(18px) saturate(160%);
          background:
            radial-gradient(1200px 500px at 0% 0%, rgba(0, 224, 255, 0.24), rgba(0, 224, 255, 0) 60%),
            radial-gradient(1200px 500px at 100% 100%, rgba(233, 48, 255, 0.24), rgba(233, 48, 255, 0) 60%),
            linear-gradient(0deg, rgba(95, 212, 214, 0.06), rgba(95, 212, 214, 0.06)),
            linear-gradient(135deg, rgba(10, 15, 30, 0.45), rgba(5, 10, 20, 0.45));
          box-shadow: 0 10px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
};

export default EngagementFilters;