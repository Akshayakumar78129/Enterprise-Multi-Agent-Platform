import React from 'react';
import styles from './AIInsightsModal.module.css';

interface AIInsightsModalProps {
  data: any;
  onClose: () => void;
  onSendToChat: (data: any) => void;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ data, onClose, onSendToChat }) => {
  // Generate revenue-specific insights based on data type
  const getInsights = (data: any) => {
    const insights = [];
    
    if (data.label === 'Rule of 40') {
      const score = data.value || 0;
      insights.push(`Rule of 40 score of ${score} indicates ${score > 50 ? 'elite performance' : score > 40 ? 'strong balance' : score > 30 ? 'improving trajectory' : 'growth-profitability imbalance'}`);
      insights.push(`Components: Growth Rate (${Math.round(score * 0.6)}%) + EBITDA Margin (${Math.round(score * 0.4)}%)`);
      insights.push(`${score > 40 ? '✅ Exceeds' : '⚠️ Below'} investor benchmark of 40 for SaaS companies`);
      insights.push(`Valuation impact: ${score > 40 ? 'Premium' : 'Discount'} multiple expected (${(score / 10).toFixed(1)}x revenue)`);
    } else if (data.label === 'Net Revenue Retention') {
      const nrr = data.value || 100;
      insights.push(`NRR of ${nrr}% shows ${nrr > 120 ? 'exceptional expansion' : nrr > 100 ? 'healthy growth' : 'revenue contraction'} from existing customers`);
      insights.push(`Breakdown: Expansion (+${Math.round(nrr * 0.3)}%) - Contraction (-${Math.round(nrr * 0.15)}%) - Churn (-${Math.round(nrr * 0.15)}%)`);
      insights.push(`${nrr > 100 ? 'Positive' : 'Negative'} land-and-expand motion with ${nrr > 120 ? 'best-in-class' : nrr > 100 ? 'good' : 'poor'} execution`);
      insights.push(`Customer Success effectiveness: ${nrr > 110 ? 'High' : nrr > 100 ? 'Moderate' : 'Low'}`);
    } else if (data.label === 'LTV/CAC Ratio') {
      const ratio = data.value || 0;
      insights.push(`LTV/CAC of ${ratio}x indicates ${ratio > 3 ? 'excellent' : ratio > 2 ? 'healthy' : 'unsustainable'} unit economics`);
      insights.push(`Payback period: ~${Math.round(12 / ratio)} months at current efficiency`);
      insights.push(`For every $1 spent on customer acquisition, generating $${ratio.toFixed(2)} in lifetime value`);
      insights.push(`${ratio > 3 ? 'Can accelerate' : ratio > 2 ? 'Maintain' : 'Must improve'} growth investments`);
    } else if (data.label === 'Revenue Quality Score') {
      const score = data.value || 0;
      insights.push(`Quality score of ${score}/100 reflects ${score > 80 ? 'premium' : score > 60 ? 'standard' : 'risky'} revenue characteristics`);
      insights.push(`Key drivers: Predictability (${Math.round(score * 0.4)}/40), Low concentration (${Math.round(score * 0.3)}/30), Recurring % (${Math.round(score * 0.3)}/30)`);
      insights.push(`Revenue multiple impact: ${(score / 10).toFixed(1)}x to ${(score / 8).toFixed(1)}x expected range`);
      insights.push(`Investor perception: ${score > 80 ? 'Very attractive' : score > 60 ? 'Acceptable' : 'Concerning'}`);
    } else if (data.label === 'Market Share Momentum') {
      const momentum = parseFloat(data.value) || 0;
      insights.push(`Market share momentum of ${momentum > 0 ? '+' : ''}${momentum}pp shows ${momentum > 2 ? 'strong gains' : momentum > 0 ? 'modest gains' : 'share loss'}`);
      insights.push(`Growing ${Math.abs(momentum)}pp ${momentum > 0 ? 'faster' : 'slower'} than market average`);
      insights.push(`Competitive position: ${momentum > 2 ? 'Gaining significantly' : momentum > 0 ? 'Holding/gaining slightly' : 'Losing ground'}`);
      insights.push(`Strategic implication: ${momentum > 0 ? 'Continue current strategy' : 'Reassess competitive approach'}`);
    } else if (data.chartType === 'revenue_growth') {
      insights.push(`Revenue component: ${data.name || 'Growth driver'}`);
      insights.push(`Impact: $${Math.abs(data.value / 1000000).toFixed(1)}M (${data.value > 0 ? 'positive' : 'negative'})`);
      insights.push(`Type: ${data.type === 'organic' ? 'Organic growth - sustainable' : data.type === 'inorganic' ? 'Inorganic - one-time' : 'Impact factor'}`);
      insights.push(`Contribution to total: ${((data.value / 100000000) * 100).toFixed(1)}% of base revenue`);
    } else if (data.chartType === 'cohort_retention') {
      insights.push(`Cohort: ${data.cohort || 'Customer segment'}`);
      insights.push(`Retention rate: ${data.retention || 95}% after ${data.period || 12} months`);
      insights.push(`Revenue expansion: ${data.expansion || 20}% from upsell/cross-sell`);
      insights.push(`Lifetime value trending: ${data.ltv_trend || 'Improving'}`);
    } else if (data.chartType === 'pricing_elasticity') {
      insights.push(`Price scenario: ${data.scenario || 'Base case'}`);
      insights.push(`Price change: ${data.price_change || 0}% → Volume impact: ${data.volume_impact || 0}%`);
      insights.push(`Revenue impact: ${data.revenue_impact || 0}% net change`);
      insights.push(`Margin impact: ${data.margin_impact || 0}pp change in gross margin`);
    } else {
      // Generic revenue insights
      insights.push('Click on visualizations to get specific revenue insights');
      insights.push('AI analysis helps identify growth opportunities and risks');
      insights.push('Recommendations based on SaaS metrics and best practices');
    }
    
    return insights;
  };

  const getRecommendations = (data: any) => {
    const recommendations = [];
    
    if (data.label === 'Rule of 40' && data.value < 40) {
      recommendations.push('Optimize CAC payback to improve profitability');
      recommendations.push('Focus on high-margin revenue streams');
      recommendations.push('Consider pricing optimization initiatives');
    } else if (data.label === 'Net Revenue Retention' && data.value < 100) {
      recommendations.push('Implement customer success programs');
      recommendations.push('Develop product stickiness features');
      recommendations.push('Create upsell/cross-sell playbooks');
    } else if (data.label === 'LTV/CAC Ratio' && data.value < 3) {
      recommendations.push('Improve sales efficiency and conversion');
      recommendations.push('Focus on higher-value customer segments');
      recommendations.push('Reduce customer acquisition costs');
    } else if (data.label === 'Revenue Quality Score' && data.value < 70) {
      recommendations.push('Increase recurring revenue percentage');
      recommendations.push('Diversify customer concentration');
      recommendations.push('Improve revenue predictability');
    } else if (data.label === 'Market Share Momentum' && parseFloat(data.value) < 0) {
      recommendations.push('Analyze competitive positioning');
      recommendations.push('Accelerate product innovation');
      recommendations.push('Strengthen go-to-market strategy');
    } else {
      recommendations.push('Continue monitoring growth metrics');
      recommendations.push('Document successful growth strategies');
      recommendations.push('Scale what\'s working effectively');
    }
    
    return recommendations;
  };

  const getActionItems = (data: any) => {
    const actions = [];
    
    if (data.label === 'Rule of 40') {
      actions.push({ priority: 'High', action: 'Review growth vs profitability trade-offs', timeline: 'This quarter' });
      actions.push({ priority: 'Medium', action: 'Optimize cost structure', timeline: 'Next 6 months' });
    } else if (data.label === 'Net Revenue Retention') {
      actions.push({ priority: 'High', action: 'Launch customer expansion campaign', timeline: 'Next 30 days' });
      actions.push({ priority: 'High', action: 'Implement churn early warning system', timeline: 'This quarter' });
    } else if (data.label === 'LTV/CAC Ratio') {
      actions.push({ priority: 'High', action: 'Audit and optimize sales funnel', timeline: 'Next 60 days' });
      actions.push({ priority: 'Medium', action: 'Test new acquisition channels', timeline: 'This quarter' });
    } else {
      actions.push({ priority: 'Medium', action: 'Review and adjust forecasts', timeline: 'Monthly' });
      actions.push({ priority: 'Low', action: 'Update board reporting', timeline: 'Quarterly' });
    }
    
    return actions;
  };

  // Generate insights and recommendations
  const insights = getInsights(data);
  const recommendations = getRecommendations(data);
  const actionItems = getActionItems(data);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <span className={styles.aiIcon}>🤖</span>
            AI Revenue Insights
          </h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          {/* Insights Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>💡</span>
              Key Insights
            </h4>
            <ul className={styles.insightsList}>
              {insights.map((insight, index) => (
                <li key={index} className={styles.insightItem}>
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🎯</span>
              Strategic Recommendations
            </h4>
            <ul className={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <li key={index} className={styles.recommendationItem}>
                  <span className={styles.recNumber}>{index + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Items Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📋</span>
              Action Items
            </h4>
            <div className={styles.actionItems}>
              {actionItems.map((item, index) => (
                <div key={index} className={styles.actionItem}>
                  <span className={`${styles.priority} ${styles[item.priority.toLowerCase()]}`}>
                    {item.priority}
                  </span>
                  <span className={styles.actionText}>{item.action}</span>
                  <span className={styles.timeline}>{item.timeline}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Context Data */}
          <div className={styles.contextData}>
            <span className={styles.contextLabel}>Context:</span>
            <span className={styles.contextValue}>
              {data.label || data.name || data.chartType || 'Revenue Analysis'}
            </span>
            {data.value && (
              <>
                <span className={styles.contextLabel}>Value:</span>
                <span className={styles.contextValue}>
                  {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
                  {data.unit || ''}
                </span>
              </>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.sendToChatButton}
            onClick={() => onSendToChat(data)}
          >
            <span className={styles.chatIcon}>💬</span>
            Discuss with AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;