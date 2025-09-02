import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './SalesPerformanceDashboard.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../state/store';
import { fetchSalesPerformance, setDateRange, setSelectedDimension, setSelectedMetric, resetFilters } from '../state/salesPerformanceSlice';
import { SalesKpiData, SalesPerformanceState } from '../types';
import { KpiTileRowWithInsights } from '../components/kpi/KpiTileRowWithInsights';
import { ChartWithAIInsights } from '../components/wrappers/ChartWithAIInsights';
import { PerformanceOverview } from '../components/visualizations/PerformanceOverview';
import { TimeSeriesExplorer } from '../components/visualizations/TimeSeriesExplorer';
import { PerformanceDistributionAnalyzer } from '../components/visualizations/PerformanceDistributionAnalyzer';
import { ComparativePerformanceGrid } from '../components/visualizations/ComparativePerformanceGrid';
import { PerformanceCorrelationMatrix } from '../components/visualizations/PerformanceCorrelationMatrix';
import { PerformanceDriverAnalysis } from '../components/visualizations/PerformanceDriverAnalysis';
import { ComprehensiveFilters } from '../components/controls/ComprehensiveFilters';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import SalesBusinessIntelligence from '../components/bi/SalesBusinessIntelligence';

const SalesPerformanceDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    data, 
    loading, 
    error, 
    dateRange, 
    selectedDimension, 
    selectedMetric,
    analysisResult,
  } = useSelector((state: { salesPerformance: SalesPerformanceState }) => state.salesPerformance);

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [overviewChartType, setOverviewChartType] = useState<'bar' | 'line' | 'area'>('bar');
  
  // Additional filter states
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChannel, setSelectedChannel] = useState('all');

  useEffect(() => {
    // Set default date range for 2017-2021 data
    if (!dateRange || dateRange.startDate === '2020-01-01') {
      dispatch(setDateRange({ startDate: '2017-01-01', endDate: '2021-12-31' }));
    }
    // Set default dimension to avoid time-based bars initially
    if (!selectedDimension || selectedDimension === 'time') {
      dispatch(setSelectedDimension('category'));
    }
    if (!selectedMetric) {
      dispatch(setSelectedMetric('revenue'));
    }
    dispatch(fetchSalesPerformance());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSalesPerformance());
  }, [dispatch, dateRange, selectedDimension, selectedMetric, selectedRegion, selectedCategory, selectedChannel]);

  const handleDateRangeChange = (dateRange: { startDate: string; endDate: string }) => {
    dispatch(setDateRange(dateRange));
  };

  const handleDimensionChange = (dimension: string) => {
    dispatch(setSelectedDimension(dimension));
  };

  const handleMetricChange = (metric: string) => {
    dispatch(setSelectedMetric(metric));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setSelectedRegion('all');
    setSelectedCategory('all');
    setSelectedChannel('all');
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data: any, chartType: string) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'sales_performance',
      filters: {
        dateRange,
        selectedDimension,
        selectedMetric,
        selectedRegion,
        selectedCategory,
        selectedChannel
      }
    });
    setShowAIInsights(true);
  };

  // Send data to chatbot
  const handleSendToChat = (data: any) => {
    // Data will be handled by the chatbot component
    setShowAIInsights(false);
  };

  const kpiData: SalesKpiData = useMemo(() => 
    analysisResult?.status === 'success' && analysisResult.results?.kpiData ? 
    analysisResult.results.kpiData : 
    {
      totalRevenue: { value: 0, trend: 0, direction: 'neutral' },
      averageOrderValue: { value: 0, trend: 0, direction: 'neutral' },
      totalUnitsSold: { value: 0, trend: 0, direction: 'neutral' },
      topPerformingRegion: { value: 'N/A', percentage: 0 },
      conversionRate: { value: 0, trend: 0, direction: 'neutral' }, 
    }
  , [analysisResult]);

  const chartData = useMemo(() => {
    if (analysisResult?.status === 'success' && analysisResult.results?.chartData) {
      let filteredData = analysisResult.results.chartData;
      
      // Apply additional filters
      if (selectedRegion !== 'all') {
        filteredData = filteredData?.filter((item: any) => item.region === selectedRegion);
      }
      if (selectedCategory !== 'all') {
        filteredData = filteredData?.filter((item: any) => item.category === selectedCategory);
      }
      if (selectedChannel !== 'all') {
        filteredData = filteredData?.filter((item: any) => item.channel === selectedChannel);
      }
      
      return filteredData;
    }
    return undefined;
  }, [analysisResult, selectedRegion, selectedCategory, selectedChannel]);

  const overviewSummaryData = useMemo(() => {
    if (kpiData && selectedMetric && selectedDimension) {
      let totalValue: number | string = 'N/A';
      let topPerformerActualLabel = 'Top Performer';
      let topPerformerActualName = kpiData.topPerformingRegion.value || 'N/A';

      if (selectedMetric.toLowerCase().includes('revenue')) totalValue = kpiData.totalRevenue.value;
      else if (selectedMetric.toLowerCase().includes('unit')) totalValue = kpiData.totalUnitsSold.value;
      else if (selectedMetric.toLowerCase().includes('aov')) totalValue = kpiData.averageOrderValue.value;
      else if (selectedMetric.toLowerCase().includes('margin')) totalValue = kpiData.conversionRate.value;
      
      if (selectedDimension === 'region') topPerformerActualLabel = "Top Region";
      else if (selectedDimension === 'product') topPerformerActualLabel = "Top Product";
      else if (selectedDimension === 'category') topPerformerActualLabel = "Top Category";

      return {
        total: typeof totalValue === 'number' ? 
               (selectedMetric.toLowerCase().includes('revenue') || selectedMetric.toLowerCase().includes('aov') ? `$${totalValue.toLocaleString()}` : 
               selectedMetric.toLowerCase().includes('margin') ? `${(totalValue * 100).toFixed(1)}%` : totalValue.toLocaleString()) 
               : totalValue,
        periodComparison: '+0% vs LY',
        contribution: '20%',
        topPerformerLabel: topPerformerActualLabel,
        topPerformerName: topPerformerActualName,
      };
    }
    return undefined;
  }, [kpiData, selectedMetric, selectedDimension]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Sales Performance Analyzer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={() => dispatch(fetchSalesPerformance())} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.icon}>💼</span>
            Sales Performance Analyzer
          </h1>
          <p className={styles.subtitle}>
            AI-powered sales insights and performance optimization
          </p>
        </div>
      </div>

      {/* Comprehensive Filters */}
      <section className={styles.filterSection}>
        <ComprehensiveFilters
          dateRange={dateRange}
          selectedDimension={selectedDimension}
          selectedMetric={selectedMetric}
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
          selectedChannel={selectedChannel}
          onDateRangeChange={handleDateRangeChange}
          onDimensionChange={handleDimensionChange}
          onMetricChange={handleMetricChange}
          onRegionChange={setSelectedRegion}
          onCategoryChange={setSelectedCategory}
          onChannelChange={setSelectedChannel}
          onResetFilters={handleResetFilters}
        />
      </section>

      {/* KPI Dashboard */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
        <KpiTileRowWithInsights 
          data={kpiData} 
          loading={loading}
          onKpiClick={handleDataPointClick}
        />
      </section>

      {/* Main Visualizations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sales Analytics</h2>
        
        {/* Performance Overview - Full Width */}
        <div style={{
          background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
          border: '1px solid rgba(0, 224, 255, 0.2)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 1
          }}>
            <button
              onClick={() => handleDataPointClick({ data: chartData, kpis: kpiData }, 'performance_overview')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <h3 style={{ 
            color: '#00e0ff',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 600
          }}>
            Performance Overview
          </h3>
          <PerformanceOverview 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
            dateRange={dateRange}
            summaryData={overviewSummaryData}
            chartType={overviewChartType}
            onChartTypeChange={setOverviewChartType}
          />
        </div>

        {/* Visualizations Grid */}
        <div className={styles.visualizationsGrid}>
        
        {/* Time Series Explorer */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Time Series Analysis</h3>
            <button
              onClick={() => handleDataPointClick({ data: chartData, metric: selectedMetric }, 'time_series')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <ChartWithAIInsights chartType="time_series" data={chartData}>
            <TimeSeriesExplorer 
              data={chartData} 
              loading={loading} 
              selectedMetric={selectedMetric} 
            />
          </ChartWithAIInsights>
        </section>

        {/* Performance Distribution */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Performance Distribution</h3>
            <button
              onClick={() => handleDataPointClick({ data: chartData, dimension: selectedDimension }, 'distribution')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <ChartWithAIInsights chartType="distribution" data={chartData}>
            <PerformanceDistributionAnalyzer 
              data={chartData} 
              loading={loading} 
              selectedDimension={selectedDimension}
              selectedMetric={selectedMetric}
            />
          </ChartWithAIInsights>
        </section>

        {/* Comparative Performance Grid */}
        <section className={styles.chartSection} style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Comparative Performance</h3>
            <button
              onClick={() => handleDataPointClick({ data: chartData, dimension: selectedDimension, metric: selectedMetric }, 'comparative_performance')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <ComparativePerformanceGrid 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
            dateRange={dateRange}
          />
        </section>

        {/* Correlation Matrix */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Performance Correlation</h3>
            <button
              onClick={() => handleDataPointClick({ data: chartData, dimension: selectedDimension }, 'correlation_matrix')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <PerformanceCorrelationMatrix 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            dateRange={dateRange}
          />
        </section>

        {/* Driver Analysis */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Performance Drivers</h3>
            <button
              onClick={() => handleDataPointClick({ data: chartData, dimension: selectedDimension, metric: selectedMetric }, 'performance_drivers')}
              style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                color: '#00e0ff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
              }}
            >
              🤖 AI Insights
            </button>
          </div>
          <PerformanceDriverAnalysis 
            data={chartData} 
            loading={loading} 
            selectedDimension={selectedDimension}
            selectedMetric={selectedMetric}
          />
        </section>
        </div>
      </section>

      {/* AI Components */}
      {showAIInsights && (
        <AIInsightsModal
          data={aiInsightData}
          onClose={() => setShowAIInsights(false)}
          onSendToChat={handleSendToChat}
        />
      )}

      {/* Business Intelligence Button */}
      <button
        onClick={() => setShowBIAgent(true)}
        className={styles.biButton}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 224, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          zIndex: 997,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 224, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 224, 255, 0.3)';
        }}
      >
        🧠
      </button>

      {/* Chatbot Button */}
      <ChatbotButton
        onClick={() => setShowChatbot(!showChatbot)}
        isOpen={showChatbot}
      />

      {/* Chatbot Component */}
      {showChatbot && (
        <UniversalChatbot
          defaultAgent="sales"
          onClose={() => setShowChatbot(false)}
          dashboardContext={{
            source_dashboard: 'sales_performance',
            sales_context: {
              kpis: kpiData,
              salesData: chartData,
              filters: {
                dateRange,
                selectedDimension,
                selectedMetric,
                selectedRegion,
                selectedCategory,
                selectedChannel
              }
            }
          }}
        />
      )}

      {/* Business Intelligence Component */}
      {showBIAgent && (
        <SalesBusinessIntelligence
          onClose={() => setShowBIAgent(false)}
          dashboardData={{
            kpis: kpiData,
            salesData: chartData,
            dimension: selectedDimension,
            metric: selectedMetric
          }}
        />
      )}
    </div>
  );
};

export default SalesPerformanceDashboard;