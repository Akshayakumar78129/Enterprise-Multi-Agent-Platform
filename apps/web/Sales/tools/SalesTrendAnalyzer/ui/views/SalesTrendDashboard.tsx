import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardState, FilterState, THEME, Metric, TimePeriod, KEYFRAMES } from '../types';
import KPITiles from '../components/kpi/KPITiles';
import TimeSeriesExplorer from '../components/visualizations/TimeSeriesExplorer';
import SeasonalPatternAnalyzer from '../components/visualizations/SeasonalPatternAnalyzer';
import GrowthRateVisualizer from '../components/visualizations/GrowthRateVisualizer';
import EnhancedContextAwareChatbot from '../components/chat/EnhancedContextAwareChatbot';
import QuickInsightsAssistant from '../components/chat/QuickInsightsAssistantSimple';
import BusinessIntelligenceAssistant from '../components/chat/BusinessIntelligenceAssistantSimple';
import { ThemeProvider } from '../contexts/ThemeContext';

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

const SalesTrendDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    filters: initialFilters,
    data: null,
    isLoading: true,
    error: null
  });

  // Enhanced Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastClickedPoint, setLastClickedPoint] = useState<ClickedDataPoint | null>(null);

  // Business Intelligence Assistant state
  const [isBIOpen, setIsBIOpen] = useState(false);

  // Quick Insights Assistant state
  const [quickInsightsVisible, setQuickInsightsVisible] = useState(false);
  const [quickInsightsPosition, setQuickInsightsPosition] = useState({ x: 0, y: 0 });
  const [quickInsightsData, setQuickInsightsData] = useState<any>(null);
  const [quickInsightsChartInfo, setQuickInsightsChartInfo] = useState<any>(null);
  const [quickInsightsChartType, setQuickInsightsChartType] = useState<string>('timeseries');

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

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  };

  // Create separate handlers for each chart type
  const createDataPointClickHandler = useCallback((chartType: string) => {
    return (point: any, event?: any) => {
      console.log(`🎯 ${chartType} data point clicked:`, point);
      
      // Extract and normalize the clicked point data
      const clickedPoint: ClickedDataPoint = {
        metricName: point.metricName || point.metric || state.filters.metric,
        date: point.period || point.date || point.x,
        value: point.value || point.y || point.val || point.revenue || 0
      };

      // Enhanced previous value calculation for different data types
      let previousValue: number | undefined;
      
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
        clickedPoint.percentChange = calculatePercentChange(clickedPoint.value, previousValue);
      }

      console.log('🎯 Processed clicked point:', clickedPoint);

      // Show Quick Insights Assistant at click position
      if (event && event.event) {
        const mouseEvent = event.event;
        setQuickInsightsPosition({ 
          x: mouseEvent.clientX + 10, 
          y: mouseEvent.clientY - 10 
        });
        setQuickInsightsData(clickedPoint);
        setQuickInsightsChartInfo(null);
        setQuickInsightsChartType(chartType);
        setQuickInsightsVisible(true);
      }

      // Store the clicked point for main chatbot
      setLastClickedPoint(clickedPoint);
      
      console.log('🎯 Quick insights and chatbot state updated');
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
  };

  // Handle info icon clicks for chart explanations
  const handleInfoIconClick = useCallback((event: React.MouseEvent, chartType: string) => {
    event.stopPropagation();
    
    const chartInfo = {
      timeseries: {
        title: 'Time Series Explorer',
        description: 'Interactive trend visualization showing how your sales metrics change over time',
        purpose: 'Identify trends, patterns, and anomalies in your sales data'
      },
      seasonal: {
        title: 'Seasonal Pattern Analyzer',
        description: 'Reveals seasonal patterns and cyclical trends in your business performance',
        purpose: 'Understand seasonal variations to optimize planning and forecasting'
      },
      growth: {
        title: 'Growth Rate Visualizer',
        description: 'Displays period-over-period growth rates to track business momentum',
        purpose: 'Monitor growth acceleration and identify high-performing periods'
      },
      kpi: {
        title: 'KPI Dashboard',
        description: 'Key performance indicators providing snapshot of business health',
        purpose: 'Quick overview of critical business metrics and performance'
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  return (
    <ThemeProvider>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #3d323bff 100%)',
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
        {/* Header Section */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
            animation: THEME.animations.fadeInUp
          }}
        >
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
              color: THEME.colors.text.white,
              margin: 0,
              fontWeight: THEME.typography.weights.medium,
              opacity: 0.9
            }}
          >
            AI-Powered Sales Intelligence Dashboard
          </p>
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

      {/* Business Intelligence Assistant */}
      <BusinessIntelligenceAssistant
        dashboardState={state}
        isOpen={isBIOpen}
        onToggle={() => setIsBIOpen(!isBIOpen)}
      />

      {/* Floating Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 999
      }}>
        {/* Business Intelligence Button */}
        <button
          onClick={() => setIsBIOpen(!isBIOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isBIOpen ? 'none' : THEME.animations.float
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
          }}
          title="Business Intelligence Assistant"
        >
          🧠
        </button>

        {/* Main AI Assistant Button */}
        <button
          onClick={toggleChatbot}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(79, 172, 254, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isChatOpen ? 'none' : THEME.animations.float
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(79, 172, 254, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.4)';
          }}
          title="AI Assistant with 4 Specialized Agents"
        >
          🤖
        </button>
      </div>
    </div>
    </ThemeProvider>
  );
};

export default SalesTrendDashboard;