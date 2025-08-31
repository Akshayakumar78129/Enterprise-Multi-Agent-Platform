import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// Global functions for agent communication (available via window object)
declare global {
  interface Window {
    setSalesInsightMode?: (mode: string) => void;
    setSalesInsightView?: (view: string) => void;
    getSalesInsightMode?: () => string;
  }
}

const setSalesInsightView = (view: string) => {
  if (window.setSalesInsightView) {
    window.setSalesInsightView(view);
  }
};

const setSalesInsightMode = (mode: string) => {
  if (window.setSalesInsightMode) {
    window.setSalesInsightMode(mode);
  }
};

const getSalesInsightMode = () => {
  return window.getSalesInsightMode ? window.getSalesInsightMode() : 'insights';
};

// Type definitions for Sales Business Agent
interface RegionalSale {
  region_id: string;
  region_name: string;
  sales_revenue: number;
  performance_level: 'Underperforming' | 'Meeting Target' | 'Exceeding' | 'Outstanding';
  growth_rate: number;
  target_achievement?: number;
  lead_count?: number;
  conversion_rate?: number;
}

interface RootState {
  salesInsight: {
    regions: RegionalSale[];
    filters: any;
    loading: boolean;
    error: string | null;
  };
}

interface SalesAssessment {
  opportunityLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  avgPerformance: number;
  potentialRevenue: number;
  underperformingRegions: number;
  marketValue: string;
  recommendation: string;
}

interface PredictedOutcome {
  scenario: string;
  revenueImpact: number;
  growthRate: number;
  marketImpact: 'Minimal' | 'Moderate' | 'Significant';
  timeframe: string;
}

interface SalesStrategy {
  id: string;
  name: string;
  type: 'Territory Expansion' | 'Lead Generation' | 'Channel Optimization' | 'Account Management' | 'Digital Marketing';
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
  potentialRevenue: number;
  targetedRegions: number;
  confidenceLevel: number;
}

// Currency helpers: convert INR values to USD for display
const INR_TO_USD_RATE = 83; // Adjust via env/config as needed
const inrToUSD = (inr: number) => inr / INR_TO_USD_RATE;
const formatUSD = (usd: number, fractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(usd);

export default function SalesBusinessAgent() {
  // Mock data since we don't have real Redux state
  const mockRegions: RegionalSale[] = [
    { region_id: '1', region_name: 'North', sales_revenue: 2500000, performance_level: 'Exceeding', growth_rate: 15.2, target_achievement: 110, lead_count: 150, conversion_rate: 25 },
    { region_id: '2', region_name: 'South', sales_revenue: 1800000, performance_level: 'Meeting Target', growth_rate: 8.5, target_achievement: 98, lead_count: 120, conversion_rate: 22 },
    { region_id: '3', region_name: 'East', sales_revenue: 1200000, performance_level: 'Underperforming', growth_rate: -2.1, target_achievement: 75, lead_count: 80, conversion_rate: 18 },
    { region_id: '4', region_name: 'West', sales_revenue: 3200000, performance_level: 'Outstanding', growth_rate: 22.8, target_achievement: 125, lead_count: 200, conversion_rate: 30 }
  ];
  
  const regions = mockRegions;
  
  // State management
  const [activeView, setActiveView] = useState<'overview' | 'assessment' | 'prediction' | 'strategy' | 'simulation'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'high-performing' | 'underperforming'>('high-performing');
  const [showInsights, setShowInsights] = useState(false); // Hidden by default, toggled by brain button
  const [animateCards, setAnimateCards] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<SalesStrategy | null>(null);
  const [actionTaken, setActionTaken] = useState<{ [key: string]: 'accepted' | 'snoozed' | 'reviewed' }>({});
  
  // Calculate sales metrics
  const highPerformingRegions = regions.filter(r => r.performance_level === 'Outstanding' || r.performance_level === 'Exceeding');
  const underperformingRegions = regions.filter(r => r.performance_level === 'Underperforming');
  const avgDealValue = 85000; // Average deal value
  const totalPotentialRevenue = underperformingRegions.length * avgDealValue * 25; // 25x deals potential
  
  useEffect(() => {
    setAnimateCards(true);
  }, []);

  // Sales Assessment Logic
  const assessSales = useCallback((): SalesAssessment => {
    const opportunityScore = (underperformingRegions.length / regions.length) * 100;
    const opportunityLevel = 
      opportunityScore > 30 ? 'Critical' :
      opportunityScore > 20 ? 'High' :
      opportunityScore > 10 ? 'Medium' : 'Low';
    
    const avgPerformance = regions.reduce((sum, r) => sum + (r.target_achievement || 0), 0) / regions.length;
    
    return {
      opportunityLevel,
      avgPerformance,
      potentialRevenue: totalPotentialRevenue,
      underperformingRegions: underperformingRegions.length,
      marketValue: 'Multi-Regional Growth',
      recommendation: opportunityLevel === 'Critical' ? 
        'Immediate regional intervention required' : 
        'Optimize regional sales strategies'
    };
  }, [underperformingRegions, regions, totalPotentialRevenue]);

  // Predict Sales Outcomes
  const predictOutcomes = (): PredictedOutcome[] => {
    return [
      {
        scenario: 'Status Quo',
        revenueImpact: 0,
        growthRate: 5,
        marketImpact: 'Minimal',
        timeframe: '6 months'
      },
      {
        scenario: 'Regional Optimization',
        revenueImpact: totalPotentialRevenue * 0.6,
        growthRate: 18,
        marketImpact: 'Moderate',
        timeframe: '6 months'
      },
      {
        scenario: 'Full Market Expansion',
        revenueImpact: totalPotentialRevenue * 1.2,
        growthRate: 35,
        marketImpact: 'Significant',
        timeframe: '6 months'
      }
    ];
  };

  // Generate Sales Strategies
  const generateStrategies = (): SalesStrategy[] => {
    return [
      {
        id: 'territory-expansion',
        name: 'Strategic Territory Expansion',
        type: 'Territory Expansion',
        description: 'Identify and penetrate high-value untapped markets',
        expectedROI: 380,
        implementationCost: 120000,
        successProbability: 82,
        timeToImplement: '3 months',
        icon: '🗺️'
      },
      {
        id: 'lead-generation',
        name: 'AI-Powered Lead Engine',
        type: 'Lead Generation',
        description: 'Automated lead scoring and nurturing system',
        expectedROI: 450,
        implementationCost: 80000,
        successProbability: 88,
        timeToImplement: '6 weeks',
        icon: '🎯'
      },
      {
        id: 'channel-optimization',
        name: 'Multi-Channel Sales Optimization',
        type: 'Channel Optimization',
        description: 'Streamline sales processes across all channels',
        expectedROI: 320,
        implementationCost: 95000,
        successProbability: 75,
        timeToImplement: '2 months',
        icon: '📊'
      },
      {
        id: 'account-management',
        name: 'Enterprise Account Focus',
        type: 'Account Management',
        description: 'Dedicated high-value account management program',
        expectedROI: 520,
        implementationCost: 150000,
        successProbability: 85,
        timeToImplement: '4 months',
        icon: '🏢'
      }
    ];
  };

  // Simulate Sales Benefits
  const simulateBenefits = (strategy: SalesStrategy): SimulationResult => {
    const baseGrowth = 12;
    const strategyBoost = strategy.successProbability * 0.4;
    const revenueIncrease = baseGrowth + strategyBoost;
    
    return {
      revenueIncrease,
      roi: strategy.expectedROI,
      potentialRevenue: Math.floor(totalPotentialRevenue * (revenueIncrease / 100)),
      targetedRegions: Math.floor(underperformingRegions.length * (revenueIncrease / 100)),
      confidenceLevel: strategy.successProbability
    };
  };

  const salesAssessment = assessSales();
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
          border: '1px solid rgba(34, 197, 94, 0.3)',
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
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))';
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
          border: '1px solid rgba(34, 197, 94, 0.3)',
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
          borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                animation: 'pulse 2s infinite'
              }}>
                📈
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                  Sales Business Agent
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Opportunity: {salesAssessment.opportunityLevel}
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
              { id: 'overview', label: '📊 Overview', color: '#22c55e' },
              { id: 'assessment', label: '🎯 Opportunity', color: '#10b981' },
              { id: 'prediction', label: '🔮 Forecast', color: '#06b6d4' },
              { id: 'strategy', label: '💡 Strategies', color: '#f59e0b' },
              { id: 'simulation', label: '📈 ROI Sim', color: '#ef4444' }
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
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid rgba(34, 197, 94, 0.2)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e', marginBottom: '8px' }}>
                  {formatUSD(inrToUSD(totalPotentialRevenue), 0)} Revenue Opportunity
                </div>
                <div style={{ fontSize: '14px', color: '#f8fafc' }}>
                  {underperformingRegions.length} regions with growth potential
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Avg Performance', value: `${salesAssessment.avgPerformance.toFixed(0)}%`, color: '#22c55e' },
                  { label: 'Top Regions', value: `${highPerformingRegions.length}`, color: '#10b981' },
                  { label: 'Growth Rate', value: `+${regions.reduce((sum, r) => sum + r.growth_rate, 0) / regions.length > 0 ? (regions.reduce((sum, r) => sum + r.growth_rate, 0) / regions.length).toFixed(1) : 0}%`, color: '#06b6d4' },
                  { label: 'Action Priority', value: salesAssessment.opportunityLevel, color: '#f59e0b' }
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

          {/* Sales Assessment View */}
          {activeView === 'assessment' && (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{
                background: `linear-gradient(135deg, ${
                  salesAssessment.opportunityLevel === 'Critical' ? 'rgba(34, 197, 94, 0.1)' :
                  salesAssessment.opportunityLevel === 'High' ? 'rgba(16, 185, 129, 0.1)' : 
                  'rgba(6, 182, 212, 0.1)'
                }, rgba(30, 41, 59, 0.1))`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: `1px solid ${
                  salesAssessment.opportunityLevel === 'Critical' ? '#22c55e' :
                  salesAssessment.opportunityLevel === 'High' ? '#10b981' : '#06b6d4'
                }30`
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#f8fafc', marginBottom: '12px' }}>
                  📋 Regional Sales Assessment
                </div>
                
                <div style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: '1.6', marginBottom: '16px' }}>
                  {salesAssessment.recommendation}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Revenue Potential</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>
                      {formatUSD(inrToUSD(salesAssessment.potentialRevenue), 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Target Regions</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                      {salesAssessment.underperformingRegions}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Performance Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', marginBottom: '12px' }}>
                  🗺️ Regional Performance
                </div>
                {regions.map((region, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      border: '1px solid rgba(75, 85, 99, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                        {region.region_name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: region.performance_level === 'Outstanding' ? 'rgba(34, 197, 94, 0.2)' :
                                  region.performance_level === 'Exceeding' ? 'rgba(16, 185, 129, 0.2)' :
                                  region.performance_level === 'Meeting Target' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: region.performance_level === 'Outstanding' ? '#22c55e' :
                               region.performance_level === 'Exceeding' ? '#10b981' :
                               region.performance_level === 'Meeting Target' ? '#06b6d4' : '#ef4444'
                      }}>
                        {region.performance_level}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Revenue</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc' }}>
                          {formatUSD(inrToUSD(region.sales_revenue), 0)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Growth</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: region.growth_rate > 0 ? '#22c55e' : '#ef4444' }}>
                          {region.growth_rate > 0 ? '+' : ''}{region.growth_rate}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Target</div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#f8fafc' }}>
                          {region.target_achievement}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prediction View */}
          {activeView === 'prediction' && (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
                🔮 Sales Forecast Scenarios
              </div>
              
              {outcomes.map((outcome, i) => (
                <div
                  key={i}
                  style={{
                    background: `linear-gradient(135deg, ${
                      outcome.scenario === 'Full Market Expansion' ? 'rgba(34, 197, 94, 0.1)' :
                      outcome.scenario === 'Regional Optimization' ? 'rgba(16, 185, 129, 0.1)' : 
                      'rgba(75, 85, 99, 0.1)'
                    }, rgba(30, 41, 59, 0.1))`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: `1px solid ${
                      outcome.scenario === 'Full Market Expansion' ? '#22c55e' :
                      outcome.scenario === 'Regional Optimization' ? '#10b981' : '#6b7280'
                    }30`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                      {outcome.scenario}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {outcome.timeframe}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Revenue Impact</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#22c55e' }}>
                        +{formatUSD(inrToUSD(outcome.revenueImpact), 0)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Growth Rate</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                        +{outcome.growthRate}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Market Impact</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#06b6d4' }}>
                        {outcome.marketImpact}
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
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
                💡 Recommended Sales Strategies
              </div>
              
              {strategies.map((strategy, i) => (
                <div
                  key={i}
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(30, 41, 59, 0.1))',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setSelectedStrategy(strategy)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '24px' }}>{strategy.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc' }}>
                        {strategy.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {strategy.type}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5', marginBottom: '12px' }}>
                    {strategy.description}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Expected ROI</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#22c55e' }}>
                        {strategy.expectedROI}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Success Rate</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
                        {strategy.successProbability}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>Timeline</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#06b6d4' }}>
                        {strategy.timeToImplement}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Simulation View */}
          {activeView === 'simulation' && (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#f8fafc', marginBottom: '16px' }}>
                📈 ROI Simulation
              </div>
              
              {selectedStrategy ? (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '28px' }}>{selectedStrategy.icon}</div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                          {selectedStrategy.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Simulation Results
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const simulation = simulateBenefits(selectedStrategy);
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Revenue Increase</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>
                              +{simulation.revenueIncrease.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Expected ROI</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                              {simulation.roi}%
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Potential Revenue</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#06b6d4' }}>
                              {formatUSD(inrToUSD(simulation.potentialRevenue), 0)}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Confidence</div>
                            <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                              {simulation.confidenceLevel}%
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setActionTaken({ ...actionTaken, [selectedStrategy.id]: 'accepted' });
                      }}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        background: actionTaken[selectedStrategy.id] === 'accepted' ? 
                          'linear-gradient(135deg, #22c55e, #16a34a)' : 
                          'linear-gradient(135deg, #22c55e, #10b981)',
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
                      {actionTaken[selectedStrategy.id] === 'accepted' ? '✓ Strategy Approved' : 'Approve Strategy'}
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
                      Review Later
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>Select a Strategy</div>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>
                    Go to Strategies tab and click on any strategy to see detailed ROI simulation
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}