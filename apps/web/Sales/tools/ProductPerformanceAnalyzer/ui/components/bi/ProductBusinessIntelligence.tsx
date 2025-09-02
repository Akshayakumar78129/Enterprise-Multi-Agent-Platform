import React, { useState } from 'react';

interface ProductBusinessIntelligenceProps {
  onClose: () => void;
  dashboardData: any;
}

export default function ProductBusinessIntelligence({ onClose, dashboardData }: ProductBusinessIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'predict' | 'optimize' | 'simulate'>('overview');
  
  // Extract metrics from dashboard data
  const totalSales = dashboardData?.kpis?.totalSales?.value || 0;
  const averageMargin = dashboardData?.kpis?.averageMargin?.value || 0;
  const totalUnits = dashboardData?.kpis?.totalUnits?.value || 0;
  const topCategory = dashboardData?.kpis?.topCategory?.value || 'N/A';
  
  // Simulation state - moved to component level to fix hooks error
  const [priceAdjust, setPriceAdjust] = useState(0);
  const [marginTarget, setMarginTarget] = useState(averageMargin);
  const [volumeGrowth, setVolumeGrowth] = useState(0);

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
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid rgba(0, 224, 255, 0.1)'
    },
    metricTitle: {
      fontSize: '14px',
      color: '#00e0ff',
      marginBottom: '8px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#f7f9fb',
      marginBottom: '4px'
    },
    metricSubtext: {
      fontSize: '13px',
      color: 'rgba(247, 249, 251, 0.6)'
    },
    performanceItem: {
      background: 'rgba(0, 224, 255, 0.03)',
      borderRadius: '10px',
      padding: '14px',
      marginBottom: '12px',
      border: '1px solid rgba(0, 224, 255, 0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    button: {
      background: 'linear-gradient(135deg, #00e0ff 0%, #00b8d4 100%)',
      color: '#0a1224',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '16px',
      width: '100%'
    },
    slider: {
      width: '100%',
      marginTop: '8px',
      marginBottom: '16px'
    }
  };

  const renderOverview = () => (
    <div>
      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>📊</span> Executive Summary
        </span>
        <div style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '12px' }}>
          Your product portfolio of ${(totalSales/1000000).toFixed(2)}M in sales is 
          operating at {averageMargin.toFixed(1)}% margin with {totalUnits.toLocaleString()} units sold.
          Top performing category is {topCategory}.
        </div>
      </div>
      
      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>💰</span> Revenue Performance
        </span>
        <div style={styles.metricValue}>${(totalSales/1000000).toFixed(2)}M</div>
        <div style={styles.metricSubtext}>Total Sales Revenue</div>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>📈</span> Margin Analysis
        </span>
        <div style={styles.metricValue}>{averageMargin.toFixed(1)}%</div>
        <div style={styles.metricSubtext}>Average Product Margin</div>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>🎯</span> 30-Day Outlook
        </span>
        <div style={{ fontSize: '14px', marginTop: '12px' }}>
          • Expected revenue: ${((totalSales * 1.08)/1000000).toFixed(2)}M (+8%)<br/>
          • Margin target: {(averageMargin + 2).toFixed(1)}% (+2pp)<br/>
          • Volume forecast: {Math.floor(totalUnits * 1.12).toLocaleString()} units
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div>
      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>🏆</span> Top Performers
        </span>
      </div>
      
      {['Premium Electronics', 'Smart Home Devices', 'Accessories', 'Software'].map((product, idx) => (
        <div key={idx} style={styles.performanceItem}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product}</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>
              Revenue: ${(Math.random() * 5 + 1).toFixed(1)}M
            </div>
          </div>
          <div style={{ 
            color: '#00ff88',
            fontSize: '14px',
            fontWeight: 600
          }}>
            +{(Math.random() * 30 + 10).toFixed(1)}%
          </div>
        </div>
      ))}

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>⚠️</span> Underperformers
        </span>
      </div>
      
      {['Legacy Products', 'Seasonal Items'].map((product, idx) => (
        <div key={idx} style={styles.performanceItem}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product}</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>
              Revenue: ${(Math.random() * 1 + 0.5).toFixed(1)}M
            </div>
          </div>
          <div style={{ 
            color: '#ff5252',
            fontSize: '14px',
            fontWeight: 600
          }}>
            -{(Math.random() * 20 + 5).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );

  const renderPredict = () => (
    <div>
      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>🔮</span> 30-Day Forecast
        </span>
        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.6)', marginBottom: '4px' }}>
              Revenue Projection
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              ${((totalSales * 1.08)/1000000).toFixed(2)}M
            </div>
            <div style={{ fontSize: '12px', color: '#00ff88' }}>↑ 8% growth expected</div>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>📊</span> Category Predictions
        </span>
        {['Electronics: +12%', 'Home & Garden: +6%', 'Fashion: +9%', 'Sports: +15%'].map((pred, idx) => (
          <div key={idx} style={{ 
            padding: '8px 0',
            borderBottom: idx < 3 ? '1px solid rgba(0, 224, 255, 0.1)' : 'none',
            fontSize: '14px'
          }}>
            {pred}
          </div>
        ))}
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>🎯</span> Confidence Levels
        </span>
        <div style={{ marginTop: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px' }}>Revenue Forecast</span>
              <span style={{ fontSize: '13px', color: '#00e0ff' }}>92%</span>
            </div>
            <div style={{ 
              height: '6px',
              background: 'rgba(0, 224, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '92%',
                height: '100%',
                background: 'linear-gradient(90deg, #00e0ff 0%, #00ff88 100%)'
              }}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px' }}>Margin Forecast</span>
              <span style={{ fontSize: '13px', color: '#00e0ff' }}>85%</span>
            </div>
            <div style={{ 
              height: '6px',
              background: 'rgba(0, 224, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: '85%',
                height: '100%',
                background: 'linear-gradient(90deg, #00e0ff 0%, #e930ff 100%)'
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOptimize = () => (
    <div>
      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>
          <span>🚀</span> Optimization Strategy
        </span>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>Phase 1: Quick Wins (Week 1)</span>
        <div style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.6' }}>
          • Adjust pricing on high-margin items<br/>
          • Bundle slow-moving inventory<br/>
          • Launch flash sales for overstocked items<br/>
          <strong style={{ color: '#00ff88' }}>Potential Impact: +$250K revenue</strong>
        </div>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>Phase 2: Category Optimization (Month 1)</span>
        <div style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.6' }}>
          • Expand top-performing categories<br/>
          • Renegotiate supplier terms<br/>
          • Implement dynamic pricing<br/>
          <strong style={{ color: '#00ff88' }}>Potential Impact: +$1.2M revenue</strong>
        </div>
      </div>

      <div style={styles.metricCard}>
        <span style={styles.metricTitle}>Phase 3: Strategic Growth (Quarter 1)</span>
        <div style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.6' }}>
          • Launch premium product lines<br/>
          • Enter new market segments<br/>
          • Develop exclusive partnerships<br/>
          <strong style={{ color: '#00ff88' }}>Potential Impact: +$3.5M revenue</strong>
        </div>
      </div>

      <button style={styles.button}>
        Generate Detailed Report
      </button>
    </div>
  );

  const renderSimulate = () => {
    return (
      <div>
        <div style={styles.metricCard}>
          <span style={styles.metricTitle}>
            <span>🎮</span> Scenario Simulator
          </span>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricTitle}>Price Adjustment</span>
          <input
            type="range"
            min="-20"
            max="20"
            value={priceAdjust}
            onChange={(e) => setPriceAdjust(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>-20%</span>
            <span style={{ color: '#00e0ff', fontWeight: 600 }}>{priceAdjust > 0 ? '+' : ''}{priceAdjust}%</span>
            <span>+20%</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricTitle}>Target Margin</span>
          <input
            type="range"
            min="10"
            max="50"
            value={marginTarget}
            onChange={(e) => setMarginTarget(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>10%</span>
            <span style={{ color: '#00e0ff', fontWeight: 600 }}>{marginTarget.toFixed(1)}%</span>
            <span>50%</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricTitle}>Volume Growth Target</span>
          <input
            type="range"
            min="-30"
            max="50"
            value={volumeGrowth}
            onChange={(e) => setVolumeGrowth(Number(e.target.value))}
            style={styles.slider}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span>-30%</span>
            <span style={{ color: '#00e0ff', fontWeight: 600 }}>{volumeGrowth > 0 ? '+' : ''}{volumeGrowth}%</span>
            <span>+50%</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricTitle}>
            <span>📊</span> Simulation Results
          </span>
          <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Projected Revenue:</span>
              <span style={{ fontWeight: 700, color: '#00ff88' }}>
                ${((totalSales * (1 + priceAdjust/100) * (1 + volumeGrowth/100))/1000000).toFixed(2)}M
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Expected Margin:</span>
              <span style={{ fontWeight: 700, color: marginTarget > averageMargin ? '#00ff88' : '#ff9800' }}>
                {marginTarget.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Unit Volume:</span>
              <span style={{ fontWeight: 700 }}>
                {Math.floor(totalUnits * (1 + volumeGrowth/100)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button style={styles.button}>
          Apply Simulation Settings
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>
          <span>🧠</span>
          Business Intelligence
        </h2>
        <button 
          onClick={onClose}
          style={styles.closeButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'rotate(90deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'rotate(0deg)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['overview', 'performance', 'predict', 'optimize', 'simulate'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.activeTab : {})
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
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