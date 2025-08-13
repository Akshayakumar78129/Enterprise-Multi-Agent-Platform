import React, { useState, useEffect } from 'react';

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

const QuickInsightsAssistant: React.FC<QuickInsightsAssistantProps> = ({
  isVisible,
  position,
  dataPoint,
  chartType,
  chartInfo,
  onClose,
  dashboardState
}) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate insights when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      
      // Simulate AI processing
      setTimeout(() => {
        if (dataPoint) {
          // Enhanced data point insights
          const value = dataPoint.value || 0;
          const date = dataPoint.date || 'Unknown';
          const metricName = dataPoint.metricName || 'metric';
          const percentChange = dataPoint.percentChange;
          const previousValue = dataPoint.previousValue;
          
          const insights = [];
          
          // Enhanced performance analysis with business context
          if (percentChange !== undefined) {
            if (percentChange > 25) {
              insights.push(`🎉 Exceptional month! Sales surged ${percentChange.toFixed(1)}% - this puts you in the top 10% of businesses. This kind of growth often indicates successful product launches, viral marketing, or capturing competitor market share.`);
            } else if (percentChange > 15) {
              insights.push(`🚀 Outstanding performance! ${percentChange.toFixed(1)}% growth is excellent - most successful businesses see 10-20% monthly growth. You're likely gaining market share and building strong customer loyalty.`);
            } else if (percentChange > 5) {
              insights.push(`✅ Solid growth of ${percentChange.toFixed(1)}%! This is healthy, sustainable growth. At this rate, you're on track to double your business in 12-18 months. Consider what's working and scale it up.`);
            } else if (percentChange > -3) {
              insights.push(`📊 Stable performance (${Math.abs(percentChange).toFixed(1)}% variance) - this consistency is actually valuable. Steady businesses are easier to predict, plan for, and often more profitable than volatile ones.`);
            } else if (percentChange > -10) {
              insights.push(`⚠️ ${Math.abs(percentChange).toFixed(1)}% decline needs attention. Common causes: seasonal dips, increased competition, economic factors, or operational issues. Quick action can usually reverse this trend.`);
            } else {
              insights.push(`🔴 Significant ${Math.abs(percentChange).toFixed(1)}% drop requires immediate investigation. This could indicate market disruption, supply chain issues, or customer satisfaction problems. Address root causes quickly.`);
            }
          }
          
          // Enhanced value display with business context
          const formattedValue = metricName.toLowerCase().includes('revenue') || metricName.toLowerCase().includes('value') 
            ? `$${value.toLocaleString()}` 
            : metricName.toLowerCase().includes('rate') || metricName.toLowerCase().includes('margin')
            ? `${(value * 100).toFixed(1)}%`
            : value.toLocaleString();
          
          // Add business context based on value size
          let valueContext = '';
          if (metricName.toLowerCase().includes('revenue')) {
            if (value > 10000000) valueContext = ' (enterprise-level performance)';
            else if (value > 1000000) valueContext = ' (strong mid-market business)';
            else if (value > 100000) valueContext = ' (growing small business)';
            else if (value > 10000) valueContext = ' (early-stage business)';
            else valueContext = ' (startup phase)';
          }
          
          insights.push(`💰 ${date} Performance: ${formattedValue} in ${metricName.replace('_', ' ')}${valueContext}. ${previousValue ? `Previous month: $${previousValue.toLocaleString()} (${percentChange > 0 ? '+' : ''}${percentChange?.toFixed(1)}% change)` : 'Building your business foundation.'}`);
          
          
          // Strategic recommendations with business intelligence
          if (percentChange !== undefined) {
            if (percentChange < -15) {
              insights.push(`🎯 Strategic Action: Investigate immediately - check customer feedback, competitor moves, supply chain issues, or market changes. Consider emergency promotions, customer retention campaigns, or operational audits. Time is critical.`);
            } else if (percentChange > 20) {
              insights.push(`⭐ Scale Success: Document what drove this growth (new marketing channels, product features, partnerships). Increase marketing spend, expand successful campaigns, hire more sales staff, and prepare inventory for sustained growth.`);
            } else if (percentChange > 10) {
              insights.push(`🔄 Optimize Growth: You're in the sweet spot! Test new marketing channels, expand to adjacent markets, improve customer retention programs, and consider raising prices if demand is strong.`);
            } else if (percentChange < -5) {
              insights.push(`🔍 Course Correction: Analyze customer acquisition costs, review pricing strategy, check competitor activities, survey customers for feedback, and consider seasonal promotions or product improvements.`);
            } else {
              insights.push(`📊 Maintain Momentum: Stable growth is valuable. Focus on customer satisfaction, operational efficiency, and building cash reserves for future opportunities. Consider gradual expansion.`);
            }
          }
          
          // Market intelligence and forecasting
          const currentMonth = new Date(date).getMonth();
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const seasonalInsights = {
            0: 'January often sees post-holiday dips but strong B2B activity as budgets reset.',
            1: 'February is typically slower for retail but strong for B2B as Q1 initiatives launch.',
            2: 'March shows spring recovery with increased consumer spending and business investments.',
            3: 'April benefits from tax refunds and spring shopping, plus strong B2B quarter-end pushes.',
            4: 'May sees graduation/wedding season spending and strong business activity before summer.',
            5: 'June has strong consumer activity but may see B2B slowdowns as vacation season starts.',
            6: 'July often shows summer slowdowns in B2B but strong travel and leisure spending.',
            7: 'August sees back-to-school spending surge and businesses preparing for Q4.',
            8: 'September shows strong business activity as teams return from summer breaks.',
            9: 'October builds toward holiday season with increased marketing and inventory preparation.',
            10: 'November features Black Friday/Cyber Monday - often the strongest retail month.',
            11: 'December shows holiday peak for retail but B2B often slows for year-end.'
          };
          
          insights.push(`📅 Market Context: ${seasonalInsights[currentMonth]} ${percentChange > 5 ? 'Your performance exceeds typical seasonal expectations!' : percentChange < -5 ? 'Consider seasonal factors in your analysis.' : 'Your performance aligns with seasonal patterns.'}`);
          
          // Advanced analytics suggestions
          insights.push(`🔬 Deep Dive Opportunities: Use the main AI chat to explore customer segmentation, cohort analysis, lifetime value trends, or predictive forecasting based on this data point.`);
          
          // Enhanced chart context with business intelligence
          if (chartType === 'timeseries') {
            insights.push(`📈 Time Series Intelligence: This trend analysis reveals business cycles, growth patterns, and anomalies. Look for 3-month moving averages to spot true trends vs. noise, and identify your peak/trough cycles for better planning.`);
          } else if (chartType === 'seasonal') {
            insights.push(`🌊 Seasonal Intelligence: This pattern analysis helps predict future performance and optimize inventory, staffing, and marketing spend. Strong seasonal businesses can achieve 40-60% of annual revenue in peak months.`);
          } else if (chartType === 'growth') {
            insights.push(`🚀 Growth Intelligence: This momentum analysis shows acceleration/deceleration patterns. Consistent 15%+ monthly growth can indicate product-market fit, while volatile growth may suggest external dependencies.`);
          }
          
          setInsights(insights.slice(0, 6));
        } else if (chartInfo) {
          // Enhanced time series explanations with business intelligence
          if (chartType === 'timeseries') {
            setInsights([
              `📈 Time Series Analysis: This shows your business performance over time, revealing growth trends, seasonal patterns, and business cycles. It's like your business's heartbeat monitor.`,
              `🔍 Advanced Usage: Click points for detailed analysis. Look for trend lines (overall direction), volatility (how much it jumps around), and inflection points (where trends change direction).`,
              `📊 Key Patterns to Spot: Upward trends = growth, downward trends = decline, flat lines = stability. Jagged lines = high volatility (risky but potentially high reward), smooth lines = predictable business.`,
              `🎯 Business Intelligence: Identify your growth rate (slope of the line), seasonal peaks/troughs, and correlation with external events (holidays, marketing campaigns, economic changes).`,
              `⚡ Professional Insight: 3-month moving averages smooth out noise to show true trends. 12-month comparisons reveal year-over-year growth. Look for compound growth patterns.`,
              `🚀 Strategic Applications: Use for budget forecasting, inventory planning, hiring decisions, and investor presentations. Strong upward trends indicate scalable business models.`
            ]);
          } else if (chartType === 'seasonal') {
            setInsights([
              `🌊 Seasonal Pattern Analysis: This reveals your business's natural rhythms and cyclical patterns. Most businesses have 20-40% variance between peak and trough seasons.`,
              `📅 Advanced Pattern Recognition: Compare year-over-year performance for the same months. Strong seasonal businesses can predict 70-80% of future performance using historical patterns.`,
              `🔄 Seasonal Intelligence: Peaks indicate high-demand periods (optimize pricing, increase inventory). Valleys show opportunity for counter-seasonal marketing, cost reduction, or product development.`,
              `📊 Strategic Planning: Use for cash flow forecasting, staff scheduling, inventory management, and marketing budget allocation. Plan 3-6 months ahead based on seasonal patterns.`,
              `🎯 Market Opportunities: Weak seasons can become competitive advantages through targeted promotions, new product launches, or market expansion when competitors are dormant.`,
              `💡 Forecasting Power: Seasonal decomposition helps separate trend from seasonality. If December typically does 25% of annual revenue, plan accordingly for inventory and staffing.`
            ]);
          } else if (chartType === 'growth') {
            setInsights([
              `🚀 Growth Rate Analysis: This measures your business acceleration - the rate of change in your performance. It's more sensitive than absolute values and shows momentum shifts early.`,
              `📈 Growth Intelligence: Positive bars = expansion, negative bars = contraction. Consistent 10-20% monthly growth indicates strong product-market fit and scalable operations.`,
              `⚡ Momentum Indicators: Accelerating growth (bars getting taller) = gaining momentum. Decelerating growth (bars getting shorter) = potential headwinds or market saturation.`,
              `🎯 Benchmark Context: 5-10% monthly growth = healthy, 15-25% = excellent, 30%+ = exceptional (but potentially unsustainable). Negative growth >3 months = strategic concern.`,
              `🔍 Root Cause Analysis: Growth spikes often correlate with product launches, marketing campaigns, or market expansion. Growth dips may indicate competition, economic factors, or operational issues.`,
              `💼 Strategic Implications: Use for setting realistic targets, planning resources, and identifying inflection points. Compound growth at 15% monthly = 5x annual growth.`
            ]);
          } else if (chartType === 'kpi') {
            setInsights([
              `🎯 KPI Dashboard Intelligence: This executive scorecard tracks leading and lagging indicators of business health. KPIs should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).`,
              `📊 Performance Management: Green = exceeding targets (celebrate and scale), Yellow = at-risk (monitor closely), Red = critical (immediate action required). Focus on the vital few, not the trivial many.`,
              `🔍 Balanced Scorecard Approach: Monitor financial metrics (revenue, profit), customer metrics (satisfaction, retention), operational metrics (efficiency, quality), and learning/growth metrics.`,
              `⚖️ Leading vs Lagging Indicators: Leading indicators predict future performance (website traffic, pipeline), lagging indicators show past results (revenue, profit). Balance both for complete visibility.`,
              `🚨 Alert Management: Red KPIs indicate system failures or market changes. Prioritize by business impact and urgency. Address root causes, not just symptoms.`,
              `📈 Continuous Improvement: Track KPI trends over time. Improving KPIs = business optimization. Declining KPIs = early warning system. Set realistic targets based on historical performance and industry benchmarks.`
            ]);
          } else {
            setInsights([
              `📊 Advanced Analytics Dashboard: This visualization transforms complex business data into actionable insights using statistical analysis, pattern recognition, and predictive modeling.`,
              `🎯 Data-Driven Decision Making: Look for correlations, outliers, and trend patterns. Statistical significance helps distinguish real signals from random noise in your business data.`,
              `🔍 Business Intelligence Patterns: Identify cyclical patterns, growth trajectories, performance anomalies, and market correlations. Each data point tells part of your business story.`,
              `🤖 Machine Learning Insights: Advanced algorithms detect patterns humans might miss, predict future trends, and identify optimization opportunities based on historical performance.`,
              `📈 Integrated Analysis: Cross-reference multiple data sources for comprehensive insights. Customer behavior + sales data + market trends = complete business intelligence picture.`,
              `⚡ Predictive Analytics: Use historical patterns to forecast future performance, identify risks early, and optimize resource allocation for maximum ROI.`
            ]);
          }
        }
        setIsLoading(false);
      }, 500);
    }
  }, [isVisible, dataPoint, chartInfo, chartType]);

  // Helper function for performance level
  const getPerformanceLevel = (percentChange?: number): string => {
    if (percentChange === undefined) return 'normal';
    if (percentChange > 20) return 'amazing';
    if (percentChange > 10) return 'great';
    if (percentChange > 0) return 'good';
    if (percentChange > -5) return 'okay';
    if (percentChange > -15) return 'concerning';
    return 'needs attention';
  };

  // Auto-close after 12 seconds (increased for comprehensive insights)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  // Smart positioning to prevent off-screen issues
  const getSmartPosition = () => {
    const popupWidth = 400;
    const popupHeight = 300;
    const margin = 20;
    
    let left = position.x;
    let top = position.y;
    
    // Adjust horizontal position if too close to right edge
    if (left + popupWidth > window.innerWidth - margin) {
      left = window.innerWidth - popupWidth - margin;
    }
    
    // Adjust horizontal position if too close to left edge
    if (left < margin) {
      left = margin;
    }
    
    // Adjust vertical position if too close to bottom edge
    if (top + popupHeight > window.innerHeight - margin) {
      top = window.innerHeight - popupHeight - margin;
    }
    
    // Adjust vertical position if too close to top edge
    if (top < margin) {
      top = margin;
    }
    
    return { left, top };
  };

  const smartPosition = getSmartPosition();

  return (
    <div
      style={{
        position: 'fixed',
        left: smartPosition.left,
        top: smartPosition.top,
        zIndex: 10000,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '300px',
        maxWidth: '400px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          ⚡ Quick AI Insights
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ fontSize: '13px', color: '#64748b' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ 
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ marginTop: '8px' }}>Analyzing data...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: '500', marginBottom: '8px' }}>
              {dataPoint ? 'Data Point Analysis' : chartInfo ? 'Chart Explanation' : 'Quick Insights'}
            </div>
            <div>
              {insights.map((insight, index) => (
                <div key={index} style={{ 
                  marginBottom: '6px',
                  padding: '4px 0',
                  borderLeft: '2px solid #3b82f6',
                  paddingLeft: '8px'
                }}>
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #e2e8f0',
        fontSize: '11px',
        color: '#94a3b8',
        textAlign: 'center'
      }}>
        💡 For detailed analysis, use the main AI chatbot
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuickInsightsAssistant;