import React, { useState, useEffect, useCallback } from 'react';
import styles from './ARAgingDashboard.module.css';
import KPITiles from '../components/kpi/KPITiles';
import NPVPortfolioChart from '../components/visualizations/NPVPortfolioChart';
import CustomerMatrix from '../components/visualizations/CustomerMatrix';
import RiskHeatMap from '../components/visualizations/RiskHeatMap';
import CollectionForecast from '../components/visualizations/CollectionForecast';
import FilterSection from '../components/filters/FilterSection';
import AIInsightsModal from '../components/ai/AIInsightsModal';
import { ChatbotIntegration } from '../components/ai-interaction/ChatbotIntegration';
import { BIAgent } from '../components/ai-interaction/BIAgent';
import { fetchARData, fetchCollectionForecast } from '../api/arApi';

const ARAgingDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    customerSegment: 'all',
    riskLevel: 'all',
    wacc: 10
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
      const data = await fetchARData(filters);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading AR data:', err);
      setError('Failed to load AR aging data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleKPIClick = (data, type) => {
    setAIInsightData({ data, type, context: 'kpi' });
    setShowAIInsights(true);
  };

  const handleChartClick = (data, type) => {
    setAIInsightData({ data, type, context: 'visualization' });
    setShowAIInsights(true);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading AR Aging Analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={loadDashboardData} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Accounts Receivable Aging Analysis</h1>
          <p className={styles.subtitle}>Strategic Working Capital Optimization Platform</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={() => setShowBIAgent(true)}
            className={styles.biButton}
          >
            BI Agent
          </button>
          <button 
            onClick={() => setShowAIInsights(true)}
            className={styles.aiButton}
          >
            AI Insights
          </button>
        </div>
      </header>

      <FilterSection 
        filters={filters}
        onFiltersChange={handleFilterChange}
        className={styles.filterSection}
      />

      {dashboardData && (
        <>
          <KPITiles 
            kpis={dashboardData.kpis}
            onKPIClick={handleKPIClick}
            className={styles.kpiSection}
          />

          <div className={styles.mainGrid}>
            <div className={styles.chartContainer}>
              <NPVPortfolioChart 
                data={dashboardData.agingBuckets}
                wacc={filters.wacc}
                onChartClick={handleChartClick}
              />
            </div>

            <div className={styles.chartContainer}>
              <CustomerMatrix 
                data={dashboardData.customerRisks}
                onChartClick={handleChartClick}
              />
            </div>

            <div className={styles.chartContainer}>
              <RiskHeatMap 
                data={dashboardData.customerRisks}
                onChartClick={handleChartClick}
              />
            </div>

            <div className={styles.chartContainer}>
              <CollectionForecast 
                onChartClick={handleChartClick}
              />
            </div>
          </div>
        </>
      )}

      {/* AI Insights Modal */}
      <AIInsightsModal 
        show={showAIInsights}
        onClose={() => setShowAIInsights(false)}
        data={aiInsightData}
      />

      {/* Business Intelligence Agent */}
      {showBIAgent && (
        <div style={{ 
          position: 'fixed', 
          bottom: '120px', 
          right: '20px', 
          zIndex: 1000, 
          width: '400px',
          height: '500px'
        }}>
          <BIAgent onClose={() => setShowBIAgent(false)} />
        </div>
      )}

      {/* Universal Chatbot */}
      {showChatbot && (
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          zIndex: 1000 
        }}>
          <ChatbotIntegration onClose={() => setShowChatbot(false)} />
        </div>
      )}
      
      {/* Chat Button */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#00e0ff',
            border: 'none',
            color: '#0a1224',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 4px 16px rgba(0, 224, 255, 0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          💬
        </button>
      )}
    </div>
  );
};

export default ARAgingDashboard;