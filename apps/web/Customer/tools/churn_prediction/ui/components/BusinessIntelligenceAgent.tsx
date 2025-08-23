import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// Type definitions
interface ChurnCustomer {
  customer_id: number;
  name: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'Very High';
  churn_probability: number;
  avg_order_value?: number;
  frequency?: number;
}

interface RootState {
  churnPrediction: {
    customers: ChurnCustomer[];
    filters: any;
    loading: boolean;
    error: string | null;
  };
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

export default function BusinessIntelligenceAgent() {
  const { customers, filters } = useSelector((state: RootState) => state.churnPrediction);
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'high-risk' | 'medium-risk'>('high-risk');
  const [showInsights, setShowInsights] = useState(true); // Always show when component is rendered
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<RetentionStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate metrics
  const highRiskCustomers = customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High');
  const mediumRiskCustomers = customers.filter(c => c.risk_level === 'Medium');
  const avgCustomerValue = 45000; // Average LTV
  const totalRevenueAtRisk = highRiskCustomers.length * avgCustomerValue;
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Risk Assessment Logic
  const assessRisk = useCallback((): RiskAssessment => {
    const impactScore = (highRiskCustomers.length / customers.length) * 100;
    const toleranceLevel = 
      impactScore > 30 ? 'Critical' :
      impactScore > 20 ? 'High' :
      impactScore > 10 ? 'Medium' : 'Low';
    
    return {
      toleranceLevel,
      impactScore,
      revenueAtRisk: totalRevenueAtRisk,
      affectedCustomers: highRiskCustomers.length,
      segmentValue: 'Enterprise & Mid-Market',
      recommendation: toleranceLevel === 'Critical' ? 
        'Immediate intervention required' : 
        'Proactive engagement recommended'
    };
  }, [highRiskCustomers, customers, totalRevenueAtRisk]);

  // Predict Outcomes
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: 'No Action Taken',
        revenueImpact: -(totalRevenueAtRisk * 0.7),
        churnRate: 65,
        brandImpact: 'Severe',
        timeframe: '3 months'
      },
      {
        scenario: 'Partial Intervention',
        revenueImpact: -(totalRevenueAtRisk * 0.3),
        churnRate: 35,
        brandImpact: 'Moderate',
        timeframe: '3 months'
      },
      {
        scenario: 'Full Strategy Implementation',
        revenueImpact: -(totalRevenueAtRisk * 0.1),
        churnRate: 15,
        brandImpact: 'Minimal',
        timeframe: '3 months'
      }
    ];
  };

  // Generate Retention Strategies
  const generateStrategies = (): RetentionStrategy[] => {
    return [
      {
        id: 'discount-campaign',
        name: 'Targeted Discount Campaign',
        type: 'Discount',
        description: 'Offer 20-30% discounts to high-risk segments',
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
        description: 'Personal calls from account managers',
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
        description: 'Double points and exclusive perks',
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
        description: 'Collect feedback and resolve pain points',
        expectedROI: 380,
        implementationCost: 25000,
        successProbability: 80,
        timeToImplement: '1 week',
        icon: '💬'
      }
    ];
  };

  // Simulate Benefits
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

  const riskAssessment = assessRisk();
  const outcomes = predictOutcomes();
  const strategies = generateStrategies();

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '380px',
      maxHeight: '600px',
      background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.97), rgba(31, 41, 55, 0.97))',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      zIndex: 1000,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              animation: 'pulse 2s infinite'
            }}>
              🧠
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                Business Intelligence
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Risk: {riskAssessment.toleranceLevel}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowInsights(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
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
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeView === tab.id ? 
                  `linear-gradient(135deg, ${tab.color}40, ${tab.color}20)` : 
                  'rgba(30, 41, 59, 0.5)',
                color: activeView === tab.id ? '#f8fafc' : '#94a3b8',
                fontSize: '12px',
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

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        scrollbarWidth: 'thin'
      }}>
        
        {/* Overview View */}
        {activeView === 'overview' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                ${(totalRevenueAtRisk / 1000).toFixed(1)}K at Risk
              </div>
              <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                {highRiskCustomers.length} customers likely to churn
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Churn Probability', value: '65%', color: '#ef4444' },
                { label: 'Impact Score', value: `${riskAssessment.impactScore.toFixed(1)}%`, color: '#f59e0b' },
                { label: 'Affected Segments', value: '3', color: '#8b5cf6' },
                { label: 'Time to Act', value: 'Now', color: '#10b981' }
              ].map((metric, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${metric.color}30`
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: metric.color }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Assessment View */}
        {activeView === 'assessment' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: `linear-gradient(135deg, ${
                riskAssessment.toleranceLevel === 'Critical' ? 'rgba(239, 68, 68, 0.1)' :
                riskAssessment.toleranceLevel === 'High' ? 'rgba(245, 158, 11, 0.1)' :
                'rgba(34, 197, 94, 0.1)'
              }, transparent)`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  fontSize: '32px',
                  animation: riskAssessment.toleranceLevel === 'Critical' ? 'pulse 1s infinite' : 'none'
                }}>
                  {riskAssessment.toleranceLevel === 'Critical' ? '🚨' :
                   riskAssessment.toleranceLevel === 'High' ? '⚠️' :
                   riskAssessment.toleranceLevel === 'Medium' ? '📊' : '✅'}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                    {riskAssessment.toleranceLevel} Risk Level
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    {riskAssessment.recommendation}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              Impact Analysis
            </div>
            
            {[
              { label: 'Revenue at Risk', value: `$${(riskAssessment.revenueAtRisk / 1000).toFixed(1)}K`, severity: 'high' },
              { label: 'Customers Affected', value: riskAssessment.affectedCustomers, severity: 'medium' },
              { label: 'Segment Value', value: riskAssessment.segmentValue, severity: 'low' },
              { label: 'Brand Impact', value: 'Moderate to Severe', severity: 'high' }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  border: `1px solid ${
                    item.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' :
                    item.severity === 'medium' ? 'rgba(245, 158, 11, 0.3)' :
                    'rgba(34, 197, 94, 0.3)'
                  }`
                }}
              >
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.label}</span>
                <span style={{ 
                  color: item.severity === 'high' ? '#ef4444' : 
                         item.severity === 'medium' ? '#f59e0b' : '#10b981',
                  fontWeight: '600',
                  fontSize: '13px'
                }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Prediction View */}
        {activeView === 'prediction' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              📉 Outcome Scenarios
            </div>
            
            {outcomes.map((outcome, i) => (
              <div
                key={i}
                style={{
                  background: i === 0 ? 'rgba(239, 68, 68, 0.05)' :
                             i === 1 ? 'rgba(245, 158, 11, 0.05)' :
                             'rgba(34, 197, 94, 0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${
                    i === 0 ? 'rgba(239, 68, 68, 0.2)' :
                    i === 1 ? 'rgba(245, 158, 11, 0.2)' :
                    'rgba(34, 197, 94, 0.2)'
                  }`,
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#f8fafc',
                  marginBottom: '8px'
                }}>
                  {outcome.scenario}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Revenue Impact</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '600',
                      color: outcome.revenueImpact < 0 ? '#ef4444' : '#10b981'
                    }}>
                      ${(Math.abs(outcome.revenueImpact) / 1000).toFixed(1)}K
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Churn Rate</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b' }}>
                      {outcome.churnRate}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Brand Impact</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: '600',
                      color: outcome.brandImpact === 'Severe' ? '#ef4444' :
                             outcome.brandImpact === 'Moderate' ? '#f59e0b' : '#10b981'
                    }}>
                      {outcome.brandImpact}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Timeframe</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#8b5cf6' }}>
                      {outcome.timeframe}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategy View */}
        {activeView === 'strategy' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              💡 AI-Recommended Strategies
            </div>
            
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                style={{
                  background: selectedStrategy?.id === strategy.id ? 
                    'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${
                    selectedStrategy?.id === strategy.id ? 
                    'rgba(59, 130, 246, 0.3)' : 'rgba(75, 85, 99, 0.3)'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{strategy.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                        {strategy.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {strategy.description}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '8px',
                  marginTop: '12px'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>ROI</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
                      {strategy.expectedROI}%
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Success</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#3b82f6' }}>
                      {strategy.successProbability}%
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Time</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b' }}>
                      {strategy.timeToImplement}
                    </div>
                  </div>
                </div>

                {selectedStrategy?.id === strategy.id && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(75, 85, 99, 0.3)'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView('simulation');
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
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

        {/* Simulation View */}
        {activeView === 'simulation' && selectedStrategy && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{selectedStrategy.icon}</span>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                  {selectedStrategy.name}
                </div>
              </div>
              
              {(() => {
                const simulation = simulateBenefits(selectedStrategy);
                return (
                  <>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: '#10b981',
                      marginBottom: '4px'
                    }}>
                      +{simulation.retentionIncrease.toFixed(1)}% Retention
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Expected improvement with {simulation.confidenceLevel}% confidence
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Preserved LTV
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                          ${(simulation.preservedLTV / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Prevented Churn
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                          {simulation.preventedChurn} customers
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          ROI
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          {simulation.roi}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Cost
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>
                          ${(selectedStrategy.implementationCost / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              ⚠️ Consequences of Inaction
            </div>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', color: '#f8fafc', marginBottom: '8px' }}>
                If no action is taken:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#ef4444', fontSize: '12px' }}>
                <li>Revenue loss: ${(totalRevenueAtRisk * 0.7 / 1000).toFixed(1)}K</li>
                <li>Customer churn: {Math.floor(highRiskCustomers.length * 0.65)} customers</li>
                <li>Brand damage: Severe impact on reputation</li>
                <li>Competitive disadvantage: Loss of market share</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'accepted' });
                  alert('Strategy accepted! Implementation will begin.');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                disabled={actionTaken[selectedStrategy.id]}
              >
                {actionTaken[selectedStrategy.id] === 'accepted' ? '✓ Accepted' : 'Accept & Implement'}
              </button>
              
              <button
                onClick={() => {
                  setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'snoozed' });
                }}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(75, 85, 99, 0.3)',
                  border: '1px solid rgba(75, 85, 99, 0.5)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Snooze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add floating trigger button
export function BusinessIntelligenceTrigger({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const { customers } = useSelector((state: RootState) => state.churnPrediction);
  const highRiskCount = customers.filter(c => 
    c.risk_level === 'High' || c.risk_level === 'Very High'
  ).length;
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '90px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: highRiskCount > 15 ? 
          'linear-gradient(135deg, #ef4444, #dc2626)' :
          'linear-gradient(135deg, #f59e0b, #d97706)',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: isHovered ? 
          '0 12px 40px rgba(239, 68, 68, 0.5)' :
          '0 8px 32px rgba(239, 68, 68, 0.3)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1001,
        animation: highRiskCount > 15 ? 'pulse 2s infinite' : 'none',
        position: 'relative'
      }}
      title="Business Intelligence Agent"
    >
      🧠
      {highRiskCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '24px',
          height: '24px',
          background: '#ef4444',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
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