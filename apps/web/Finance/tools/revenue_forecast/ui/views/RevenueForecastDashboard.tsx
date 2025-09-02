import React, { useState, useEffect, useCallback } from 'react';
import styles from './RevenueForecastDashboard.module.css';
import KPITiles from '../components/kpi/KPITiles';
import RevenueGrowthDecomposition from '../components/visualizations/RevenueGrowthDecomposition';
import CohortRevenueRetention from '../components/visualizations/CohortRevenueRetention';
import TAMMarketShare from '../components/visualizations/TAMMarketShare';
import BCGGrowthMatrix from '../components/visualizations/BCGGrowthMatrix';
import CustomerEconomicsWaterfall from '../components/visualizations/CustomerEconomicsWaterfall';
import FilterSection from '../components/filters/FilterSection';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import RevenueBusinessIntelligence from '../components/bi/RevenueBusinessIntelligence';
import { fetchDashboardData } from '../api/revenueApi';

const RevenueForecastDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2021-01-01',
    endDate: '2021-12-31',
    segment: 'all',
    product: 'all',
    region: 'all',
    customer_type: 'all',
    revenue_type: 'all',
    forecast_horizon: '12_months',
    confidence_level: 80,
    scenario: 'base',
    comparison_period: 'previous_year'
  });

  // AI Features State
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [aiInsightData, setAIInsightData] = useState(null);
  const [showBIAgent, setShowBIAgent] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(filters);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load revenue forecast data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle chart/KPI clicks for AI Insights
  const handleDataPointClick = (data, chartType) => {
    setAIInsightData({
      ...data,
      chartType,
      context: 'revenue_forecast',
      filters
    });
    setShowAIInsights(true);
  };

  // Send data to chatbot
  const handleSendToChat = (data) => {
    // Data will be handled by the chatbot component
    setShowAIInsights(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Revenue Forecast Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
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
            <span className={styles.icon}>📊</span>
            Revenue Forecast Dashboard
          </h1>
          <p className={styles.subtitle}>
            Strategic revenue planning with AI-powered growth optimization
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterSection
        filters={filters}
        onFilterChange={handleFilterChange}
        segments={dashboardData?.data?.filters?.segments || []}
        products={dashboardData?.data?.filters?.products || []}
        regions={dashboardData?.data?.filters?.regions || []}
        customerTypes={dashboardData?.data?.filters?.customer_types || []}
      />

      {/* Strategic Growth KPI Tiles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Strategic Growth KPIs</h2>
        <KPITiles
          kpis={dashboardData?.data?.kpis}
          onKPIClick={handleDataPointClick}
        />
      </section>

      {/* Primary Visualizations Grid */}
      <div className={styles.primaryGrid}>
        {/* Revenue Growth Decomposition */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Revenue Growth Decomposition</h3>
          <RevenueGrowthDecomposition
            data={dashboardData?.data?.growthDecomposition}
            onDataClick={handleDataPointClick}
          />
        </section>

        {/* Cohort Revenue Retention */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Cohort Revenue Retention Analysis</h3>
          <CohortRevenueRetention
            data={dashboardData?.data?.cohortRetention}
            onCohortClick={handleDataPointClick}
          />
        </section>

        {/* TAM & Market Share */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>TAM Expansion & Market Share</h3>
          <TAMMarketShare
            data={dashboardData?.data?.tamMarketShare}
            onSegmentClick={handleDataPointClick}
          />
        </section>

      </div>

      {/* Secondary Visualizations Grid */}
      <div className={styles.secondaryGrid}>
        {/* BCG Growth-Share Matrix */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>BCG Portfolio Analysis</h3>
          <BCGGrowthMatrix
            data={dashboardData?.data?.bcgMatrix}
            onBubbleClick={handleDataPointClick}
          />
        </section>

        {/* Customer Economics */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Customer Economics</h3>
          <CustomerEconomicsWaterfall
            data={dashboardData?.data?.customerEconomics}
            onBarClick={handleDataPointClick}
          />
        </section>

      </div>

      {/* AI Components */}
      {showAIInsights && aiInsightData && (
        <AIInsightsModal
          data={aiInsightData}
          onClose={() => setShowAIInsights(false)}
          onSendToChat={handleSendToChat}
        />
      )}

      {/* Business Intelligence Button - positioned above chatbot */}
      <button
        onClick={() => setShowBIAgent(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
          border: 'none',
          boxShadow: '0 10px 40px rgba(0, 224, 255, 0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          transition: 'all 0.3s ease',
          zIndex: 999
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 15px 50px rgba(0, 224, 255, 0.7)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 224, 255, 0.5)';
        }}
        title="Revenue Intelligence Q&A"
      >
        🧠
      </button>

      {/* Chatbot Button - positioned at bottom */}
      <ChatbotButton
        onClick={() => setShowChatbot(!showChatbot)}
        isOpen={showChatbot}
      />

      {/* Universal Chatbot with @mentions support */}
      {showChatbot && (
        <UniversalChatbot
          defaultAgent="revenue"
          onClose={() => setShowChatbot(false)}
          dashboardContext={{
            source_dashboard: 'revenue_forecast',
            revenue_context: {
              kpis: dashboardData?.data?.kpis,
              growth_decomposition: dashboardData?.data?.growthDecomposition,
              cohort_retention: dashboardData?.data?.cohortRetention,
              filters: filters
            }
          }}
        />
      )}

      {/* Revenue Business Intelligence Panel */}
      {showBIAgent && (
        <RevenueBusinessIntelligence
          onClose={() => setShowBIAgent(false)}
          dashboardData={dashboardData}
        />
      )}
    </div>
  );
};

export default RevenueForecastDashboard;