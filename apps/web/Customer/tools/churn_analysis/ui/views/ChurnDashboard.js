import React, { useState, useEffect } from 'react';
import ChurnKPICards from '../components/ChurnKPICards';
import EnhancedChurnAI from '../components/EnhancedChurnAI';
import styles from './ChurnDashboard.module.css';

const ChurnDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample data matching the design specifications
  const sampleData = {
    kpis: {
      overallChurnRisk: 29,
      criticalRiskCustomers: 15,
      aiModelAccuracy: 85.0,
      primaryRiskFactor: 'Recency',
      riskTransitions24h: 0
    },
    insights: [
      {
        id: 'churn-risk',
        title: 'Overall Churn Risk',
        content: 'Current churn risk is at 29%, indicating moderate concern.',
        priority: 1,
        type: 'warning'
      },
      {
        id: 'model-accuracy',
        title: 'AI Model Performance',
        content: 'Model accuracy is performing well at 85.0%.',
        priority: 2,
        type: 'success'
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/churn-analysis/data');
        // const result = await response.json();
        
        // For now, use sample data
        setTimeout(() => {
          setDashboardData(sampleData);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNavigateToChart = (chartType) => {
    console.log(`Navigating to ${chartType}`);
    // Implementation for chart navigation
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Main Dashboard Area */}
      <div className={styles.mainDashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Churn Analysis Dashboard</h1>
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <ChurnKPICards 
              data={dashboardData?.kpis} 
              isLoading={isLoading}
            />

            {/* Navigation Buttons */}
            <div className={styles.navigationSection}>
              <button 
                className={styles.navButton}
                onClick={() => handleNavigateToChart('risk-pyramid')}
              >
                <div className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 22h20L12 2zm0 3.5L19.5 20h-15L12 5.5z"/>
                  </svg>
                </div>
                <span>Risk Distribution Pyramid</span>
              </button>

              <button 
                className={styles.navButton}
                onClick={() => handleNavigateToChart('churn-probability')}
              >
                <div className={styles.navIcon}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <span>Churn Probability Distribution</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Churn AI Sidebar */}
      <div className={styles.aiSidebar}>
        <EnhancedChurnAI insights={dashboardData?.insights} />
      </div>
    </div>
  );
};

export default ChurnDashboard;
