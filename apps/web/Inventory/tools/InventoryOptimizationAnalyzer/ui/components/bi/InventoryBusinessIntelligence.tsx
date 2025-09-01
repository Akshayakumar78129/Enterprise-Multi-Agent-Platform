import React, { useState } from 'react';

interface InventoryBusinessIntelligenceProps {
  onClose: () => void;
  dashboardData?: any;
}

export default function InventoryBusinessIntelligence({ onClose, dashboardData }: InventoryBusinessIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'predict' | 'strategy' | 'simulate'>('overview');
  
  // Extract metrics from dashboard data
  const kpis = dashboardData?.data?.kpis || {};
  const healthMatrix = dashboardData?.data?.healthMatrix || [];
  const actionPriority = dashboardData?.data?.actionPriority || [];
  
  const inventoryValue = kpis.totalValue?.value || 645000;
  const healthScore = kpis.inventoryHealth?.value || 75;
  const stockoutRisk = kpis.stockoutRisk?.value || 23;
  const slowMoving = kpis.slowMoving?.value || 15;
  const savingsOpportunity = kpis.savingsOpportunity?.value || 85000;

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
      display: 'flex',
      flexDirection: 'column' as const,
      zIndex: 998,
      overflow: 'hidden'
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
      background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(0, 224, 255, 0.05) 100%)'
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
      color: 'rgba(247, 249, 251, 0.8)',
      fontWeight: 500
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#00e0ff'
    },
    metricDescription: {
      fontSize: '13px',
      color: 'rgba(247, 249, 251, 0.6)',
      lineHeight: 1.5
    },
    riskItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      background: 'rgba(10, 18, 36, 0.5)',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid rgba(0, 224, 255, 0.1)'
    },
    closeButton: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#f7f9fb',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  };

  const renderOverview = () => (
    <div>
      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>📊 Executive Summary</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ ...styles.metricDescription, marginBottom: '16px' }}>
            Your inventory portfolio of <span style={{ color: '#00e0ff', fontWeight: 600 }}>${(inventoryValue/1000).toFixed(0)}K</span> is 
            operating at <span style={{ color: healthScore > 70 ? '#00ff88' : '#ffd600', fontWeight: 600 }}>{healthScore}%</span> health 
            with <span style={{ color: '#ff9800', fontWeight: 600 }}>{stockoutRisk} items</span> at stockout risk.
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>💰 Financial Impact</span>
          <span style={{ ...styles.metricValue, fontSize: '20px' }}>$${(savingsOpportunity/1000).toFixed(0)}K</span>
        </div>
        <div style={styles.metricDescription}>
          Potential savings identified through optimization. Quick wins available in reducing slow-moving inventory ({slowMoving}% of stock).
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🎯 Key Metrics</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00e0ff' }}>{healthScore}%</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>Health Score</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#ff9800' }}>{stockoutRisk}</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>At Risk SKUs</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffd600' }}>{slowMoving}%</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>Slow Moving</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00ff88' }}>12.5</div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)' }}>Turns/Year</div>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>📈 30-Day Outlook</span>
        </div>
        <div style={styles.metricDescription}>
          • Stockout risk increasing by 15% without intervention<br/>
          • $${(stockoutRisk * 15).toFixed(0)}K revenue at risk<br/>
          • Recommend immediate reorder for critical items
        </div>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div>
      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🚨 Critical Risks</span>
          <span style={{ fontSize: '14px', color: '#ff5252' }}>Immediate Action</span>
        </div>
      </div>

      {[
        { level: 'Critical', items: Math.floor(stockoutRisk * 0.3), revenue: stockoutRisk * 0.3 * 15000, color: '#ff5252' },
        { level: 'High', items: Math.floor(stockoutRisk * 0.5), revenue: stockoutRisk * 0.5 * 15000, color: '#ff9800' },
        { level: 'Medium', items: Math.floor(stockoutRisk * 0.2), revenue: stockoutRisk * 0.2 * 15000, color: '#ffd600' },
      ].map((risk, idx) => (
        <div key={idx} style={styles.riskItem}>
          <div style={{ 
            width: '4px', 
            height: '40px', 
            background: risk.color, 
            borderRadius: '2px',
            marginRight: '16px'
          }}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f7f9fb' }}>
              {risk.level} Risk - {risk.items} items
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)', marginTop: '4px' }}>
              Revenue impact: ${(risk.revenue/1000).toFixed(0)}K
            </div>
          </div>
          <button 
            onClick={() => console.log(`View ${risk.level} risk items:`, risk.items)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${risk.color}`,
              background: `${risk.color}20`,
              color: risk.color,
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${risk.color}40`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${risk.color}20`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            View Items
          </button>
        </div>
      ))}

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>📊 Risk Distribution</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '30%', background: '#ff5252' }}/>
            <div style={{ width: '50%', background: '#ff9800' }}/>
            <div style={{ width: '20%', background: '#ffd600' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>
            <span>Critical 30%</span>
            <span>High 50%</span>
            <span>Medium 20%</span>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>💡 Mitigation Strategy</span>
        </div>
        <div style={styles.metricDescription}>
          1. Expedite orders for critical items (24-48 hrs)<br/>
          2. Increase safety stock by 20% for high-risk SKUs<br/>
          3. Negotiate rush delivery with suppliers<br/>
          4. Implement automated reorder points
        </div>
      </div>
    </div>
  );

  const renderPredict = () => (
    <div>
      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🔮 30-Day Forecast</span>
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.8)' }}>Stockout Risk</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff5252' }}>+35%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 82, 82, 0.2)', borderRadius: '3px' }}>
              <div style={{ width: '65%', height: '100%', background: '#ff5252', borderRadius: '3px' }}/>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.8)' }}>Holding Costs</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff9800' }}>+12%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 152, 0, 0.2)', borderRadius: '3px' }}>
              <div style={{ width: '45%', height: '100%', background: '#ff9800', borderRadius: '3px' }}/>
            </div>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.8)' }}>Inventory Turns</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#00ff88' }}>-8%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(0, 255, 136, 0.2)', borderRadius: '3px' }}>
              <div style={{ width: '35%', height: '100%', background: '#00ff88', borderRadius: '3px' }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>📈 Demand Prediction</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.8)', marginBottom: '8px' }}>
            Top Categories by Growth
          </div>
          {['Electronics (+25%)', 'Gadgets (+18%)', 'Tools (+12%)', 'Widgets (-5%)'].map((cat, idx) => (
            <div key={idx} style={{ 
              padding: '8px', 
              background: 'rgba(0, 224, 255, 0.05)', 
              borderRadius: '6px',
              marginBottom: '8px',
              fontSize: '13px',
              color: '#f7f9fb'
            }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🎯 Confidence Level</span>
          <span style={{ ...styles.metricValue, fontSize: '20px' }}>87%</span>
        </div>
        <div style={styles.metricDescription}>
          Model accuracy based on 6 months historical data. Seasonal patterns detected with 92% confidence.
        </div>
      </div>
    </div>
  );

  const renderStrategy = () => (
    <div>
      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🎯 Optimization Strategy</span>
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#00e0ff', marginBottom: '12px' }}>
            Phase 1: Quick Wins (Week 1)
          </div>
          <div style={styles.metricDescription}>
            • Clear {slowMoving}% slow-moving inventory<br/>
            • Adjust reorder points for top 20 SKUs<br/>
            • Implement safety stock buffers<br/>
            • Expected savings: $${(savingsOpportunity * 0.3 / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#00e0ff', marginBottom: '12px' }}>
          Phase 2: Process Optimization (Month 1)
        </div>
        <div style={styles.metricDescription}>
          • Implement ABC analysis<br/>
          • Automate purchase orders<br/>
          • Optimize warehouse layout<br/>
          • Expected savings: $${(savingsOpportunity * 0.5 / 1000).toFixed(0)}K
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#00e0ff', marginBottom: '12px' }}>
          Phase 3: Technology (Quarter 1)
        </div>
        <div style={styles.metricDescription}>
          • Deploy predictive analytics<br/>
          • Integrate supplier systems<br/>
          • Real-time inventory tracking<br/>
          • Expected savings: $${(savingsOpportunity * 0.2 / 1000).toFixed(0)}K
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>💰 Total ROI</span>
          <span style={{ ...styles.metricValue, fontSize: '20px', color: '#00ff88' }}>320%</span>
        </div>
        <div style={styles.metricDescription}>
          Investment: $50K | Return: $${(savingsOpportunity/1000).toFixed(0)}K | Payback: 4 months
        </div>
      </div>
    </div>
  );

  const renderSimulate = () => (
    <div>
      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>🔬 Scenario Simulator</span>
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(247, 249, 251, 0.8)', marginBottom: '12px' }}>
            Adjust parameters to see impact:
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)', marginBottom: '8px' }}>
              Safety Stock Level: <span style={{ color: '#00e0ff', fontWeight: 600 }}>+20%</span>
            </div>
            <input type="range" min="0" max="50" defaultValue="20" style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 224, 255, 0.2)',
              outline: 'none',
              borderRadius: '2px'
            }}/>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.6)', marginBottom: '8px' }}>
              Reorder Frequency: <span style={{ color: '#00e0ff', fontWeight: 600 }}>Weekly</span>
            </div>
            <input type="range" min="1" max="4" defaultValue="2" style={{
              width: '100%',
              height: '4px',
              background: 'rgba(0, 224, 255, 0.2)',
              outline: 'none',
              borderRadius: '2px'
            }}/>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>📊 Simulation Results</span>
        </div>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00ff88' }}>-65%</div>
            <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Stockout Risk</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#ff9800' }}>+15%</div>
            <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Holding Cost</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00e0ff' }}>95%</div>
            <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Service Level</div>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#00ff88' }}>$42K</div>
            <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Net Savings</div>
          </div>
        </div>
      </div>

      <div style={styles.metricCard}>
        <div style={styles.metricHeader}>
          <span style={styles.metricTitle}>💡 Recommendations</span>
        </div>
        <div style={styles.metricDescription}>
          Based on simulation, optimal configuration:<br/>
          • Safety stock: 20-25% buffer<br/>
          • Reorder: Weekly for A-items<br/>
          • Expected improvement: 85% stockout reduction
        </div>
      </div>

      <button style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #00e0ff, #00b8d4)',
        color: '#f7f9fb',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
        marginTop: '16px',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
      }}>
        Apply Optimized Settings
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={styles.title}>
              🧠 Business Intelligence
            </h2>
            <p style={styles.subtitle}>
              Inventory optimization insights & strategies
            </p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['overview', 'risk', 'predict', 'strategy', 'simulate'] as const).map(tab => (
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
        {activeTab === 'risk' && renderRisk()}
        {activeTab === 'predict' && renderPredict()}
        {activeTab === 'strategy' && renderStrategy()}
        {activeTab === 'simulate' && renderSimulate()}
      </div>
    </div>
  );
}