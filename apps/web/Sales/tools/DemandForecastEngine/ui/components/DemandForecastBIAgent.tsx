import React, { useState, useEffect, useCallback } from 'react';

interface ForecastData {
  date: string;
  actual?: number;
  forecast?: number;
  revenue?: number;
}

interface ForecastMetrics {
  totalVolume: number;
  totalRevenue: number;
  growthRate: number;
  accuracy: number;
  trend: string;
}

interface ForecastAssessment {
  reliabilityLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  confidenceScore: number;
  volumeImpact: number;
  revenueImpact: number;
  recommendation: string;
}

interface ForecastScenario {
  scenario: string;
  volumeChange: number;
  revenueChange: number;
  marketImpact: 'Minimal' | 'Moderate' | 'Significant';
  timeframe: string;
}

interface InventoryStrategy {
  id: string;
  name: string;
  type: 'Safety Stock' | 'JIT' | 'Seasonal Buffer' | 'Dynamic' | 'Conservative';
  description: string;
  expectedSavings: number;
  implementationCost: number;
  riskMitigation: number;
  timeToImplement: string;
  icon: string;
}

interface SimulationResult {
  inventoryOptimization: number;
  costSavings: number;
  serviceLevel: number;
  stockoutRisk: number;
  confidenceLevel: number;
}

interface DemandForecastBIAgentProps {
  forecastData: ForecastData[];
  metrics: ForecastMetrics;
  isVisible: boolean;
  onClose: () => void;
}

export default function DemandForecastBIAgent({ 
  forecastData = [], 
  metrics,
  isVisible, 
  onClose 
}: DemandForecastBIAgentProps) {
  
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'scenarios' | 'strategy' | 'simulation'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<InventoryStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  useEffect(() => {
    if (isVisible) {
      setAnimateCards(true);
    }
  }, [isVisible]);

  const assessForecast = useCallback((): ForecastAssessment => {
    const confidenceScore = metrics.accuracy || 95;
    const reliabilityLevel = 
      confidenceScore > 95 ? 'Very High' :
      confidenceScore > 90 ? 'High' :
      confidenceScore > 85 ? 'Medium' : 'Low';
    
    return {
      reliabilityLevel,
      confidenceScore,
      volumeImpact: metrics.totalVolume,
      revenueImpact: metrics.totalRevenue,
      recommendation: reliabilityLevel === 'Very High' ? 
        'Forecast reliability is excellent - proceed with confidence' : 
        reliabilityLevel === 'High' ?
        'Forecast is reliable - minor adjustments may be needed' :
        'Consider additional validation before major decisions'
    };
  }, [metrics]);

  const predictScenarios = useCallback((): ForecastScenario[] => {
    return [
      {
        scenario: 'Optimistic Growth',
        volumeChange: metrics.totalVolume * 1.25,
        revenueChange: metrics.totalRevenue * 1.30,
        marketImpact: 'Significant',
        timeframe: '3 months'
      },
      {
        scenario: 'Base Case',
        volumeChange: metrics.totalVolume,
        revenueChange: metrics.totalRevenue,
        marketImpact: 'Moderate',
        timeframe: '3 months'
      },
      {
        scenario: 'Conservative',
        volumeChange: metrics.totalVolume * 0.85,
        revenueChange: metrics.totalRevenue * 0.80,
        marketImpact: 'Minimal',
        timeframe: '3 months'
      }
    ];
  }, [metrics]);

  const inventoryStrategies: InventoryStrategy[] = [
    {
      id: 'safety-stock',
      name: 'Optimized Safety Stock',
      type: 'Safety Stock',
      description: 'Maintain buffer inventory based on forecast variance',
      expectedSavings: 150000,
      implementationCost: 50000,
      riskMitigation: 85,
      timeToImplement: '2 weeks',
      icon: '🛡️'
    },
    {
      id: 'jit',
      name: 'Just-In-Time Delivery',
      type: 'JIT',
      description: 'Minimize inventory holding with precise timing',
      expectedSavings: 200000,
      implementationCost: 75000,
      riskMitigation: 70,
      timeToImplement: '1 month',
      icon: '⚡'
    },
    {
      id: 'seasonal',
      name: 'Seasonal Buffer Strategy',
      type: 'Seasonal Buffer',
      description: 'Build inventory before predicted demand peaks',
      expectedSavings: 175000,
      implementationCost: 60000,
      riskMitigation: 90,
      timeToImplement: '3 weeks',
      icon: '📅'
    }
  ];

  const simulateStrategy = (strategy: InventoryStrategy): SimulationResult => {
    return {
      inventoryOptimization: Math.random() * 30 + 70,
      costSavings: strategy.expectedSavings * (0.8 + Math.random() * 0.4),
      serviceLevel: 95 + Math.random() * 4,
      stockoutRisk: Math.max(0, 10 - strategy.riskMitigation / 10),
      confidenceLevel: 85 + Math.random() * 10
    };
  };

  const handleAction = (strategyId: string, action: 'accepted' | 'snoozed' | 'reviewed') => {
    setActionTaken(prev => ({ ...prev, [strategyId]: action }));
  };

  const riskAssessment = assessForecast();
  const scenarios = predictScenarios();

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '480px',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a1224 0%, #1e2738 100%)',
      boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              color: '#f7f9fb', 
              fontSize: '24px', 
              margin: 0,
              fontWeight: 600
            }}>
              🧠 Forecast Intelligence
            </h2>
            <p style={{ 
              color: 'rgba(247, 249, 251, 0.7)', 
              fontSize: '14px', 
              margin: '4px 0 0 0' 
            }}>
              Strategic forecast insights & recommendations
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f7f9fb',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* View Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          {(['overview', 'assessment', 'scenarios', 'strategy', 'simulation'] as const).map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: activeView === view ? '1px solid #00e0ff' : '1px solid rgba(247, 249, 251, 0.2)',
                background: activeView === view ? 'rgba(0, 224, 255, 0.1)' : 'transparent',
                color: activeView === view ? '#00e0ff' : 'rgba(247, 249, 251, 0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '24px',
        paddingBottom: '100px'
      }}>
        {activeView === 'overview' && (
          <div>
            <h3 style={{ color: '#00e0ff', fontSize: '18px', marginBottom: '16px' }}>
              Executive Summary
            </h3>
            
            {/* Key Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(0, 224, 255, 0.1)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ color: 'rgba(247, 249, 251, 0.7)', fontSize: '12px' }}>Forecast Volume</div>
                <div style={{ color: '#00e0ff', fontSize: '24px', fontWeight: 600 }}>
                  {metrics.totalVolume.toLocaleString()}
                </div>
                <div style={{ color: metrics.growthRate > 0 ? '#00ff88' : '#ff5252', fontSize: '12px' }}>
                  {metrics.growthRate > 0 ? '↑' : '↓'} {Math.abs(metrics.growthRate)}%
                </div>
              </div>

              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ color: 'rgba(247, 249, 251, 0.7)', fontSize: '12px' }}>Revenue Impact</div>
                <div style={{ color: '#00ff88', fontSize: '24px', fontWeight: 600 }}>
                  ${(metrics.totalRevenue / 1000).toFixed(1)}K
                </div>
                <div style={{ color: '#00ff88', fontSize: '12px' }}>
                  {metrics.trend} trend
                </div>
              </div>
            </div>

            {/* Insights */}
            <div style={{
              background: 'rgba(30, 39, 56, 0.5)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ color: '#f7f9fb', fontSize: '14px', marginBottom: '12px' }}>
                🔍 Key Insights
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px',
                color: 'rgba(247, 249, 251, 0.8)',
                fontSize: '13px',
                lineHeight: 1.6
              }}>
                <li>Forecast accuracy is {metrics.accuracy}% with {metrics.trend.toLowerCase()} demand trend</li>
                <li>Expected volume of {metrics.totalVolume.toLocaleString()} units over forecast period</li>
                <li>Revenue opportunity of ${(metrics.totalRevenue / 1000).toFixed(1)}K identified</li>
                <li>Seasonal patterns detected with 25% impact on demand</li>
              </ul>
            </div>
          </div>
        )}

        {activeView === 'assessment' && (
          <div>
            <h3 style={{ color: '#00e0ff', fontSize: '18px', marginBottom: '16px' }}>
              Forecast Reliability Assessment
            </h3>
            
            <div style={{
              background: riskAssessment.reliabilityLevel === 'Very High' ? 'rgba(0, 255, 136, 0.1)' :
                         riskAssessment.reliabilityLevel === 'High' ? 'rgba(0, 224, 255, 0.1)' :
                         'rgba(255, 82, 82, 0.1)',
              border: `1px solid ${
                riskAssessment.reliabilityLevel === 'Very High' ? 'rgba(0, 255, 136, 0.3)' :
                riskAssessment.reliabilityLevel === 'High' ? 'rgba(0, 224, 255, 0.3)' :
                'rgba(255, 82, 82, 0.3)'
              }`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(247, 249, 251, 0.7)', marginBottom: '8px' }}>
                Reliability Level
              </div>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 600,
                color: riskAssessment.reliabilityLevel === 'Very High' ? '#00ff88' :
                       riskAssessment.reliabilityLevel === 'High' ? '#00e0ff' :
                       '#ff5252'
              }}>
                {riskAssessment.reliabilityLevel}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#f7f9fb', 
                marginTop: '12px',
                lineHeight: 1.5
              }}>
                {riskAssessment.recommendation}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                background: 'rgba(30, 39, 56, 0.5)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.7)' }}>Confidence Score</div>
                <div style={{ fontSize: '20px', color: '#00e0ff', fontWeight: 600 }}>
                  {riskAssessment.confidenceScore}%
                </div>
              </div>
              <div style={{
                background: 'rgba(30, 39, 56, 0.5)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.7)' }}>Volume Impact</div>
                <div style={{ fontSize: '20px', color: '#00e0ff', fontWeight: 600 }}>
                  {riskAssessment.volumeImpact.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'scenarios' && (
          <div>
            <h3 style={{ color: '#00e0ff', fontSize: '18px', marginBottom: '16px' }}>
              Forecast Scenarios
            </h3>
            
            {scenarios.map((scenario, index) => (
              <div key={index} style={{
                background: 'rgba(30, 39, 56, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                border: scenario.scenario === 'Base Case' ? '1px solid rgba(0, 224, 255, 0.3)' : 'none'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ color: '#f7f9fb', fontSize: '14px', margin: 0 }}>
                    {scenario.scenario}
                  </h4>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: scenario.marketImpact === 'Significant' ? 'rgba(233, 48, 255, 0.2)' :
                               scenario.marketImpact === 'Moderate' ? 'rgba(0, 224, 255, 0.2)' :
                               'rgba(0, 255, 136, 0.2)',
                    color: scenario.marketImpact === 'Significant' ? '#e930ff' :
                           scenario.marketImpact === 'Moderate' ? '#00e0ff' :
                           '#00ff88',
                    fontSize: '11px'
                  }}>
                    {scenario.marketImpact} Impact
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Volume</div>
                    <div style={{ fontSize: '16px', color: '#00e0ff' }}>
                      {scenario.volumeChange.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Revenue</div>
                    <div style={{ fontSize: '16px', color: '#00ff88' }}>
                      ${(scenario.revenueChange / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'strategy' && (
          <div>
            <h3 style={{ color: '#00e0ff', fontSize: '18px', marginBottom: '16px' }}>
              Inventory Strategies
            </h3>
            
            {inventoryStrategies.map(strategy => (
              <div key={strategy.id} style={{
                background: selectedStrategy?.id === strategy.id ? 
                  'rgba(0, 224, 255, 0.1)' : 'rgba(30, 39, 56, 0.5)',
                border: selectedStrategy?.id === strategy.id ? 
                  '1px solid rgba(0, 224, 255, 0.3)' : '1px solid transparent',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedStrategy(strategy)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{strategy.icon}</span>
                      <h4 style={{ color: '#f7f9fb', fontSize: '14px', margin: 0 }}>
                        {strategy.name}
                      </h4>
                    </div>
                    <p style={{ 
                      color: 'rgba(247, 249, 251, 0.7)', 
                      fontSize: '12px',
                      margin: '0 0 12px 0',
                      lineHeight: 1.4
                    }}>
                      {strategy.description}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(247, 249, 251, 0.5)' }}>Savings</div>
                        <div style={{ fontSize: '14px', color: '#00ff88' }}>
                          ${(strategy.expectedSavings / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: 'rgba(247, 249, 251, 0.5)' }}>Risk Mitigation</div>
                        <div style={{ fontSize: '14px', color: '#00e0ff' }}>
                          {strategy.riskMitigation}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!actionTaken[strategy.id] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(strategy.id, 'accepted');
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'rgba(0, 255, 136, 0.2)',
                          color: '#00ff88',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(strategy.id, 'snoozed');
                        }}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(247, 249, 251, 0.2)',
                          background: 'transparent',
                          color: 'rgba(247, 249, 251, 0.7)',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        Snooze
                      </button>
                    </div>
                  )}
                  
                  {actionTaken[strategy.id] && (
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: actionTaken[strategy.id] === 'accepted' ? 
                        'rgba(0, 255, 136, 0.2)' : 'rgba(247, 249, 251, 0.1)',
                      color: actionTaken[strategy.id] === 'accepted' ? 
                        '#00ff88' : 'rgba(247, 249, 251, 0.5)',
                      fontSize: '11px'
                    }}>
                      {actionTaken[strategy.id] === 'accepted' ? '✓ Accepted' : '⏰ Snoozed'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'simulation' && selectedStrategy && (
          <div>
            <h3 style={{ color: '#00e0ff', fontSize: '18px', marginBottom: '16px' }}>
              Strategy Simulation
            </h3>
            
            {(() => {
              const result = simulateStrategy(selectedStrategy);
              return (
                <div>
                  <div style={{
                    background: 'rgba(0, 224, 255, 0.1)',
                    border: '1px solid rgba(0, 224, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{ color: '#f7f9fb', fontSize: '14px', margin: '0 0 12px 0' }}>
                      {selectedStrategy.icon} {selectedStrategy.name}
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Optimization</div>
                        <div style={{ fontSize: '20px', color: '#00e0ff', fontWeight: 600 }}>
                          {result.inventoryOptimization.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Cost Savings</div>
                        <div style={{ fontSize: '20px', color: '#00ff88', fontWeight: 600 }}>
                          ${(result.costSavings / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Service Level</div>
                        <div style={{ fontSize: '20px', color: '#00e0ff', fontWeight: 600 }}>
                          {result.serviceLevel.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(247, 249, 251, 0.6)' }}>Stockout Risk</div>
                        <div style={{ fontSize: '20px', color: result.stockoutRisk < 5 ? '#00ff88' : '#ffd600', fontWeight: 600 }}>
                          {result.stockoutRisk.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: 'rgba(247, 249, 251, 0.7)', marginBottom: '4px' }}>
                        Confidence Level
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'rgba(247, 249, 251, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${result.confidenceLevel}%`,
                          background: 'linear-gradient(90deg, #00e0ff, #00ff88)',
                          borderRadius: '4px'
                        }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#00e0ff', marginTop: '4px' }}>
                        {result.confidenceLevel.toFixed(1)}% confidence in simulation results
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export function BusinessIntelligenceTrigger({ 
  onClick, 
  count = 0 
}: { 
  onClick: () => void; 
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e930ff 0%, #00e0ff 100%)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(233, 48, 255, 0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        zIndex: 999,
        transition: 'transform 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      🧠
      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          background: '#ff5252',
          color: '#fff',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600
        }}>
          {count}
        </span>
      )}
    </button>
  );
}