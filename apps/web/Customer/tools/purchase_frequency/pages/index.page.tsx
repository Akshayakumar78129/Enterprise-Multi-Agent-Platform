import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { fetchPurchaseFrequencyData, transformKPIData } from '../api/data.api';
import EnhancedFilterContainer from '../../transaction_patterns/ui/components/filters/EnhancedFilterContainer';
import { handleChartClick } from '../ui/utils/chartSelectionHelper';
import {
  setDateRange,
  setKPIData,
  setHistogramData,
  setIntervalData,
  setCustomerSegments,
  setRegularityData,
  setValueSegments,
  setIsLoading,
  toggleIntelligencePanel
} from '../ui/state/purchaseFrequencySlice';
import { DateRange, KPIData } from '../ui/types';
  return (
    <div 
      className="purchase-frequency-dashboard"
      style={{
        background: '#181e2a',
        color: '#f7f9fb',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        padding: 0
      }}
      ref={containerRef}
    >
      <header
        style={{
          marginBottom: '24px',
          padding: '32px 40px 0 40px',
          borderBottom: '2px solid #232a36',
          background: '#232a36'
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Purchase Frequency Analyzer</h1>
        <div style={{ color: '#b0b8c9', marginTop: 4, marginBottom: 16 }}>AI-powered purchase frequency analytics</div>
      </header>
    lowThreshold,
    intervalData,
    customerSegments,
    regularityData,
    // valueSegments, // removed with ValueTreemap
    isLoading,
    intelligencePanelExpanded,
    intelligenceResponse,
    intelligenceLoading,
    highlightedElements
  } = useSelector((state: any) => state.purchaseFrequency);
  
  // Refs for components that need imperative control
  const kpiTilesRef = useRef<any>(null);
  const histogramRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  const quadrantRef = useRef<any>(null);
  const regularityChartRef = useRef<any>(null);
  // const treemapRef = useRef<any>(null); // removed with ValueTreemap
  const dateRangePickerRef = useRef<any>(null);
  const filterControlRef = useRef<any>(null);
  const intelligenceRef = useRef<any>(null);
  
  // Local state for initial data loading
  const [initialLoading, setInitialLoading] = useState(true);

  // Initial date range - last 90 days
  const initialDateRange: DateRange = {
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        dispatch(setIsLoading(true));
        dispatch(setDateRange(initialDateRange));
        
        const response = await fetchPurchaseFrequencyData(
          initialDateRange.start,
          initialDateRange.end
        );
        
        // Transform and dispatch data to Redux store
        const kpiData = transformKPIData(response);
        dispatch(setKPIData(kpiData));
        
        // Set histogram data
        const histogramData = {
          data: response.frequency_distribution || [],
          mean: response.avg_purchase_frequency || 0,
          highThreshold: response.high_frequency_threshold || 0,
          lowThreshold: response.low_frequency_threshold || 0
        };
        dispatch(setHistogramData(histogramData));
        
        // Set interval data
        dispatch(setIntervalData(response.interval_data || []));
        
        // Set customer segments
        dispatch(setCustomerSegments(response.customer_segments || []));
        
        // Set regularity data
        dispatch(setRegularityData(response.regularity_data || []));
        
        // Set value segments
        dispatch(setValueSegments(response.value_segments || []));
        
        setInitialLoading(false);
        dispatch(setIsLoading(false));
      } catch (error) {
        console.error('Error loading initial data:', error);
        setInitialLoading(false);
        dispatch(setIsLoading(false));
      }
    }
    
    loadInitialData();
  }, [dispatch]);

  // Handle date range change
  const handleDateRangeChange = async (newRange: DateRange) => {
    dispatch(setIsLoading(true));
    dispatch(setDateRange(newRange));
    
    try {
      const response = await fetchPurchaseFrequencyData(
        newRange.start,
        newRange.end,
        selectedSegments
      );
      
      // Update Redux store with new data
      const kpiData = transformKPIData(response);
      dispatch(setKPIData(kpiData));
      
      // Update histogram data
      const histogramData = {
        data: response.frequency_distribution || [],
        mean: response.avg_purchase_frequency || 0,
        highThreshold: response.high_frequency_threshold || 0,
        lowThreshold: response.low_frequency_threshold || 0
      };
      dispatch(setHistogramData(histogramData));
      
      // Update other data...
      dispatch(setIntervalData(response.interval_data || []));
      dispatch(setCustomerSegments(response.customer_segments || []));
      dispatch(setRegularityData(response.regularity_data || []));
      dispatch(setValueSegments(response.value_segments || []));
      
      dispatch(setIsLoading(false));
    } catch (error) {
      console.error('Error fetching data for new date range:', error);
      dispatch(setIsLoading(false));
    }
  };

  // Handle segment filter change
  const handleSegmentFilterChange = async (segments: string[]) => {
    dispatch(setIsLoading(true));
    
    try {
      const response = await fetchPurchaseFrequencyData(
        dateRange.start,
        dateRange.end,
        segments
      );
      
      // Update Redux store with filtered data
      // Similar to date range change above...
      const kpiData = transformKPIData(response);
      dispatch(setKPIData(kpiData));
      
      dispatch(setIsLoading(false));
    } catch (error) {
      console.error('Error fetching data for segment filter:', error);
      dispatch(setIsLoading(false));
    }
  };

  // Handle KPI tile click
  const handleKpiTileClick = (metric: string) => {
    // No-op: removed intelligence panel behavior per request
    kpiTilesRef.current?.highlightTile(metric);
  };
  
  // Handle intelligence query submission
  const handleIntelligenceQuery = (query: string) => {
    // No-op: removed popup/intelligence behavior per request
    return;
  };
  

  // Import new filter components
  // import EnhancedFilterContainer from transaction-patterns
  // import DateRangeFilter from transaction-patterns
  // import ProductCategoryFilter from transaction-patterns (if needed)
  // import CustomerSegmentFilter from transaction-patterns (if needed)
  // import styles from transaction-patterns EnhancedFilterContainer.module.css

  // Sample available segments and categories (replace with actual data as needed)
  // Enhanced segments structure for segmented chips in the filter UI
  const availableSegments = {
    // Legacy buckets (still shown inside CustomerSegmentFilter)
    champions: [{ id: 'champions', label: 'Champions', count: 1200 }],
    loyal: [{ id: 'loyal', label: 'Loyal', count: 800 }],
    big_spenders: [{ id: 'big_spenders', label: 'Big Spenders', count: 500 }],
    at_risk: [{ id: 'at_risk', label: 'At Risk', count: 300 }],
    others: [{ id: 'others', label: 'Others', count: 2000 }],

    // New segment groups used by EnhancedFilterContainer chip groups
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
  const availableCategories = {
    bikes: [{ id: 'bikes', label: 'Bicycles', revenue: 2500000 }],
    accessories: [{ id: 'accessories', label: 'Accessories', revenue: 1800000 }],
    components: [{ id: 'components', label: 'Components', revenue: 1200000 }],
    apparel: [{ id: 'apparel', label: 'Apparel', revenue: 900000 }]
  };

  // Filters state
  const [filters, setFilters] = useState({
    dateRange: dateRange,
    customerSegments: [],
    productCategories: [],
    markets: [],
    monetary: [],
    loyalty: [],
    countries: []
  });

  // Sync Redux dateRange with local filters
  useEffect(() => {
    setFilters((prev) => ({ ...prev, dateRange }));
  }, [dateRange]);

  // Handler for EnhancedFilterContainer (segments, categories, date)
  const handleEnhancedFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Combine all selected segment-like filters into a single segment id list
    const combinedSegmentIds = [
      ...((newFilters.customerSegments || []).map((s: any) => s.id)),
      ...((newFilters.markets || []).map((s: any) => s.id)),
      ...((newFilters.monetary || []).map((s: any) => s.id)),
      ...((newFilters.loyalty || []).map((s: any) => s.id)),
      ...((newFilters.countries || []).map((s: any) => s.id)),
    ];
    handleSegmentFilterChange(combinedSegmentIds);
  };

  // Handler for date range change from EnhancedFilterContainer
  const handleEnhancedDateRangeChange = (newRange) => {
    handleDateRangeChange(newRange);
  };

  // Client-side filtered datasets (productCategories apply here; segments handled by API fetch via handleSegmentFilterChange)
  const filteredHistogram = useMemo(() => {
    if (!histogramData) return [];
    // If categories are selected and data contains category keys, filter; else pass-through
    const categoryIds = (filters.productCategories || []).map((c: any) => c.id);
    if (categoryIds.length === 0) return histogramData;
    // Expecting histogramData as array of bins; if contains categoryId, filter; else pass-through
    return (histogramData as any[]).filter((bin: any) => !bin.categoryId || categoryIds.includes(bin.categoryId));
  }, [histogramData, filters.productCategories]);

  const filteredInterval = useMemo(() => {
    if (!intervalData) return [];
    const categoryIds = (filters.productCategories || []).map((c: any) => c.id);
    if (categoryIds.length === 0) return intervalData;
    return (intervalData as any[]).filter((row: any) => !row.categoryId || categoryIds.includes(row.categoryId));
  }, [intervalData, filters.productCategories]);

  const filteredCustomerSegments = useMemo(() => {
    if (!customerSegments) return [];
    const categoryIds = (filters.productCategories || []).map((c: any) => c.id);
    if (categoryIds.length === 0) return customerSegments;
    return (customerSegments as any[]).filter((seg: any) => !seg.categoryId || categoryIds.includes(seg.categoryId));
  }, [customerSegments, filters.productCategories]);

  const filteredRegularity = useMemo(() => {
    if (!regularityData) return [];
    const categoryIds = (filters.productCategories || []).map((c: any) => c.id);
    if (categoryIds.length === 0) return regularityData;
    return (regularityData as any[]).filter((r: any) => !r.categoryId || categoryIds.includes(r.categoryId));
  }, [regularityData, filters.productCategories]);

  return (
    <div 
      className="purchase-frequency-dashboard"
      style={{
        minHeight: '100vh',
        padding: '40px 60px',
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%, #f8fafc 100%)'
      }}
    >
      {/* Subtle animated background like churn_prediction */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />
      <header
        style={{
          marginBottom: 48,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '32px 28px',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05), 0 0 20px rgba(59, 130, 246, 0.05)'
        }}
      >
        <h1 style={{ 
          fontSize: 38, 
          fontWeight: 800, 
          marginBottom: 8,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0
        }}>
          📊 Purchase Frequency Analyzer
        </h1>
        <div style={{ 
          color: '#64748b', 
          fontSize: 15,
          fontWeight: 500,
          maxWidth: 680,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Analyze customer purchase patterns and frequency trends
        </div>
      </header>

      {/* Advanced Filter Section - fills horizontally */}
      <div style={{ marginBottom: '32px' }}>
        {/* Use EnhancedFilterContainer from transaction-patterns */}
        <EnhancedFilterContainer
          filters={filters}
          onFiltersChange={handleEnhancedFiltersChange}
          onDateRangeChange={handleEnhancedDateRangeChange}
          isLoading={isLoading}
          availableSegments={availableSegments}
          availableCategories={availableCategories}
          minDate={filters.dateRange?.start || '2017-01-01'}
          maxDate={filters.dateRange?.end || '2024-12-31'}
          showDateRange={true}
          showApply={false}
          className="enhanced-filter-container"
        />
      </div>

      {/* KPI Tiles */}
      {/* Selected Filters Summary Bar */}
      {/* Clickable Filter Chips for Segments & Categories */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#232a36' }}>
          Customer Segmentation & Product Categories
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {/* Customer Segmentation Chips */}
          {Object.values(availableSegments).flat().length > 0 ? (
            Object.values(availableSegments).flat().map(segment => (
              <button
                key={segment.id}
                style={{
                  padding: '6px 16px',
                  borderRadius: '16px',
                  border: filters.customerSegments.some(s => s.id === segment.id) ? '2px solid #e930ff' : '1px solid #e2e8f0',
                  background: filters.customerSegments.some(s => s.id === segment.id) ? 'rgba(233,48,255,0.12)' : '#fff',
                  color: '#e930ff',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: filters.customerSegments.some(s => s.id === segment.id) ? '0 2px 8px rgba(233,48,255,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  const isSelected = filters.customerSegments.some(s => s.id === segment.id);
                  const newSegments = isSelected
                    ? filters.customerSegments.filter(s => s.id !== segment.id)
                    : [...filters.customerSegments, segment];
                  setFilters(prev => ({ ...prev, customerSegments: newSegments }));
                  handleSegmentFilterChange(newSegments.map(s => s.id));
                }}
              >
                {segment.label}
              </button>
            ))
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 500 }}>No segments available</span>
          )}
          {/* Product Category Chips */}
          {Object.values(availableCategories).flat().length > 0 ? (
            Object.values(availableCategories).flat().map(category => (
              <button
                key={category.id}
                style={{
                  padding: '6px 16px',
                  borderRadius: '16px',
                  border: filters.productCategories.some(c => c.id === category.id) ? '2px solid #10b981' : '1px solid #e2e8f0',
                  background: filters.productCategories.some(c => c.id === category.id) ? 'rgba(16,185,129,0.12)' : '#fff',
                  color: '#10b981',
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: filters.productCategories.some(c => c.id === category.id) ? '0 2px 8px rgba(16,185,129,0.08)' : 'none',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  const isSelected = filters.productCategories.some(c => c.id === category.id);
                  const newCategories = isSelected
                    ? filters.productCategories.filter(c => c.id !== category.id)
                    : [...filters.productCategories, category];
                  setFilters(prev => ({ ...prev, productCategories: newCategories }));
                }}
              >
                {category.label}
              </button>
            ))
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 500 }}>No categories available</span>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(59,130,246,0.08)',
          padding: '12px 24px',
          marginBottom: '18px',
          border: '1px solid #e2e8f0',
          fontSize: '15px',
          fontWeight: 500
        }}
      >
        <span style={{ color: '#3b82f6', fontWeight: 700 }}>Active Filters:</span>
        {filters.customerSegments.length > 0 && (
          <span style={{ color: '#e930ff' }}>
            Segments: {filters.customerSegments.map(s => s.label).join(', ')}
          </span>
        )}
        {filters.productCategories.length > 0 && (
          <span style={{ color: '#10b981' }}>
            Categories: {filters.productCategories.map(c => c.label).join(', ')}
          </span>
        )}
        {filters.markets.length > 0 && (
          <span style={{ color: '#8b5cf6' }}>
            Markets: {filters.markets.map(m => m.label).join(', ')}
          </span>
        )}
        {filters.monetary.length > 0 && (
          <span style={{ color: '#fbbf24' }}>
            Monetary: {filters.monetary.map(m => m.label).join(', ')}
          </span>
        )}
        {filters.loyalty.length > 0 && (
          <span style={{ color: '#10b981' }}>
            Loyalty: {filters.loyalty.map(l => l.label).join(', ')}
          </span>
        )}
        {filters.countries.length > 0 && (
          <span style={{ color: '#64748b' }}>
            Countries: {filters.countries.map(c => c.label).join(', ')}
          </span>
        )}
        {(filters.customerSegments.length === 0 && filters.productCategories.length === 0 && filters.markets.length === 0 && filters.monetary.length === 0 && filters.loyalty.length === 0 && filters.countries.length === 0) && (
          <span style={{ color: '#64748b' }}>None</span>
        )}
      </div>
      <section 
        className="kpi-section"
        style={{ marginBottom: '24px' }}
      >
        {initialLoading ? (
          <div style={{ height: '120px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
            <p style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading KPI data...</p>
          </div>
        ) : (
          <KPITilesRow
            ref={kpiTilesRef}
            data={kpiData || {
              total_customers: 0,
              avg_purchase_frequency: 0,
              avg_interval_days: 0,
              active_customers_percentage: 0,
              high_value_customers_percentage: 0
            }}
            width={1200}
            onTileClick={handleKpiTileClick}
          />
        )}
      </section>

      {/* Main Visualizations */}
      <div 
        className="visualizations-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridGap: '24px',
          marginBottom: '24px'
        }}
      >
        <FrequencyHistogram
          ref={histogramRef}
          data={filteredHistogram || []}
          meanFrequency={meanFrequency}
          highThreshold={highThreshold}
          lowThreshold={lowThreshold}
          highlightBins={highlightedElements.histogramBins}
        />

        {/* Legacy Distribution (with hover insights) */}
  {/* Remove FrequencyDistribution if not needed, or import it if required */}
        
        <IntervalHeatmap
          ref={heatmapRef}
          data={filteredInterval || []}
          dateRange={dateRange}
          highlightCells={highlightedElements.intervalCells}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Secondary Visualizations */}
      <div 
        className="visualizations-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridGap: '24px',
          marginBottom: '24px'
        }}
      >
        <div data-chart="segment-quadrant">
          <SegmentQuadrant
            ref={quadrantRef}
            data={filteredCustomerSegments || []}
            highlightSegments={highlightedElements.customerSegments}
          />
        </div>
        
        <div 
          className="secondary-charts"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          <RegularityChart
            ref={regularityChartRef}
            data={filteredRegularity || []}
            previousPeriodData={undefined}
            showComparison={false}
          />

          {/* New: Recency vs Frequency Heatmap */}
          <RecencyFrequencyHeatmap
            data={filteredCustomerSegments || []}
          />

          {/* New: Frequency Pareto Chart */}
          <FrequencyParetoChart
            data={filteredHistogram || []}
          />
          
          {/* ValueTreemap removed per request */}
        </div>
      </div>


    </div>
  );
} 