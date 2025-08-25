import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DashboardState, FilterState, THEME, Metric, TimePeriod, KEYFRAMES, SelectedDataPoint } from '../types';
import KPITiles from '../components/kpi/KPITiles';
import TimeSeriesExplorer from '../components/visualizations/TimeSeriesExplorer';
import SeasonalPatternAnalyzer from '../components/visualizations/SeasonalPatternAnalyzer';
import GrowthRateVisualizer from '../components/visualizations/GrowthRateVisualizer';
import EnhancedContextAwareChatbot from '../components/chat/EnhancedContextAwareChatbot';
import QuickInsightsAssistant from '../components/chat/QuickInsightsAssistantSimple';
import InteractiveAIDashboardAssistant from '../components/chat/InteractiveAIDashboardAssistant';
import { useTheme } from '../contexts/ThemeContext';
import { chartSelectionManager } from '../utils/ChartSelectionManager';
import SelectionStatusIndicator from '../components/common/SelectionStatusIndicator';
import MultiSelectionGuide from '../components/common/MultiSelectionGuide';
// New non-invasive filter UI and data bridge (5 filters only)
import { SalesFilterBar } from '../../../../../ui-common/components/SalesFilterBar';
import { SalesFilterDataBridge } from '../../../../../ui-common/components/SalesFilterDataBridge';

const initialFilters: FilterState = {
  startDate: '2020-01-01',
  endDate: '2020-12-31',
  timePeriod: 'monthly',
  metric: 'revenue',
  dimension: null
};

// Types for Enhanced Chatbot functionality
interface ClickedDataPoint {
  metricName: string;
  date: string;
  value: number;
  previousValue?: number;
  percentChange?: number;
}

const ThemeToggleButton: React.FC = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: theme.bg.card,
        border: `2px solid ${theme.border.medium}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        color: theme.text.primary,
        boxShadow: `0 4px 16px ${theme.chat.shadow}`,
        transition: 'all 0.3s ease'
      }}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? '🌙' : '☀️'}
    </button>
  );
};

const SalesTrendDashboardInner: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    filters: initialFilters,
    data: null,
    isLoading: true,
    error: null
  });

  // Enhanced Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastClickedPoint, setLastClickedPoint] = useState<ClickedDataPoint | null>(null);



  // Quick Insights Assistant state
  const [quickInsightsVisible, setQuickInsightsVisible] = useState(false);
  const [quickInsightsPosition, setQuickInsightsPosition] = useState({ x: 0, y: 0 });
  const [quickInsightsData, setQuickInsightsData] = useState<any>(null);
  const [quickInsightsChartInfo, setQuickInsightsChartInfo] = useState<any>(null);
  const [quickInsightsChartType, setQuickInsightsChartType] = useState<string>('timeseries');

  // Multi-selection state
  const [selectedPoints, setSelectedPoints] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Local UI filters for top-panel filters
  const [uiFilters, setUiFilters] = useState<{ 
    date_from?: string; date_to?: string; salesperson?: string; territory?: string; customer_category?: string; customer_region?: string;
  }>({ date_from: state.filters.startDate, date_to: state.filters.endDate });
  const prevUiFiltersRef = useRef<typeof uiFilters>(uiFilters);

  useEffect(() => {
    // Keep date pickers in sync when dashboard date range changes elsewhere
    setUiFilters(prev => ({ ...prev, date_from: state.filters.startDate, date_to: state.filters.endDate }));
  }, [state.filters.startDate, state.filters.endDate]);

  const fetchData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/sales-trends/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.filters)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setState(prev => ({
        ...prev,
        data: result.data,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false
      }));
    }
  };

  // Toggle chatbot visibility
  const toggleChatbot = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  // Handle new chart creation
  const handleNewChart = useCallback(() => {
    // This would trigger creation of a new chart/analysis
    // For now, we'll just show a success message in the chatbot
    console.log('🎉 Creating new trend analysis chart');
  }, []);

  const calculatePercentChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const findPreviousValue = (data: any[], currentDate: string, metricName: string): number | undefined => {
    if (!data || !Array.isArray(data)) return undefined;
    
    const currentIndex = data.findIndex(item => 
      item.period === currentDate
    );
    
    if (currentIndex <= 0) return undefined;
    
    const previousItem = data[currentIndex - 1];
    return previousItem?.[metricName] || previousItem?.value;
  };



  useEffect(() => {
    fetchData();
  }, [state.filters]);

  useEffect(() => {
    if (state.data?.kpis) {
      console.log('KPI data received:', state.data.kpis);
    }
  }, [state.data?.kpis]);

  // Multi-selection setup and cleanup
  useEffect(() => {
    // Subscribe to selection changes
    const unsubscribe = chartSelectionManager.subscribe((selections: SelectedDataPoint[]) => {
      const selectionIds = new Set(selections.map(s => s.id));
      setSelectedPoints(selectionIds);
      setIsMultiSelectMode(selections.length > 0);

      // Show combined analysis if multiple points selected
      if (selections.length > 1) {
        const analysis = chartSelectionManager.analyzeSelections();
        if (analysis) {
          // Show analysis in Quick Insights
          setQuickInsightsData({
            isMultiSelection: true,
            analysis: analysis
          });
          setQuickInsightsChartInfo(null);
          setQuickInsightsChartType('multi-selection');
          setQuickInsightsPosition({ x: window.innerWidth / 2 - 200, y: 100 });
          setQuickInsightsVisible(true);
        }
      }
    });

    // ESC key handler to clear selections
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        chartSelectionManager.clearSelections();
        setQuickInsightsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      unsubscribe();
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));

    // Trigger Quick Insights when filters are applied
    const x = Math.round(window.innerWidth / 2) - 200;
    const y = 110;
    setQuickInsightsPosition({ x, y });
    setQuickInsightsData({
      metricName: state.filters.metric,
      date: `${newFilters.startDate || state.filters.startDate} to ${newFilters.endDate || state.filters.endDate}`,
      value: 0,
      period: 'Filters Applied'
    });
    setQuickInsightsChartInfo({
      title: 'Filters Updated',
      description: 'Dashboard updated based on your selected filters',
      purpose: 'Confirm context and provide quick guidance'
    });
    setQuickInsightsChartType('timeseries');
    setQuickInsightsVisible(true);
  };

  // Enhanced click handler supporting both single click and Shift+Click multi-selection
  const createDataPointClickHandler = useCallback((chartType: string) => {
    return (point: any, event?: any) => {
      console.log(`🎯 ${chartType} data point clicked:`, point);
      
      // Extract and normalize the clicked point data
      const clickedPoint: ClickedDataPoint = {
        metricName: point.metricName || point.metric || state.filters.metric,
        // Prefer structured date for parsing; fall back to period only if no 'date'
        date: point.date || point.period || point.x,
        value: point.value || point.y || point.val || point.revenue || 0,
        // Pass through seasonal context so Quick Insights can compute seasonal insights
        period: point.period,
        year: point.year,
        month: point.month,
        isAverage: point.isAverage
      };

      // Use provided previous/percentChange if present; otherwise compute
      if (typeof point.previousValue === 'number') {
        clickedPoint.previousValue = point.previousValue;
      }
      if (typeof point.percentChange === 'number') {
        clickedPoint.percentChange = point.percentChange;
      }

      // Enhanced previous value calculation for different data types
      let previousValue: number | undefined;

      if (clickedPoint.previousValue === undefined) {
        // Try to find previous value from mainData first
        if (state.data?.mainData && clickedPoint.date) {
          previousValue = findPreviousValue(state.data.mainData, clickedPoint.date, clickedPoint.metricName);
        }
        
        // If not found, try to calculate from seasonal data for seasonal chart clicks
        if (previousValue === undefined && state.data?.seasonality && clickedPoint.date) {
          const seasonalData = state.data.seasonality;
          const currentIndex = seasonalData.findIndex(item => 
            item.year + '-' + String(item.month).padStart(2, '0') + '-01' === clickedPoint.date ||
            item.year + '-' + String(item.month) === clickedPoint.date
          );
          
          if (currentIndex > 0) {
            const previousItem = seasonalData[currentIndex - 1];
            previousValue = previousItem?.revenue;
          }
        }

        if (previousValue !== undefined) {
          clickedPoint.previousValue = previousValue;
          // Set percentChange only if not provided
          if (clickedPoint.percentChange === undefined) {
            clickedPoint.percentChange = calculatePercentChange(clickedPoint.value, previousValue);
          }
        }
      }

      console.log('🎯 Processed clicked point:', clickedPoint);

      // Get a reliable DOM event reference across libs/browsers
      const domEvent: any = (event && (event.event || event.nativeEvent || event.srcEvent)) || undefined;
      const isShiftClick = !!(domEvent && domEvent.shiftKey);

      if (isShiftClick) {
        // Multi-selection mode: Shift+Click
        console.log('🔄 Shift+Click detected - Multi-selection mode');
        
        // Create selection data point
        const selectionPoint: SelectedDataPoint = {
          id: `${chartType}-${clickedPoint.date}-${clickedPoint.metricName}`,
          chartType: chartType as any,
          metricName: clickedPoint.metricName,
          date: clickedPoint.date,
          value: clickedPoint.value,
          previousValue: clickedPoint.previousValue,
          percentChange: clickedPoint.percentChange,
          period: point.period,
          year: point.year,
          month: point.month,
          isAverage: point.isAverage,
          displayName: `${clickedPoint.metricName} (${clickedPoint.date})`,
          timestamp: Date.now()
        };

        // Toggle selection
        chartSelectionManager.toggleSelection(selectionPoint);
        
      } else {
        // Regular single click - preserve existing behavior
        console.log('🎯 Regular click - Single selection mode');
        
        // Clear any existing multi-selections
        chartSelectionManager.clearSelections();
        
        // Show Quick Insights Assistant at click position
        const x = domEvent?.clientX ?? Math.round(window.innerWidth / 2);
        const y = domEvent?.clientY ?? 120;
        setQuickInsightsPosition({ x: x + 10, y: y - 10 });
        setQuickInsightsData(clickedPoint);
        setQuickInsightsChartInfo(null);
        setQuickInsightsChartType(chartType);
        setQuickInsightsVisible(true);

        // Store the clicked point for main chatbot
        setLastClickedPoint(clickedPoint);
      }
      
      console.log('🎯 Click processing completed');
    };
  }, [state.data, state.filters.metric]);

  // Individual chart handlers
  const handleTimeSeriesClick = useMemo(() => createDataPointClickHandler('timeseries'), [createDataPointClickHandler]);
  const handleSeasonalClick = useMemo(() => createDataPointClickHandler('seasonal'), [createDataPointClickHandler]);
  const handleGrowthClick = useMemo(() => createDataPointClickHandler('growth'), [createDataPointClickHandler]);

  const handleMetricSelect = (metric: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, metric: metric as Metric }
    }));

    // Show Quick Insights when a KPI tile is selected
    const x = Math.round(window.innerWidth / 2) - 180;
    const y = 120;
    setQuickInsightsPosition({ x, y });
    const k = state.data?.kpis || {};
    const metricValue =
      metric === 'revenue' ? k.total_revenue :
      metric === 'units' ? k.total_units :
      metric === 'aov' ? k.avg_order_value :
      metric === 'margin' ? k.margin_percentage : k[metric];
    setQuickInsightsData({
      metricName: metric,
      date: `${state.filters.startDate} to ${state.filters.endDate}`,
      value: Number(metricValue || 0),
      period: 'Current Selection'
    });
    setQuickInsightsChartInfo({
      title: 'Key Metrics',
      description: 'Essential business performance indicators',
      purpose: 'Quick health check of your business'
    });
    setQuickInsightsChartType('kpi');
    setQuickInsightsVisible(true);
  };

  // Handle info icon clicks for chart explanations
  const handleInfoIconClick = useCallback((event: React.MouseEvent, chartType: string) => {
    event.stopPropagation();
    
    const chartInfo = {
      timeseries: {
        title: 'Time Series Explorer',
        description: 'Track how your sales change over time',
        purpose: 'Spot trends and patterns in your data'
      },
      seasonal: {
        title: 'Seasonal Patterns',
        description: 'See monthly and seasonal sales cycles',
        purpose: 'Plan for busy and slow periods'
      },
      growth: {
        title: 'Growth Rate Analysis',
        description: 'Month-to-month growth percentage changes',
        purpose: 'Monitor business momentum and acceleration'
      },
      kpi: {
        title: 'Key Metrics',
        description: 'Essential business performance indicators',
        purpose: 'Quick health check of your business'
      },
      revenue: {
        title: 'Total Revenue',
        description: 'Net sales after returns/discounts; main income indicator.',
        purpose: 'Track topline momentum and plan allocation.',
        calc: 'Sum of (price × quantity) minus returns and discounts.',
        drivers: 'Price, volume, product mix, discounts, seasonality.',
        benchmark: 'Target YoY ≥ 5% growth; stable MoM seasonality pattern.',
        action: 'Scale winning channels; secure inventory; monitor returns/discounts.'
      },
      units: {
        title: 'Units Sold',
        description: 'Total items shipped; volume performance tracker.',
        purpose: 'Gauge demand and operational load.',
        calc: 'Sum of quantities sold across orders.',
        drivers: 'Demand, pricing, promotions, availability, seasonality.',
        benchmark: 'Watch fill rate/stockouts; aim for sustained YoY growth.',
        action: 'Ensure inventory/fulfillment capacity; replicate best-performing campaigns.'
      },
      aov: {
        title: 'Average Order Value',
        description: 'Average revenue per order (excl. taxes).',
        purpose: 'Understand basket size and upsell impact.',
        calc: 'Total revenue ÷ number of orders.',
        drivers: 'Bundling, cross-sell, pricing, shipping thresholds.',
        benchmark: 'Target steady growth; avoid spikes from heavy discounting.',
        action: 'Promote bundles and add‑ons; test free‑shipping thresholds.'
      },
      margin: {
        title: 'Profit Margin',
        description: 'Percent of revenue kept as profit.',
        purpose: 'Assess pricing power and cost efficiency.',
        calc: '(Revenue − costs) ÷ revenue.',
        drivers: 'COGS, shipping, discounts, mix, pricing.',
        benchmark: 'Aim for consistent or improving margin QoQ.',
        action: 'Review COGS/discounting; optimize mix; adjust pricing where elastic.'
      },
      avgGrowth: {
        title: 'Average Growth',
        description: 'Typical month‑over‑month growth rate across the selected period.',
        purpose: 'Assess sustained momentum and baseline velocity.',
        calc: 'Average of monthly growth rates: (current − previous) ÷ previous.',
        drivers: 'Seasonality, campaigns, supply, pricing, mix.',
        benchmark: 'Healthy baseline ≥ 3–5% MoM depending on season.',
        action: 'Stabilize dips; scale repeatable plays that lift baseline.'
      },
      maxGrowth: {
        title: 'Best Growth Month',
        description: 'Month with the highest MoM growth rate.',
        purpose: 'Benchmark peak momentum and repeat drivers.',
        calc: 'Max of monthly growth rates in range.',
        drivers: 'Campaign spikes, launches, price moves, promotions.',
        benchmark: 'Validate quality of spike (sustainable vs promo‑driven).',
        action: 'Document playbook; replicate across channels/segments.'
      },
      minGrowth: {
        title: 'Worst Growth Month',
        description: 'Month with the lowest (or negative) MoM growth.',
        purpose: 'Identify headwinds and fix root causes.',
        calc: 'Min of monthly growth rates in range.',
        drivers: 'Stockouts, pricing, competition, seasonality, campaign gaps.',
        benchmark: 'Contain declines; recover within 1–2 months.',
        action: 'Diagnose drivers; adjust pricing/promo; fix supply; refresh creatives.'
      },
      latestGrowth: {
        title: 'Current Growth',
        description: 'Most recent MoM growth rate.',
        purpose: 'Gauge current trend direction.',
        calc: '(Latest − previous) ÷ previous.',
        drivers: 'Recent campaigns, supply, pricing moves, macro.',
        benchmark: 'Confirm alignment with seasonal baseline and targets.',
        action: 'If momentum is positive, scale; if negative, run rapid test to recover.'
      }
    };

    const info = chartInfo[chartType as keyof typeof chartInfo];
    if (info) {
      setQuickInsightsPosition({ 
        x: event.clientX + 10, 
        y: event.clientY - 10 
      });
      setQuickInsightsData(null);
      setQuickInsightsChartInfo(info);
      setQuickInsightsChartType(chartType);
      setQuickInsightsVisible(true);
    }
  }, []);

  // Close Quick Insights Assistant
  const closeQuickInsights = useCallback(() => {
    setQuickInsightsVisible(false);
    setQuickInsightsData(null);
    setQuickInsightsChartInfo(null);
    setQuickInsightsChartType('timeseries');
  }, []);



  // Add keyframes to document head
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ${KEYFRAMES}
      .glass-card {
        background: ${THEME.glass.background};
        border: ${THEME.glass.border};
        backdrop-filter: ${THEME.glass.backdropFilter};
        -webkit-backdrop-filter: ${THEME.glass.backdropFilter};
        box-shadow: ${THEME.glass.boxShadow};
        transition: ${THEME.animations.smooth};
      }
      .glass-card:hover {
        ${THEME.animations.hoverLift}
        transition: ${THEME.animations.spring};
      }
      .gradient-text {
        background: ${THEME.colors.text.gradient};
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .floating-bg {
        animation: ${THEME.animations.float};
      }
      body {
        min-height: 100vh;
        font-family: ${THEME.typography.fontFamily};
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (state.error) {
    return (
      <div
        style={{
          padding: '40px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #302c34ff 100%)',
          fontFamily: THEME.typography.fontFamily
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: '32px',
            borderRadius: '20px',
            textAlign: 'center',
            animation: THEME.animations.scaleIn
          }}
        >
          <div style={{ 
            color: THEME.colors.risk.red, 
            fontSize: THEME.typography.sizes['2xl'],
            fontWeight: THEME.typography.weights.bold,
            marginBottom: '16px'
          }}>
            ⚠️ Error Loading Dashboard
          </div>
          <div style={{
            color: THEME.colors.text.primary,
            fontSize: THEME.typography.sizes.base
          }}>
            {state.error}
          </div>
        </div>
      </div>
    );
  }



  // Main Dashboard Layout
  const { theme } = useTheme();
  // Keep the body synced to theme for areas outside React tree
  React.useEffect(() => {
    document.body.style.background = theme.bg.primary;
    document.body.style.color = theme.text.primary;
  }, [theme]);

  return (
      <div
        style={{
          minHeight: '100vh',
          background: theme.bg.primary,
          color: theme.text.primary,
          fontFamily: THEME.typography.fontFamily
        }}
      >
      {/* Floating Background Elements */}
      <div
        className="floating-bg"
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 1,
          animationDelay: '0s'
        }}
      />
      <div
        className="floating-bg"
        style={{
          position: 'absolute',
          top: '60%',
          right: '10%',
          width: '150px',
          height: '150px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          zIndex: 1,
          animationDelay: '2s'
        }}
      />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '40px',
          maxWidth: '1600px',
          margin: '0 auto'
        }}
      >
        {/* Header Section with floating theme toggle */}
        <div
          style={{
            position: 'relative',
            textAlign: 'center',
            marginBottom: '48px',
            animation: THEME.animations.fadeInUp
          }}
        >
          {/* Fixed Theme Toggle Button at top-right of the dashboard */}
          <div
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
              zIndex: 10000 // ensure above charts and overlays
            }}
          >
            <ThemeToggleButton />
          </div>

          <h1
            className="gradient-text"
            style={{
              fontSize: THEME.typography.sizes['4xl'],
              fontWeight: THEME.typography.weights.extrabold,
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em'
            }}
          >
            📈 Sales Trend Analytics
          </h1>
          <p
            style={{
              fontSize: THEME.typography.sizes.lg,
              color: theme.text.primary,
              margin: 0,
              fontWeight: THEME.typography.weights.medium,
              opacity: 0.9
            }}
          >
            AI-Powered Sales Intelligence Dashboard
          </p>
        </div>

        {/* Filters (non-invasive, 5 best filters). Updates dashboard state via DataBridge */}
        <div style={{ marginBottom: '20px' }}>
          <SalesFilterBar
            value={uiFilters}
            onChange={(v) => {
              // Detect filter changes to trigger Quick Insights popup near the filter bar
              const prev = prevUiFiltersRef.current;
              const changed = JSON.stringify(prev) !== JSON.stringify(v);
              setUiFilters(v);
              prevUiFiltersRef.current = v;
              if (changed) {
                const container = document.body; // fallback to viewport center
                const x = Math.round(window.innerWidth / 2) - 200;
                const y = 140; // slightly below header
                setQuickInsightsPosition({ x, y });
                setQuickInsightsData({
                  metricName: state.filters.metric,
                  date: `${v.date_from || state.filters.startDate} to ${v.date_to || state.filters.endDate}`,
                  value: 0,
                  period: 'Filters Applied'
                });
                setQuickInsightsChartInfo({
                  title: 'Filters Updated',
                  description: 'Dashboard updated based on your selected filters',
                  purpose: 'Quick, contextual insights'
                });
                setQuickInsightsChartType('timeseries');
                setQuickInsightsVisible(true);
              }
            }}
          />
          <SalesFilterDataBridge
            filters={uiFilters as any}
            setDashboardState={(updater) => setState(updater as any)}
          />
        </div>

        {/* KPI Section */}
        <div
          style={{
            marginBottom: '40px',
            animation: THEME.animations.slideInFromLeft,
            animationDelay: '0.2s',
            animationFillMode: 'both'
          }}
        >
          <KPITiles 
            data={state.data?.kpis} 
            isLoading={state.isLoading}
            selectedMetric={state.filters.metric}
            onMetricSelect={handleMetricSelect}
            onInfoIconClick={handleInfoIconClick}
          />
        </div>

        {/* Charts Grid - Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}
        >
          {/* Time Series Explorer */}
          <div
            style={{
              animation: THEME.animations.slideInFromLeft,
              animationDelay: '0.4s',
              animationFillMode: 'both'
            }}
          >
            <TimeSeriesExplorer
              data={state.data?.mainData || []}
              isLoading={state.isLoading}
              filters={state.filters}
              onFilterChange={handleFilterChange}
              onDataPointClick={handleTimeSeriesClick}
              onInfoIconClick={(event) => handleInfoIconClick(event, 'timeseries')}
              selectedPoints={selectedPoints}
            />
          </div>

          {/* Seasonal Pattern Analyzer */}
          <div
            style={{
              animation: THEME.animations.slideInFromRight,
              animationDelay: '0.6s',
              animationFillMode: 'both'
            }}
          >
            <SeasonalPatternAnalyzer
              data={state.data?.seasonality || []}
              isLoading={state.isLoading}
              timePeriod={state.filters.timePeriod}
              onTimePeriodChange={(period) => handleFilterChange({ timePeriod: period })}
              onDataPointClick={handleSeasonalClick}
              onInfoIconClick={(event) => handleInfoIconClick(event, 'seasonal')}
              selectedPoints={selectedPoints}
            />
          </div>
        </div>

        {/* Growth Rate Visualizer - Full Width */}
        <div
          style={{
            animation: THEME.animations.fadeInUp,
            animationDelay: '0.8s',
            animationFillMode: 'both'
          }}
        >
          <GrowthRateVisualizer
            data={state.data?.growthRates || []}
            isLoading={state.isLoading}
            timePeriod={state.filters.timePeriod}
            onTimePeriodChange={(period) => handleFilterChange({ timePeriod: period })}
            onDataPointClick={handleGrowthClick}
            onInfoIconClick={(event) => handleInfoIconClick(event, 'growth')}
            selectedPoints={selectedPoints}
          />
        </div>
      </div>

      {/* Enhanced Context Aware Chatbot */}
      <EnhancedContextAwareChatbot
        dashboardState={state}
        lastClickedPoint={lastClickedPoint}
        isOpen={isChatOpen}
        onToggle={toggleChatbot}
        onNewChart={handleNewChart}
      />

      {/* Quick Insights Assistant */}
      <QuickInsightsAssistant
        isVisible={quickInsightsVisible}
        position={quickInsightsPosition}
        dataPoint={quickInsightsData}
        chartInfo={quickInsightsChartInfo}
        chartType={quickInsightsChartType as 'timeseries' | 'seasonal' | 'growth' | 'kpi'}
        onClose={closeQuickInsights}
        dashboardState={state}
      />

      {/* Interactive AI Dashboard Assistant */}
      <InteractiveAIDashboardAssistant dashboardState={state} suppressTrigger={isChatOpen} />

      {/* Selection Status Indicator */}
      <SelectionStatusIndicator
        selectionCount={selectedPoints.size}
        isVisible={isMultiSelectMode}
        onClearSelections={() => chartSelectionManager.clearSelections()}
      />

      {/* Multi-Selection Guide */}
      <MultiSelectionGuide isVisible={!isMultiSelectMode} />


    </div>
  );
};

import { ThemeProvider } from '../contexts/ThemeContext';

const SalesTrendDashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <SalesTrendDashboardInner />
    </ThemeProvider>
  );
};

export default SalesTrendDashboard;