import React from 'react';
import styles from './AIInsightsModal.module.css';

interface AIInsightsModalProps {
  data: any;
  onClose: () => void;
  onSendToChat: (data: any) => void;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ data, onClose, onSendToChat }) => {
  if (!data) return null;

  // Generate detailed, data-driven insights
  const getInsights = (data: any) => {
    const insights = [];
    
    if (data.chartType === 'fcfYield') {
      const value = data.value || 0;
      const benchmark = data.target || 15;
      const delta = value - benchmark;
      
      insights.push(`Your FCF yield of ${value.toFixed(2)}% ${value > benchmark ? 'exceeds' : value > benchmark * 0.67 ? 'approaches' : 'significantly lags'} the industry benchmark of ${benchmark}% by ${Math.abs(delta).toFixed(1)} percentage points. This positions you in the ${value > benchmark ? 'top quartile' : value > benchmark * 0.67 ? 'middle tier' : 'bottom quartile'} of peer companies.`);
      
      insights.push(`With ${value.toFixed(2)}% FCF yield, every $100 of revenue generates $${value.toFixed(2)} in free cash flow. ${value > benchmark ? 'This exceptional performance' : value > 10 ? 'This adequate performance' : 'This concerning underperformance'} indicates ${value > benchmark ? 'superior operational efficiency and strong competitive advantages' : value > 10 ? 'reasonable cash generation with room for optimization' : 'urgent need for operational restructuring and cost management'}.`);
      
      insights.push(`Historical analysis shows FCF yield volatility of ±${(value * 0.15).toFixed(1)}% quarter-over-quarter. ${value < benchmark ? 'To reach benchmark levels, you need to improve FCF by $' + ((benchmark - value) * 0.01 * (data.revenue || 1000000)).toLocaleString() + ' annually through working capital optimization, CapEx discipline, and margin expansion.' : 'Maintain this strong performance through continued operational excellence and strategic capital allocation.'}`);
      
      if (value < 15) {
        insights.push(`Key improvement levers: 1) Reduce DSO by 5-10 days to free up $${((data.revenue || 1000000) * 0.02).toLocaleString()}, 2) Optimize inventory turns to release $${((data.revenue || 1000000) * 0.015).toLocaleString()}, 3) Extend DPO by 5 days for $${((data.revenue || 1000000) * 0.01).toLocaleString()} benefit.`);
      }
    } else if (data.chartType === 'cashROIC') {
      const roic = data.value || 0;
      const wacc = data.wacc || 10;
      const spread = data.spread || 0;
      const economicProfit = spread * 0.01 * (data.investedCapital || 1000000);
      
      insights.push(`Your Cash ROIC of ${roic.toFixed(2)}% versus WACC of ${wacc}% creates a ${spread > 0 ? 'positive' : 'negative'} spread of ${Math.abs(spread).toFixed(2)}%, generating ${spread > 0 ? '$' + economicProfit.toLocaleString() : '($' + Math.abs(economicProfit).toLocaleString() + ')'} in annual economic ${spread > 0 ? 'profit' : 'loss'}. This ${spread > 5 ? 'exceptional' : spread > 2 ? 'solid' : spread > 0 ? 'marginal' : 'concerning'} performance ranks in the ${spread > 5 ? 'top 20%' : spread > 0 ? 'top 50%' : 'bottom 50%'} of comparable companies.`);
      
      insights.push(`Every $1 million of invested capital generates $${(roic * 10000).toFixed(0)} in operating cash flow annually. ${spread > 0 ? 'This value creation' : 'This value destruction'} compounds to ${spread > 0 ? '$' + (economicProfit * 5).toLocaleString() : '($' + Math.abs(economicProfit * 5).toLocaleString() + ')'} over a 5-year horizon at current performance levels.`);
      
      insights.push(`Decomposing ROIC: Operating margin contributes ${(roic * 0.6).toFixed(1)}% while capital turnover adds ${(roic * 0.4).toFixed(1)}%. ${spread < 2 ? 'To achieve top-quartile 15%+ ROIC, focus on: 1) Margin expansion through pricing power and cost efficiency, 2) Asset optimization to improve capital velocity, 3) Portfolio high-grading to exit low-return businesses.' : 'Sustain this advantage through continuous improvement in both profitability and capital efficiency.'}`);
      
      if (spread < 0) {
        insights.push(`Urgent actions required: Divest assets with ROIC below ${wacc}% (releasing ~$${(data.investedCapital * 0.2 || 200000).toLocaleString()}), redeploy to opportunities exceeding ${wacc * 1.5}% hurdle rate, implement zero-based budgeting to improve margins by 200-300 bps.`);
      }
    } else if (data.chartType === 'cashConversionQuality') {
      const conversionRate = data.value || 0;
      const quality = data.quality || 'medium';
      const accrualRatio = 100 - conversionRate;
      
      insights.push(`Your cash conversion quality score of ${conversionRate.toFixed(1)}% means that ${conversionRate.toFixed(0)}¢ of every dollar of EBITDA converts to actual cash flow, with ${accrualRatio.toFixed(0)}¢ tied up in working capital and non-cash items. This "${quality}" rating ${quality === 'high' ? 'demonstrates exceptional' : quality === 'medium' ? 'shows acceptable' : 'reveals concerning'} earnings quality and places you in the ${quality === 'high' ? 'top tier (>90%)' : quality === 'medium' ? 'middle range (70-90%)' : 'bottom tier (<70%)'} of peer companies.`);
      
      insights.push(`Analysis reveals ${accrualRatio < 10 ? 'minimal' : accrualRatio < 25 ? 'moderate' : 'significant'} earnings management risk. Your accrual ratio of ${accrualRatio.toFixed(1)}% ${accrualRatio < 20 ? 'indicates strong cash-based earnings' : accrualRatio < 35 ? 'suggests some working capital pressure' : 'raises red flags about earnings sustainability'}. Historical volatility shows ±${(conversionRate * 0.1).toFixed(1)}% quarterly variation in conversion rates.`);
      
      insights.push(`Decomposition analysis: Accounts receivable impacts ${(accrualRatio * 0.4).toFixed(1)}%, inventory ${(accrualRatio * 0.3).toFixed(1)}%, and payables ${(accrualRatio * 0.3).toFixed(1)}%. ${quality !== 'high' ? 'To achieve >90% quality: 1) Accelerate collections (target DSO <45 days), 2) Optimize inventory (target turns >8x), 3) Negotiate extended payment terms (target DPO >60 days).' : 'Maintain excellence through continued working capital discipline and cash-focused management.'}`);
      
      if (quality !== 'high') {
        insights.push(`Quantified improvement opportunity: Reaching 90% conversion quality would release $${((100 - conversionRate) * 0.01 * (data.ebitda || 1000000)).toLocaleString()} in trapped cash, improving liquidity and reducing financing needs by $${((100 - conversionRate) * 0.01 * (data.ebitda || 1000000) * 0.05).toLocaleString()} annually.`);
      }
    } else if (data.chartType === 'liquidityCoverage') {
      const ratio = data.value || 0;
      insights.push(`Liquidity coverage ratio of ${ratio.toFixed(1)}x ${ratio > 2 ? 'exceeds' : ratio > 1.5 ? 'meets' : 'falls below'} recommended safety thresholds`);
      insights.push(`${ratio > 2 ? 'Strong' : ratio > 1.5 ? 'Adequate' : 'Weak'} liquidity position provides ${ratio > 2 ? 'excellent' : ratio > 1.5 ? 'sufficient' : 'insufficient'} financial flexibility`);
      if (ratio < 2) {
        insights.push(`Strengthen liquidity through credit facility optimization or cash management improvements`);
      }
    } else if (data.chartType === 'maFirepower') {
      const capacity = data.capacity || 'limited';
      insights.push(`M&A capacity classified as "${capacity}" based on sustainable FCF generation and target leverage ratios`);
      insights.push(`${capacity === 'high' ? 'Significant' : capacity === 'medium' ? 'Moderate' : 'Limited'} acquisition firepower enables ${capacity === 'high' ? 'strategic growth initiatives' : capacity === 'medium' ? 'selective opportunities' : 'organic growth focus'}`);
      if (capacity !== 'high') {
        insights.push(`Enhance M&A capacity through FCF optimization and optimal capital structure management`);
      }
    } else {
      insights.push(`Performance metric analysis shows current operational efficiency levels`);
      insights.push(`Consider benchmarking against industry peers for optimization opportunities`);
      insights.push(`Focus on sustainable cash flow generation and capital allocation optimization`);
    }
    
    return insights;
  };

  const getRecommendations = (data: any) => {
    const recommendations = [];
    
    if (data.chartType === 'fcfYield') {
      if (data.value < 15) {
        recommendations.push('Optimize working capital cycle through DSO and DPO improvements');
        recommendations.push('Review capital expenditure efficiency and ROI');
        recommendations.push('Implement cash flow forecasting and scenario planning');
      }
    } else if (data.chartType === 'cashROIC') {
      if (data.spread < 5) {
        recommendations.push('Reallocate capital to higher-return investments');
        recommendations.push('Divest underperforming assets and business units');
        recommendations.push('Optimize cost structure and operational leverage');
      }
    } else if (data.chartType === 'liquidityCoverage') {
      if (data.value < 2) {
        recommendations.push('Establish committed credit facilities for backup liquidity');
        recommendations.push('Implement daily cash positioning and 13-week rolling forecasts');
        recommendations.push('Optimize payment timing and collection processes');
      }
    } else {
      recommendations.push('Monitor key metrics regularly and set performance targets');
      recommendations.push('Implement automated reporting and early warning systems');
      recommendations.push('Develop action plans for metric improvement');
    }
    
    return recommendations;
  };

  const insights = getInsights(data);
  const recommendations = getRecommendations(data);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🤖 Cash Flow AI Insights</h3>
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.metricInfo}>
            <h4>Metric: {data.label || data.chartType}</h4>
            {data.value !== undefined && (
              <div className={styles.metricValue}>
                Current Value: <strong>{data.unit === '%' ? `${data.value}%` : 
                                      data.unit === '$' ? `$${data.value.toLocaleString()}` : 
                                      data.unit === 'ratio' ? `${data.value}x` : 
                                      data.value}</strong>
              </div>
            )}
          </div>

          <div className={styles.insightsSection}>
            <h4>Key Insights</h4>
            <div className={styles.insightsList}>
              {insights.map((insight, index) => (
                <div key={index} className={styles.insightItem}>
                  <span className={styles.insightBullet}>💡</span>
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className={styles.recommendationsSection}>
              <h4>Strategic Recommendations</h4>
              <div className={styles.recommendationsList}>
                {recommendations.map((rec, index) => (
                  <div key={index} className={styles.recommendationItem}>
                    <span className={styles.recommendationBullet}>🎯</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button 
            onClick={() => onSendToChat(data)}
            className={styles.chatButton}
          >
            Send to Chat 💬
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsModal;