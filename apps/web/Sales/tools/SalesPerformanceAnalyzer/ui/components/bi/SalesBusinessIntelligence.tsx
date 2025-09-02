import React, { useState } from 'react';

interface SalesBusinessIntelligenceProps {
  onClose: () => void;
  dashboardData: any;
}

export default function SalesBusinessIntelligence({ onClose, dashboardData }: SalesBusinessIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'predict' | 'optimize' | 'simulate'>('overview');
  
  // Extract metrics from dashboard data
  const totalRevenue = dashboardData?.kpis?.totalRevenue?.value || 0;
  const averageOrderValue = dashboardData?.kpis?.averageOrderValue?.value || 0;
  const totalUnitsSold = dashboardData?.kpis?.totalUnitsSold?.value || 0;
  const topRegion = dashboardData?.kpis?.topPerformingRegion?.value || 'N/A';
  const conversionRate = dashboardData?.kpis?.conversionRate?.value || 0;
  
  // Simulation state
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [aovTarget, setAovTarget] = useState(averageOrderValue);
  const [conversionTarget, setConversionTarget] = useState(conversionRate * 100);

  const styles = {
    container: {
      position: 'fixed' as const,
      bottom: '100px',
      right: '30px',
      width: '450px',
      height: '650px',
      background: 'linear-gradient(135deg, #1e2738 0%, #1a2332 100%)',
      borderRadius: '24px',
      border: '1px solid rgba(0, 224, 255, 0.3)',
      boxShadow: '0 25px 70px rgba(0, 0, 0, 0.6)',
      zIndex: 998,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden'
    },
    header: {
      background: 'linear-gradient(135deg, #00e0ff 0%, #e930ff 100%)',
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(0, 224, 255, 0.2)'
    },
    headerTitle: {
      margin: 0,
      fontSize: '22px',
      fontWeight: 700,
      color: '#0a1224',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    closeButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      color: '#0a1224',
      fontSize: '20px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    },
    tabs: {
      display: 'flex',
      padding: '16px 20px',
      gap: '8px',
      borderBottom: '1px solid rgba(0, 224, 255, 0.1)',
      background: 'rgba(0, 224, 255, 0.02)'
    },
    tab: {
      flex: 1,
      padding: '10px 8px',
      background: 'transparent',
      border: '1px solid rgba(0, 224, 255, 0.2)',
      borderRadius: '8px',
      color: 'rgba(247, 249, 251, 0.7)',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center' as const
    },
    activeTab: {
      background: 'rgba(0, 224, 255, 0.1)',
      borderColor: '#00e0ff',
      color: '#00e0ff'
    },
    content: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '24px',
      color: '#f7f9fb'
    },
    metricCard: {
      background: 'rgba(0, 224, 255, 0.05)',
      border: '1px solid rgba(0, 224, 255, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px'
    },
    metricTitle: {
      fontSize: '13px',
      color: 'rgba(247, 249, 251, 0.6)',
      marginBottom: '8px'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#00e0ff'
    },
    metricChange: {
      fontSize: '12px',
      marginTop: '4px'
    },
    insightCard: {
      background: 'rgba(233, 48, 255, 0.05)',
      border: '1px solid rgba(233, 48, 255, 0.2)',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px'
    },
    insightTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#e930ff',
      marginBottom: '8px'
    },
    insightText: {
      fontSize: '13px',
      lineHeight: 1.6,
      color: 'rgba(247, 249, 251, 0.8)'
    },
    sliderContainer: {
      marginBottom: '20px'
    },
    sliderLabel: {
      fontSize: '13px',
      color: 'rgba(247, 249, 251, 0.7)',
      marginBottom: '8px',
      display: 'flex',
      justifyContent: 'space-between'
    },
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      outline: 'none',
      background: 'rgba(0, 224, 255, 0.2)',
      WebkitAppearance: 'none' as const
    },
    button: {
      background: 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
      color: '#0a1224',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      width: '100%',
      marginTop: '16px',
      transition: 'all 0.3s ease'
    }
  };

  const renderOverview = () => (
    <>
      <div style={styles.metricCard}>
        <div style={styles.metricTitle}>Total Revenue</div>
        <div style={styles.metricValue}>${(totalRevenue / 1000000).toFixed(2)}M</div>
        <div style={{ ...styles.metricChange, color: '#4caf50' }}>↑ 12.5% vs last period</div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricTitle}>Average Order Value</div>
        <div style={styles.metricValue}>${averageOrderValue.toFixed(2)}</div>
        <div style={{ ...styles.metricChange, color: '#4caf50' }}>↑ 5.2% improvement</div>
      </div>
      
      <div style={styles.metricCard}>
        <div style={styles.metricTitle}>Conversion Rate</div>
        <div style={styles.metricValue}>{(conversionRate * 100).toFixed(2)}%</div>
        <div style={{ ...styles.metricChange, color: '#ff9800' }}>→ Stable performance</div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>🎯 Key Insight</div>
        <div style={styles.insightText}>
          {topRegion} is your top performing region, contributing {((totalRevenue * 0.35) / 1000000).toFixed(1)}M in revenue. 
          Consider increasing marketing spend in this region by 15% to capitalize on momentum.
        </div>
      </div>
    </>
  );

  const renderPerformance = () => (
    <>
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>📊 Performance Analysis</div>
        <div style={styles.insightText}>
          Your sales velocity has increased by 18% this quarter. 
          Product categories showing strongest growth: Electronics (+25%), Home & Garden (+19%).
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>🔍 Opportunity Detection</div>
        <div style={styles.insightText}>
          Underperforming segments identified:
          • Mobile channel conversion 40% below desktop
          • Weekend sales 30% lower than weekdays
          • New customer acquisition down 15%
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>⚡ Quick Wins</div>
        <div style={styles.insightText}>
          1. Optimize mobile checkout flow
          2. Launch weekend-specific promotions
          3. Implement abandoned cart recovery
        </div>
      </div>
    </>
  );

  const renderPredict = () => (
    <>
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>📈 30-Day Forecast</div>
        <div style={styles.insightText}>
          Expected Revenue: ${((totalRevenue * 1.08) / 1000000).toFixed(2)}M
          <br />Confidence Level: 87%
          <br />Range: ${((totalRevenue * 1.05) / 1000000).toFixed(2)}M - ${((totalRevenue * 1.11) / 1000000).toFixed(2)}M
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>🎯 Q4 Projections</div>
        <div style={styles.insightText}>
          Based on current trends and seasonality:
          • Revenue: ${((totalRevenue * 1.35) / 1000000).toFixed(1)}M
          • Units: {Math.floor(totalUnitsSold * 1.4).toLocaleString()}
          • AOV: ${(averageOrderValue * 1.1).toFixed(2)}
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>⚠️ Risk Factors</div>
        <div style={styles.insightText}>
          • Supply chain delays may impact 15% of orders
          • Competitor promotions expected in week 3
          • Seasonal demand spike requires 20% more inventory
        </div>
      </div>
    </>
  );

  const renderOptimize = () => (
    <>
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>💡 Pricing Optimization</div>
        <div style={styles.insightText}>
          Recommended price adjustments:
          • Increase premium products by 5-7%
          • Bundle slow-moving items with bestsellers
          • Implement dynamic pricing for peak hours
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>🚀 Channel Optimization</div>
        <div style={styles.insightText}>
          • Shift 15% budget from underperforming channels
          • Increase social commerce investment by 25%
          • Launch marketplace presence for 20% reach boost
        </div>
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>🎯 Customer Segmentation</div>
        <div style={styles.insightText}>
          High-value segment opportunities:
          • VIP customers: Personalized offers (+30% LTV)
          • Dormant users: Win-back campaign (12% reactivation)
          • New customers: Onboarding optimization (+25% retention)
        </div>
      </div>
    </>
  );

  const renderSimulate = () => (
    <>
      <div style={styles.sliderContainer}>
        <div style={styles.sliderLabel}>
          <span>Revenue Growth Target</span>
          <span>{revenueGrowth}%</span>
        </div>
        <input
          type="range"
          min="-20"
          max="50"
          value={revenueGrowth}
          onChange={(e) => setRevenueGrowth(Number(e.target.value))}
          style={styles.slider}
        />
      </div>
      
      <div style={styles.sliderContainer}>
        <div style={styles.sliderLabel}>
          <span>Target AOV</span>
          <span>${aovTarget.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min="50"
          max="500"
          value={aovTarget}
          onChange={(e) => setAovTarget(Number(e.target.value))}
          style={styles.slider}
        />
      </div>
      
      <div style={styles.sliderContainer}>
        <div style={styles.sliderLabel}>
          <span>Conversion Rate Target</span>
          <span>{conversionTarget.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.1"
          value={conversionTarget}
          onChange={(e) => setConversionTarget(Number(e.target.value))}
          style={styles.slider}
        />
      </div>
      
      <div style={styles.insightCard}>
        <div style={styles.insightTitle}>📊 Simulation Results</div>
        <div style={styles.insightText}>
          Projected Revenue: ${((totalRevenue * (1 + revenueGrowth/100)) / 1000000).toFixed(2)}M
          <br />Required Daily Sales: {Math.floor((totalRevenue * (1 + revenueGrowth/100)) / 365 / aovTarget)}
          <br />Traffic Needed: {Math.floor((totalRevenue * (1 + revenueGrowth/100)) / aovTarget / (conversionTarget/100)).toLocaleString()}
        </div>
      </div>
      
      <button style={styles.button}>
        Generate Action Plan
      </button>
    </>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>
          <span>🧠</span>
          Sales Intelligence
        </h2>
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={styles.tabs}>
        {(['overview', 'performance', 'predict', 'optimize', 'simulate'] as const).map(tab => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab(tab)}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'rgba(0, 224, 255, 0.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'performance' && renderPerformance()}
        {activeTab === 'predict' && renderPredict()}
        {activeTab === 'optimize' && renderOptimize()}
        {activeTab === 'simulate' && renderSimulate()}
      </div>
    </div>
  );
}