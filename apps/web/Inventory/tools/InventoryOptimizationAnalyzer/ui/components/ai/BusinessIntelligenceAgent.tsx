import React, { useState, useEffect } from 'react';
import styles from './BusinessIntelligenceAgent.module.css';

interface BusinessIntelligenceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardData: any;
  filters: any;
}

const BusinessIntelligenceAgent: React.FC<BusinessIntelligenceAgentProps> = ({
  isOpen,
  onClose,
  dashboardData,
  filters
}) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      generateExecutiveInsights();
    }
  }, [isOpen, dashboardData]);

  const generateExecutiveInsights = () => {
    setLoading(true);
    
    // Generate insights based on dashboard data
    const executiveInsights = [];
    
    if (dashboardData?.data?.kpis) {
      const { inventoryHealth, totalValue, slowMoving, savingsOpportunity } = dashboardData.data.kpis;
      
      executiveInsights.push({
        type: 'summary',
        title: 'Executive Summary',
        content: `Inventory health score is ${inventoryHealth?.value?.toFixed(1)}% with total inventory value of $${(totalValue?.value / 1000000).toFixed(2)}M. ${slowMoving?.value?.toFixed(1)}% of inventory is slow-moving, presenting a savings opportunity of $${(savingsOpportunity?.value / 1000).toFixed(1)}K.`,
        priority: 'high'
      });

      if (inventoryHealth?.value < 70) {
        executiveInsights.push({
          type: 'alert',
          title: 'Critical Action Required',
          content: 'Inventory health is below optimal levels. Immediate optimization strategies should be implemented to improve stock management and reduce costs.',
          priority: 'critical'
        });
      }

      if (slowMoving?.value > 20) {
        executiveInsights.push({
          type: 'opportunity',
          title: 'Slow-Moving Inventory Optimization',
          content: `${slowMoving.count} items are moving slowly. Consider promotional campaigns, bundling strategies, or liquidation to free up capital.`,
          priority: 'high'
        });
      }

      executiveInsights.push({
        type: 'recommendation',
        title: 'Strategic Recommendations',
        content: 'Focus on quick-win optimizations in high-value categories. Implement automated reordering for critical items and review safety stock levels quarterly.',
        priority: 'medium'
      });
    }

    setInsights(executiveInsights);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.biContainer}>
      <div className={styles.biHeader}>
        <div className={styles.headerContent}>
          <span className={styles.biIcon}>🧠</span>
          <h2 className={styles.biTitle}>Business Intelligence Hub</h2>
          <p className={styles.biSubtitle}>Executive Insights & Strategic Recommendations</p>
        </div>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      <div className={styles.biContent}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <p>Generating executive insights...</p>
          </div>
        ) : (
          <>
            <div className={styles.insightsGrid}>
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`${styles.insightCard} ${styles[insight.type]} ${styles[insight.priority]}`}
                >
                  <div className={styles.insightHeader}>
                    <span className={styles.insightTypeIcon}>
                      {insight.type === 'alert' ? '⚠️' :
                       insight.type === 'opportunity' ? '💡' :
                       insight.type === 'recommendation' ? '📋' : '📊'}
                    </span>
                    <h3 className={styles.insightTitle}>{insight.title}</h3>
                  </div>
                  <p className={styles.insightContent}>{insight.content}</p>
                  {insight.priority === 'critical' && (
                    <div className={styles.priorityBadge}>CRITICAL</div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.metricsOverview}>
              <h3 className={styles.overviewTitle}>Key Performance Metrics</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>ROI Potential</span>
                  <span className={styles.metricValue}>15-25%</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Implementation Time</span>
                  <span className={styles.metricValue}>3-6 months</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Risk Level</span>
                  <span className={styles.metricValue}>Medium</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>Impact Score</span>
                  <span className={styles.metricValue}>8.5/10</span>
                </div>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.exportButton}>
                Export Report 📄
              </button>
              <button className={styles.scheduleButton}>
                Schedule Review 📅
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessIntelligenceAgent;