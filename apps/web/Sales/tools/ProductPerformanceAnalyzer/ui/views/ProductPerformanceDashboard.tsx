import React, { useState, useEffect, useCallback } from 'react';
import styles from './ProductPerformanceDashboard.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../state/store';
import { fetchProductPerformance, setDateRange, setSelectedCategory, setSelectedSubcategory, setMinSalesThreshold, resetFilters } from '../state/productPerformanceSlice';
import { ProductKpiData, ProductPerformanceState } from '../types';
import { KpiTileRow } from '../components/kpi/KpiTileRow';
import { KpiTileRowWithInsights } from '../components/kpi/KpiTileRowWithInsights';
import { SalesPerformanceExplorer } from '../components/visualizations/SalesPerformanceExplorer';
import { MarginAnalysisVisualizer } from '../components/visualizations/MarginAnalysisVisualizer';
import { PriceBandDistribution } from '../components/visualizations/PriceBandDistribution';
import { PriceBandDistributionWithInsights } from '../components/visualizations/PriceBandDistributionWithInsights';
import { FilterControls } from '../components/controls/FilterControls';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import ProductBusinessIntelligence from '../components/bi/ProductBusinessIntelligence';
import { ChartWithAIInsights } from '../components/wrappers/ChartWithAIInsights';

const ProductPerformanceDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    data, 
    loading, 
    error, 
    dateRange, 
    selectedCategory, 
    selectedSubcategory, 
    categories, 
    subcategories,
    analysisResult,
    scatterPlotData,
    priceBandChartData
  } = useSelector((state: { productPerformance: ProductPerformanceState }) => state.productPerformance);

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    dispatch(fetchProductPerformance());
  }, [dispatch, dateRange, selectedCategory, selectedSubcategory]);

  const handleDateRangeChange = (dateRange: { startDate: string; endDate: string }) => {
    dispatch(setDateRange(dateRange));
  };

  const handleCategoryChange = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleSubcategoryChange = (subcategory: string) => {
    dispatch(setSelectedSubcategory(subcategory));
  };

  const handleThresholdChange = (threshold: number) => {
    dispatch(setMinSalesThreshold(threshold));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data: any, chartType: string) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'product_performance',
      filters: {
        dateRange,
        selectedCategory,
        selectedSubcategory
      }
    });
    setShowAIInsights(true);
  };

  // Send data to chatbot
  const handleSendToChat = (data: any) => {
    // Data will be handled by the chatbot component
    setShowAIInsights(false);
  };

  const kpiData: ProductKpiData = analysisResult?.status === 'success' && analysisResult.results?.kpi ? {
    totalSales: analysisResult.results.kpi.totalSales,
    averageMargin: analysisResult.results.kpi.averageMargin,
    totalUnits: analysisResult.results.kpi.totalUnits,
    topCategory: analysisResult.results.kpi.topCategory,
    priceDistribution: analysisResult.results.kpi.priceDistribution,
  } : {
    totalSales: { value: 0, trend: 0, direction: 'neutral' },
    averageMargin: { value: 0, trend: 0, direction: 'neutral' },
    totalUnits: { value: 0, trend: 0, direction: 'neutral' },
    topCategory: { value: 'Loading...', percentage: 0 },
    priceDistribution: { dominant: 'Loading...', percentage: 0 },
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Product Performance Analyzer...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={() => dispatch(fetchProductPerformance())} className={styles.retryButton}>
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
            <span className={styles.icon}>📈</span>
            Product Performance Analyzer
          </h1>
          <p className={styles.subtitle}>
            AI-powered product insights and performance optimization
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className={styles.filterSection}>
        <FilterControls
          dateRange={dateRange}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          categories={categories}
          subcategories={subcategories}
          minSalesThreshold={0}
          onDateRangeChange={handleDateRangeChange}
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={handleSubcategoryChange}
          onMinSalesThresholdChange={handleThresholdChange}
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

      {/* Main Visualizations Grid */}
      <div className={styles.visualizationsGrid}>
        {/* Sales Performance Explorer */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Sales Performance Explorer</h3>
            <button
              onClick={() => handleDataPointClick({ data, type: 'sales_performance' }, 'sales_explorer')}
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
          <ChartWithAIInsights chartType="sales_explorer" data={data}>
            <SalesPerformanceExplorer data={data} loading={loading} />
          </ChartWithAIInsights>
        </section>

        {/* Margin Analysis */}
        <section className={styles.chartSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className={styles.chartTitle}>Margin Analysis</h3>
            <button
              onClick={() => handleDataPointClick({ scatterPlotData, averageMargin: kpiData.averageMargin.value }, 'margin_analysis')}
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
          <ChartWithAIInsights chartType="margin_analysis" data={scatterPlotData}>
            <MarginAnalysisVisualizer 
              data={scatterPlotData}
              loading={loading} 
              kpiAverageMargin={kpiData.averageMargin.value}
            />
          </ChartWithAIInsights>
        </section>

        {/* Price Band Distribution */}
        <section className={styles.chartSection} style={{ gridColumn: 'span 2' }}>
          <h3 className={styles.chartTitle}>Price Band Distribution</h3>
          <PriceBandDistributionWithInsights 
            loading={loading} 
            bands={priceBandChartData?.bands}
            distribution={priceBandChartData?.distribution}
            onBandClick={handleDataPointClick}
          />
        </section>
      </div>

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
            source_dashboard: 'product_performance',
            product_context: {
              kpis: kpiData,
              salesData: data,
              marginData: scatterPlotData,
              priceBands: priceBandChartData,
              filters: {
                dateRange,
                selectedCategory,
                selectedSubcategory
              }
            }
          }}
        />
      )}

      {/* Business Intelligence Component */}
      {showBIAgent && (
        <ProductBusinessIntelligence
          onClose={() => setShowBIAgent(false)}
          dashboardData={{
            kpis: kpiData,
            salesData: data,
            marginData: scatterPlotData,
            priceBands: priceBandChartData
          }}
        />
      )}
    </div>
  );
};

export default ProductPerformanceDashboard;