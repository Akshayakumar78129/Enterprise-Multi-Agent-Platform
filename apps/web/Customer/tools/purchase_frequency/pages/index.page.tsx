import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { fetchPurchaseFrequencyData, transformKPIData } from '../api/data.api';
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

// Dynamic imports for components
const KPITilesRow = dynamic(() => import('../ui/components/kpi/KPITilesRow'), { ssr: false });
const FrequencyHistogram = dynamic(() => import('../ui/components/visualizations/FrequencyHistogram'), { ssr: false });
const IntervalHeatmap = dynamic(() => import('../ui/components/visualizations/IntervalHeatmap'), { ssr: false });
const SegmentQuadrant = dynamic(() => import('../ui/components/visualizations/SegmentQuadrant'), { ssr: false });
const RegularityChart = dynamic(() => import('../ui/components/visualizations/RegularityChart'), { ssr: false });
const ValueTreemap = dynamic(() => import('../ui/components/visualizations/ValueTreemap'), { ssr: false });
const PatternIntelligence = dynamic(() => import('../ui/components/PatternIntelligence'), { ssr: false });
const DateRangePicker = dynamic(() => import('../ui/components/controls/DateRangePicker'), { ssr: false });
const FilterControl = dynamic(() => import('../ui/components/controls/FilterControl'), { ssr: false });

export default function PurchaseFrequencyDashboard() {
  const dispatch = useDispatch();
  
  // Access state from Redux store
  const {
    dateRange,
    selectedSegments,
    kpiData,
    histogramData,
    meanFrequency,
    highThreshold,
    lowThreshold,
    intervalData,
    customerSegments,
    regularityData,
    valueSegments,
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
  const treemapRef = useRef<any>(null);
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
    // Show intelligence panel with information about the selected metric
    dispatch(toggleIntelligencePanel());
    
    // Highlight the selected tile
    kpiTilesRef.current?.highlightTile(metric);
    
    // Set a query about this metric
    if (intelligenceRef.current) {
      const query = `What does the ${metric} metric tell us about our customers?`;
      intelligenceRef.current.setQuery(query);
      intelligenceRef.current.submitQuery(query);
    }
  };
  
  // Handle intelligence query submission
  const handleIntelligenceQuery = (query: string) => {
    // In a real implementation, this would call an API to get AI-powered insights
    console.log('Intelligence query:', query);
    
    // Simulate a response after a delay
    setTimeout(() => {
      // This is where you would set the response from the API
      // dispatch(setIntelligenceResponse('Sample response...'));
    }, 1500);
  };
  
  // Sample customer segments for the filter
  const availableSegments = [
    'champions',
    'loyal',
    'big_spenders',
    'at_risk',
    'others'
  ];

  return (
    <div 
      className="purchase-frequency-dashboard"
      style={{
        backgroundColor: '#0a1224',
        color: '#f7f9fb',
        padding: '24px',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <header
        style={{
          marginBottom: '24px'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '28px', marginBottom: '8px' }}>
          Purchase Frequency Analyzer
        </h1>
        <p style={{ margin: 0, opacity: 0.7 }}>
          Analyze customer purchase patterns and frequency trends
        </p>
      </header>

      {/* Controls Section */}
      <div 
        className="controls-section"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '16px'
        }}
      >
        <div style={{ flex: 1 }}>
          <DateRangePicker
            ref={dateRangePickerRef}
            dateRange={dateRange}
            onChange={handleDateRangeChange}
            isLoading={isLoading}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FilterControl
            ref={filterControlRef}
            segments={availableSegments}
            selectedSegments={selectedSegments}
            onChange={handleSegmentFilterChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* KPI Tiles */}
      <section 
        className="kpi-section"
        style={{ marginBottom: '24px' }}
      >
        {initialLoading ? (
          <div style={{ height: '120px', backgroundColor: '#232a36', borderRadius: '20px' }}>
            <p style={{ textAlign: 'center', padding: '48px' }}>Loading KPI data...</p>
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
          data={histogramData || []}
          meanFrequency={meanFrequency}
          highThreshold={highThreshold}
          lowThreshold={lowThreshold}
          highlightBins={highlightedElements.histogramBins}
          onBarClick={(bin) => {
            console.log(`Clicked bin ${bin}`);
            
            // Expand intelligence panel with a relevant query
            if (intelligenceRef.current && !intelligencePanelExpanded) {
              dispatch(toggleIntelligencePanel());
              const query = `What can you tell me about customers who purchase ${bin} times?`;
              intelligenceRef.current.setQuery(query);
              intelligenceRef.current.submitQuery(query);
            }
          }}
        />
        
        <IntervalHeatmap
          ref={heatmapRef}
          data={intervalData || []}
          dateRange={dateRange}
          highlightCells={highlightedElements.intervalCells}
          onCellClick={(day, hour) => {
            console.log(`Clicked cell ${day} at ${hour}:00`);
            
            // Similar intelligence panel integration as above
          }}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>

      {/* Secondary Visualizations */}
      <div 
        className="visualizations-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '7fr 5fr',
          gridGap: '24px',
          marginBottom: '24px'
        }}
      >
        <SegmentQuadrant
          ref={quadrantRef}
          data={customerSegments || []}
          highlightSegments={highlightedElements.customerSegments}
          onSegmentClick={(segment) => {
            console.log(`Clicked segment ${segment}`);
            
            // Filter to this segment
            filterControlRef.current?.selectSegment(segment);
            
            // Intelligence panel integration
            if (intelligenceRef.current) {
              const query = `What are the key characteristics of the ${segment} segment?`;
              intelligenceRef.current.setQuery(query);
            }
          }}
        />
        
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
            data={regularityData || []}
            previousPeriodData={undefined} // Would come from previous period data
            showComparison={false}
            onAxisClick={(timeframe) => {
              console.log(`Clicked timeframe ${timeframe}`);
              
              // Intelligence panel integration
              if (intelligenceRef.current) {
                const query = `What are the trends for ${timeframe} purchasing customers?`;
                intelligenceRef.current.setQuery(query);
              }
            }}
          />
          
          <ValueTreemap
            ref={treemapRef}
            data={valueSegments || []}
            highlightSegments={highlightedElements.valueSegments}
            onSegmentClick={(segment) => {
              console.log(`Clicked value segment ${segment}`);
              
              // Intelligence panel integration
              if (intelligenceRef.current) {
                const query = `What strategies should we use for ${segment} value customers?`;
                intelligenceRef.current.setQuery(query);
              }
            }}
          />
        </div>
      </div>

      {/* Intelligence Panel - Fixed position on right side */}
      <div 
        className="intelligence-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          backgroundColor: 'rgba(35, 42, 54, 0.95)',
          borderLeft: '1px solid #3a4459',
          padding: '24px',
          transform: intelligencePanelExpanded ? 'translateX(0)' : 'translateX(360px)',
          transition: 'transform 0.3s ease',
          overflow: 'auto',
          zIndex: 100
        }}
      >
        <PatternIntelligence
          ref={intelligenceRef}
          isExpanded={intelligencePanelExpanded}
          onToggle={() => dispatch(toggleIntelligencePanel())}
          onQuery={handleIntelligenceQuery}
          response={intelligenceResponse}
          isLoading={intelligenceLoading}
        />
      </div>
    </div>
  );
} 