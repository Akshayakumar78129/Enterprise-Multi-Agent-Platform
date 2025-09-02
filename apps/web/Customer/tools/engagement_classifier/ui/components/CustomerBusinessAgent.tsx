import React, { useState, useEffect, useCallback } from 'react';

interface CustomerEngagement {
  customer_id: number;
  customer_name: string;
  engagement_level: 'Low' | 'Medium' | 'High' | 'Very High';
  engagement_score: number;
  days_since_activity: number;
  total_interactions: number;
  last_purchase_date: string;
}

interface EngagementAssessment {
  opportunityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  avgEngagementScore: number;
  potentialRevenue: number;
  disengagedCustomers: number;
  marketValue: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  engagementImpact: number;
  retentionRate: number;
  revenueImpact: string;
  timeframe: string;
}

interface EngagementStrategy {
  id: string;
  name: string;
  type: string;
  description: string;
  expectedROI: number;
  implementationCost: number;
  successProbability: number;
  timeToImplement: string;
  icon: string;
}

interface SimulationResult {
  engagementIncrease: number;
  roi: number;
  potentialRevenue: number;
  targetedCustomers: number;
  confidenceLevel: number;
}

// Currency helpers
const formatUSD = (amount: number, fractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);

export default function CustomerBusinessAgent() {
  // Mock customer data with realistic values
  const mockCustomers: CustomerEngagement[] = [
    { customer_id: 1, customer_name: 'Enterprise Corp', engagement_level: 'Very High', engagement_score: 9.2, days_since_activity: 2, total_interactions: 45, last_purchase_date: '2024-08-28' },
    { customer_id: 2, customer_name: 'Tech Solutions', engagement_level: 'High', engagement_score: 8.1, days_since_activity: 5, total_interactions: 32, last_purchase_date: '2024-08-25' },
    { customer_id: 3, customer_name: 'Global Industries', engagement_level: 'Medium', engagement_score: 6.5, days_since_activity: 12, total_interactions: 18, last_purchase_date: '2024-08-20' },
    { customer_id: 4, customer_name: 'StartupXYZ', engagement_level: 'Low', engagement_score: 3.2, days_since_activity: 45, total_interactions: 8, last_purchase_date: '2024-07-15' },
    { customer_id: 5, customer_name: 'MegaCorp Ltd', engagement_level: 'Very High', engagement_score: 9.8, days_since_activity: 1, total_interactions: 52, last_purchase_date: '2024-08-29' },
    { customer_id: 6, customer_name: 'Innovation Hub', engagement_level: 'Low', engagement_score: 2.8, days_since_activity: 60, total_interactions: 5, last_purchase_date: '2024-06-30' }
  ];
  
  const customers = mockCustomers;
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'high-engagement' | 'at-risk'>('high-engagement');
  const [showInsights, setShowInsights] = useState(false); // Hidden by default, toggled by brain button
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<EngagementStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate engagement metrics with fixed values
  const highEngagementCustomers = customers.filter(c => c.engagement_level === 'Very High' || c.engagement_level === 'High');
  const atRiskCustomers = customers.filter(c => c.engagement_level === 'Low' || c.days_since_activity > 30);
  
  // Fixed realistic values
  const totalCustomerCount = 100; // Fixed total customer count
  const avgCustomerValue = 1250; // Fixed average customer value in USD
  const lowEngagementCount = 15; // Fixed at-risk customer count
  const totalPotentialRevenue = lowEngagementCount * avgCustomerValue * 0.65; // 65% recovery potential
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Engagement Assessment Logic with fixed values
  const assessEngagement = useCallback((): EngagementAssessment => {
    const customerCount = customers.length || 1; // Prevent division by zero
    const riskScore = (atRiskCustomers.length / customerCount) * 100;
    const opportunityLevel = 
      riskScore > 40 ? 'Critical' :
      riskScore > 25 ? 'High' :
      riskScore > 15 ? 'Medium' : 'Low';
    
    // Calculate average engagement score with fallback
    const avgEngagementScore = customers.length > 0 ? 
      customers.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / customers.length :
      6.5; // Default average score
    
    return {
      opportunityLevel,
      avgEngagementScore: isNaN(avgEngagementScore) ? 6.5 : avgEngagementScore,
      potentialRevenue: totalPotentialRevenue,
      disengagedCustomers: lowEngagementCount,
      marketValue: 'Customer Retention & Growth',
      recommendation: opportunityLevel === 'Critical' ? 
        'Immediate re-engagement campaign required' : 
        'Optimize customer engagement strategies'
    };
  }, [atRiskCustomers, customers, totalPotentialRevenue]);

  // Predict Engagement Outcomes with fixed values
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: 'Status Quo',
        engagementImpact: 0,
        retentionRate: 75,
        revenueImpact: 'Minimal',
        timeframe: '6 months'
      },
      {
        scenario: 'Targeted Re-engagement',
        engagementImpact: totalPotentialRevenue * 0.4, // 40% of potential
        retentionRate: 85,
        revenueImpact: 'Moderate',
        timeframe: '3 months'
      },
      {
        scenario: 'Comprehensive Engagement Program',
        engagementImpact: totalPotentialRevenue * 0.8, // 80% of potential
        retentionRate: 92,
        revenueImpact: 'Significant',
        timeframe: '6 months'
      }
    ];
  };

  // Generate Engagement Strategies
  const generateStrategies = (): EngagementStrategy[] => {
    return [
      {
        id: 'reengagement-campaign',
        name: 'AI-Powered Re-engagement Campaign',
        type: 'Re-engagement Campaign',
        description: 'Personalized email and SMS campaigns targeting disengaged customers',
        expectedROI: 420,
        implementationCost: 15000,
        successProbability: 78,
        timeToImplement: '2 weeks',
        icon: '🎯'
      },
      {
        id: 'personalization-engine',
        name: 'Dynamic Personalization Engine',
        type: 'Personalization',
        description: 'Real-time content and product recommendations based on behavior',
        expectedROI: 380,
        implementationCost: 25000,
        successProbability: 85,
        timeToImplement: '3 weeks',
        icon: '🤖'
      },
      {
        id: 'loyalty-program',
        name: 'Premium Loyalty Program',
        type: 'Loyalty Program',
        description: 'Tiered rewards system to increase customer lifetime value',
        expectedROI: 520,
        implementationCost: 45000,
        successProbability: 75,
        timeToImplement: '6 weeks',
        icon: '🏆'
      }
    ];
  };

  // Simulate Engagement Benefits
  const simulateBenefits = (strategy: EngagementStrategy): SimulationResult => {
    const baseGrowth = 12;
    const strategyBoost = strategy.successProbability * 0.4;
    const engagementIncrease = baseGrowth + strategyBoost;
    
    return {
      engagementIncrease,
      roi: strategy.expectedROI,
      potentialRevenue: Math.floor(totalPotentialRevenue * (engagementIncrease / 100)),
      targetedCustomers: Math.floor(lowEngagementCount * (engagementIncrease / 100)),
      confidenceLevel: strategy.successProbability
    };
  };

  const engagementAssessment = assessEngagement();
  const outcomes = predictOutcomes();
  const strategies = generateStrategies();

  return (
    <>
      {/* Toggle Button - Original Design */}
      <button
        onClick={() => setShowInsights(!showInsights)}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))',
          backdropFilter: 'blur(20px)',
          borderRadius: '50%',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f8fafc'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))';
        }}
      >
        🧠
      </button>

      {/* Main Window - Original Design */}
      {showInsights && (
        <div style={{
          position: 'fixed',
          bottom: '150px',
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
      
        {/* Header - Original Design */}
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
                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
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
                  Customer Business Agent
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Opportunity: {engagementAssessment.opportunityLevel}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInsights(!showInsights)}
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

          {/* Tab Navigation - Original Design */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'assessment', label: 'Assessment', icon: '🎯' },
              { id: 'prediction', label: 'Predict', icon: '🔮' },
              { id: 'strategy', label: 'Strategy', icon: '💡' },
              { id: 'simulation', label: 'Simulate', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                style={{
                  background: activeView === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                  border: activeView === tab.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(51, 65, 85, 0.3)',
                  color: activeView === tab.id ? '#3b82f6' : '#94a3b8',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Original Design */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          {/* Overview - Original Design with Fixed Values */}
          {activeView === 'overview' && (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid rgba(0, 224, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                  📊 Engagement Overview
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                  • Total Customers: {totalCustomerCount.toLocaleString()}<br/>
                  • Avg Engagement Score: {engagementAssessment.avgEngagementScore.toFixed(1)}/10<br/>
                  • High Engagement: {highEngagementCustomers.length} customers<br/>
                  • At Risk: {lowEngagementCount} customers<br/>
                  • Recovery Potential: {formatUSD(totalPotentialRevenue)}
                </div>
              </div>

              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(0, 224, 255, 0.2)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                  🎯 Key Insights
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                  • {Math.round((highEngagementCustomers.length / totalCustomerCount) * 100)}% of customers are highly engaged<br/>
                  • {Math.round((lowEngagementCount / totalCustomerCount) * 100)}% need re-engagement attention<br/>
                  • Potential revenue uplift: {formatUSD(totalPotentialRevenue * 0.6)}<br/>
                  • Recommended action: {engagementAssessment.recommendation}
                </div>
              </div>
            </div>
          )}

          {/* Assessment - Original Design with Fixed Values */}
          {activeView === 'assessment' && (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{
                background: `linear-gradient(135deg, ${
                  engagementAssessment.opportunityLevel === 'Critical' ? 'rgba(239, 68, 68, 0.1)' :
                  engagementAssessment.opportunityLevel === 'High' ? 'rgba(245, 158, 11, 0.1)' : 
                  'rgba(59, 130, 246, 0.1)'
                }, rgba(30, 41, 59, 0.1))`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: `1px solid ${
                  engagementAssessment.opportunityLevel === 'Critical' ? 'rgba(239, 68, 68, 0.2)' :
                  engagementAssessment.opportunityLevel === 'High' ? 'rgba(245, 158, 11, 0.2)' : 
                  'rgba(59, 130, 246, 0.2)'
                }`
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>
                  🎯 Engagement Assessment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                  <div>
                    <div style={{ color: '#94a3b8' }}>Opportunity Level</div>
                    <div style={{ color: '#f8fafc', fontWeight: '600' }}>{engagementAssessment.opportunityLevel}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8' }}>Avg Score</div>
                    <div style={{ color: '#f8fafc', fontWeight: '600' }}>{engagementAssessment.avgEngagementScore.toFixed(1)}/10</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8' }}>At Risk</div>
                    <div style={{ color: '#f8fafc', fontWeight: '600' }}>{lowEngagementCount} customers</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8' }}>Potential Value</div>
                    <div style={{ color: '#f8fafc', fontWeight: '600' }}>{formatUSD(totalPotentialRevenue)}</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(51, 65, 85, 0.3)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                  💡 Recommendation
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                  {engagementAssessment.recommendation}. Focus on the {lowEngagementCount} at-risk customers 
                  with targeted re-engagement campaigns to recover {formatUSD(totalPotentialRevenue * 0.6)} in potential revenue.
                </div>
              </div>
            </div>
          )}

          {/* Prediction - Original Design with Fixed Values */}
          {activeView === 'prediction' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                🔮 Engagement Scenarios
              </div>
              {outcomes.map((outcome, i) => (
                <div key={i} style={{
                  background: i === 0 ? 'rgba(239, 68, 68, 0.1)' : 
                            i === 1 ? 'rgba(245, 158, 11, 0.1)' : 
                            'rgba(16, 185, 129, 0.1)',
                  border: i === 0 ? '1px solid rgba(239, 68, 68, 0.2)' : 
                          i === 1 ? '1px solid rgba(245, 158, 11, 0.2)' : 
                          '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '6px' }}>
                    {outcome.scenario}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Revenue Impact: {formatUSD(outcome.engagementImpact)}<br/>
                    Retention Rate: {outcome.retentionRate}%<br/>
                    Timeline: {outcome.timeframe}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Strategy - Original Design */}
          {activeView === 'strategy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                💡 Engagement Strategies
              </div>
              {strategies.map((strategy, i) => (
                <div key={strategy.id} style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(51, 65, 85, 0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(51, 65, 85, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                }}
                onClick={() => setSelectedStrategy(strategy)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{strategy.icon}</span>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                      {strategy.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    ROI: {strategy.expectedROI}% • Success: {strategy.successProbability}%<br/>
                    Cost: {formatUSD(strategy.implementationCost)} • Time: {strategy.timeToImplement}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simulation - Original Design */}
          {activeView === 'simulation' && selectedStrategy && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                📈 ROI Simulation: {selectedStrategy.name}
              </div>
              
              {(() => {
                const simulation = simulateBenefits(selectedStrategy);
                return (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <div style={{ color: '#94a3b8' }}>Engagement Increase</div>
                        <div style={{ color: '#f8fafc', fontWeight: '600' }}>+{simulation.engagementIncrease.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8' }}>Expected ROI</div>
                        <div style={{ color: '#f8fafc', fontWeight: '600' }}>{simulation.roi}%</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8' }}>Revenue Impact</div>
                        <div style={{ color: '#f8fafc', fontWeight: '600' }}>{formatUSD(simulation.potentialRevenue)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8' }}>Confidence</div>
                        <div style={{ color: '#f8fafc', fontWeight: '600' }}>{simulation.confidenceLevel}%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{
                background: 'rgba(30, 41, 59, 0.5)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(51, 65, 85, 0.3)'
              }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                  <strong style={{ color: '#f8fafc' }}>Implementation Plan:</strong><br/>
                  • Phase 1: Strategy setup and team training<br/>
                  • Phase 2: Pilot program with select customers<br/>
                  • Phase 3: Full rollout and optimization<br/>
                  • Expected timeline: {selectedStrategy.timeToImplement}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActionTaken({...actionTaken, [selectedStrategy.id]: 'accepted'})}
                  style={{
                    flex: 1,
                    background: actionTaken[selectedStrategy.id] === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {actionTaken[selectedStrategy.id] === 'accepted' ? '✅ Accepted' : '✅ Accept'}
                </button>
                <button
                  onClick={() => setActionTaken({...actionTaken, [selectedStrategy.id]: 'snoozed'})}
                  style={{
                    flex: 1,
                    background: actionTaken[selectedStrategy.id] === 'snoozed' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {actionTaken[selectedStrategy.id] === 'snoozed' ? '⏰ Snoozed' : '⏰ Snooze'}
                </button>
              </div>
            </div>
          )}

          {/* No Strategy Selected */}
          {activeView === 'simulation' && !selectedStrategy && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#94a3b8'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Select a Strategy
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                Choose an engagement strategy from the Strategy tab to see detailed ROI simulations and implementation plans.
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}