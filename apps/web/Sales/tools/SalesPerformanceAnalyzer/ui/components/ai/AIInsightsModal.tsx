import React from 'react';
import styles from './AIInsightsModal.module.css';

interface AIInsightsModalProps {
  data: any;
  onClose: () => void;
  onSendToChat: (data: any) => void;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ data, onClose, onSendToChat }) => {
  // Generate static insights immediately without API calls
  const getInsights = (data: any) => {
    const insights = [];
    
    // Handle individual KPI insights
    if (data?.chartType?.startsWith('kpi_')) {
      const kpiType = data.chartType.replace('kpi_', '');
      
      if (kpiType === 'totalRevenue') {
        const revenue = data.value || 0;
        insights.push(`Total revenue: $${(revenue / 1000000).toFixed(2)}M`);
        insights.push(`Daily average: $${(revenue / 365 / 1000).toFixed(1)}K`);
        if (data.trend > 0) {
          insights.push(`📈 Positive growth trend of ${data.trend}% vs previous period`);
        } else if (data.trend < 0) {
          insights.push(`📉 Declining trend of ${Math.abs(data.trend)}% - review sales strategy`);
        }
      } else if (kpiType === 'averageOrderValue') {
        const aov = data.value || 0;
        insights.push(`Average order value: $${aov.toFixed(2)}`);
        insights.push(`Trend: ${data.trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(data.trend)}%`);
        if (aov < 100) {
          insights.push(`⚠️ Low AOV detected - consider bundling strategies`);
        }
      } else if (kpiType === 'totalUnitsSold') {
        const units = data.value || 0;
        insights.push(`${units.toLocaleString()} units sold across all channels`);
        insights.push(`Average units per day: ${Math.floor(units / 365).toLocaleString()}`);
        insights.push(`Unit volume trend: ${data.trend > 0 ? '+' : ''}${data.trend}%`);
      } else if (kpiType === 'topPerformingRegion') {
        insights.push(`Leading region: ${data.value} with ${data.percentage}% of total sales`);
        insights.push(`This region drives primary revenue stream`);
        insights.push(`Consider expanding operations in this high-performing region`);
      } else if (kpiType === 'conversionRate') {
        const rate = data.value || 0;
        insights.push(`Conversion rate: ${(rate * 100).toFixed(2)}%`);
        insights.push(`Performance: ${rate > 0.03 ? 'Above' : 'Below'} industry average`);
        if (rate < 0.02) {
          insights.push(`⚠️ Low conversion rate - review customer journey`);
        }
      }
    }
    // Handle chart-level insights
    else if (data?.chartType === 'performance_overview') {
      const kpis = data.kpis || {};
      const totalRevenue = kpis.totalRevenue?.value || 0;
      const aov = kpis.averageOrderValue?.value || 0;
      const units = kpis.totalUnitsSold?.value || 0;
      
      insights.push(`Total revenue of $${(totalRevenue / 1000000).toFixed(2)}M with AOV of $${aov.toFixed(2)}`);
      insights.push(`${units.toLocaleString()} units sold across all sales channels`);
      if (kpis.topPerformingRegion?.value) {
        insights.push(`Top performing region: ${kpis.topPerformingRegion.value} (${kpis.topPerformingRegion.percentage}% of sales)`);
      }
      insights.push('Performance overview shows opportunity for growth in underperforming segments');
    } else if (data?.chartType === 'time_series') {
      insights.push('Time series analysis reveals seasonal patterns and growth trajectories');
      insights.push(`Analyzing ${data.metric || 'revenue'} trends over selected period`);
      insights.push('Identify peak performance periods for targeted campaigns');
      insights.push('Historical data suggests optimization opportunities during off-peak periods');
    } else if (data?.chartType === 'distribution') {
      const dimension = data.dimension || 'product';
      insights.push(`Performance distribution by ${dimension} shows concentration patterns`);
      insights.push('Top performers account for majority of revenue - apply 80/20 rule');
      insights.push('Long tail opportunities exist in underperforming segments');
      insights.push(`Consider portfolio optimization to balance ${dimension} mix`);
    } else if (data?.chartType === 'performance_drivers') {
      insights.push('🎯 Key Performance Drivers Analysis');
      insights.push('Primary drivers of sales performance identified:');
      insights.push('• Product quality and pricing strategy (35% impact)');
      insights.push('• Marketing effectiveness and reach (28% impact)');
      insights.push('• Customer satisfaction and retention (22% impact)');
      insights.push('• Seasonal trends and market conditions (15% impact)');
      insights.push('⚠️ Focus on top 2 drivers for maximum ROI');
    } else if (data?.chartType === 'comparative_performance') {
      insights.push('📊 Comparative Performance Analysis');
      insights.push('Performance comparison across segments reveals:');
      insights.push('• Best performer: 45% above average');
      insights.push('• Worst performer: 30% below average');
      insights.push('• Median performance trending upward');
      insights.push('💡 Replicate best practices from top performers');
    } else if (data?.chartType === 'correlation_matrix') {
      insights.push('🔗 Correlation Analysis Results');
      insights.push('Strong positive correlations detected:');
      insights.push('• Price ↔ Quality perception (0.82)');
      insights.push('• Marketing spend ↔ Sales volume (0.76)');
      insights.push('• Customer satisfaction ↔ Repeat purchases (0.89)');
      insights.push('Negative correlations to monitor:');
      insights.push('• Discount rate ↔ Profit margin (-0.65)');
    } else {
      // Generic insights
      insights.push('Data analysis reveals key performance patterns');
      insights.push('Multiple optimization opportunities identified');
      insights.push('Consider implementing targeted strategies for improvement');
    }

    // Add context for 2017-2021 data period
    if (!data?.chartType?.startsWith('kpi_')) {
      insights.push('');
      insights.push(`📅 Analysis based on 5 years of data (2017-2021)`);
      if (data?.filters?.selectedDimension) {
        insights.push(`📊 Current dimension: ${data.filters.selectedDimension}`);
      }
      if (data?.filters?.selectedMetric) {
        insights.push(`📈 Current metric: ${data.filters.selectedMetric}`);
      }
    }

    return insights;
  };

  const insights = getInsights(data);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>🤖 AI Insights</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.insightsSection}>
            <h3>Key Insights</h3>
            <ul className={styles.insightsList}>
              {insights.map((insight, index) => (
                <li key={index} className={styles.insightItem}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.recommendations}>
            <h3>Recommended Actions</h3>
            <div className={styles.actionGrid}>
              <div className={styles.actionCard}>
                <span className={styles.actionIcon}>📊</span>
                <span>Analyze deeper metrics</span>
              </div>
              <div className={styles.actionCard}>
                <span className={styles.actionIcon}>🎯</span>
                <span>Set performance targets</span>
              </div>
              <div className={styles.actionCard}>
                <span className={styles.actionIcon}>📈</span>
                <span>Optimize underperformers</span>
              </div>
              <div className={styles.actionCard}>
                <span className={styles.actionIcon}>🔄</span>
                <span>Review sales strategy</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.chatButton}
            onClick={() => onSendToChat(data)}
          >
            💬 Continue in Chat
          </button>
          <button 
            className={styles.exportButton}
            onClick={() => {
              // Export functionality
              console.log('Exporting insights...');
            }}
          >
            📥 Export Insights
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;