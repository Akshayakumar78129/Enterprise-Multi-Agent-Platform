import React, { useState } from 'react';

interface ARBIAgentProps {
  onClose?: () => void;
}

export const BIAgent: React.FC<ARBIAgentProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'predict' | 'strategy' | 'simulate'>('overview');

  const renderOverview = () => (
    <div style={{ color: '#f7f9fb' }}>
      <h3 style={{ color: '#00e0ff', marginBottom: '16px' }}>AR Portfolio Overview</h3>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Current DSO Performance</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>DSO: 46.5 days (+8.3 vs industry median)</p>
          <p style={{ color: '#ffc145', fontSize: '11px' }}>Potential cash impact: $4.2M tied up in excess AR</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Collection Efficiency</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>Current ratio: 56% (down from 68%)</p>
          <p style={{ color: '#ffc145', fontSize: '11px' }}>12% deterioration over 6 months requires attention</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Risk Concentration</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>Top 3 customers: 45% of outstanding AR</p>
          <p style={{ color: '#ffc145', fontSize: '11px' }}>High concentration risk - diversification needed</p>
        </div>
      </div>
      <div>
        <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Key Performance Indicators</h4>
        <ul style={{ color: '#8892a8', fontSize: '12px', lineHeight: '1.5', paddingLeft: '16px' }}>
          <li>Total Outstanding: $55.2M across 260 active customers</li>
          <li>60+ Days Bucket: 23% (increased by 8% from 15%)</li>
          <li>Average Collection Period: 46.5 days</li>
          <li>Customer Risk Score Distribution: 47 high-risk customers with $15.3M exposure</li>
        </ul>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div style={{ color: '#f7f9fb' }}>
      <h3 style={{ color: '#e930ff', marginBottom: '16px' }}>Risk Assessment</h3>
      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px', borderLeft: '4px solid #e930ff' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>High Risk Customers (80-100)</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>47 customers | $15.3M exposure</p>
          <p style={{ color: '#e930ff', fontSize: '11px' }}>Average days past due: 67 days</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px', borderLeft: '4px solid #ffc145' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Medium Risk Customers (50-79)</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>89 customers | $18.7M exposure</p>
          <p style={{ color: '#ffc145', fontSize: '11px' }}>Average days past due: 45 days</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#1e2738', borderRadius: '6px', borderLeft: '4px solid #5fd4d6' }}>
          <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Low Risk Customers (0-49)</h4>
          <p style={{ color: '#8892a8', fontSize: '12px', marginBottom: '4px' }}>124 customers | $21.2M exposure</p>
          <p style={{ color: '#5fd4d6', fontSize: '11px' }}>Average days past due: 28 days</p>
        </div>
      </div>
      <div>
        <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Deteriorating Payment Patterns</h4>
        <ul style={{ color: '#8892a8', fontSize: '12px', lineHeight: '1.5', paddingLeft: '16px', marginBottom: '16px' }}>
          <li><strong>TechCorp Industries:</strong> DSO increased 23 days over 3 months</li>
          <li><strong>Global Manufacturing:</strong> Late payment frequency up 40%</li>
          <li><strong>Regional Distributors:</strong> Credit utilization at 95%</li>
          <li><strong>Innovation Partners:</strong> Dispute rate increased 3x</li>
        </ul>
        <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '8px' }}>Early Warning Triggers</h4>
        <ul style={{ color: '#8892a8', fontSize: '12px', lineHeight: '1.5', paddingLeft: '16px' }}>
          <li>DSO increase &gt;10 days in 60-day period: 23 customers</li>
          <li>Payment frequency drop &gt;20%: 31 customers</li>
          <li>Credit utilization &gt;90%: 12 customers</li>
        </ul>
      </div>
    </div>
  );

  const renderPredict = () => (
    <div style={{ color: '#f7f9fb' }}>
      <h3 style={{ color: '#5fd4d6', marginBottom: '16px' }}>Collection Forecast</h3>
      <div className="insight-cards">
        <div className="insight-card">
          <h4>Next 30 Days Forecast</h4>
          <p>Expected Collections: $4.2M (82% confidence)</p>
          <p className="metric-detail">Gap to target: -$400K</p>
        </div>
        <div className="insight-card">
          <h4>Weekly Breakdown</h4>
          <p>Week 1: $1.1M | Week 2: $1.4M</p>
          <p>Week 3: $0.9M | Week 4: $0.8M</p>
        </div>
        <div className="insight-card">
          <h4>Payment Behavior Analysis</h4>
          <p>Mid-size customers show best payment patterns</p>
          <p className="metric-detail">Correlation coefficient: -0.34 (size vs payment)</p>
        </div>
      </div>
      <div className="key-metrics">
        <h4>Customer Size Impact on Collections</h4>
        <ul>
          <li><strong>Large Customers (&gt;$500K):</strong> Average DSO 52.3 days, 68% reliability</li>
          <li><strong>Medium Customers ($100K-$500K):</strong> Average DSO 41.2 days, 78% reliability</li>
          <li><strong>Small Customers (&lt;$100K):</strong> Average DSO 38.7 days, 72% reliability</li>
        </ul>
        <h4>Forecast Factors</h4>
        <ul>
          <li>Historical payment patterns weighted 40%</li>
          <li>Customer risk scores weighted 35%</li>
          <li>Seasonal adjustments weighted 25%</li>
        </ul>
      </div>
    </div>
  );

  const renderStrategy = () => (
    <div className="bi-content">
      <h3>Collection Strategy</h3>
      <div className="insight-cards">
        <div className="insight-card">
          <h4>Immediate Actions (0-7 days)</h4>
          <p>Automated reminders for 30-day invoices</p>
          <p className="metric-detail">Expected DSO improvement: 1.2 days</p>
        </div>
        <div className="insight-card">
          <h4>Medium-term (1-4 weeks)</h4>
          <p>Payment plans for struggling customers</p>
          <p className="metric-detail">Target 15 high-risk accounts</p>
        </div>
        <div className="insight-card">
          <h4>Strategic Initiatives</h4>
          <p>Credit insurance for top 3 customers</p>
          <p className="metric-detail">Protect $24.8M exposure</p>
        </div>
      </div>
      <div className="key-metrics">
        <h4>Recommended Actions by Priority</h4>
        <ul>
          <li><strong>High Priority:</strong> Personal calls to top 5 high-risk accounts ($8.2M exposure)</li>
          <li><strong>Medium Priority:</strong> Early payment discount offers (2% for 10-day payment)</li>
          <li><strong>Low Priority:</strong> Collection agency referrals for 90+ day accounts</li>
        </ul>
        <h4>Expected Impact</h4>
        <ul>
          <li>DSO improvement: 15% (7 days reduction)</li>
          <li>Cash acceleration: $2.1M</li>
          <li>Collection efficiency gain: 18%</li>
          <li>Risk reduction: 25% in high-risk segment</li>
        </ul>
      </div>
    </div>
  );

  const renderSimulate = () => (
    <div className="bi-content">
      <h3>Scenario Simulation</h3>
      <div className="insight-cards">
        <div className="insight-card">
          <h4>Scenario 1: Aggressive Collection</h4>
          <p>DSO Target: 38 days (industry median)</p>
          <p className="metric-detail">Cash release: $2.8M working capital</p>
        </div>
        <div className="insight-card">
          <h4>Scenario 2: Best-in-Class Target</h4>
          <p>DSO Target: 28.5 days (top quartile)</p>
          <p className="metric-detail">Cash release: $6.1M working capital</p>
        </div>
        <div className="insight-card">
          <h4>Scenario 3: Status Quo</h4>
          <p>DSO remains at 46.5 days</p>
          <p className="metric-detail">Opportunity cost: $4.2M annually</p>
        </div>
      </div>
      <div className="key-metrics">
        <h4>Implementation Scenarios</h4>
        <ul>
          <li><strong>Automation Implementation:</strong> 20% efficiency gain, $180K annual savings</li>
          <li><strong>Credit Policy Tightening:</strong> 30% risk reduction, 2% revenue impact</li>
          <li><strong>Early Payment Incentives:</strong> 8-day DSO improvement, 1.5% margin reduction</li>
          <li><strong>Collection Team Expansion:</strong> 25% capacity increase, $320K investment</li>
        </ul>
        <h4>ROI Analysis</h4>
        <ul>
          <li>Automation ROI: 450% first year</li>
          <li>Credit policy changes ROI: 280% first year</li>
          <li>Team expansion ROI: 190% first year</li>
          <li>Combined approach ROI: 340% first year</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div style={{
      backgroundColor: '#232a36',
      border: '1px solid #00e0ff40',
      borderRadius: '8px',
      minHeight: '400px',
      minWidth: '350px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #1e2738',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#f7f9fb',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          <span>📊</span>
          <span>AR Business Intelligence</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8892a8',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1e2738'
      }}>
        {(['overview', 'risk', 'predict', 'strategy', 'simulate'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: activeTab === tab ? '#00e0ff20' : 'transparent',
              color: activeTab === tab ? '#00e0ff' : '#8892a8',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'risk' && renderRisk()}
        {activeTab === 'predict' && renderPredict()}
        {activeTab === 'strategy' && renderStrategy()}
        {activeTab === 'simulate' && renderSimulate()}
      </div>
    </div>
  );
};

export default BIAgent;