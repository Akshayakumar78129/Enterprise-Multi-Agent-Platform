import React, { useState, useEffect } from 'react';
import FloatingAIChat from '../components/chat/FloatingAIChat';
import { formatCurrency, formatNumber, formatTurnoverRatio, formatPercentage } from '../utils/formatters';

// Import visualization components
import TurnoverAnalysisMatrix from '../components/visualizations/TurnoverAnalysisMatrix';
import AgingAnalysisPanel from '../components/visualizations/AgingAnalysisPanel';
import FinancialImpactAnalyzer from '../components/visualizations/FinancialImpactAnalyzer';
import ItemLevelAnalyzer from '../components/visualizations/ItemLevelAnalyzer';

// Define interfaces
interface KPIMetrics {
  totalSlowMovingItems: number;
  slowMovingValue: number;
  averageTurnoverRatio: number;
  agedInventoryPercent: number;
  carryingCostImpact: number;
}

// Import shared KPI components
import { KPITile } from '../components/kpi/KPITile';
import { KPITilesRow } from '../components/kpi/KPITilesRow';

// Date Range Filter Component
const DateRangeFilter: React.FC<{
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  allTimeMode: boolean;
  onAllTimeToggle: (enabled: boolean) => void;
}> = ({ startDate, endDate, onDateChange, allTimeMode, onAllTimeToggle }) => {
  const [tempStartDate, setTempStartDate] = React.useState(startDate);
  const [tempEndDate, setTempEndDate] = React.useState(endDate);

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
  };

  const handleAllTimeClick = () => {
    onAllTimeToggle(!allTimeMode);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: '#1f2937',
      borderRadius: '8px',
      border: '1px solid #374151',
      marginBottom: '24px',
      justifyContent: 'flex-start'
    }}>
      <input
        type="date"
        value={tempStartDate}
        onChange={(e) => setTempStartDate(e.target.value)}
        disabled={allTimeMode}
        style={{
          padding: '6px 8px',
          fontSize: '13px',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          backgroundColor: allTimeMode ? '#23272e' : '#374151',
          color: 'white',
          cursor: allTimeMode ? 'not-allowed' : 'pointer'
        }}
      />
      <span style={{ color: '#9ca3af', fontSize: '14px' }}>to</span>
      <input
        type="date"
        value={tempEndDate}
        onChange={(e) => setTempEndDate(e.target.value)}
        disabled={allTimeMode}
        style={{
          padding: '6px 8px',
          fontSize: '13px',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          backgroundColor: allTimeMode ? '#23272e' : '#374151',
          color: 'white',
          cursor: allTimeMode ? 'not-allowed' : 'pointer'
        }}
      />
      <button
        onClick={handleApply}
        disabled={allTimeMode}
        style={{
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 500,
          backgroundColor: allTimeMode ? '#374151' : '#00e0ff',
          color: allTimeMode ? '#9ca3af' : '#0a1224',
          border: 'none',
          borderRadius: '4px',
          cursor: allTimeMode ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!allTimeMode) e.currentTarget.style.backgroundColor = '#00c9e6';
        }}
        onMouseLeave={(e) => {
          if (!allTimeMode) e.currentTarget.style.backgroundColor = '#00e0ff';
        }}
      >
        Apply
      </button>
      <button
        onClick={handleAllTimeClick}
        style={{
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: 500,
          background: allTimeMode
            ? 'linear-gradient(90deg, #00e0ff 0%, #00bfff 100%)'
            : 'linear-gradient(90deg, #23272e 0%, #23272e 100%)',
          color: allTimeMode ? '#0a1224' : '#e0e6ed',
          border: allTimeMode ? '2px solid #00e0ff' : '2px solid #3b4252',
          borderRadius: '5px',
          boxShadow: allTimeMode
            ? '0 1px 6px 0 rgba(0,224,255,0.13)'
            : '0 1px 2px 0 rgba(0,0,0,0.08)',
          cursor: 'pointer',
          marginLeft: '8px',
          outline: 'none',
          transition: 'background 0.2s, color 0.2s, border 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = allTimeMode
            ? 'linear-gradient(90deg, #00e0ff 0%, #00bfff 100%)'
            : 'linear-gradient(90deg, #2d3748 0%, #23272e 100%)';
          e.currentTarget.style.color = allTimeMode ? '#0a1224' : '#ffffff';
          e.currentTarget.style.border = '2px solid #00e0ff';
          e.currentTarget.style.boxShadow = '0 2px 16px 0 rgba(0,224,255,0.22)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = allTimeMode
            ? 'linear-gradient(90deg, #00e0ff 0%, #00bfff 100%)'
            : 'linear-gradient(90deg, #23272e 0%, #23272e 100%)';
          e.currentTarget.style.color = allTimeMode ? '#0a1224' : '#e0e6ed';
          e.currentTarget.style.border = allTimeMode ? '2px solid #00e0ff' : '2px solid #3b4252';
          e.currentTarget.style.boxShadow = allTimeMode
            ? '0 2px 12px 0 rgba(0,224,255,0.18)'
            : '0 1px 4px 0 rgba(0,0,0,0.10)';
        }}
        tabIndex={0}
        onFocus={e => {
          e.currentTarget.style.border = '2px solid #00e0ff';
          e.currentTarget.style.boxShadow = '0 0 0 2px #00e0ff55';
        }}
        onBlur={e => {
          e.currentTarget.style.border = allTimeMode ? '2px solid #00e0ff' : '2px solid #3b4252';
          e.currentTarget.style.boxShadow = allTimeMode
            ? '0 2px 12px 0 rgba(0,224,255,0.18)'
            : '0 1px 4px 0 rgba(0,0,0,0.10)';
        }}
      >
        {allTimeMode ? 'Disable All Time' : 'All Time'}
      </button>
    </div>
  );
};

const SlowMovingDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedScenario, setSelectedScenario] = useState('baseline');
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0], // 90 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [allTimeMode, setAllTimeMode] = useState(false);
  const [lastDateRange, setLastDateRange] = useState<{startDate: string, endDate: string} | null>(null);
  const [filters, setFilters] = useState({
    turnoverThreshold: 4.0,
    daysThreshold: 90,
    category: null as string | null,
    warehouseId: null as string | null
  });
  
  // Use real categories from API data if available
  const categories = dashboardData?.filterOptions?.categories?.length > 0 
    ? ['All Categories', ...dashboardData.filterOptions.categories]
    : ['All Categories'];

  // KPI target values state for dynamic updates
  const [kpiTargets, setKpiTargets] = useState({
    'slow-moving-items': '< 300',
    'slow-moving-value': '< $1M',
    'turnover-ratio': '4.0x',
    'aged-inventory': '< 15%',
    'carrying-cost': '< $75K',
  });

  // Handler to update a target value by kpiId
  const handleTargetChange = (kpiId: string) => (newTarget: string) => {
    setKpiTargets(prev => ({ ...prev, [kpiId]: newTarget }));
  };

  // KPI explanations for popup tooltips (now using dynamic targets)
  const kpiExplanations = {
    'slow-moving-items': [
      '• This number shows total items with low sales velocity',
      '• Currently displaying items sold <4 times per year',
      '• Higher numbers indicate inventory management challenges',
      `• Target: Keep below ${kpiTargets['slow-moving-items']} for optimal efficiency`
    ],
    'slow-moving-value': [
      '• Dollar value of all slow-moving inventory combined',
      '• Represents capital tied up in underperforming stock',
      '• Shows financial impact of stagnant inventory',
      `• Target: Keep below ${kpiTargets['slow-moving-value']} to maintain cash flow`
    ],
    'turnover-ratio': [
      '• Average times inventory is sold and replaced annually',
      '• Calculated as: Cost of Goods Sold ÷ Average Inventory',
      '• Higher ratios mean faster-moving products',
      `• Target: ${kpiTargets['turnover-ratio']} or higher for healthy turnover`
    ],
    'aged-inventory': [
      '• Percentage of total inventory sitting for 90+ days',
      '• Calculated as: (Aged Inventory Value ÷ Total Inventory) × 100',
      '• Indicates risk of obsolescence or markdowns',
      `• Target: Keep below ${kpiTargets['aged-inventory']} for optimal freshness`
    ],
    'carrying-cost': [
      '• Monthly cost to store and maintain slow-moving stock',
      '• Includes warehousing, insurance, and opportunity costs',
      '• Calculated as ~2-3% of inventory value per month',
      `• Target: Keep below ${kpiTargets['carrying-cost']} monthly burden`
    ]
  };

  // AI Chat insights based on current dashboard state
  const getCurrentInsights = () => {
    if (!dashboardData) return [];
    
    const { summary, insights } = dashboardData;
    const dateRangeText = `${dateRange.startDate} to ${dateRange.endDate}`;
    const daysDiff = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return [
      `📅 **Analysis Period**: ${dateRangeText} (${daysDiff} days)`,
      `${summary.slowMovingItems} slow-moving items detected (${formatPercentage((summary.slowMovingPercentage || 0) / 100)} of total inventory)`,
      `${formatCurrency(summary.slowMovingValue)} value at risk from slow-moving inventory`,
      `Average turnover ratio: ${formatTurnoverRatio(summary.averageTurnoverRatio || 0)} (target: 4.0x+)`,
      `${formatPercentage((summary.agedInventoryPercent || 0) / 100)} of inventory is aged (90+ days)`,
      `${summary.criticalItems} critical items requiring immediate attention`,
      ...(insights?.map(insight => insight.description) || [])
    ];
  };

  // Dashboard-specific AI function
  const handleDashboardAI = async (message: string): Promise<string> => {
    // Simulate dashboard-specific AI analysis
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const currentData = dashboardData?.summary;
    const kpis = dashboardData?.kpis;
    
    return `
# 📊 Dashboard Analysis for: "${message}"

## Current Context:
- **Active Category**: ${selectedCategory}
- **Slow-Moving Items**: ${currentData?.slowMovingItems || 450} items
- **Total Value at Risk**: ${currentData?.slowMovingValue ? formatCurrency(currentData.slowMovingValue) : '$1.20M'}
- **Average Turnover**: ${currentData?.averageTurnoverRatio || 2.3}x

## Key Insights:
• **Performance Gap**: Current turnover is ${currentData?.averageTurnoverRatio ? formatNumber(4.0 - currentData.averageTurnoverRatio) : '1.70'}x below target
• **Category Focus**: ${selectedCategory !== 'All Categories' ? selectedCategory : 'Electronics'} requires immediate attention
• **Aging Pattern**: ${currentData?.agedInventoryPercent ? formatPercentage(currentData.agedInventoryPercent / 100) : '18.50%'} of inventory is 90+ days old

## Recommendations:
1. **Immediate**: Review ${selectedCategory} pricing strategy
2. **Short-term**: Implement targeted liquidation campaigns  
3. **Long-term**: Adjust reorder points and safety stock levels

*For specialized analysis, try mentioning one of our expert agents like @liquidation_strategist or @cost_optimizer!*
    `.trim();
  };

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const requestFilters: any = {
        ...filters,
        category: selectedCategory !== 'All Categories' ? selectedCategory : null
      };
      // Include explicit dateRange only when the user applied one (stored in lastDateRange)
      if (!allTimeMode && lastDateRange) {
        requestFilters.startDate = lastDateRange.startDate;
        requestFilters.endDate = lastDateRange.endDate;
      }
      
  const response = await fetch("/api/slow-moving-analyzer/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestFilters),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Response error:", errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resultJSON = await response.json();

      
      if (resultJSON.status !== 'success') {
        console.error("❌ API returned error status:", resultJSON);
        throw new Error(resultJSON.error || resultJSON.message || "API request failed");
      }
      
      const result = resultJSON.data;
      // Diagnostic log: show raw API payload so we can trace why UI falls back
      try {
        console.log('SlowMovingDashboard: sample payload preview ->', {
          hasByCategory: !!result.data.byCategory,
          warehousesLen: (result.data.warehouses || []).length,
          slowMovingItemsLen: (result.data.slowMovingItems || []).length
        });
      } catch (e) {}

      setDashboardData(result.data);
    } catch (err) {
      console.error("💥 Error fetching slow-moving inventory data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle KPI tile clicks
  const handleKpiClick = (kpiId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Prevent document click listener from firing
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
    setActivePopup(activePopup === kpiId ? null : kpiId);
  };

  // Sample data fallback for development
  const sampleMetrics: KPIMetrics = {
    totalSlowMovingItems: 450,
    slowMovingValue: 1250000,
    averageTurnoverRatio: 2.3,
    agedInventoryPercent: 18.5,
    carryingCostImpact: 89000
  };

  useEffect(() => {
    // Try to fetch real data
    fetchData();
  }, [selectedCategory, filters, dateRange]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Only close if not clicking on a KPI tile or the popup itself
      if (activePopup && !target.closest('[data-kpi-tile]') && !target.closest('[data-popup]')) {
        setActivePopup(null);
      }
    };

    if (activePopup) {
      // Use a small delay to avoid immediate closure on the same click that opened it
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 10);
      
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activePopup]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1224, #232a36)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #e930ff, #ff6b6b)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            color: '#f7f9fb',
            fontSize: '24px',
            fontWeight: '600',
            margin: '0 0 16px 0'
          }}>
            Database Connection Error
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0 0 24px 0',
            lineHeight: '1.5'
          }}>
            Unable to connect to the inventory database. This could be due to:
          </p>
          <ul style={{
            color: '#94a3b8',
            fontSize: '14px',
            textAlign: 'left',
            lineHeight: '1.6',
            margin: '0 0 24px 0'
          }}>
            <li>Database file not found at: <code style={{ color: '#00e0ff' }}>Inventory/database/inventory.db</code></li>
            <li>Database connection timeout</li>
            <li>Missing required tables or data</li>
          </ul>
          <div style={{
            background: 'rgba(233, 48, 255, 0.1)',
            border: '1px solid rgba(233, 48, 255, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px'
          }}>
            <p style={{
              color: '#e930ff',
              fontSize: '12px',
              margin: 0,
              fontFamily: 'monospace'
            }}>
              Error: {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            🔄 Retry Connection
          </button>
          <button
            onClick={() => fetchData()}
            style={{
              backgroundColor: 'transparent',
              color: '#00e0ff',
              border: '1px solid #00e0ff',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📊 Use Sample Data
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1224, #232a36)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(0, 224, 255, 0.3)',
            borderTop: '3px solid #00e0ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div style={{
            color: '#f7f9fb',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            Loading Inventory Intelligence...
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1224, #232a36)',
      padding: '24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Dashboard Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center',
        maxWidth: '1440px',
        margin: '0 auto 32px'
      }}>
        <h1 style={{
          color: '#00e0ff',
          fontSize: '34px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          textShadow: '0 2px 4px rgba(0,0,0,0.25)'
        }}>
          Slow Moving Inventory Analyzer
        </h1>
        <p style={{
          color: '#94a3b8', // Light gray text on dark background
          fontSize: '16px',
          margin: 0,
          fontWeight: '400'
        }}>
          Enterprise Intelligence Platform • Inventory Optimization Dashboard
        </p>
      </div>

      {/* Main Content Container */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto'
      }}>
        {/* Enhanced KPI Tiles Row */}
  <KPITilesRow
    metrics={dashboardData?.kpis || sampleMetrics}
    onKpiClick={handleKpiClick}
    targets={kpiTargets}
    onTargetChange={handleTargetChange}
  />

        {/* KPI Explanation Popup */}
        {activePopup && kpiExplanations[activePopup] && (
          <div 
            data-popup
            style={{
              position: 'fixed',
              left: `${mousePosition.x + 15}px`,
              top: `${mousePosition.y - 10}px`,
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '8px',
              width: '180px',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#00e0ff',
              textAlign: 'center',
              marginBottom: '6px'
            }}>
              Understanding This Metric
            </div>
            <div style={{
              color: '#cbd5e1',
              lineHeight: '1.3'
            }}>
              {kpiExplanations[activePopup].map((point, index) => (
                <div key={index} style={{ marginBottom: index < kpiExplanations[activePopup].length - 1 ? '4px' : '0' }}>
                  {point}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateChange={(startDate, endDate) => {
            setDateRange({ startDate, endDate });
            setAllTimeMode(false);
            setLastDateRange({ startDate, endDate });
          }}
          allTimeMode={allTimeMode}
          onAllTimeToggle={(enabled) => {
            setAllTimeMode(enabled);
            if (enabled) {
              // Save the last explicit date range and clear current dateRange
              setLastDateRange(dateRange);
              setDateRange({ startDate: '', endDate: '' });
            } else {
              // Restore previous date range if exists
              if (lastDateRange) setDateRange(lastDateRange);
            }
          }}
        />

        {/* Phase 3: Core Visualizations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1, isolation: 'isolate' }}>
          {(() => {
            try {
              console.log('SlowMovingDashboard: Passing to TurnoverAnalysisMatrix ->', {
                byCategory: dashboardData?.byCategory ? Object.keys(dashboardData.byCategory).length : 0,
                warehouses: (dashboardData?.warehouses || []).length
              });
            } catch (e) {}
            return null;
          })()}
          {(() => {
            try {
              // Determine which source we'll pass into ItemLevelAnalyzer for debugging
              const itemLevelLen = (dashboardData?.itemLevelData || []).length;
              const slowMovingLen = (dashboardData?.slowMovingItems || []).length;
              const mergedLen = (dashboardData?.merged || []).length;
              let source = 'none';
              if (itemLevelLen > 0) source = 'itemLevelData (primary)';
              else if (slowMovingLen > 0) source = 'slowMovingItems (postgres)';
              else if (mergedLen > 0) source = 'merged (sqlite snapshot - fallback)';
              console.log(`SlowMovingDashboard: item-level data source -> ${source}`, { itemLevelLen, slowMovingLen, mergedLen });
            } catch (e) {}
            return null;
          })()}
          {/* Pass the aggregated shapes returned by the API into the matrix */}
          <TurnoverAnalysisMatrix
            selectedCategory={selectedCategory}
            categories={categories}
            onCategoryChange={setSelectedCategory}
            data={dashboardData ? {
              byCategory: dashboardData.byCategory,
              byCategoryWarehouse: dashboardData.byCategoryWarehouse,
              warehouses: dashboardData.warehouses
            } : undefined}
          />
          
          <AgingAnalysisPanel 
            selectedCategory={selectedCategory}
            categories={categories}
            data={dashboardData?.agingAnalysis}
          />
          
          {/* Pass item-level rows; fallback to slowMovingItems or merged snapshot when itemLevelData is absent */}
          {(() => {
            // Resolve warehouseId -> warehouse name when possible so the item-level component
            // (which filters by warehouse name) matches rows from the SQLite merged snapshot.
            let resolvedWarehouse = 'All';
            try {
              const warehouses = dashboardData?.filterOptions?.warehouses || [];
              if (filters.warehouseId) {
                const found = warehouses.find(w => (w.id == filters.warehouseId));
                resolvedWarehouse = found ? found.name : String(filters.warehouseId);
              }
              console.log('SlowMovingDashboard: resolved activeWarehouse ->', resolvedWarehouse);
            } catch (e) {
              // fallback
            }

            // Choose first non-empty item array so we don't pass an empty itemLevelData when merged exists
            const itemLevelLen = (dashboardData?.itemLevelData || []).length;
            const slowMovingLen = (dashboardData?.slowMovingItems || []).length;
            const mergedLen = (dashboardData?.merged || []).length;
            const itemRows = dashboardData ? (itemLevelLen > 0 ? dashboardData.itemLevelData : (slowMovingLen > 0 ? dashboardData.slowMovingItems : (mergedLen > 0 ? dashboardData.merged : []))) : undefined;

            return (
              <ItemLevelAnalyzer 
                onItemSelect={(item) => {}}
                onActionTaken={(itemId, action) => {}}
                data={itemRows}
                activeCategory={selectedCategory !== 'All Categories' ? selectedCategory : 'All'}
                activeWarehouse={resolvedWarehouse}
              />
            );
          })()}
          
          <FinancialImpactAnalyzer 
            onScenarioChange={setSelectedScenario}
            // Pass the full query result so the component can use `summary` and `merged` directly
            data={dashboardData}
            itemLevelData={dashboardData?.itemLevelData}
          />
        </div>
      </div>

      {/* AI Assistant Integration */}
      <FloatingAIChat 
        insights={getCurrentInsights()}
        onAskAI={handleDashboardAI}
      />
    </div>
  );
};

export default SlowMovingDashboard;
