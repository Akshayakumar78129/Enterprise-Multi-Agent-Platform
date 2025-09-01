import React, { useState, useEffect, useCallback } from 'react';
import styles from './InventoryOptimizationDashboard.module.css';
import KPITiles from '../components/kpi/KPITiles';
import HealthMatrix from '../components/visualizations/HealthMatrix';
import CostImpactWaterfall from '../components/visualizations/CostImpactWaterfall';
import PerformanceTimeline from '../components/visualizations/PerformanceTimeline';
import ActionPriorityMatrix from '../components/visualizations/ActionPriorityMatrix';
import AgingAnalysis from '../components/visualizations/AgingAnalysis';
import FilterSection from '../components/filters/FilterSection';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { UniversalChatbot, ChatbotButton } from '../../../../../ui-common/chatbot';
import InventoryBusinessIntelligence from '../components/bi/InventoryBusinessIntelligence';
import { fetchDashboardData } from '../api/inventoryApi';

const InventoryOptimizationDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    warehouseId: 'all',
    category: 'all',
    metric: 'health_score'
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
      setError('Failed to load dashboard data. Please try again.');
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
      context: 'inventory_optimization',
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
        <p>Loading Inventory Optimization Analyzer...</p>
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
            <span className={styles.icon}>📦</span>
            Inventory Optimization Analyzer
          </h1>
          <p className={styles.subtitle}>
            AI-powered inventory intelligence and optimization
          </p>
        </div>
      </div>

      {/* Filters */}
      <FilterSection
        filters={filters}
        onFilterChange={handleFilterChange}
        warehouses={dashboardData?.data?.filters?.warehouses || []}
        categories={dashboardData?.data?.filters?.categories || []}
      />

      {/* KPI Dashboard */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
        <KPITiles
          kpis={dashboardData?.data?.kpis}
          onKPIClick={handleDataPointClick}
        />
      </section>

      {/* Main Visualizations Grid */}
      <div className={styles.visualizationsGrid}>
        {/* Health Matrix */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Inventory Health Matrix</h3>
          <HealthMatrix
            data={dashboardData?.data?.healthMatrix}
            onCellClick={handleDataPointClick}
          />
        </section>

        {/* Cost Impact Analysis */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Cost Impact Analysis</h3>
          <CostImpactWaterfall
            data={dashboardData?.data?.costImpact}
            onBarClick={handleDataPointClick}
          />
        </section>

        {/* Performance Timeline */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Performance Timeline</h3>
          <PerformanceTimeline
            data={dashboardData?.data?.performanceTimeline}
            metric={filters.metric}
            onPointClick={handleDataPointClick}
          />
        </section>

        {/* Action Priority Matrix */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Action Priority Matrix</h3>
          <ActionPriorityMatrix
            data={dashboardData?.data?.actionPriority}
            onBubbleClick={handleDataPointClick}
          />
        </section>

        {/* Aging Analysis */}
        <section className={styles.chartSection}>
          <h3 className={styles.chartTitle}>Inventory Aging Analysis</h3>
          <AgingAnalysis
            data={dashboardData?.data?.agingAnalysis}
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
        title="Business Intelligence Q&A"
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
          defaultAgent="inventory"
          onClose={() => setShowChatbot(false)}
          dashboardContext={{
            source_dashboard: 'inventory_optimization',
            inventory_context: {
              kpis: dashboardData?.data?.kpis,
              health_matrix: dashboardData?.data?.healthMatrix,
              filters: filters
            }
          }}
        />
      )}

      {/* Inventory Business Intelligence Panel */}
      {showBIAgent && (
        <InventoryBusinessIntelligence
          onClose={() => setShowBIAgent(false)}
          dashboardData={dashboardData}
        />
      )}
    </div>
  );
};

export default InventoryOptimizationDashboard;