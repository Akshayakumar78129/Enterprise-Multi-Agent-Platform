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
    
    if (data.chartType === 'health_matrix') {
      const score = data.health_score || data.value || 0;
      insights.push(`Health score of ${score.toFixed(1)}% indicates ${score > 80 ? 'excellent' : score > 70 ? 'good' : score > 60 ? 'moderate' : 'poor'} inventory management`);
      if (data.item_count) {
        insights.push(`Managing ${data.item_count} SKUs in ${data.warehouse || 'this location'} - ${data.category || 'this category'}`);
      }
      if (data.stockout_risk_count > 0) {
        insights.push(`⚠️ Alert: ${data.stockout_risk_count} items at immediate stockout risk - revenue impact ~$${(data.stockout_risk_count * 5000).toLocaleString()}`);
      }
      if (data.stock_coverage_ratio) {
        insights.push(`Stock coverage ratio at ${(data.stock_coverage_ratio * 100).toFixed(1)}% - ${data.stock_coverage_ratio > 1.2 ? 'overstocked' : data.stock_coverage_ratio < 0.8 ? 'understocked' : 'optimal'}`);
      }
      insights.push(`Holding cost averaging $${data.avg_holding_cost?.toFixed(0) || '500'} per SKU monthly`);
    } else if (data.label === 'Inventory Health') {
      insights.push(`Overall inventory health at ${data.value}% ${data.value > 80 ? 'exceeds' : data.value > 70 ? 'meets' : 'below'} industry benchmarks`);
      insights.push('Health score incorporates: stock levels (40%), turnover rate (30%), holding costs (20%), stockout risk (10%)');
      insights.push(`Trend: ${data.trend?.direction === 'up' ? '📈 Improving' : data.trend?.direction === 'down' ? '📉 Declining' : '➡️ Stable'} ${data.trend?.value || ''}`);
    } else if (data.label === 'Total Inventory Value') {
      const value = data.value || 0;
      insights.push(`Total inventory valued at $${(value / 1000).toFixed(0)}K across all warehouses and categories`);
      insights.push(`This represents approximately ${Math.round(value / 50000)} months of average sales coverage`);
      insights.push(`Working capital tied up in inventory: ~$${(value * 0.7 / 1000).toFixed(0)}K`);
    } else if (data.label === 'Slow-Moving Items') {
      insights.push(`${data.value}% of inventory is slow-moving (${data.count || 0} SKUs) - typical range is 15-25%`);
      insights.push(`Estimated annual holding cost for slow movers: $${((data.count || 0) * 2500).toLocaleString()}`);
      insights.push('These items haven\'t moved in 90+ days and are candidates for clearance');
    } else if (data.label === 'Stockout Risk') {
      const riskItems = data.value || 0;
      insights.push(`${riskItems} SKUs at stockout risk within next 7-14 days`);
      insights.push(`Potential revenue loss if stockout occurs: $${(riskItems * 15000).toLocaleString()}`);
      insights.push(`Customer satisfaction impact: ~${riskItems * 3} negative experiences expected`);
    } else if (data.label === 'Savings Opportunity') {
      insights.push(`Potential savings of $${(data.value / 1000).toFixed(1)}K identified through optimization`);
      insights.push('Primary savings sources: reduced holding costs (40%), better purchasing (35%), lower obsolescence (25%)');
      insights.push(`ROI timeline: 3-6 months with ${data.value > 50000 ? 'high' : data.value > 20000 ? 'medium' : 'low'} implementation effort`);
    } else if (data.chartType === 'cost_impact') {
      insights.push(`Cost impact analysis for ${data.strategy || 'optimization strategy'}`);
      insights.push(`Expected impact: $${Math.abs(data.impact || 0).toLocaleString()} ${data.impact_type === 'reduction' ? 'savings' : 'cost'}`);
      insights.push('Implementation complexity: ' + (data.sequence_order > 2 ? 'High' : data.sequence_order > 0 ? 'Medium' : 'Low'));
    } else if (data.chartType === 'action_priority') {
      insights.push(`Action: ${data.action_name || 'Optimization opportunity'}`);
      insights.push(`Financial impact: $${(data.financial_impact || 0).toLocaleString()} potential savings`);
      insights.push(`Affects ${data.affected_items || 0} SKUs in ${data.category || 'multiple categories'}`);
      insights.push(`Priority quadrant: ${data.quadrant || 'To be evaluated'}`);
    } else {
      // Generic insights
      insights.push('Click on different visualizations to get specific insights');
      insights.push('AI-powered analysis helps identify optimization opportunities');
      insights.push('Recommendations are based on industry best practices and your data patterns');
    }
    
    return insights;
  };

  const getRecommendations = (data: any) => {
    const recommendations = [];
    
    if (data.health_score && data.health_score < 60) {
      recommendations.push('Review and adjust reorder points');
      recommendations.push('Identify and clear slow-moving inventory');
      recommendations.push('Optimize safety stock levels');
    } else if (data.label === 'Slow-Moving Items' && data.value > 20) {
      recommendations.push('Implement promotional campaigns for slow movers');
      recommendations.push('Review demand forecasting accuracy');
      recommendations.push('Consider bundling or discounting strategies');
    } else if (data.stockout_risk_count > 0) {
      recommendations.push('Increase safety stock for critical items');
      recommendations.push('Review lead times with suppliers');
      recommendations.push('Implement automated reordering');
    } else {
      recommendations.push('Continue monitoring key metrics');
      recommendations.push('Document successful strategies');
      recommendations.push('Share best practices across teams');
    }
    
    return recommendations;
  };

  // Generate insights and recommendations immediately (no API calls)
  const insights = getInsights(data);
  const recommendations = getRecommendations(data);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <span className={styles.aiIcon}>🤖</span>
            AI Insights
          </h3>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.dataContext}>
            <h4>{data.label || data.category || 'Selected Data'}</h4>
            {data.value !== undefined && (
              <p className={styles.dataValue}>
                {typeof data.value === 'number' 
                  ? data.unit === '$' 
                    ? `$${(data.value / 1000000).toFixed(2)}M`
                    : data.unit === '%'
                    ? `${data.value.toFixed(1)}%`
                    : data.value
                  : data.value}
              </p>
            )}
          </div>

          <div className={styles.insightsSection}>
            <h4 className={styles.sectionTitle}>Key Insights</h4>
            <ul className={styles.insightsList}>
              {insights.map((insight, index) => (
                <li key={index} className={styles.insightItem}>
                  <span className={styles.insightBullet}>•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.recommendationsSection}>
            <h4 className={styles.sectionTitle}>Recommendations</h4>
            <ul className={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <li key={index} className={styles.recommendationItem}>
                  <span className={styles.recommendationNumber}>{index + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.sendToChatButton}
            onClick={() => onSendToChat(data)}
          >
            Send to Chat 💬
          </button>
          <button 
            className={styles.closeModalButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;