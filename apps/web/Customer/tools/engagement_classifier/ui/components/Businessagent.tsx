import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
// Global functions for agent communication (available via window object)
declare global {
  interface Window {
    setCustomerInsightMode?: (mode: string) => void;
    setCustomerInsightView?: (view: string) => void;
    getCustomerInsightMode?: () => string;
  }
}

const setCustomerInsightView = (view: string) => {
  if (window.setCustomerInsightView) {
    window.setCustomerInsightView(view);
  }
};

const setCustomerInsightMode = (mode: string) => {
  if (window.setCustomerInsightMode) {
    window.setCustomerInsightMode(mode);
  }
};

const getCustomerInsightMode = () => {
  return window.getCustomerInsightMode ? window.getCustomerInsightMode() : 'insights';
};

// Type definitions for Customer Insight Agent
interface EngagementCustomer {
  customer_id: number;
  name: string;
  engagement_level: 'Low' | 'Medium' | 'High' | 'Very High';
  engagement_score: number;
  avg_session_duration?: number;
  activity_count?: number;
  sentiment_score?: number;
}

interface RootState {
  customerInsight: {
    customers: EngagementCustomer[];
    filters: any;
    loading: boolean;
    error: string | null;
  };
}

interface EngagementAssessment {
  opportunityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  engagementScore: number;
  potentialRevenue: number;
  targetCustomers: number;
  segmentValue: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  engagementImpact: number;
  conversionRate: number;
  brandImpact: 'Minimal' | 'Moderate' | 'Significant';
  timeframe: string;
}

interface EngagementStrategy {
  id: string;
  name: string;
  type: 'Personalization' | 'Gamification' | 'Content' | 'Social' | 'Mobile';
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

export default function CustomerInsightAgent() {
  const { customers, filters } = useSelector((state: RootState) => state.customerInsight);
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'high-engagement' | 'medium-engagement'>('high-engagement');
  const [showInsights, setShowInsights] = useState(false); // Hidden by default, toggled by brain button
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<EngagementStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate engagement metrics
  const highEngagementCustomers = customers.filter(c => c.engagement_level === 'High' || c.engagement_level === 'Very High');
  const lowEngagementCustomers = customers.filter(c => c.engagement_level === 'Low');
  const avgCustomerValue = 45000; // Average LTV
  const totalPotentialRevenue = lowEngagementCustomers.length * avgCustomerValue * 0.3; // 30% uplift potential
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Engagement Assessment Logic
  const assessEngagement = useCallback((): EngagementAssessment => {
    const opportunityScore = (lowEngagementCustomers.length / customers.length) * 100;
    const opportunityLevel = 
      opportunityScore > 30 ? 'Critical' :
      opportunityScore > 20 ? 'High' :
      opportunityScore > 10 ? 'Medium' : 'Low';
    
    const avgEngagementScore = customers.reduce((sum, c) => sum + c.engagement_score, 0) / customers.length;
    
    return {
      opportunityLevel,
      engagementScore: avgEngagementScore,
      potentialRevenue: totalPotentialRevenue,
      targetCustomers: lowEngagementCustomers.length,
      segmentValue: 'Cross-segment Opportunity',
      recommendation: opportunityLevel === 'Critical' ? 
        'Immediate engagement campaign required' : 
        'Optimize engagement strategies'
    };
  }, [lowEngagementCustomers, customers, totalPotentialRevenue]);

  // Predict Engagement Outcomes
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: 'No Action Taken',
        engagementImpact: 0,
        conversionRate: 12,
        brandImpact: 'Minimal',
        timeframe: '3 months'
      },
      {
        scenario: 'Targeted Engagement Campaign',
        engagementImpact: totalPotentialRevenue * 0.4,
        conversionRate: 28,
        brandImpact: 'Moderate',
        timeframe: '3 months'
      },
      {
        scenario: 'Full Engagement Strategy',
        engagementImpact: totalPotentialRevenue * 0.7,
        conversionRate: 45,
        brandImpact: 'Significant',
        timeframe: '3 months'
      }
    ];
  };

  // Generate Engagement Strategies
  const generateStrategies = (): EngagementStrategy[] => {
    return [
      {
        id: 'personalization-engine',
        name: 'AI-Powered Personalization',
        type: 'Personalization',
        description: 'Dynamic content and product recommendations based on behavior',
        expectedROI: 420,
        implementationCost: 60000,
        successProbability: 85,
        timeToImplement: '2 weeks',
        icon: '🤖'
      },
      {
        id: 'gamification-system',
        name: 'Engagement Gamification',
        type: 'Gamification',
        description: 'Points, badges, leaderboards, and challenges',
        expectedROI: 350,
        implementationCost: 40000,
        successProbability: 78,
        timeToImplement: '3 weeks',
        icon: '🎮'
      },
      {
        id: 'content-strategy',
        name: 'Interactive Content Hub',
        type: 'Content',
        description: 'Video tutorials, webinars, and interactive guides',
        expectedROI: 280,
        implementationCost: 35000,
        successProbability: 72,
        timeToImplement: '1 week',
        icon: '📚'
      },
      {
        id: 'social-engagement',
        name: 'Social Community Platform',
        type: 'Social',
        description: 'User forums, reviews, and peer-to-peer interactions',
        expectedROI: 320,
        implementationCost: 45000,
        successProbability: 75,
        timeToImplement: '4 weeks',
        icon: '👥'
      }
    ];
  };

  // Simulate Engagement Benefits
  const simulateBenefits = (strategy: EngagementStrategy): SimulationResult => {
    const baseEngagement = 25;
    const strategyBoost = strategy.successProbability * 0.6;
    const engagementIncrease = baseEngagement + strategyBoost;
    
    return {
      engagementIncrease,
      roi: strategy.expectedROI,
      potentialRevenue: Math.floor(totalPotentialRevenue * (engagementIncrease / 100)),
      targetedCustomers: Math.floor(lowEngagementCustomers.length * (engagementIncrease / 100)),
      confidenceLevel: strategy.successProbability
    };
  };

  const engagementAssessment = assessEngagement();
  const outcomes = predictOutcomes();
  const strategies = generateStrategies();

  return (
    <>
      {/* Toggle Button */}
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

      {/* Main Window */}
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
              background: 'linear-gradient(135deg, #10b981, #3b82f6)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              animation: 'pulse 2s infinite'
            }}>
              💡
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                Customer Insight Agent
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
            { id: 'assessment', label: '🎯 Opportunity', color: '#10b981' },
            { id: 'prediction', label: '🔮 Predict', color: '#8b5cf6' },
            { id: 'strategy', label: '💡 Engage', color: '#f59e0b' },
            { id: 'simulation', label: '📈 Simulate', color: '#ef4444' }
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
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                ₹{(totalPotentialRevenue / 100000).toFixed(1)}L Opportunity
              </div>
              <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                {lowEngagementCustomers.length} customers with engagement potential
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Avg Engagement', value: `${engagementAssessment.engagementScore.toFixed(0)}%`, color: '#10b981' },
                { label: 'High Engaged', value: `${highEngagementCustomers.length}`, color: '#3b82f6' },
                { label: 'Opportunity Score', value: `${engagementAssessment.opportunityLevel}`, color: '#f59e0b' },
                { label: 'Action Priority', value: 'High', color: '#ef4444' }
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

        {/* Engagement Assessment View */}
        {activeView === 'assessment' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: `linear-gradient(135deg, ${
                engagementAssessment.opportunityLevel === 'Critical' ? 'rgba(16, 185, 129, 0.1)' :
                engagementAssessment.opportunityLevel === 'High' ? 'rgba(59, 130, 246, 0.1)' :
                'rgba(245, 158, 11, 0.1)'
              }, transparent)`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  fontSize: '32px',
                  animation: engagementAssessment.opportunityLevel === 'Critical' ? 'pulse 1s infinite' : 'none'
                }}>
                  {engagementAssessment.opportunityLevel === 'Critical' ? '🎯' :
                   engagementAssessment.opportunityLevel === 'High' ? '📈' :
                   engagementAssessment.opportunityLevel === 'Medium' ? '💡' : '✅'}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>
                    {engagementAssessment.opportunityLevel} Opportunity Level
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    {engagementAssessment.recommendation}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              Opportunity Analysis
            </div>
            
            {[
              { label: 'Revenue Potential', value: `₹${(engagementAssessment.potentialRevenue / 100000).toFixed(1)}L`, severity: 'high' },
              { label: 'Target Customers', value: engagementAssessment.targetCustomers, severity: 'medium' },
              { label: 'Segment Focus', value: engagementAssessment.segmentValue, severity: 'low' },
              { label: 'Brand Impact', value: 'Positive Growth', severity: 'high' }
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
                    item.severity === 'high' ? 'rgba(16, 185, 129, 0.3)' :
                    item.severity === 'medium' ? 'rgba(59, 130, 246, 0.3)' :
                    'rgba(245, 158, 11, 0.3)'
                  }`
                }}
              >
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>{item.label}</span>
                <span style={{ 
                  color: item.severity === 'high' ? '#10b981' : 
                         item.severity === 'medium' ? '#3b82f6' : '#f59e0b',
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
                      ₹{(Math.abs(outcome.revenueImpact) / 100000).toFixed(1)}L
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
                          ₹{(simulation.preservedLTV / 100000).toFixed(1)}L
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
                          ₹{(selectedStrategy.implementationCost / 1000).toFixed(0)}K
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
                <li>Revenue loss: ₹{(totalRevenueAtRisk * 0.7 / 100000).toFixed(1)}L</li>
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
      )}
    </>
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