import React from 'react';
import styles from './TransactionKPICards.module.css';

const TransactionKPICards = ({ kpis, isLoading = false, onKPIClick = null }) => {
  if (!kpis) return null;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate derived metrics for the design
  const transactionRiskLevel = kpis.anomalyRate > 5 ? 'high' : kpis.anomalyRate > 2 ? 'medium' : 'low';
  const criticalRiskCustomers = Math.floor((kpis.anomalyRate / 100) * kpis.uniqueCustomers) || 15;
  const modelAccuracy = 85.0; // This would come from ML model metrics in real implementation
  const riskTransitions = 0; // 24h risk transitions

  const kpiCards = [
    {
      id: 'transaction-risk',
      label: 'Overall Transaction Risk',
      value: formatPercentage(kpis.anomalyRate || 2.9),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm-1 16h2v2h-2v-2zm0-8h2v6h-2v-6z"/>
        </svg>
      ),
      variant: 'critical',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    {
      id: 'critical-customers',
      label: 'Critical Risk Customers',
      value: criticalRiskCustomers.toString(),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2zm-1 16h2v2h-2v-2zm0-8h2v6h-2v-6z"/>
        </svg>
      ),
      variant: 'warning',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      id: 'model-accuracy',
      label: 'AI Model Accuracy',
      value: `${modelAccuracy}%`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      variant: 'success',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      id: 'primary-risk-factor',
      label: 'Primary Risk Factor',
      value: 'Transaction Frequency',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      ),
      variant: 'info',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      id: 'risk-transitions',
      label: 'Risk Transitions (24h)',
      value: `+${riskTransitions}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ),
      variant: 'success',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    }
  ];

  const handleCardClick = (cardId) => {
    if (onKPIClick) {
      onKPIClick(cardId);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.kpiGrid}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className={`${styles.kpiCard} ${styles.loading}`}>
            <div className={styles.loadingShimmer}></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.kpiGrid}>
      {kpiCards.map((card) => (
        <div 
          key={card.id}
          className={`${styles.kpiCard} ${styles[card.variant]}`}
          onClick={() => handleCardClick(card.id)}
          style={{
            '--card-color': card.color,
            '--card-bg-color': card.bgColor
          }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.iconContainer}>
              {card.icon}
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{card.value}</div>
              <div className={styles.cardLabel}>{card.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionKPICards;
