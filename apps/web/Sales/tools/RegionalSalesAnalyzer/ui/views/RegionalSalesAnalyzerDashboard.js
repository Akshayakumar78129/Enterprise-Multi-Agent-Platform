import React, { useState, useEffect } from "react";
import RegionalKPITiles from "../components/kpi/RegionalKPITiles";
import RegionalPerformanceMap from "../components/visualizations/RegionalPerformanceMap";
import RegionalTimeSeriesExplorer from "../components/visualizations/RegionalTimeSeriesExplorer";
import RegionalSalesChatbot from "../components/chat/RegionalSalesChatbot";
import ChatButton from "../components/chat/ChatButton";
import SalesBusinessAgent from "../components/businessagent.tsx";

// Add CSS animations for AI insight popup
const aiInsightStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(10px); }
    to { transform: translateY(0); }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('ai-insight-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'ai-insight-styles';
  styleSheet.textContent = aiInsightStyles;
  document.head.appendChild(styleSheet);
}

// Lightweight UUIDv4 generator (avoids external deps)
const uuidv4 = () => {
  // RFC4122 version 4 compliant
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const RegionalSalesAnalyzerDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: {
      start: '2017-01-01',
      end: '2021-12-31'
    },
    aggregation: 'month'
  });
  const [selectedRegions, setSelectedRegions] = useState(['overall']);
  const [selectedMetric, setSelectedMetric] = useState('totalSales');
  
  // AI Insight state
  const [aiInsight, setAiInsight] = useState({
    visible: false,
    elementType: '', // 'kpi', 'region', 'chart', 'table'
    elementId: '',
    explanation: '',
    position: { x: 0, y: 0 }
  });
  
  // Context tags state for future chat integration
  const [contextTags, setContextTags] = useState([]);
  
  // Chatbot state
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatContext, setChatContext] = useState({});
  const [hasNewChatMessage, setHasNewChatMessage] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Update chat context when dashboard state changes
  useEffect(() => {
    setChatContext({
      selectedRegions,
      selectedMetric,
      filters,
      data: data ? {
        totalSales: data.kpis?.totalRevenue || 0,
        topRegions: data.kpis?.topRegions || [],
        concentrationRatio: data.kpis?.concentrationRatio || 0,
        growthOpportunities: data.kpis?.growthOpportunities || 0
      } : null,
      timestamp: new Date().toISOString()
    });
  }, [selectedRegions, selectedMetric, filters, data]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/regional-sales-analyzer/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching regional sales data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRegionSelect = (country, state) => {
    const regionKey = `${country}-${state}`;
    setSelectedRegions(prev => {
      if (prev.includes(regionKey)) {
        return prev.filter(r => r !== regionKey);
      } else {
        // Remove 'overall' if adding specific regions
        const filtered = prev.filter(r => r !== 'overall');
        return [...filtered, regionKey];
      }
    });
  };

  const handleRegionToggle = (regionKey) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionKey)) {
        return prev.filter(r => r !== regionKey);
      } else {
        return [...prev, regionKey];
      }
    });
  };

  const handleKPIClick = (kpiType) => {
    switch (kpiType) {
      case 'totalSales':
        setSelectedMetric('totalSales');
        break;
      case 'topRegion':
        if (data?.kpis?.topRegions?.length > 0) {
          const topRegion = data.kpis.topRegions[0];
          handleRegionSelect(topRegion.country, topRegion.state);
        }
        break;
      case 'opportunities':
        // Filter to show only growth opportunity regions
        if (data?.opportunityAnalysis) {
          const opportunities = data.opportunityAnalysis
            .filter(region => region.opportunityCategory === 'Growth Opportunity')
            .slice(0, 5)
            .map(region => `${region.country}-${region.state}`);
          setSelectedRegions(opportunities);
        }
        break;
      default:
        break;
    }
  };

  const handleTimeRangeChange = (range) => {
    handleFilterChange({ dateRange: range });
  };

  const handleAggregationChange = (aggregation) => {
    handleFilterChange({ aggregation });
  };

  // Chat handlers
  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
    if (hasNewChatMessage) {
      setHasNewChatMessage(false);
    }
  };

  const handleChatContextUpdate = (newContext) => {
    setChatContext(prev => ({ ...prev, ...newContext }));
  };

  // Generate AI explanation for different dashboard elements
  const generateAIExplanation = (elementType, elementId, elementData) => {
    let explanation = '';
    
    switch (elementType) {
      case 'kpi':
        switch (elementId) {
          case 'totalSales':
            const totalSales = elementData?.value || 0;
            const trend = elementData?.trend;
            explanation = `Total Sales: $${(totalSales / 1000000).toFixed(1)}M\n\n` +
              `This represents your total sales across all regions. ` +
              `${trend?.direction === 'up' ? 'Growing' : trend?.direction === 'down' ? 'Declining' : 'Stable'} ` +
              `${trend?.value ? `by ${trend.value}% ${trend.period}` : ''}.\n\n` +
              `Focus: ${totalSales > 50000000 ? 'Maintain momentum with expansion strategies.' : 
                       totalSales > 10000000 ? 'Scale successful regions and optimize underperformers.' : 
                       'Identify growth opportunities and market penetration strategies.'}`;
            break;
          case 'topRegion':
            const topRegion = data?.kpis?.topRegions?.[0];
            explanation = `Top Performing Region: ${topRegion?.state}, ${topRegion?.country}\n\n` +
              `Sales: $${(topRegion?.totalSales / 1000).toFixed(0)}K\n` +
              `Customers: ${topRegion?.customerCount?.toLocaleString() || 0}\n\n` +
              `This region leads in performance. Analyze their success factors:\n` +
              `• Market conditions and demographics\n` +
              `• Sales strategies and team performance\n` +
              `• Product-market fit and customer satisfaction\n\n` +
              `Focus: Replicate successful strategies in other regions.`;
            break;
          case 'opportunities':
            const opportunityCount = data?.opportunityAnalysis?.filter(r => r.opportunityCategory === 'Growth Opportunity')?.length || 0;
            explanation = `Growth Opportunities: ${opportunityCount} regions identified\n\n` +
              `These regions show potential for significant growth based on:\n` +
              `• Market size vs current penetration\n` +
              `• Historical growth patterns\n` +
              `• Competitive landscape analysis\n\n` +
              `Focus: Prioritize investment in high-potential regions with targeted campaigns and resource allocation.`;
            break;
          case 'avgOrderValue':
            const avgOrder = elementData?.value || 0;
            explanation = `Average Order Value: $${avgOrder.toFixed(0)}\n\n` +
              `This metric indicates customer spending patterns per transaction. ` +
              `${avgOrder > 500 ? 'Excellent - customers are making substantial purchases.' : 
                avgOrder > 200 ? 'Good - room for upselling opportunities.' : 
                'Low - focus on increasing basket size.'}\n\n` +
              `Focus: ${avgOrder > 500 ? 'Maintain premium positioning and customer satisfaction.' : 
                       'Implement upselling strategies and bundle offers.'}`;
            break;
          default:
            explanation = `Regional Sales Metric\n\n` +
              `This KPI provides insights into your regional sales performance. ` +
              `Click on specific regions or time periods for detailed analysis.\n\n` +
              `Focus: Use this data to identify trends and optimization opportunities.`;
        }
        break;
        
      case 'region':
        const regionData = elementData;
        const isFromMap = regionData?.selectedMetric && regionData?.metricValue !== undefined;
        
        if (isFromMap) {
          // Enhanced analysis for map clicks with current metric context
          const metricValue = regionData.metricValue;
          const metricLabel = regionData.metricLabel;
          const selectedMetric = regionData.selectedMetric;
          
          explanation = `Regional Analysis: ${regionData?.state}, ${regionData?.country}\n\n` +
            `Current Focus: ${metricLabel}\n` +
            `Value: ${selectedMetric.includes('Sales') ? `$${(metricValue / 1000).toFixed(0)}K` : 
                     selectedMetric.includes('Margin') ? `${metricValue?.toFixed(1)}%` :
                     metricValue?.toLocaleString() || 'N/A'}\n\n` +
            `Performance Context:\n` +
            `• Sales: $${(regionData?.totalSales / 1000).toFixed(0)}K\n` +
            `• Customers: ${regionData?.customerCount?.toLocaleString() || 0}\n` +
            `• Transactions: ${regionData?.transactionCount?.toLocaleString() || 0}\n\n` +
            `${metricLabel} Analysis:\n` +
            `${selectedMetric === 'totalSales' ? 
              `• ${metricValue > 1000000 ? 'Top revenue generator' : metricValue > 500000 ? 'Strong sales performance' : 'Growth opportunity'}\n` +
              `• Market penetration: ${metricValue > 1000000 ? 'Excellent' : 'Developing'}\n` +
              `• Revenue contribution: ${((metricValue / (regionData?.totalSales || metricValue)) * 100).toFixed(1)}%` :
              selectedMetric === 'profitMargin' ?
              `• ${metricValue > 15 ? 'Excellent profitability' : metricValue > 10 ? 'Good margins' : 'Margin improvement needed'}\n` +
              `• Cost efficiency: ${metricValue > 15 ? 'Highly efficient' : 'Optimization opportunity'}\n` +
              `• Pricing strategy: ${metricValue > 15 ? 'Premium positioning' : 'Volume-focused'}` :
              selectedMetric === 'customerCount' ?
              `• ${metricValue > 5000 ? 'Large customer base' : metricValue > 1000 ? 'Growing market' : 'Early stage market'}\n` +
              `• Market penetration: ${metricValue > 5000 ? 'High' : 'Developing'}\n` +
              `• Customer density: ${(metricValue / (regionData?.totalSales || 1) * 1000).toFixed(1)} customers per $1K sales` :
              `• Performance indicator for strategic planning\n• Benchmark against similar regions\n• Monitor trends over time`
            }\n\n` +
            `Strategic Recommendations:\n` +
            `${metricValue > (selectedMetric === 'totalSales' ? 1000000 : selectedMetric === 'profitMargin' ? 15 : 1000) ?
              '• Maintain competitive advantage\n• Expand successful strategies\n• Consider market leadership initiatives' :
              '• Analyze top-performing regions\n• Implement targeted improvements\n• Increase market investment'
            }`;
        } else {
          // Standard region analysis for table clicks
          explanation = `Region: ${regionData?.state}, ${regionData?.country}\n\n` +
            `Sales: $${(regionData?.totalSales / 1000).toFixed(0)}K\n` +
            `Customers: ${regionData?.customerCount?.toLocaleString() || 0}\n` +
            `Avg Order: $${regionData?.avgSalesAmount?.toFixed(0) || 0}\n\n` +
            `Performance Analysis:\n` +
            `• ${regionData?.totalSales > 1000000 ? 'High-performing region' : 'Developing market'}\n` +
            `• ${regionData?.customerCount > 1000 ? 'Strong customer base' : 'Growth opportunity'}\n` +
            `• ${regionData?.avgSalesAmount > 300 ? 'High-value customers' : 'Focus on order value'}\n\n` +
            `Focus: ${regionData?.totalSales > 1000000 ? 'Maintain and expand market share.' : 'Invest in market development and customer acquisition.'}`;
        }
        break;
        
      case 'chart':
        if (elementData && elementData.period) {
          // Specific data point analysis
          const { traceName, period, value, metricLabel, isOverall, regionInfo } = elementData;
          const formattedValue = metricLabel.includes('Sales') ? 
            `$${(value / 1000).toFixed(0)}K` : 
            value.toLocaleString();
          
          explanation = `${isOverall ? 'Overall' : 'Regional'} Data Point Analysis\n\n` +
            `${traceName} - ${period}\n` +
            `${metricLabel}: ${formattedValue}\n\n` +
            `Performance Insights:\n` +
            `• ${value > 100000 ? 'Strong performance period' : value > 50000 ? 'Moderate performance' : 'Below average performance'}\n` +
            `• ${isOverall ? 'Company-wide trend indicator' : 'Regional market dynamics'}\n` +
            `• ${period.includes('Q4') || period.includes('Dec') ? 'Holiday season impact' : 
                 period.includes('Q1') || period.includes('Jan') ? 'New year market conditions' : 
                 'Regular business period'}\n\n` +
            `Strategic Focus:\n` +
            `${value > 100000 ? 
              '• Analyze success factors for replication\n• Maintain momentum with continued investment' : 
              '• Investigate performance gaps\n• Implement targeted improvement strategies'}\n\n` +
            `Context: Click on other data points to compare trends and identify patterns.`;
        } else {
          // General chart analysis
          explanation = `Time Series Analysis\n\n` +
            `This chart shows sales trends over time for selected regions. ` +
            `Look for seasonal patterns, growth trends, and anomalies.\n\n` +
            `Key Insights:\n` +
            `• Identify peak and low seasons\n` +
            `• Compare regional performance\n` +
            `• Spot growth opportunities\n\n` +
            `Focus: Click on individual data points for detailed period analysis.`;
        }
        break;
        
      case 'opportunity':
        const opportunityData = elementData;
        explanation = `Growth Opportunity: ${opportunityData?.state}, ${opportunityData?.country}\n\n` +
          `Sales: $${(opportunityData?.totalSales / 1000).toFixed(0)}K\n` +
          `Profit Margin: ${opportunityData?.profitMargin?.toFixed(1) || 0}%\n` +
          `Customers: ${opportunityData?.customerCount?.toLocaleString() || 0}\n` +
          `Category: ${opportunityData?.opportunityCategory || 'Growth Opportunity'}\n\n` +
          `Opportunity Analysis:\n` +
          `• ${opportunityData?.totalSales < 500000 ? 'Untapped market potential' : 'Developing market with room for growth'}\n` +
          `• ${opportunityData?.profitMargin > 10 ? 'Healthy margins indicate good pricing power' : 'Margin improvement opportunities exist'}\n` +
          `• ${opportunityData?.customerCount < 1000 ? 'Low customer penetration - high acquisition potential' : 'Growing customer base with expansion opportunities'}\n\n` +
          `Strategic Recommendations:\n` +
          `• Increase marketing investment and brand awareness\n` +
          `• Develop targeted customer acquisition campaigns\n` +
          `• Consider local partnerships or distribution channels\n` +
          `• Monitor competitor activity and market dynamics\n\n` +
          `Investment Priority: ${opportunityData?.totalSales < 200000 ? 'High - Early market entry advantage' : 'Medium - Market development opportunity'}`;
        break;
        
      case 'table':
        explanation = `Regional Performance Comparison\n\n` +
          `This table provides a comprehensive view of all regions ranked by performance. ` +
          `Use it to identify top performers and underperformers.\n\n` +
          `Analysis Tips:\n` +
          `• Compare similar-sized regions\n` +
          `• Look for efficiency patterns\n` +
          `• Identify outliers for investigation\n\n` +
          `Focus: Benchmark performance and share best practices across regions.`;
        break;
        
      default:
        explanation = `Regional Sales Insight\n\n` +
          `This element provides valuable insights into your regional sales performance. ` +
          `Analyze the data to identify trends, opportunities, and areas for improvement.\n\n` +
          `Focus: Use data-driven insights to optimize regional strategies.`;
    }
    
    return explanation;
  };

  // Handle AI insight display
  const handleShowAIInsight = (e, elementType, elementId, elementData = null) => {
    // Don't show AI insight popup if Shift key is pressed (for multi-selection)
    if (e && e.shiftKey) {
      console.log('🚫 Shift+Click detected, skipping AI insight popup');
      return;
    }
    
    // Calculate position for the popup
    let x = 100;
    let y = 100;
    
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const popupWidth = 350;
      const popupHeight = 300;
      
      // Position to the right of the element if there's space, otherwise to the left
      if (rect.right + popupWidth + 20 < window.innerWidth) {
        x = rect.right + 15;
        y = rect.top;
      } else {
        x = rect.left - popupWidth - 15;
        y = rect.top;
      }
      
      // Adjust vertical position if off screen
      if (y + popupHeight > window.innerHeight - 20) {
        y = window.innerHeight - popupHeight - 20;
      }
      if (y < 20) {
        y = 20;
      }
      
      // Final horizontal adjustment
      if (x < 20) {
        x = 20;
      } else if (x + popupWidth > window.innerWidth - 20) {
        x = window.innerWidth - popupWidth - 20;
      }
    } else if (e && e.clientX) {
      x = e.clientX + 15;
      y = e.clientY - 50;
    }
    
    setAiInsight({
      visible: true,
      elementType,
      elementId,
      explanation: generateAIExplanation(elementType, elementId, elementData),
      position: { x, y }
    });
  };

  // Handle context addition for future chat integration
  const handleAddContext = (contextString) => {
    console.log('Adding context:', contextString);
    setContextTags(prev => {
      if (!prev.includes(contextString)) {
        return [...prev, contextString];
      }
      return prev;
    });
  };

  if (error) {
    return (
      <div style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}>
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #e930ff",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center",
        }}>
          <h2 style={{ color: "#e930ff", marginBottom: "16px" }}>
            Error Loading Regional Sales Data
          </h2>
          <p style={{ color: "#f7f9fb", marginBottom: "16px" }}>
            {error}
          </p>
          <button
            onClick={fetchData}
            style={{
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ 
          marginBottom: "8px", 
          color: "#00e0ff",
          fontSize: "28px",
          fontWeight: "600"
        }}>
          Regional Sales Analyzer
        </h1>
        <p style={{ 
          color: "#5891cb", 
          fontSize: "16px",
          margin: 0,
          marginBottom: "8px"
        }}>
          Comprehensive geospatial analytics and regional performance insights
        </p>
        <div style={{
          fontSize: "12px",
          color: "#00e0ff",
          backgroundColor: "rgba(0, 224, 255, 0.1)",
          padding: "6px 12px",
          borderRadius: "16px",
          display: "inline-block",
          border: "1px solid rgba(0, 224, 255, 0.3)"
        }}>
          💡 Click on KPI tiles, map regions, chart points, or table rows for AI insights
        </div>
      </div>

      {/* Date Range and Filters */}
      <div style={{
        marginBottom: "24px",
        padding: "16px",
        backgroundColor: "#232a36",
        borderRadius: "8px",
        border: "1px solid #3a4459",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            Start Date
          </label>
          <input
            type="date"
            value={filters.dateRange?.start || ''}
            onChange={(e) => handleFilterChange({
              dateRange: { ...filters.dateRange, start: e.target.value }
            })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            End Date
          </label>
          <input
            type="date"
            value={filters.dateRange?.end || ''}
            onChange={(e) => handleFilterChange({
              dateRange: { ...filters.dateRange, end: e.target.value }
            })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "bold" }}>
            Country Filter
          </label>
          <select
            value={filters.country || ''}
            onChange={(e) => handleFilterChange({ country: e.target.value || undefined })}
            style={{
              padding: "6px 8px",
              backgroundColor: "#0a1224",
              color: "#f7f9fb",
              border: "1px solid #3a4459",
              borderRadius: "4px",
              fontSize: "12px",
              minWidth: "120px"
            }}
          >
            <option value="">All Countries</option>
            {data?.availableRegions && 
              [...new Set(data.availableRegions.map(r => r.country))]
                .sort()
                .map(country => (
                  <option key={country} value={country}>{country}</option>
                ))
            }
          </select>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            padding: "8px 16px",
            backgroundColor: isLoading ? "#3a4459" : "#00e0ff",
            color: isLoading ? "#f7f9fb" : "#0a1224",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            marginTop: "auto"
          }}
        >
          {isLoading ? "Loading..." : "Refresh Data"}
        </button>

        {data?.metadata && (
          <div style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: "#5891cb",
            textAlign: "right"
          }}>
            <div>{data.metadata.totalRegions} regions analyzed</div>
            <div>
              {data.metadata.dateRange.start} to {data.metadata.dateRange.end}
            </div>
          </div>
        )}
      </div>

      {/* KPI Section */}
      <RegionalKPITiles 
        kpis={data?.kpis} 
        isLoading={isLoading}
        onKPIClick={handleKPIClick}
        onShowAIInsight={handleShowAIInsight}
      />

      {/* Main Visualizations Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "24px"
      }}>
        {/* Regional Performance Map */}
        <div style={{ gridColumn: "1 / 3" }}>
          <RegionalPerformanceMap
            data={data?.regionalSalesData || []}
            countryData={data?.countryLevelData || []}
            selectedMetric={selectedMetric}
            selectedRegions={selectedRegions}
            onRegionSelect={handleRegionSelect}
            onShowAIInsight={handleShowAIInsight}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Time Series Section */}
      <div style={{ marginBottom: "24px" }}>
        <RegionalTimeSeriesExplorer
          data={data?.timeSeriesData}
          selectedRegions={selectedRegions}
          dateRange={filters.dateRange}
          aggregation={filters.aggregation}
          onTimeRangeChange={handleTimeRangeChange}
          onRegionToggle={handleRegionToggle}
          onAggregationChange={handleAggregationChange}
          onShowAIInsight={handleShowAIInsight}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Analysis Sections */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
        marginBottom: "24px"
      }}>
        {/* Regional Comparison Table */}
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #3a4459",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h3 style={{
            color: "#00e0ff",
            marginBottom: "16px",
            fontSize: "18px"
          }}>
            Regional Performance Comparison
          </h3>
          
          {data?.regionalSalesData ? (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #3a4459",
              borderRadius: "4px"
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px"
              }}>
                <thead style={{
                  backgroundColor: "#0a1224",
                  position: "sticky",
                  top: 0,
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{ padding: "8px", textAlign: "left", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Region
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Sales
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Customers
                    </th>
                    <th style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                      Avg Order
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.regionalSalesData.slice(0, 20).map((region, index) => (
                    <tr 
                      key={`${region.country}-${region.state}`}
                      style={{
                        backgroundColor: selectedRegions.includes(`${region.country}-${region.state}`) 
                          ? "#00e0ff20" 
                          : index % 2 === 0 ? "#232a36" : "#2c3341",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedRegions.includes(`${region.country}-${region.state}`)) {
                          e.currentTarget.style.backgroundColor = "#3a4459";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedRegions.includes(`${region.country}-${region.state}`)) {
                          e.currentTarget.style.backgroundColor = index % 2 === 0 ? "#232a36" : "#2c3341";
                        }
                      }}
                      onClick={(e) => {
                        // Call the global addAIInsightToChat for Shift+Click multi-selection
                        if (typeof window !== 'undefined' && window.addAIInsightToChat) {
                          window.addAIInsightToChat({
                            label: `${region.state}, ${region.country}`,
                            value: `$${(region.totalSales / 1000).toFixed(0)}K`,
                            chartType: 'Performance Comparison',
                            originalEvent: e,
                            metadata: {
                              ...region,
                              customers: region.customerCount,
                              avgOrder: region.avgSalesAmount,
                              timestamp: new Date().toISOString()
                            }
                          });
                          
                          console.log('📊 Performance comparison row clicked:', {
                            region: `${region.state}, ${region.country}`,
                            sales: `$${(region.totalSales / 1000).toFixed(0)}K`,
                            shiftKey: e.shiftKey
                          });
                        }
                        
                        // Show AI insight (will be skipped if shift key is pressed)
                        handleShowAIInsight(e, 'region', `${region.country}-${region.state}`, region);
                        
                        // Open chatbot when shift-clicking
                        if (e.shiftKey) {
                          setIsChatVisible(true);
                        }
                      }}
                      title="Click for AI insight"
                    >
                      <td style={{ padding: "8px", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        {region.state}, {region.country}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        ${(region.totalSales / 1000).toFixed(0)}K
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7fafbff", borderBottom: "1px solid #3a4459" }}>
                        {region.customerCount?.toLocaleString() || 0}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", color: "#f7f9fb", borderBottom: "1px solid #3a4459" }}>
                        ${region.avgSalesAmount?.toFixed(0) || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#5891cb"
            }}>
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>

        {/* Opportunity Analysis */}
        <div style={{
          backgroundColor: "#232a36",
          border: "1px solid #3a4459",
          borderRadius: "8px",
          padding: "20px"
        }}>
          <h3 style={{
            color: "#00e0ff",
            marginBottom: "16px",
            fontSize: "18px"
          }}>
            Growth Opportunities
          </h3>
          
          {data?.opportunityAnalysis ? (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {data.opportunityAnalysis
                .filter(region => region.opportunityCategory === 'Growth Opportunity')
                .slice(0, 10)
                .map((region, index) => (
                  <div
                    key={`${region.country}-${region.state}`}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: "#0a1224",
                      border: "1px solid #3a4459",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#232a36";
                      e.currentTarget.style.borderColor = "#5fd4d6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0a1224";
                      e.currentTarget.style.borderColor = "#3a4459";
                    }}
                    onClick={(e) => {
                      // Call the global addAIInsightToChat for Shift+Click multi-selection
                      if (typeof window !== 'undefined' && window.addAIInsightToChat) {
                        window.addAIInsightToChat({
                          label: `${region.state}, ${region.country}`,
                          value: `$${(region.totalSales / 1000).toFixed(0)}K (${region.profitMargin?.toFixed(1) || 0}% margin)`,
                          chartType: 'Growth Opportunities',
                          originalEvent: e,
                          metadata: {
                            ...region,
                            opportunityCategory: 'Growth Opportunity',
                            customers: region.customerCount,
                            margin: region.profitMargin,
                            timestamp: new Date().toISOString()
                          }
                        });
                        
                        console.log('🚀 Growth opportunity clicked:', {
                          region: `${region.state}, ${region.country}`,
                          sales: `$${(region.totalSales / 1000).toFixed(0)}K`,
                          margin: `${region.profitMargin?.toFixed(1) || 0}%`,
                          shiftKey: e.shiftKey
                        });
                      }
                      
                      // Show AI insight (will be skipped if shift key is pressed)
                      handleShowAIInsight(e, 'opportunity', `${region.country}-${region.state}`, region);
                      
                      // Open chatbot when shift-clicking
                      if (e.shiftKey) {
                        setIsChatbotOpen(true);
                      }
                    }}
                    title="Click for AI insight"
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px"
                    }}>
                      <div style={{
                        fontWeight: "bold",
                        color: "#f7f9fb",
                        fontSize: "14px"
                      }}>
                        {region.state}, {region.country}
                      </div>
                      <div style={{
                        fontSize: "12px",
                        color: "#5fd4d6",
                        backgroundColor: "#5fd4d620",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>
                        Growth Opportunity
                      </div>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#5891cb",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>Sales: ${(region.totalSales / 1000).toFixed(0)}K</span>
                      <span>Margin: {region.profitMargin?.toFixed(1) || 0}%</span>
                      <span>Customers: {region.customerCount?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                ))
              }
              
              {data.opportunityAnalysis.filter(r => r.opportunityCategory === 'Growth Opportunity').length === 0 && (
                <div style={{
                  textAlign: "center",
                  color: "#5891cb",
                  padding: "20px"
                }}>
                  No growth opportunities identified
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#5891cb"
            }}>
              {isLoading ? "Loading..." : "No data available"}
            </div>
          )}
        </div>
      </div>

      {/* Footer with data info */}
      {data?.metadata && (
        <div style={{
          marginTop: "40px",
          padding: "16px",
          backgroundColor: "#232a36",
          borderRadius: "8px",
          border: "1px solid #3a4459",
          fontSize: "12px",
          color: "#5891cb",
          textAlign: "center"
        }}>
          Regional Sales Analyzer • {data.metadata.totalRegions} regions • 
          {data.metadata.dateRange.start} to {data.metadata.dateRange.end} • 
          Last updated: {new Date().toLocaleString()}
        </div>
      )}

      {/* AI Insight Popup */}
      {aiInsight.visible && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 9998
            }}
            onClick={() => setAiInsight(prev => ({ ...prev, visible: false }))}
          />
          
          {/* AI Insight Panel */}
          <div style={{
            position: 'fixed',
            top: aiInsight.position.y,
            left: aiInsight.position.x,
            zIndex: 9999,
            maxWidth: '350px',
            backgroundColor: '#0a1224',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 224, 255, 0.3)',
            border: '1px solid rgba(0, 224, 255, 0.3)',
            overflow: 'hidden',
            animation: 'fadeIn 0.3s ease, slideUp 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 224, 255, 0.1)',
              borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 224, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(0, 224, 255, 0.5)'
                }}>
                  <span style={{ fontSize: '12px' }}>🧠</span>
                </div>
                <div style={{
                  color: '#00e0ff',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  AI Sales Insight
                </div>
              </div>
              <button
                onClick={() => setAiInsight(prev => ({ ...prev, visible: false }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#5891cb',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(88, 145, 203, 0.1)';
                  e.currentTarget.style.color = '#f7f9fb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#5891cb';
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div style={{
              padding: '16px',
              color: '#f7f9fb',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-line',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {aiInsight.explanation}
            </div>
            
            {/* Footer with tip */}
            <div style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 224, 255, 0.05)',
              borderTop: '1px solid rgba(0, 224, 255, 0.1)',
              fontSize: '11px',
              color: '#5891cb',
              textAlign: 'center'
            }}>
              💡 Tip: Click on elements for instant insights
            </div>
          </div>
        </>
      )}

      {/* Chatbot Components */}
      <ChatButton 
        onClick={toggleChat}
        isActive={isChatVisible}
        hasNewMessage={hasNewChatMessage}
        messageCount={0}
      />
      
      <RegionalSalesChatbot
        isVisible={isChatVisible}
        onToggle={toggleChat}
        dashboardContext={chatContext}
        onContextUpdate={handleChatContextUpdate}
      />
      
      {/* Sales Business Agent */}
      <SalesBusinessAgent />
    </div>
  );
};

export default RegionalSalesAnalyzerDashboard; 