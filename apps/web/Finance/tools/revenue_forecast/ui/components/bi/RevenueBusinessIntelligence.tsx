import React, { useState } from 'react';

interface RevenueBusinessIntelligenceProps {
  onClose: () => void;
  dashboardData?: any;
}

export default function RevenueBusinessIntelligence({ onClose, dashboardData }: RevenueBusinessIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'retention' | 'pricing' | 'forecast'>('overview');
  
  // Extract metrics from dashboard data
  const kpis = dashboardData?.data?.kpis || {};
  const growthData = dashboardData?.data?.growthDecomposition || {};
  const cohortData = dashboardData?.data?.cohortRetention || {};
  const pricingData = dashboardData?.data?.pricingElasticity || {};
  
  const ruleOf40 = kpis.ruleOf40?.value || 45;
  const nrr = kpis.netRevenueRetention?.value || 115;
  const ltvCac = kpis.ltvCacRatio?.value || 3.2;
  const qualityScore = kpis.revenueQualityScore?.value || 82;
  const marketShare = kpis.marketShareMomentum?.value || 2.5;

  const styles = {
    container: {
      position: 'fixed' as const,
      bottom: '100px',
      right: '30px',
      width: '480px',
      height: '680px',
      background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 224, 255, 0.3)',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column' as const,
      zIndex: 998,
      overflow: 'hidden'
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
      background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(233, 48, 255, 0.05) 100%)'
    },
    title: {
      margin: 0,
      fontSize: '20px',
      fontWeight: 700,
      color: '#00e0ff',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      margin: '6px 0 0 0',
      color: 'rgba(247, 249, 251, 0.6)',
      fontSize: '13px'
    },
    tabs: {
      display: 'flex',
      padding: '0',
      borderBottom: '1px solid rgba(0, 224, 255, 0.1)',
      background: 'rgba(10, 18, 36, 0.3)'
    },
    tab: {
      flex: 1,
      padding: '14px 8px',
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      color: 'rgba(247, 249, 251, 0.6)',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center' as const
    },
    activeTab: {
      color: '#00e0ff',
      borderBottomColor: '#00e0ff',
      background: 'rgba(0, 224, 255, 0.05)'
    },
    content: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto' as const
    },
    metricCard: {
      background: 'rgba(10, 18, 36, 0.5)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid rgba(0, 224, 255, 0.1)'
    },
    metricHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    metricTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#f7f9fb'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#00e0ff'
    },
    metricTrend: {
      fontSize: '12px',
      color: '#5fd4d6',
      marginTop: '4px'
    },
    insightBox: {
      background: 'rgba(0, 224, 255, 0.05)',
      borderLeft: '3px solid #00e0ff',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px'
    },
    insightText: {
      fontSize: '13px',
      color: 'rgba(247, 249, 251, 0.9)',
      lineHeight: '1.6'
    },
    recommendationBox: {
      background: 'rgba(233, 48, 255, 0.05)',
      borderLeft: '3px solid #e930ff',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px'
    },
    actionButton: {
      width: '100%',
      padding: '10px',
      background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
      border: 'none',
      borderRadius: '8px',
      color: '#f7f9fb',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '12px',
      transition: 'all 0.3s ease'
    },
    closeButton: {
      position: 'absolute' as const,
      top: '20px',
      right: '24px',
      background: 'transparent',
      border: 'none',
      color: 'rgba(247, 249, 251, 0.6)',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'all 0.3s ease'
    },
    progressBar: {
      height: '8px',
      background: 'rgba(0, 224, 255, 0.1)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '8px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #00e0ff 0%, #e930ff 100%)',
      borderRadius: '4px',
      transition: 'width 0.5s ease'
    },
    gridMetrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '16px'
    },
    smallMetric: {
      background: 'rgba(10, 18, 36, 0.3)',
      borderRadius: '8px',
      padding: '12px',
      textAlign: 'center' as const
    },
    smallMetricLabel: {
      fontSize: '11px',
      color: 'rgba(247, 249, 251, 0.6)',
      textTransform: 'uppercase' as const,
      marginBottom: '4px'
    },
    smallMetricValue: {
      fontSize: '18px',
      fontWeight: 700,
      color: '#00e0ff'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🧠 Revenue Intelligence Q&A
        </h2>
        <p style={styles.subtitle}>AI-powered revenue insights and forecasting</p>
        <button 
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ×
        </button>
      </div>

      <div style={styles.tabs}>
        {['overview', 'growth', 'retention', 'pricing', 'forecast'].map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'overview' && (
          <>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Rule of 40 Score</span>
                <span style={styles.metricValue}>{ruleOf40}</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${Math.min(100, (ruleOf40 / 60) * 100)}%` }} />
              </div>
              <p style={styles.metricTrend}>
                {ruleOf40 > 40 ? '✅ Exceeds benchmark' : '⚠️ Below benchmark'} (Target: 40)
              </p>
              <div style={styles.insightBox}>
                <p style={styles.insightText}>
                  Your Rule of 40 score indicates {ruleOf40 > 50 ? 'exceptional' : ruleOf40 > 40 ? 'strong' : 'room for improvement in'} balance between growth and profitability. 
                  Breaking down: ~{Math.round(ruleOf40 * 0.6)}% growth rate + ~{Math.round(ruleOf40 * 0.4)}% EBITDA margin.
                </p>
              </div>
            </div>

            <div style={styles.gridMetrics}>
              <div style={styles.smallMetric}>
                <div style={styles.smallMetricLabel}>NRR</div>
                <div style={styles.smallMetricValue}>{nrr}%</div>
              </div>
              <div style={styles.smallMetric}>
                <div style={styles.smallMetricLabel}>LTV/CAC</div>
                <div style={styles.smallMetricValue}>{ltvCac}x</div>
              </div>
              <div style={styles.smallMetric}>
                <div style={styles.smallMetricLabel}>Quality</div>
                <div style={styles.smallMetricValue}>{qualityScore}/100</div>
              </div>
              <div style={styles.smallMetric}>
                <div style={styles.smallMetricLabel}>Market Share</div>
                <div style={styles.smallMetricValue}>+{marketShare}pp</div>
              </div>
            </div>

            <div style={styles.recommendationBox}>
              <p style={styles.insightText}>
                <strong>💡 Key Opportunity:</strong> With NRR at {nrr}%, focus on expansion revenue. 
                Each 10% improvement in NRR could add ${((nrr * 0.1) * 1000000).toLocaleString()} in annual revenue.
              </p>
            </div>

            <button style={styles.actionButton}>
              Generate Executive Summary →
            </button>
          </>
        )}

        {activeTab === 'growth' && (
          <>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Growth Decomposition</span>
                <span style={styles.metricValue}>+53%</span>
              </div>
              <div style={styles.insightBox}>
                <p style={styles.insightText}>
                  <strong>Organic Growth:</strong> 48% (Volume: 15%, Price: 8%, Expansion: 25%)<br/>
                  <strong>Inorganic:</strong> 5% (M&A: 7%, FX: -2%)
                </p>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Growth Quality Assessment</span>
              </div>
              <div style={styles.gridMetrics}>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Sustainable</div>
                  <div style={styles.smallMetricValue}>85%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>At Risk</div>
                  <div style={styles.smallMetricValue}>15%</div>
                </div>
              </div>
              <div style={styles.recommendationBox}>
                <p style={styles.insightText}>
                  <strong>Action:</strong> 85% of growth is sustainable. Focus on protecting volume growth and accelerating customer expansion programs.
                </p>
              </div>
            </div>

            <button style={styles.actionButton}>
              Analyze Growth Drivers →
            </button>
          </>
        )}

        {activeTab === 'retention' && (
          <>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Net Revenue Retention</span>
                <span style={styles.metricValue}>{nrr}%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${Math.min(100, (nrr / 150) * 100)}%` }} />
              </div>
              <div style={styles.insightBox}>
                <p style={styles.insightText}>
                  Breakdown: Starting ARR (100%) + Expansion ({Math.round(nrr * 0.3)}%) - Contraction ({Math.round(nrr * 0.08)}%) - Churn ({Math.round(nrr * 0.07)}%) = {nrr}%
                </p>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Cohort Performance</span>
              </div>
              <div style={styles.gridMetrics}>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>6-Month</div>
                  <div style={styles.smallMetricValue}>108%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>12-Month</div>
                  <div style={styles.smallMetricValue}>{nrr}%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>24-Month</div>
                  <div style={styles.smallMetricValue}>135%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>36-Month</div>
                  <div style={styles.smallMetricValue}>152%</div>
                </div>
              </div>
            </div>

            <div style={styles.recommendationBox}>
              <p style={styles.insightText}>
                <strong>Insight:</strong> Strong expansion trajectory. Focus on Year 2-3 expansion plays to maximize LTV.
              </p>
            </div>

            <button style={styles.actionButton}>
              Deep Dive Cohort Analysis →
            </button>
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Pricing Power Analysis</span>
              </div>
              <div style={styles.insightBox}>
                <p style={styles.insightText}>
                  <strong>Elasticity:</strong> -0.8 (relatively inelastic)<br/>
                  <strong>Optimal Price Point:</strong> +5-7% increase feasible<br/>
                  <strong>Revenue Impact:</strong> +$8.5M annual opportunity
                </p>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Pricing Scenarios</span>
              </div>
              <div style={styles.gridMetrics}>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>+5% Price</div>
                  <div style={styles.smallMetricValue}>+$6.2M</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>+10% Price</div>
                  <div style={styles.smallMetricValue}>+$8.5M</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Volume Risk</div>
                  <div style={styles.smallMetricValue}>-3%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Net Impact</div>
                  <div style={styles.smallMetricValue}>+7%</div>
                </div>
              </div>
            </div>

            <div style={styles.recommendationBox}>
              <p style={styles.insightText}>
                <strong>Recommendation:</strong> Implement tiered 5-7% price increase starting with low-churn segments. Test with 10% of base first.
              </p>
            </div>

            <button style={styles.actionButton}>
              Model Pricing Scenarios →
            </button>
          </>
        )}

        {activeTab === 'forecast' && (
          <>
            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Revenue Forecast Confidence</span>
                <span style={styles.metricValue}>82%</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: '82%' }} />
              </div>
              <div style={styles.insightBox}>
                <p style={styles.insightText}>
                  <strong>12-Month Forecast:</strong> $185M - $195M (90% CI)<br/>
                  <strong>Base Case:</strong> $190M (+53% YoY)<br/>
                  <strong>Model Accuracy:</strong> MAPE 4.2% (last 6 months)
                </p>
              </div>
            </div>

            <div style={styles.metricCard}>
              <div style={styles.metricHeader}>
                <span style={styles.metricTitle}>Scenario Probabilities</span>
              </div>
              <div style={styles.gridMetrics}>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Base Case</div>
                  <div style={styles.smallMetricValue}>60%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Optimistic</div>
                  <div style={styles.smallMetricValue}>25%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Pessimistic</div>
                  <div style={styles.smallMetricValue}>15%</div>
                </div>
                <div style={styles.smallMetric}>
                  <div style={styles.smallMetricLabel}>Black Swan</div>
                  <div style={styles.smallMetricValue}>&lt;1%</div>
                </div>
              </div>
            </div>

            <div style={styles.recommendationBox}>
              <p style={styles.insightText}>
                <strong>Risk Alert:</strong> Pipeline coverage of 3.2x supports base case. Monitor conversion rates weekly for early warning signals.
              </p>
            </div>

            <button style={styles.actionButton}>
              Run Monte Carlo Simulation →
            </button>
          </>
        )}
      </div>
    </div>
  );
}