import React, { useState, useEffect, useCallback } from 'react';

// Type definitions
interface TransactionPattern {
  pattern: string;
  frequency: number;
  avgAmount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface AnomalyInsight {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  affectedTransactions: number;
  potentialImpact: number;
  description: string;
  recommendation: string;
}

interface PerformanceMetric {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface OptimizationStrategy {
  id: string;
  name: string;
  type: 'Process' | 'Pricing' | 'Risk' | 'Customer' | 'Technology';
  description: string;
  expectedImpact: number;
  implementationCost: number;
  successProbability: number;
  timeToImplement: string;
  icon: string;
}

interface PredictedScenario {
  scenario: string;
  volumeChange: number;
  revenueImpact: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidence: number;
  timeframe: string;
}

interface SimulationResult {
  efficiencyGain: number;
  costSavings: number;
  riskReduction: number;
  customerSatisfaction: number;
  roi: number;
}

interface BusinessIntelligenceAgentProps {
  transactionData?: any;
  filters?: any;
  onClose?: () => void;
}

export default function BusinessIntelligenceAgent({ 
  transactionData = {}, 
  filters = {},
  onClose 
}: BusinessIntelligenceAgentProps) {
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'anomalies' | 'performance' | 'optimization' | 'simulation'>('overview');
  const [selectedStrategy, setSelectedStrategy] = useState<OptimizationStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  const [animateCards, setAnimateCards] = useState(false);
  
  // Calculate metrics from transaction data
  const totalTransactions = transactionData.totalTransactions || 15234;
  const avgTransactionValue = transactionData.avgAmount || 2847;
  const anomalyRate = transactionData.anomalyRate || 3.2;
  const peakHour = transactionData.peakHour || 14;
  const totalVolume = totalTransactions * avgTransactionValue;
  const atRiskVolume = totalVolume * (anomalyRate / 100);
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Detect Anomalies
  const detectAnomalies = useCallback((): AnomalyInsight[] => {
    return [
      {
        type: 'Unusual High-Value Transactions',
        severity: 'High',
        affectedTransactions: Math.floor(totalTransactions * 0.002),
        potentialImpact: atRiskVolume * 0.3,
        description: 'Multiple transactions exceeding 5x average value detected',
        recommendation: 'Review transaction verification thresholds'
      },
      {
        type: 'Off-Peak Activity Spike',
        severity: 'Medium',
        affectedTransactions: Math.floor(totalTransactions * 0.015),
        potentialImpact: atRiskVolume * 0.1,
        description: 'Unusual activity detected during typically quiet hours',
        recommendation: 'Monitor for potential fraud patterns'
      },
      {
        type: 'Payment Method Shifts',
        severity: 'Low',
        affectedTransactions: Math.floor(totalTransactions * 0.08),
        potentialImpact: atRiskVolume * 0.05,
        description: '8% shift from credit to digital wallets observed',
        recommendation: 'Optimize payment processing fees'
      },
      {
        type: 'Geographic Concentration',
        severity: 'Medium',
        affectedTransactions: Math.floor(totalTransactions * 0.12),
        potentialImpact: atRiskVolume * 0.15,
        description: 'High transaction density from new regions',
        recommendation: 'Expand regional support infrastructure'
      }
    ];
  }, [totalTransactions, atRiskVolume]);

  // Calculate Performance Metrics
  const calculatePerformance = (): PerformanceMetric[] => {
    return [
      {
        metric: 'Transaction Success Rate',
        current: 97.8,
        previous: 96.2,
        change: 1.6,
        trend: 'up'
      },
      {
        metric: 'Average Processing Time',
        current: 2.3,
        previous: 3.1,
        change: -25.8,
        trend: 'down'
      },
      {
        metric: 'Customer Satisfaction',
        current: 4.6,
        previous: 4.4,
        change: 4.5,
        trend: 'up'
      },
      {
        metric: 'Fraud Detection Rate',
        current: 99.2,
        previous: 98.7,
        change: 0.5,
        trend: 'up'
      }
    ];
  };

  // Generate Optimization Strategies
  const generateOptimizations = (): OptimizationStrategy[] => {
    return [
      {
        id: 'smart-routing',
        name: 'Smart Payment Routing',
        type: 'Technology',
        description: 'AI-driven payment method optimization',
        expectedImpact: 15,
        implementationCost: 45000,
        successProbability: 85,
        timeToImplement: '2 weeks',
        icon: '🚀'
      },
      {
        id: 'dynamic-pricing',
        name: 'Dynamic Fee Structure',
        type: 'Pricing',
        description: 'Volume-based pricing tiers for high-value customers',
        expectedImpact: 22,
        implementationCost: 20000,
        successProbability: 78,
        timeToImplement: '1 week',
        icon: '💰'
      },
      {
        id: 'fraud-ml',
        name: 'Enhanced Fraud Detection',
        type: 'Risk',
        description: 'Machine learning fraud prevention system',
        expectedImpact: 35,
        implementationCost: 80000,
        successProbability: 92,
        timeToImplement: '4 weeks',
        icon: '🛡️'
      },
      {
        id: 'customer-segments',
        name: 'Segment-Based Processing',
        type: 'Customer',
        description: 'Tailored transaction flows by customer type',
        expectedImpact: 18,
        implementationCost: 35000,
        successProbability: 73,
        timeToImplement: '3 weeks',
        icon: '👥'
      }
    ];
  };

  // Predict Scenarios
  const predictScenarios = (): PredictedScenario[] => {
    return [
      {
        scenario: 'Current Trajectory',
        volumeChange: 5,
        revenueImpact: totalVolume * 0.05,
        riskLevel: 'Moderate',
        confidence: 85,
        timeframe: 'Next Quarter'
      },
      {
        scenario: 'Market Expansion',
        volumeChange: 25,
        revenueImpact: totalVolume * 0.25,
        riskLevel: 'High',
        confidence: 65,
        timeframe: 'Next 6 Months'
      },
      {
        scenario: 'Economic Downturn',
        volumeChange: -15,
        revenueImpact: -(totalVolume * 0.15),
        riskLevel: 'High',
        confidence: 40,
        timeframe: 'Next Year'
      }
    ];
  };

  // Simulate Strategy Benefits
  const simulateBenefits = (strategy: OptimizationStrategy): SimulationResult => {
    const baseEfficiency = 10;
    const strategyBoost = strategy.successProbability * 0.3;
    
    return {
      efficiencyGain: baseEfficiency + strategyBoost,
      costSavings: Math.floor((totalVolume * 0.02) * (strategy.expectedImpact / 100)),
      riskReduction: strategy.type === 'Risk' ? 45 : 15,
      customerSatisfaction: strategy.type === 'Customer' ? 12 : 5,
      roi: strategy.expectedImpact * 10
    };
  };

  const anomalies = detectAnomalies();
  const performance = calculatePerformance();
  const optimizations = generateOptimizations();
  const scenarios = predictScenarios();

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
      border: '1px solid rgba(0, 224, 255, 0.3)',
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
        borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
        background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1), rgba(233, 48, 255, 0.1))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
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
                Transaction Intelligence
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Anomaly Rate: {anomalyRate.toFixed(1)}%
              </div>
            </div>
          </div>
          {onClose && (
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
          )}
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
            { id: 'overview', label: '📊 Overview', color: '#00e0ff' },
            { id: 'anomalies', label: '⚠️ Anomalies', color: '#ef4444' },
            { id: 'performance', label: '📈 Performance', color: '#10b981' },
            { id: 'optimization', label: '💡 Optimize', color: '#f59e0b' },
            { id: 'simulation', label: '🔮 Simulate', color: '#e930ff' }
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
              background: 'linear-gradient(135deg, rgba(0, 224, 255, 0.1), rgba(0, 224, 255, 0.05))',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              border: '1px solid rgba(0, 224, 255, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#00e0ff', marginBottom: '8px' }}>
                ${(totalVolume / 1000000).toFixed(2)}M Volume
              </div>
              <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                {totalTransactions.toLocaleString()} transactions processed
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Avg Transaction', value: `$${avgTransactionValue.toFixed(0)}`, color: '#00e0ff' },
                { label: 'Peak Hour', value: `${peakHour}:00`, color: '#f59e0b' },
                { label: 'Success Rate', value: '97.8%', color: '#10b981' },
                { label: 'At Risk', value: `$${(atRiskVolume / 1000).toFixed(0)}K`, color: '#ef4444' }
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

            {/* Quick Insights */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(30, 41, 59, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                🎯 Key Insights
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '11px' }}>
                <li>Transaction volume up 12% from last month</li>
                <li>Digital wallet adoption increased by 8%</li>
                <li>Fraud detection prevented $45K in losses</li>
                <li>Customer satisfaction at all-time high</li>
              </ul>
            </div>
          </div>
        )}

        {/* Anomalies View */}
        {activeView === 'anomalies' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              🔍 Detected Anomalies
            </div>
            
            {anomalies.map((anomaly, i) => (
              <div
                key={i}
                style={{
                  background: anomaly.severity === 'High' ? 'rgba(239, 68, 68, 0.05)' :
                             anomaly.severity === 'Medium' ? 'rgba(245, 158, 11, 0.05)' :
                             'rgba(34, 197, 94, 0.05)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  border: `1px solid ${
                    anomaly.severity === 'High' ? 'rgba(239, 68, 68, 0.2)' :
                    anomaly.severity === 'Medium' ? 'rgba(245, 158, 11, 0.2)' :
                    'rgba(34, 197, 94, 0.2)'
                  }`,
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                    {anomaly.type}
                  </div>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: anomaly.severity === 'High' ? 'rgba(239, 68, 68, 0.2)' :
                               anomaly.severity === 'Medium' ? 'rgba(245, 158, 11, 0.2)' :
                               'rgba(34, 197, 94, 0.2)',
                    color: anomaly.severity === 'High' ? '#ef4444' :
                           anomaly.severity === 'Medium' ? '#f59e0b' : '#10b981'
                  }}>
                    {anomaly.severity}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                  {anomaly.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {anomaly.affectedTransactions} transactions • ${(anomaly.potentialImpact / 1000).toFixed(0)}K impact
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#3b82f6',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    {anomaly.recommendation} →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance View */}
        {activeView === 'performance' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              📊 Performance Metrics
            </div>
            
            {performance.map((metric, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  border: '1px solid rgba(75, 85, 99, 0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#f8fafc' }}>
                    {metric.metric}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#f59e0b'
                  }}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#00e0ff' }}>
                    {metric.current}{metric.metric.includes('Time') ? 's' : metric.metric.includes('Rate') ? '%' : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    from {metric.previous}{metric.metric.includes('Time') ? 's' : metric.metric.includes('Rate') ? '%' : ''}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{
                  marginTop: '8px',
                  height: '4px',
                  background: 'rgba(75, 85, 99, 0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min((metric.current / (metric.previous * 1.2)) * 100, 100)}%`,
                    height: '100%',
                    background: metric.trend === 'up' ? 'linear-gradient(90deg, #10b981, #34d399)' :
                               metric.trend === 'down' && metric.metric.includes('Time') ? 'linear-gradient(90deg, #10b981, #34d399)' :
                               'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optimization View */}
        {activeView === 'optimization' && (
          <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              🚀 Optimization Strategies
            </div>
            
            {optimizations.map((strategy) => (
              <div
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                style={{
                  background: selectedStrategy?.id === strategy.id ? 
                    'rgba(0, 224, 255, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '12px',
                  border: `1px solid ${
                    selectedStrategy?.id === strategy.id ? 
                    'rgba(0, 224, 255, 0.3)' : 'rgba(75, 85, 99, 0.3)'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{strategy.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                      {strategy.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {strategy.description}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '8px',
                  marginTop: '10px'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Impact</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>
                      +{strategy.expectedImpact}%
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveView('simulation');
                    }}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Simulate Impact →
                  </button>
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
                      +{simulation.efficiencyGain.toFixed(1)}% Efficiency
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Expected improvement in processing efficiency
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Cost Savings
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                          ${(simulation.costSavings / 1000).toFixed(1)}K
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Risk Reduction
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>
                          {simulation.riskReduction}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          Customer Satisfaction
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          +{simulation.customerSatisfaction}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                          ROI
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#e930ff' }}>
                          {simulation.roi}%
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
              📈 Predicted Outcomes
            </div>
            
            {scenarios.map((scenario, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(30, 41, 59, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  border: '1px solid rgba(75, 85, 99, 0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc' }}>
                    {scenario.scenario}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: scenario.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.2)' :
                               scenario.riskLevel === 'Moderate' ? 'rgba(245, 158, 11, 0.2)' :
                               'rgba(34, 197, 94, 0.2)',
                    color: scenario.riskLevel === 'High' ? '#ef4444' :
                           scenario.riskLevel === 'Moderate' ? '#f59e0b' : '#10b981'
                  }}>
                    {scenario.confidence}% confidence
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Volume: </span>
                    <span style={{ 
                      color: scenario.volumeChange > 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      {scenario.volumeChange > 0 ? '+' : ''}{scenario.volumeChange}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Revenue: </span>
                    <span style={{ 
                      color: scenario.revenueImpact > 0 ? '#10b981' : '#ef4444',
                      fontWeight: '600'
                    }}>
                      ${Math.abs(scenario.revenueImpact / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Time: </span>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>
                      {scenario.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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
                disabled={actionTaken[selectedStrategy.id] === 'accepted'}
              >
                {actionTaken[selectedStrategy.id] === 'accepted' ? '✓ Accepted' : 'Implement Strategy'}
              </button>
              
              <button
                onClick={() => {
                  setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'reviewed' });
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
                Review Later
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}

// Trigger Button Component
export function BusinessIntelligenceTrigger({ onClick, transactionData = {} }: { onClick: () => void; transactionData?: any }) {
  const [isHovered, setIsHovered] = useState(false);
  const anomalyRate = transactionData.anomalyRate || 3.2;
  const hasHighAnomalies = anomalyRate > 5;
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: hasHighAnomalies ? 
          'linear-gradient(135deg, #ef4444, #dc2626)' :
          'linear-gradient(135deg, #00e0ff, #e930ff)',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: isHovered ? 
          '0 12px 40px rgba(0, 224, 255, 0.5)' :
          '0 8px 32px rgba(0, 224, 255, 0.3)',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1001
      }}
      title="Transaction Intelligence Agent"
    >
      <span
        style={{
          fontSize: '24px',
          animation: 'float 6s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        🧠
      </span>
      {hasHighAnomalies && (
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
          !
        </div>
      )}
    </button>
  );
}