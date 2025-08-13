import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

// Fallback theme in case context is not available
const fallbackTheme = {
  bg: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    glass: 'rgba(255, 255, 255, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.1)'
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8'
  },
  border: {
    light: '#e2e8f0',
    medium: '#cbd5e1'
  },
  accent: {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

interface QuickInsightsAssistantProps {
  isVisible: boolean;
  position: { x: number; y: number };
  dataPoint?: any;
  chartType?: 'timeseries' | 'seasonal' | 'growth' | 'kpi';
  chartInfo?: {
    title: string;
    description: string;
    purpose: string;
  };
  onClose: () => void;
  dashboardState?: any;
}

interface InsightPoint {
  icon: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
}

const QuickInsightsAssistant: React.FC<QuickInsightsAssistantProps> = ({
  isVisible,
  position,
  dataPoint,
  chartType,
  chartInfo,
  onClose,
  dashboardState
}) => {
  // Use theme with fallback
  let theme;
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
  } catch (error) {
    console.warn('Theme context not available, using fallback theme');
    theme = fallbackTheme;
  }
  
  const [insights, setInsights] = useState<InsightPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper functions defined first
  const generateDataPointInsights = (point: any, type?: string): InsightPoint[] => {
    const insights: InsightPoint[] = [];
    const value = point.value || point.revenue || 0;
    const date = point.date || point.period || 'Unknown';
    const percentChange = point.percentChange;
    const previousValue = point.previousValue;
    const metricName = point.metricName || 'revenue';

    // Enhanced Performance Analysis
    if (percentChange !== undefined) {
      if (percentChange > 20) {
        insights.push({
          icon: '🚀',
          text: `Exceptional ${percentChange.toFixed(1)}% growth - ${Math.abs(value - (previousValue || 0)).toLocaleString()} increase from ${previousValue?.toLocaleString() || 'N/A'}`,
          type: 'positive'
        });
      } else if (percentChange > 10) {
        insights.push({
          icon: '📈',
          text: `Strong ${percentChange.toFixed(1)}% growth indicates positive momentum in ${metricName}`,
          type: 'positive'
        });
      } else if (percentChange > 0) {
        insights.push({
          icon: '✅',
          text: `Modest ${percentChange.toFixed(1)}% improvement shows steady progress`,
          type: 'positive'
        });
      } else if (percentChange > -5) {
        insights.push({
          icon: '📊',
          text: `Minor ${Math.abs(percentChange).toFixed(1)}% decline - within normal variance range`,
          type: 'neutral'
        });
      } else if (percentChange > -15) {
        insights.push({
          icon: '⚠️',
          text: `${Math.abs(percentChange).toFixed(1)}% decline requires attention - investigate market factors`,
          type: 'warning'
        });
      } else {
        insights.push({
          icon: '🔴',
          text: `Critical ${Math.abs(percentChange).toFixed(1)}% drop - immediate action needed`,
          type: 'negative'
        });
      }
    }

    // Enhanced Value Context with Market Position
    const formattedValue = metricName.toLowerCase().includes('revenue') || metricName.toLowerCase().includes('value') 
      ? `$${value.toLocaleString()}` 
      : value.toLocaleString();
    
    insights.push({
      icon: '💰',
      text: `${date}: ${formattedValue} ${metricName} - ${getPerformanceCategory(value, percentChange)}`,
      type: 'neutral'
    });

    // Contextual Trend Analysis
    if (type === 'timeseries') {
      const trendDirection = percentChange > 5 ? 'upward' : percentChange < -5 ? 'downward' : 'stable';
      insights.push({
        icon: '📈',
        text: `Time series shows ${trendDirection} trajectory - ${getTrendInsight(percentChange, type)}`,
        type: percentChange > 5 ? 'positive' : percentChange < -5 ? 'warning' : 'neutral'
      });
    } else if (type === 'seasonal') {
      insights.push({
        icon: '🌊',
        text: `Seasonal pattern analysis: ${getSeasonalInsight(date, percentChange)}`,
        type: 'neutral'
      });
    }

    // Strategic Recommendations
    if (percentChange !== undefined) {
      if (percentChange < -10) {
        insights.push({
          icon: '🎯',
          text: `Action needed: Review pricing strategy, market conditions, and competitive landscape`,
          type: 'warning'
        });
      } else if (percentChange > 15) {
        insights.push({
          icon: '⭐',
          text: `Opportunity: Scale successful strategies and analyze growth drivers for replication`,
          type: 'positive'
        });
      } else if (percentChange > 5) {
        insights.push({
          icon: '🔄',
          text: `Maintain momentum: Continue current strategies while monitoring for optimization`,
          type: 'positive'
        });
      }
    }

    // Comparative Context
    insights.push({
      icon: '📊',
      text: `Use main AI assistant for deeper analysis, forecasting, and strategic recommendations`,
      type: 'neutral'
    });

    return insights.slice(0, 6); // Increased to 6 insights for more comprehensive analysis
  };

  // Helper function to categorize performance
  const getPerformanceCategory = (value: number, percentChange?: number): string => {
    if (percentChange === undefined) return 'baseline performance';
    if (percentChange > 15) return 'exceptional performance';
    if (percentChange > 5) return 'strong performance';
    if (percentChange > -5) return 'stable performance';
    if (percentChange > -15) return 'below expectations';
    return 'requires immediate attention';
  };

  // Helper function for trend insights
  const getTrendInsight = (percentChange: number, type: string): string => {
    if (percentChange > 10) return 'momentum building, consider scaling efforts';
    if (percentChange > 0) return 'positive direction, monitor for acceleration';
    if (percentChange > -10) return 'stabilizing, look for improvement opportunities';
    return 'declining trend, intervention required';
  };

  // Helper function for seasonal insights
  const getSeasonalInsight = (date: string, percentChange: number): string => {
    const month = new Date(date).getMonth();
    const isHolidaySeason = month === 10 || month === 11; // Nov, Dec
    const isQ1 = month >= 0 && month <= 2; // Jan, Feb, Mar
    
    if (isHolidaySeason && percentChange > 0) return 'holiday season boost as expected';
    if (isQ1 && percentChange < 0) return 'typical Q1 slowdown, plan for recovery';
    if (percentChange > 10) return 'outperforming seasonal expectations';
    return 'aligns with historical seasonal patterns';
  };

  const generateChartExplanationInsights = (info: any, type?: string): InsightPoint[] => {
    const insights: InsightPoint[] = [];

    switch (type) {
      case 'timeseries':
        insights.push(
          {
            icon: '📈',
            text: 'Time Series Explorer: Advanced trend analysis showing revenue, units sold, and growth patterns over customizable time periods (daily, weekly, monthly, quarterly)',
            type: 'neutral'
          },
          {
            icon: '🔍',
            text: 'Key Features: Zoom into specific date ranges, overlay multiple metrics, identify trend reversals, and spot anomalies that deviate >15% from expected patterns',
            type: 'positive'
          },
          {
            icon: '📊',
            text: 'Business Intelligence: Reveals seasonality cycles, growth acceleration/deceleration points, and helps forecast future performance based on historical trends',
            type: 'neutral'
          },
          {
            icon: '🎯',
            text: 'Actionable Insights: Click any data point to get instant AI analysis of why metrics changed, what external factors influenced performance, and recommended next steps',
            type: 'positive'
          },
          {
            icon: '⚡',
            text: 'Strategic Value: Essential for budget planning, inventory management, marketing campaign timing, and identifying the best/worst performing periods for deeper investigation',
            type: 'positive'
          },
          {
            icon: '🚀',
            text: 'Advanced Analytics: Automatically detects trend changes, calculates growth rates, identifies outliers, and provides statistical significance testing for observed patterns',
            type: 'positive'
          }
        );
        break;

      case 'seasonal':
        insights.push(
          {
            icon: '🌊',
            text: 'Seasonal Pattern Analyzer: Sophisticated cyclical analysis that decomposes your sales data into trend, seasonal, and irregular components using advanced statistical methods',
            type: 'neutral'
          },
          {
            icon: '📅',
            text: 'Pattern Recognition: Automatically identifies recurring patterns (holiday spikes, summer dips, back-to-school surges) and quantifies their impact on your business performance',
            type: 'positive'
          },
          {
            icon: '🔄',
            text: 'Comparative Analysis: Shows year-over-year seasonal performance, identifies shifting seasonal patterns, and highlights which seasons are strengthening or weakening over time',
            type: 'neutral'
          },
          {
            icon: '📊',
            text: 'Forecasting Power: Enables accurate seasonal forecasting by understanding historical patterns, helping predict Q4 holiday performance based on previous years\' data',
            type: 'positive'
          },
          {
            icon: '🎯',
            text: 'Strategic Planning: Critical for inventory planning (avoid stockouts during peak seasons), marketing budget allocation, staffing decisions, and cash flow management',
            type: 'positive'
          },
          {
            icon: '💡',
            text: 'Business Optimization: Identifies opportunities to counter-seasonal marketing, optimize pricing strategies during peak/off-peak periods, and plan product launches for maximum impact',
            type: 'positive'
          }
        );
        break;

      case 'growth':
        insights.push(
          {
            icon: '🚀',
            text: 'Growth Rate Visualizer: Comprehensive growth analysis calculating month-over-month, quarter-over-quarter, and year-over-year growth rates with compound annual growth rate (CAGR) tracking',
            type: 'neutral'
          },
          {
            icon: '📈',
            text: 'Growth Metrics: Tracks revenue growth, customer acquisition growth, average order value growth, and identifies which growth drivers are accelerating or decelerating',
            type: 'positive'
          },
          {
            icon: '⚡',
            text: 'Momentum Analysis: Detects growth momentum shifts, identifies inflection points where growth accelerates/decelerates, and highlights periods of exponential vs. linear growth',
            type: 'neutral'
          },
          {
            icon: '🎯',
            text: 'Benchmark Comparison: Compares your growth rates against industry benchmarks, competitor performance, and your own historical performance to identify relative positioning',
            type: 'positive'
          },
          {
            icon: '🔍',
            text: 'Root Cause Analysis: Click growth spikes/dips to understand what drove changes - new product launches, marketing campaigns, market conditions, or operational improvements',
            type: 'positive'
          },
          {
            icon: '💼',
            text: 'Strategic Applications: Essential for investor reporting, setting realistic growth targets, identifying scalable growth strategies, and planning resource allocation for sustained growth',
            type: 'positive'
          }
        );
        break;

      case 'kpi':
        insights.push(
          {
            icon: '🎯',
            text: 'KPI Performance Dashboard: Executive-level scorecard tracking 15+ critical business metrics including revenue, profitability, customer acquisition cost, lifetime value, and operational efficiency',
            type: 'neutral'
          },
          {
            icon: '📊',
            text: 'Real-Time Monitoring: Live updates of key performance indicators with color-coded alerts (green: exceeding targets, yellow: at risk, red: critical attention needed)',
            type: 'positive'
          },
          {
            icon: '🔍',
            text: 'Performance Analytics: Tracks performance against targets, industry benchmarks, and historical performance with automatic variance analysis and trend detection',
            type: 'neutral'
          },
          {
            icon: '⚖️',
            text: 'Balanced Scorecard: Covers financial metrics (revenue, profit margin), customer metrics (satisfaction, retention), operational metrics (efficiency, quality), and growth metrics',
            type: 'positive'
          },
          {
            icon: '🚨',
            text: 'Alert System: Automatically flags KPIs that deviate >10% from targets, identifies leading indicators of potential problems, and prioritizes metrics needing immediate action',
            type: 'warning'
          },
          {
            icon: '📈',
            text: 'Strategic Decision Support: Enables data-driven decision making, helps prioritize initiatives based on KPI impact, and provides clear visibility into business health for stakeholders',
            type: 'positive'
          }
        );
        break;

      default:
        insights.push(
          {
            icon: '📊',
            text: 'Advanced Sales Analytics: Comprehensive visualization combining multiple data sources to provide 360-degree view of sales performance with predictive analytics capabilities',
            type: 'neutral'
          },
          {
            icon: '🎯',
            text: 'Business Intelligence: Transforms raw sales data into actionable insights using machine learning algorithms to identify patterns, predict trends, and recommend optimizations',
            type: 'positive'
          },
          {
            icon: '🔍',
            text: 'Interactive Analysis: Click any element for instant AI-powered analysis including root cause analysis, impact assessment, and recommended actions based on similar historical patterns',
            type: 'positive'
          },
          {
            icon: '🤖',
            text: 'AI-Powered Insights: Advanced natural language processing provides contextual explanations, identifies correlations between metrics, and suggests strategic improvements',
            type: 'positive'
          },
          {
            icon: '📈',
            text: 'Integrated Analytics Suite: Part of comprehensive sales intelligence platform enabling cross-functional analysis, automated reporting, and collaborative decision-making',
            type: 'positive'
          }
        );
    }

    return insights.slice(0, 6); // Increased to 6 for more comprehensive information
  };

  // Generate insights based on data point or chart info
  const generateInsights = async () => {
    setIsLoading(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let generatedInsights: InsightPoint[] = [];

    if (dataPoint) {
      // Data point insights
      generatedInsights = generateDataPointInsights(dataPoint, chartType);
    } else if (chartInfo) {
      // Chart explanation insights
      generatedInsights = generateChartExplanationInsights(chartInfo, chartType);
    }

    setInsights(generatedInsights);
    setIsLoading(false);
  };

  // Calculate optimal position to keep tooltip in viewport
  const getOptimalPosition = () => {
    if (!containerRef.current) return position;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth - 20) {
      x = viewportWidth - rect.width - 20;
    }
    if (x < 20) {
      x = 20;
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight - 20) {
      y = y - rect.height - 40; // Position above the click point
    }
    if (y < 20) {
      y = 20;
    }

    return { x, y };
  };

  // Animation and lifecycle effects
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      generateInsights();
    } else {
      setIsAnimating(false);
      setInsights([]);
    }
  }, [isVisible, dataPoint, chartInfo]);

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const optimalPosition = getOptimalPosition();

  const getInsightColor = (type: InsightPoint['type']) => {
    switch (type) {
      case 'positive': return theme.accent.success || '#22c55e';
      case 'negative': return theme.accent.danger || '#ef4444';
      case 'warning': return theme.accent.warning || '#f59e0b';
      default: return theme.accent.info || '#3b82f6';
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${optimalPosition.x}px`,
        top: `${optimalPosition.y}px`,
        zIndex: 2000,
        background: theme.bg.card,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.border.medium}`,
        borderRadius: '16px',
        boxShadow: `0 20px 60px ${theme.chat.shadow}, 0 0 0 1px ${theme.accent.primary}20`,
        width: '320px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(10px)',
        opacity: isAnimating ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontFamily: theme.typography?.fontFamily || 'Inter, sans-serif'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.border.light}`,
        background: `linear-gradient(135deg, ${theme.accent.primary}10, ${theme.accent.secondary}10)`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.secondary})`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            ⚡
          </div>
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              color: theme.text.primary
            }}>
              Quick AI Insights
            </div>
            <div style={{
              fontSize: '11px',
              color: theme.text.secondary
            }}>
              {dataPoint ? 'Data Point Analysis' : 'Chart Explanation'}
            </div>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.text.secondary,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.bg.tertiary;
            e.currentTarget.style.color = theme.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = theme.text.secondary;
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: '16px 20px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '20px 0'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `2px solid ${theme.accent.primary}30`,
              borderTop: `2px solid ${theme.accent.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              fontSize: '13px',
              color: theme.text.secondary
            }}>
              Analyzing data...
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 0',
                  animation: `slideInFromLeft 0.4s ease-out ${index * 0.1}s both`
                }}
              >
                <div style={{
                  fontSize: '16px',
                  marginTop: '1px',
                  minWidth: '20px'
                }}>
                  {insight.icon}
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.4',
                  color: theme.text.primary,
                  flex: 1
                }}>
                  {insight.text}
                </div>
                <div style={{
                  width: '3px',
                  height: '3px',
                  borderRadius: '50%',
                  background: getInsightColor(insight.type),
                  marginTop: '6px',
                  minWidth: '3px'
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: `1px solid ${theme.border.light}`,
        background: theme.bg.glass,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '11px',
          color: theme.text.tertiary,
          textAlign: 'center'
        }}>
          💡 For detailed analysis, use the main AI chatbot
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default QuickInsightsAssistant;