import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// Type definitions
interface SegmentSummary {
  segment_name: string;
  customer_count: number;
  avg_order_value: number;
  total_revenue: number;
  engagement_rate?: number;
}

interface RootState {
  customerSegmentation: {
    segmentSummaries: SegmentSummary[];
    kpis: any;
    loading: boolean;
    error: string | null;
  };
}

interface SegmentAssessment {
  performanceLevel: 'Low' | 'Medium' | 'High' | 'Excellent';
  growthScore: number;
  revenueContribution: number;
  customerCount: number;
  topSegment: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  revenueImpact: number;
  growthRate: number;
  marketShare: 'Declining' | 'Stable' | 'Growing';
  timeframe: string;
}

interface GrowthStrategy {
  id: string;
  name: string;
  type: 'Upsell' | 'Crosssell' | 'Retention' | 'Acquisition' | 'Engagement';
  description: string;
  expectedROI: number;
  implementationCost: number;
  successProbability: number;
  timeToImplement: string;
  icon: string;
}

interface SimulationResult {
  revenueIncrease: number;
  roi: number;
  newCustomers: number;
  improvedSegments: number;
  confidenceLevel: number;
}

interface BusinessIntelligenceAgentProps {
  onClose: () => void;
}

export default function BusinessIntelligenceAgent({ onClose }: BusinessIntelligenceAgentProps) {
  const { segmentSummaries, kpis } = useSelector((state: RootState) => state.customerSegmentation);
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'champions' | 'loyal'>('champions');
  const [showInsights, setShowInsights] = useState(true);
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<GrowthStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate metrics
  const totalRevenue = segmentSummaries.reduce((sum, s) => sum + (s.total_revenue || 0), 0);
  const totalCustomers = segmentSummaries.reduce((sum, s) => sum + (s.customer_count || 0), 0);
  const topSegment = segmentSummaries.reduce((max, s) => 
    (s.total_revenue || 0) > (max.total_revenue || 0) ? s : max, segmentSummaries[0]);
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Segment Assessment Logic
  const assessSegments = useCallback((): SegmentAssessment => {
    const growthScore = ((totalRevenue / 1000000) * 100) / 10; // Simplified growth score
    const performanceLevel = 
      growthScore > 80 ? 'Excellent' :
      growthScore > 60 ? 'High' :
      growthScore > 40 ? 'Medium' : 'Low';
    
    return {
      performanceLevel,
      growthScore,
      revenueContribution: totalRevenue,
      customerCount: totalCustomers,
      topSegment: topSegment?.segment_name || 'Unknown',
      recommendation: performanceLevel === 'Excellent' ? 
        'Maintain momentum and explore new segments' : 
        'Focus on segment optimization and engagement'
    };
  }, [totalRevenue, totalCustomers, topSegment]);

  const segmentAssessment = assessSegments();

  // Predict Outcomes
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: 'Status Quo',
        revenueImpact: totalRevenue * 0.05,
        growthRate: 5,
        marketShare: 'Stable',
        timeframe: '6 months'
      },
      {
        scenario: 'Targeted Campaigns',
        revenueImpact: totalRevenue * 0.15,
        growthRate: 15,
        marketShare: 'Growing',
        timeframe: '6 months'
      },
      {
        scenario: 'Full Optimization',
        revenueImpact: totalRevenue * 0.30,
        growthRate: 30,
        marketShare: 'Growing',
        timeframe: '6 months'
      }
    ];
  };

  // Generate Growth Strategies
  const generateStrategies = (): GrowthStrategy[] => {
    return [
      {
        id: 'upsell-champions',
        name: 'Champions Upsell Program',
        type: 'Upsell',
        description: 'Premium offerings for top-tier customers',
        expectedROI: 450,
        implementationCost: 75000,
        successProbability: 85,
        timeToImplement: '2 weeks',
        icon: '👑'
      },
      {
        id: 'reactivate-dormant',
        name: 'Dormant Customer Reactivation',
        type: 'Engagement',
        description: 'Win-back campaigns for inactive segments',
        expectedROI: 380,
        implementationCost: 45000,
        successProbability: 70,
        timeToImplement: '1 week',
        icon: '🔄'
      },
      {
        id: 'loyalty-expansion',
        name: 'Loyalty Program Expansion',
        type: 'Retention',
        description: 'Enhanced rewards for frequent buyers',
        expectedROI: 520,
        implementationCost: 60000,
        successProbability: 90,
        timeToImplement: '3 weeks',
        icon: '🌟'
      },
      {
        id: 'referral-program',
        name: 'Referral Incentive Program',
        type: 'Acquisition',
        description: 'Leverage satisfied customers for growth',
        expectedROI: 600,
        implementationCost: 40000,
        successProbability: 75,
        timeToImplement: '2 weeks',
        icon: '🤝'
      },
      {
        id: 'crosssell-ai',
        name: 'AI-Powered Cross-Selling',
        type: 'Crosssell',
        description: 'Smart product recommendations',
        expectedROI: 420,
        implementationCost: 80000,
        successProbability: 80,
        timeToImplement: '4 weeks',
        icon: '🤖'
      }
    ];
  };

  // Simulate Strategy
  const simulateStrategy = (strategy: GrowthStrategy): SimulationResult => {
    const baseIncrease = (strategy.expectedROI / 100) * strategy.implementationCost;
    const confidenceAdjustment = strategy.successProbability / 100;
    
    return {
      revenueIncrease: baseIncrease * confidenceAdjustment,
      roi: strategy.expectedROI,
      newCustomers: Math.floor((baseIncrease / 5000) * confidenceAdjustment),
      improvedSegments: Math.floor(segmentSummaries.length * confidenceAdjustment * 0.6),
      confidenceLevel: strategy.successProbability
    };
  };

  const handleActionClick = (actionId: string, actionType: 'accepted' | 'snoozed' | 'reviewed') => {
    setActionTaken(prev => ({ ...prev, [actionId]: actionType }));
  };

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
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
                Performance: {segmentAssessment.performanceLevel}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
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
            { id: 'assessment', label: '📈 Performance', color: '#10b981' },
            { id: 'prediction', label: '🔮 Predict', color: '#8b5cf6' },
            { id: 'strategy', label: '💡 Strategy', color: '#f59e0b' },
            { id: 'simulation', label: '🚀 Simulate', color: '#ef4444' }
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
                ${(totalRevenue / 1000).toFixed(0)}K Revenue
              </div>
              <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                {totalCustomers} customers across {segmentSummaries.length} segments
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Top Segment', value: topSegment?.segment_name || 'N/A', color: '#3b82f6' },
                { label: 'Growth Score', value: `${segmentAssessment.growthScore.toFixed(0)}%`, color: '#10b981' },
                { label: 'Active Segments', value: segmentSummaries.length.toString(), color: '#8b5cf6' },
                { label: 'Avg Order Value', value: `$${((totalRevenue / totalCustomers) || 0).toFixed(0)}`, color: '#f59e0b' }
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

        {/* Assessment View */}
        {activeView === 'assessment' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
                Segment Performance Analysis
              </div>
              {segmentSummaries.slice(0, 3).map((segment, i) => (
                <div key={i} style={{
                  marginBottom: '12px',
                  padding: '12px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: '600' }}>
                      {segment.segment_name}
                    </span>
                    <span style={{ color: '#10b981', fontSize: '13px' }}>
                      ${(segment.total_revenue / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(segment.total_revenue / totalRevenue) * 100}%`,
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      transition: 'width 0.5s ease-out'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                      {segment.customer_count} customers
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                      Avg: ${(segment.avg_order_value || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '4px' }}>
                💡 Recommendation
              </div>
              <div style={{ fontSize: '13px', color: '#f8fafc' }}>
                {segmentAssessment.recommendation}
              </div>
            </div>
          </div>
        )}

        {/* Prediction View */}
        {activeView === 'prediction' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
              Revenue Projections
            </div>
            {predictOutcomes().map((outcome, i) => (
              <div key={i} style={{
                marginBottom: '12px',
                padding: '16px',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600' }}>
                    {outcome.scenario}
                  </span>
                  <span style={{ 
                    color: outcome.revenueImpact > 0 ? '#10b981' : '#ef4444', 
                    fontSize: '14px', 
                    fontWeight: '700' 
                  }}>
                    +${(outcome.revenueImpact / 1000).toFixed(0)}K
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Growth Rate</div>
                    <div style={{ fontSize: '13px', color: '#f8fafc' }}>{outcome.growthRate}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Market Share</div>
                    <div style={{ fontSize: '13px', color: '#f8fafc' }}>{outcome.marketShare}</div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                  Timeline: {outcome.timeframe}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategy View */}
        {activeView === 'strategy' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
              Growth Strategies
            </div>
            {generateStrategies().map((strategy, i) => (
              <div key={i} style={{
                marginBottom: '12px',
                padding: '16px',
                background: 'rgba(30, 41, 59, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(249, 158, 11, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedStrategy(strategy)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{strategy.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                      {strategy.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {strategy.type} • {strategy.timeToImplement}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                  {strategy.description}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{
                    padding: '6px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>ROI</div>
                    <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>
                      {strategy.expectedROI}%
                    </div>
                  </div>
                  <div style={{
                    padding: '6px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Success Rate</div>
                    <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                      {strategy.successProbability}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simulation View */}
        {activeView === 'simulation' && selectedStrategy && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(249, 158, 11, 0.1))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                Simulating: {selectedStrategy.name}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                {selectedStrategy.description}
              </div>
              
              {(() => {
                const result = simulateStrategy(selectedStrategy);
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        padding: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Revenue Increase
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                          +${(result.revenueIncrease / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div style={{
                        padding: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          New Customers
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                          +{result.newCustomers}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Confidence Level</span>
                        <span style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: '600' }}>
                          {result.confidenceLevel}%
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${result.confidenceLevel}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    </div>
                    
                    <button style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => handleActionClick(selectedStrategy.id, 'accepted')}
                    >
                      Implement Strategy
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <style>{`
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
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}