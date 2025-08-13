import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardState } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BusinessIntelligenceAssistantProps {
  dashboardState: DashboardState;
  isOpen: boolean;
  onToggle: () => void;
}

interface BIInsight {
  id: string;
  category: 'strategy' | 'prediction' | 'risk' | 'opportunity' | 'performance' | 'market';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  actionable: boolean;
  recommendations?: string[];
}

const BusinessIntelligenceAssistant: React.FC<BusinessIntelligenceAssistantProps> = ({
  dashboardState,
  isOpen,
  onToggle
}) => {
  const { theme, isDarkMode } = useTheme();
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const categories = [
    { id: 'all', name: 'All Insights', icon: '🎯' },
    { id: 'strategy', name: 'Strategy', icon: '🎯' },
    { id: 'prediction', name: 'Predictions', icon: '🔮' },
    { id: 'risk', name: 'Risk Analysis', icon: '⚠️' },
    { id: 'opportunity', name: 'Opportunities', icon: '💡' },
    { id: 'performance', name: 'Performance', icon: '📊' },
    { id: 'market', name: 'Market Intel', icon: '🌍' }
  ];

  // Generate comprehensive business intelligence insights
  const generateBusinessIntelligence = useCallback(() => {
    try {
      if (!dashboardState.data || !dashboardState.data.mainData) return [];

      const mainData = dashboardState.data.mainData;
      const insights: BIInsight[] = [];

      // Ensure mainData is an array
      if (!Array.isArray(mainData)) return [];

    // Calculate key metrics
    const revenues = mainData.map((d: any) => d.revenue || d.value || 0);
    
    // Safety check for empty data
    if (revenues.length === 0) return [];
    
    const totalRevenue = revenues.reduce((sum: number, rev: number) => sum + rev, 0);
    const avgRevenue = totalRevenue / revenues.length;
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);
    const volatility = avgRevenue > 0 ? (maxRevenue - minRevenue) / avgRevenue : 0;

    // Growth analysis
    const growthRates = [];
    for (let i = 1; i < revenues.length; i++) {
      if (revenues[i - 1] > 0) {
        growthRates.push(((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100);
      }
    }
    const avgGrowthRate = growthRates.length > 0 ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0;

    // Strategic Insights
    insights.push({
      id: 'strategy-1',
      category: 'strategy',
      title: 'Revenue Optimization Strategy',
      content: `Your business shows ${avgGrowthRate > 10 ? 'strong' : avgGrowthRate > 0 ? 'moderate' : 'declining'} growth patterns. ${
        avgGrowthRate > 15 ? 'Focus on scaling successful initiatives and expanding market reach.' :
        avgGrowthRate > 5 ? 'Optimize current operations while exploring new growth channels.' :
        'Immediate strategic pivot needed - analyze underperforming areas and implement corrective measures.'
      }`,
      priority: avgGrowthRate < 0 ? 'high' : avgGrowthRate > 15 ? 'high' : 'medium',
      icon: '🎯',
      actionable: true,
      recommendations: [
        avgGrowthRate > 15 ? 'Scale marketing spend in high-performing channels' : 'Audit marketing ROI and reallocate budget',
        avgGrowthRate > 10 ? 'Expand to adjacent markets or customer segments' : 'Focus on customer retention and upselling',
        'Implement data-driven pricing optimization',
        'Develop strategic partnerships for market expansion'
      ]
    });

    // Prediction Insights
    const trend = avgGrowthRate > 5 ? 'upward' : avgGrowthRate > -5 ? 'stable' : 'downward';
    const nextQuarterPrediction = avgRevenue * (1 + (avgGrowthRate / 100) * 3);
    
    insights.push({
      id: 'prediction-1',
      category: 'prediction',
      title: 'Revenue Forecast & Trends',
      content: `Based on current ${trend} trend (${avgGrowthRate.toFixed(1)}% avg growth), next quarter revenue is projected at $${nextQuarterPrediction.toLocaleString()}. ${
        trend === 'upward' ? 'Strong momentum indicates potential for accelerated growth.' :
        trend === 'stable' ? 'Stable performance provides foundation for strategic initiatives.' :
        'Declining trend requires immediate intervention to prevent further deterioration.'
      }`,
      priority: trend === 'downward' ? 'high' : 'medium',
      icon: '🔮',
      actionable: true,
      recommendations: [
        'Monitor leading indicators (pipeline, traffic, conversions)',
        'Prepare scenario-based budgets for different growth outcomes',
        'Implement early warning systems for trend changes',
        'Develop contingency plans for market volatility'
      ]
    });

    // Risk Analysis
    const riskLevel = volatility > 0.5 ? 'high' : volatility > 0.3 ? 'medium' : 'low';
    insights.push({
      id: 'risk-1',
      category: 'risk',
      title: 'Business Risk Assessment',
      content: `Revenue volatility is ${riskLevel} (${(volatility * 100).toFixed(1)}% variance). ${
        riskLevel === 'high' ? 'High volatility indicates significant business risk - diversification needed.' :
        riskLevel === 'medium' ? 'Moderate volatility is manageable but requires monitoring.' :
        'Low volatility indicates stable, predictable business model.'
      }`,
      priority: riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'medium' : 'low',
      icon: '⚠️',
      actionable: true,
      recommendations: [
        riskLevel === 'high' ? 'Diversify revenue streams to reduce dependency' : 'Maintain current risk management practices',
        'Build cash reserves for market downturns',
        'Implement customer concentration risk monitoring',
        'Develop crisis management protocols'
      ]
    });

    // Opportunity Analysis
    const seasonalData = mainData.reduce((acc: any, item: any) => {
      const month = new Date(item.period || item.date).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(item.revenue || item.value || 0);
      return acc;
    }, {});

    const bestMonth = Object.keys(seasonalData).reduce((best, month) => {
      const avgRevenue = seasonalData[month].reduce((sum: number, rev: number) => sum + rev, 0) / seasonalData[month].length;
      return avgRevenue > (seasonalData[best] ? seasonalData[best].reduce((sum: number, rev: number) => sum + rev, 0) / seasonalData[best].length : 0) ? month : best;
    }, '0');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    insights.push({
      id: 'opportunity-1',
      category: 'opportunity',
      title: 'Market Opportunity Analysis',
      content: `${monthNames[parseInt(bestMonth)]} consistently shows peak performance. Opportunity exists to replicate this success in underperforming periods through targeted campaigns, product launches, or promotional strategies.`,
      priority: 'medium',
      icon: '💡',
      actionable: true,
      recommendations: [
        `Analyze what drives ${monthNames[parseInt(bestMonth)]} success and replicate`,
        'Launch counter-seasonal marketing campaigns',
        'Develop month-specific product offerings',
        'Optimize inventory and staffing for seasonal patterns'
      ]
    });

    // Performance Insights
    const performanceScore = avgGrowthRate > 15 ? 'excellent' : avgGrowthRate > 5 ? 'good' : avgGrowthRate > 0 ? 'fair' : 'poor';
    insights.push({
      id: 'performance-1',
      category: 'performance',
      title: 'Performance Benchmarking',
      content: `Current performance is ${performanceScore} with ${avgGrowthRate.toFixed(1)}% average growth. ${
        performanceScore === 'excellent' ? 'You\'re in the top 10% of businesses - focus on scaling and market expansion.' :
        performanceScore === 'good' ? 'Solid performance with room for optimization and growth acceleration.' :
        performanceScore === 'fair' ? 'Performance is acceptable but significant improvement opportunities exist.' :
        'Performance is below industry standards - immediate strategic intervention required.'
      }`,
      priority: performanceScore === 'poor' ? 'high' : performanceScore === 'excellent' ? 'high' : 'medium',
      icon: '📊',
      actionable: true,
      recommendations: [
        'Benchmark against industry leaders and competitors',
        'Implement performance tracking dashboards',
        'Set SMART goals for key performance indicators',
        'Regular performance reviews and strategy adjustments'
      ]
    });

    // Market Intelligence
    insights.push({
      id: 'market-1',
      category: 'market',
      title: 'Market Position & Competitive Intelligence',
      content: `Your revenue patterns suggest ${volatility < 0.3 ? 'strong market position with stable customer base' : 'market sensitivity requiring competitive monitoring'}. ${
        avgGrowthRate > 10 ? 'Growth rate indicates market share gains or market expansion.' :
        avgGrowthRate > 0 ? 'Moderate growth suggests keeping pace with market trends.' :
        'Declining performance may indicate market share loss or market contraction.'
      }`,
      priority: avgGrowthRate < 0 ? 'high' : 'medium',
      icon: '🌍',
      actionable: true,
      recommendations: [
        'Conduct regular competitive analysis and market research',
        'Monitor market trends and customer behavior changes',
        'Develop unique value propositions and differentiation strategies',
        'Build strategic partnerships for market expansion'
      ]
    });

    return insights;
    } catch (error) {
      console.error('Error generating business intelligence insights:', error);
      return [];
    }
  }, [dashboardState.data]);

  // Generate insights when dashboard data changes
  useEffect(() => {
    if (isOpen && dashboardState.data) {
      setIsAnalyzing(true);
      setTimeout(() => {
        try {
          const newInsights = generateBusinessIntelligence();
          setInsights(newInsights);
        } catch (error) {
          console.error('Error in insights generation:', error);
          setInsights([]);
        } finally {
          setIsAnalyzing(false);
        }
      }, 300); // Reduced simulation time
    }
  }, [isOpen, dashboardState.data, generateBusinessIntelligence]);

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedInsights = filteredInsights.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '450px',
      height: '100vh',
      background: theme.bg.glass,
      backdropFilter: 'blur(20px)',
      borderLeft: `1px solid ${theme.border.medium}`,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: `1px solid ${theme.border.light}`,
        background: `linear-gradient(135deg, ${theme.accent.primary}15, ${theme.accent.secondary}10)`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🧠
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '700',
                color: theme.text.primary
              }}>
                Business Intelligence
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.text.secondary
              }}>
                Strategic insights & analytics
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: theme.text.secondary,
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.bg.overlay;
              e.currentTarget.style.color = theme.text.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = theme.text.secondary;
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === category.id 
                  ? theme.accent.primary 
                  : theme.bg.overlay,
                color: selectedCategory === category.id 
                  ? theme.text.inverse 
                  : theme.text.secondary,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px'
      }}>
        {isAnalyzing ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: `3px solid ${theme.accent.primary}30`,
              borderTop: `3px solid ${theme.accent.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: theme.text.primary
            }}>
              Analyzing Business Intelligence...
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.text.secondary,
              textAlign: 'center'
            }}>
              Processing strategies, predictions, risks, and opportunities
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedInsights.map(insight => (
              <div
                key={insight.id}
                style={{
                  background: theme.bg.tertiary,
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${
                    insight.priority === 'high' ? theme.accent.error + '40' :
                    insight.priority === 'medium' ? theme.accent.warning + '40' :
                    theme.border.light
                  }`,
                  boxShadow: `0 4px 12px ${theme.bg.overlay}40`
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    marginTop: '2px'
                  }}>
                    {insight.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600',
                        color: theme.text.primary
                      }}>
                        {insight.title}
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        background: insight.priority === 'high' ? theme.accent.error + '20' :
                                   insight.priority === 'medium' ? theme.accent.warning + '20' :
                                   theme.accent.success + '20',
                        color: insight.priority === 'high' ? theme.accent.error :
                               insight.priority === 'medium' ? theme.accent.warning :
                               theme.accent.success
                      }}>
                        {insight.priority}
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.5',
                      color: theme.text.secondary
                    }}>
                      {insight.content}
                    </p>
                  </div>
                </div>

                {insight.recommendations && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: theme.bg.overlay,
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme.text.primary,
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>💡</span>
                      <span>Recommended Actions:</span>
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '16px',
                      fontSize: '12px',
                      color: theme.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} style={{ marginBottom: '4px' }}>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BusinessIntelligenceAssistant;