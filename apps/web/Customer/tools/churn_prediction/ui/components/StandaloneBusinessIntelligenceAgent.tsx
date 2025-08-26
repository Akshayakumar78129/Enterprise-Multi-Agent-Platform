import React, { useState, useEffect, useCallback } from 'react';

// Type definitions
interface ChurnCustomer {
  customer_id: number;
  name: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  churn_probability: number;
  avg_order_value?: number;
  frequency?: number;
}

interface RiskAssessment {
  toleranceLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  impactScore: number;
  revenueAtRisk: number;
  affectedCustomers: number;
  segmentValue: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  revenueImpact: number;
  churnRate: number;
  brandImpact: 'Minimal' | 'Moderate' | 'Severe';
  timeframe: string;
}

interface RetentionStrategy {
  id: string;
  name: string;
  type: 'Discount' | 'Outreach' | 'Loyalty' | 'Feedback' | 'Premium';
  description: string;
  expectedROI: number;
  implementationCost: number;
  successProbability: number;
  timeToImplement: string;
  icon: string;
}

interface SimulationResult {
  retentionIncrease: number;
  roi: number;
  preservedLTV: number;
  preventedChurn: number;
  confidenceLevel: number;
}

interface StandaloneBusinessIntelligenceAgentProps {
  customers: ChurnCustomer[];
  isVisible: boolean;
  onClose: () => void;
}

export default function StandaloneBusinessIntelligenceAgent({ 
  customers = [], 
  isVisible, 
  onClose 
}: StandaloneBusinessIntelligenceAgentProps) {
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'high-risk' | 'medium-risk'>('high-risk');
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<RetentionStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate metrics
  const highRiskCustomers = customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High');
  const mediumRiskCustomers = customers.filter(c => c.risk_level === 'Medium');
  const avgCustomerValue = 45000; // Average LTV in INR
  const totalRevenueAtRisk = highRiskCustomers.length * avgCustomerValue;
  
  useEffect(() => {
    if (isVisible) {
      setAnimateCards(true);
    }
  }, [isVisible]);

  // 4.1 Risk Assessment Logic - "Is this a tolerable risk?"
  const assessRisk = useCallback((): RiskAssessment => {
    const impactScore = customers.length > 0 ? (highRiskCustomers.length / customers.length) * 100 : 0;
    const toleranceLevel = 
      impactScore > 30 ? 'Critical' :
      impactScore > 20 ? 'High' :
      impactScore > 10 ? 'Medium' : 'Low';
    
    // Evaluate segment value
    const hasEnterpriseCustomers = highRiskCustomers.some(c => (c.avg_order_value || 0) > 100000);
    const segmentValue = hasEnterpriseCustomers ? 'Enterprise & Mid-Market' : 'SMB & Consumer';
    
    return {
      toleranceLevel,
      impactScore,
      revenueAtRisk: totalRevenueAtRisk,
      affectedCustomers: highRiskCustomers.length,
      segmentValue,
      recommendation: toleranceLevel === 'Critical' ? 
        'IMMEDIATE INTERVENTION REQUIRED - Risk exceeds tolerance levels' : 
        toleranceLevel === 'High' ?
        'URGENT ACTION NEEDED - Proactive engagement critical' :
        'MONITOR CLOSELY - Prepare retention strategies'
    };
  }, [highRiskCustomers, customers, totalRevenueAtRisk]);

  // 4.2 Predict Outcomes - "What will happen if we take no action?"
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: '🚫 No Action Taken',
        revenueImpact: -(totalRevenueAtRisk * 0.7),
        churnRate: 65,
        brandImpact: 'Severe',
        timeframe: '3 months'
      },
      {
        scenario: '⚡ Partial Intervention',
        revenueImpact: -(totalRevenueAtRisk * 0.3),
        churnRate: 35,
        brandImpact: 'Moderate',
        timeframe: '3 months'
      },
      {
        scenario: '✅ Full Strategy Implementation',
        revenueImpact: -(totalRevenueAtRisk * 0.1),
        churnRate: 15,
        brandImpact: 'Minimal',
        timeframe: '3 months'
      }
    ];
  };

  // 4.3 Generate Retention Strategies - "What should the company do now?"
  const generateStrategies = (): RetentionStrategy[] => {
    return [
      {
        id: 'discount-campaign',
        name: 'Targeted Discount Campaign',
        type: 'Discount',
        description: 'Offer 20-30% discounts to high-risk segments with personalized messaging',
        expectedROI: 320,
        implementationCost: 50000,
        successProbability: 75,
        timeToImplement: '1 week',
        icon: '🎯'
      },
      {
        id: 'vip-outreach',
        name: 'VIP Customer Outreach',
        type: 'Outreach',
        description: 'Personal calls from account managers to understand concerns',
        expectedROI: 450,
        implementationCost: 30000,
        successProbability: 85,
        timeToImplement: '3 days',
        icon: '📞'
      },
      {
        id: 'loyalty-rewards',
        name: 'Enhanced Loyalty Program',
        type: 'Loyalty',
        description: 'Double points, exclusive perks, and early access to new features',
        expectedROI: 280,
        implementationCost: 75000,
        successProbability: 70,
        timeToImplement: '2 weeks',
        icon: '🏆'
      },
      {
        id: 'feedback-loop',
        name: 'Feedback & Resolution',
        type: 'Feedback',
        description: 'Collect feedback via surveys and resolve top 3 pain points',
        expectedROI: 380,
        implementationCost: 25000,
        successProbability: 80,
        timeToImplement: '1 week',
        icon: '💬'
      }
    ];
  };

  // 4.4 Simulate Benefits - "If we act, what benefit can we expect?"
  const simulateBenefits = (strategy: RetentionStrategy): SimulationResult => {
    const baseRetention = 30;
    const strategyBoost = strategy.successProbability * 0.5;
    const retentionIncrease = baseRetention + strategyBoost;
    
    return {
      retentionIncrease,
      roi: strategy.expectedROI,
      preservedLTV: Math.floor(totalRevenueAtRisk * (retentionIncrease / 100)),
      preventedChurn: Math.floor(highRiskCustomers.length * (retentionIncrease / 100)),
      confidenceLevel: strategy.successProbability
    };
  };

  if (!isVisible) return null;

  const riskAssessment = assessRisk();
  const outcomes = predictOutcomes();
  const strategies = generateStrategies();

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '420px',
      maxHeight: '650px',
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '2px solid rgba(255, 193, 7, 0.3)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 193, 7, 0.2)',
      overflow: 'hidden',
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInUp 0.5s ease-out'
    }}>
      
      {/* Header with gradient */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 193, 7, 0.2)',
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(251, 146, 60, 0.15))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '45px',
              height: '45px',
              background: 'linear-gradient(135deg, #FFC107, #FF6B6B)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              animation: 'pulse 2s infinite',
              boxShadow: '0 4px 20px rgba(255, 193, 7, 0.4)'
            }}>
              🧠
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                Business Intelligence Agent
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: riskAssessment.toleranceLevel === 'Critical' ? '#FF6B6B' :
                       riskAssessment.toleranceLevel === 'High' ? '#FFC107' : '#94a3b8',
                fontWeight: '600'
              }}>
                Risk Level: {riskAssessment.toleranceLevel} 
                {riskAssessment.toleranceLevel === 'Critical' && ' ⚠️'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#f8fafc',
              fontSize: '20px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation with better styling */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginTop: '16px',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'overview', label: '📊 Overview', color: '#3b82f6' },
            { id: 'assessment', label: '⚠️ Risk', color: '#ef4444' },
            { id: 'prediction', label: '🔮 Predict', color: '#8b5cf6' },
            { id: 'strategy', label: '💡 Strategy', color: '#10b981' },
            { id: 'simulation', label: '📈 Simulate', color: '#f59e0b' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: activeView === tab.id ? `1px solid ${tab.color}50` : 'none',
                background: activeView === tab.id ? 
                  `linear-gradient(135deg, ${tab.color}30, ${tab.color}15)` : 
                  'rgba(30, 41, 59, 0.5)',
                color: activeView === tab.id ? '#f8fafc' : '#94a3b8',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area with scrollbar */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#FFC107 transparent'
      }}>
        
        {/* Overview View */}
        {activeView === 'overview' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '16px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                ${(totalRevenueAtRisk / 1000).toFixed(0)}K at Risk
              </div>
              <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                {highRiskCustomers.length} customers likely to churn in next 3 months
              </div>
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#FFC107', marginBottom: '12px' }}>
              📊 Key Metrics
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Churn Probability', value: '65%', color: '#ef4444', icon: '📉' },
                { label: 'Impact Score', value: `${riskAssessment.impactScore.toFixed(1)}%`, color: '#f59e0b', icon: '💥' },
                { label: 'Affected Segments', value: '3', color: '#8b5cf6', icon: '👥' },
                { label: 'Time to Act', value: 'URGENT', color: '#10b981', icon: '⏰' }
              ].map((metric, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '10px',
                    padding: '14px',
                    border: `1px solid ${metric.color}40`,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 20px ${metric.color}30`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span>{metric.icon}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{metric.label}</span>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: metric.color }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4.1 Risk Assessment View - "Is this a tolerable risk?" */}
        {activeView === 'assessment' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: `linear-gradient(135deg, ${
                riskAssessment.toleranceLevel === 'Critical' ? 'rgba(239, 68, 68, 0.2)' :
                riskAssessment.toleranceLevel === 'High' ? 'rgba(245, 158, 11, 0.2)' :
                'rgba(34, 197, 94, 0.2)'
              }, transparent)`,
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '16px',
              border: `1px solid ${
                riskAssessment.toleranceLevel === 'Critical' ? 'rgba(239, 68, 68, 0.4)' :
                riskAssessment.toleranceLevel === 'High' ? 'rgba(245, 158, 11, 0.4)' :
                'rgba(34, 197, 94, 0.4)'
              }`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  fontSize: '36px',
                  animation: riskAssessment.toleranceLevel === 'Critical' ? 'pulse 1s infinite' : 'none'
                }}>
                  {riskAssessment.toleranceLevel === 'Critical' ? '🚨' :
                   riskAssessment.toleranceLevel === 'High' ? '⚠️' :
                   riskAssessment.toleranceLevel === 'Medium' ? '📊' : '✅'}
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc' }}>
                    {riskAssessment.toleranceLevel} Risk Level
                  </div>
                  <div style={{ fontSize: '14px', color: '#FFC107', fontWeight: '600' }}>
                    {riskAssessment.recommendation}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFC107', marginBottom: '12px' }}>
              💼 Business Impact Analysis
            </div>
            
            {[
              { label: 'Revenue at Risk', value: `$${(riskAssessment.revenueAtRisk / 1000).toFixed(0)}K`, severity: 'high', desc: 'Expected revenue loss' },
              { label: 'Customers Affected', value: `${riskAssessment.affectedCustomers} customers`, severity: 'medium', desc: `${((riskAssessment.affectedCustomers/customers.length)*100).toFixed(1)}% of total base` },
              { label: 'Segment Value', value: riskAssessment.segmentValue, severity: 'low', desc: 'Primary affected segments' },
              { label: 'Brand Impact', value: 'Moderate to Severe', severity: 'high', desc: 'Reputation & loyalty damage' }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '14px',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  border: `1px solid ${
                    item.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                    item.severity === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                    'rgba(34, 197, 94, 0.3)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ 
                      color: item.severity === 'high' ? '#ef4444' : 
                             item.severity === 'medium' ? '#f59e0b' : '#10b981',
                      fontWeight: '700',
                      fontSize: '16px'
                    }}>
                      {item.value}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right', maxWidth: '120px' }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4.2 Prediction View - "What will happen if we take no action?" */}
        {activeView === 'prediction' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFC107', marginBottom: '12px' }}>
              🔮 Future Outcome Scenarios
            </div>
            
            {outcomes.map((outcome, i) => (
              <div
                key={i}
                style={{
                  background: i === 0 ? 'rgba(239, 68, 68, 0.08)' :
                             i === 1 ? 'rgba(245, 158, 11, 0.08)' :
                             'rgba(34, 197, 94, 0.08)',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '14px',
                  border: `1px solid ${
                    i === 0 ? 'rgba(239, 68, 68, 0.3)' :
                    i === 1 ? 'rgba(245, 158, 11, 0.3)' :
                    'rgba(34, 197, 94, 0.3)'
                  }`,
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateX(-4px)';
                  e.currentTarget.style.boxShadow = '4px 0 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '700', 
                  color: '#f8fafc',
                  marginBottom: '10px'
                }}>
                  {outcome.scenario}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Revenue Impact</div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: outcome.revenueImpact < 0 ? '#ef4444' : '#10b981'
                    }}>
                      -${(Math.abs(outcome.revenueImpact) / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Churn Rate</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                      {outcome.churnRate}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Brand Impact</div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: outcome.brandImpact === 'Severe' ? '#ef4444' :
                             outcome.brandImpact === 'Moderate' ? '#f59e0b' : '#10b981'
                    }}>
                      {outcome.brandImpact}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Timeframe</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#8b5cf6' }}>
                      {outcome.timeframe}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4.3 Strategy View - "What should the company do now?" */}
        {activeView === 'strategy' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#FFC107', marginBottom: '12px' }}>
              💡 AI-Recommended Retention Strategies
            </div>
            
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                style={{
                  background: selectedStrategy?.id === strategy.id ? 
                    'rgba(255, 193, 7, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '14px',
                  border: `1px solid ${
                    selectedStrategy?.id === strategy.id ? 
                    'rgba(255, 193, 7, 0.4)' : 'rgba(75, 85, 99, 0.3)'
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => {
                  if (selectedStrategy?.id !== strategy.id) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedStrategy?.id !== strategy.id) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{strategy.icon}</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                        {strategy.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                        {strategy.description}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '8px',
                  marginTop: '14px'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>ROI</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                      {strategy.expectedROI}%
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Success</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>
                      {strategy.successProbability}%
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Cost</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>
                      ${(strategy.implementationCost/1000).toFixed(0)}K
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Time</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#8b5cf6' }}>
                      {strategy.timeToImplement}
                    </div>
                  </div>
                </div>

                {selectedStrategy?.id === strategy.id && (
                  <div style={{
                    marginTop: '14px',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255, 193, 7, 0.2)'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView('simulation');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #FFC107, #FF6B6B)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#0a1224',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 193, 7, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Simulate Benefits →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4.4 & 4.5 Simulation View - Benefits & Consequences */}
        {activeView === 'simulation' && selectedStrategy && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            {/* 4.4 Simulate Benefits */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '24px' }}>{selectedStrategy.icon}</span>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                  {selectedStrategy.name}
                </div>
              </div>
              
              {(() => {
                const simulation = simulateBenefits(selectedStrategy);
                return (
                  <>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#10b981',
                      marginBottom: '6px'
                    }}>
                      +{simulation.retentionIncrease.toFixed(1)}% Retention
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Expected improvement with {simulation.confidenceLevel}% confidence
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          💰 Preserved LTV
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
                          ${(simulation.preservedLTV / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          👥 Saved Customers
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                          {simulation.preventedChurn}
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          📈 ROI
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                          {simulation.roi}%
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          💸 Investment
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                          ${(selectedStrategy.implementationCost / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* 4.5 Highlight Consequences of Inaction */}
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ef4444', marginBottom: '12px' }}>
              ⚠️ Consequences of Inaction
            </div>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '14px',
              padding: '18px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', color: '#f8fafc', marginBottom: '10px', fontWeight: '600' }}>
                If no action is taken:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ef4444', fontSize: '13px', lineHeight: '1.8' }}>
                <li>💔 Revenue loss: <strong>${(totalRevenueAtRisk * 0.7 / 1000).toFixed(0)}K</strong> (70% of at-risk revenue)</li>
                <li>📉 Customer churn: <strong>{Math.floor(highRiskCustomers.length * 0.65)} customers</strong> will leave</li>
                <li>😞 Brand damage: <strong>Severe impact</strong> on reputation & trust</li>
                <li>🏃 Competitive loss: Customers will switch to competitors</li>
                <li>📊 Market share: <strong>-2.5%</strong> estimated decline</li>
                <li>💸 Recovery cost: <strong>3x more expensive</strong> to win back lost customers</li>
              </ul>
            </div>

            {/* 4.6 Guide User Decision */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(251, 146, 60, 0.1))',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFC107', marginBottom: '10px' }}>
                🎯 Would you like to implement this strategy?
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'accepted' });
                    alert(`✅ Strategy "${selectedStrategy.name}" accepted!\n\nImplementation will begin within ${selectedStrategy.timeToImplement}.\n\nExpected results:\n• Retention: +${simulateBenefits(selectedStrategy).retentionIncrease.toFixed(1)}%\n• ROI: ${selectedStrategy.expectedROI}%\n• Saved customers: ${simulateBenefits(selectedStrategy).preventedChurn}`);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: actionTaken[selectedStrategy.id] === 'accepted' ? 
                      'linear-gradient(135deg, #059669, #047857)' :
                      'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: actionTaken[selectedStrategy.id] === 'accepted' ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  disabled={actionTaken[selectedStrategy.id] === 'accepted'}
                >
                  {actionTaken[selectedStrategy.id] === 'accepted' ? '✓ Accepted' : '✅ Accept & Implement'}
                </button>
                
                <button
                  onClick={() => {
                    setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'snoozed' });
                    alert('⏰ Reminder set for 24 hours');
                  }}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(75, 85, 99, 0.3)',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ⏰ Snooze
                </button>

                <button
                  onClick={() => {
                    setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'reviewed' });
                  }}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '10px',
                    color: '#a78bfa',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📝 Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}

// Floating trigger button for BI Agent
export function BusinessIntelligenceTrigger({ 
  onClick, 
  highRiskCount = 0 
}: { 
  onClick: () => void;
  highRiskCount?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '100px',  // Positioned above the chat button
        right: '20px',    // Same right alignment as chat button
        width: '65px',
        height: '65px',
        borderRadius: '50%',
        background: highRiskCount > 15 ? 
          'linear-gradient(135deg, #ef4444, #dc2626)' :
          'linear-gradient(135deg, #FFC107, #FF6B6B)',
        border: 'none',
        color: 'white',
        fontSize: '28px',
        cursor: 'pointer',
        boxShadow: isHovered ? 
          '0 12px 40px rgba(255, 193, 7, 0.5)' :
          '0 8px 32px rgba(255, 193, 7, 0.3)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
        animation: highRiskCount > 15 ? 'pulse 2s infinite' : 'none'
      }}
      title="Business Intelligence Agent - Click for AI-powered insights"
    >
      🧠
      {highRiskCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '26px',
          height: '26px',
          background: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '700',
          color: '#ffffff',
          border: '2px solid #1f2937'
        }}>
          {highRiskCount}
        </div>
      )}
    </button>
  );
}