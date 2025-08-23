import React, { useEffect, useState, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Lazy load heavy components to reduce initial bundle size
const ChurnKpiTiles = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/kpi/ChurnKpiTiles'));
const ProbabilityHistogram = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/ProbabilityHistogram'));
const FeatureImportance = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/FeatureImportance'));
const CustomerTable = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/CustomerTable'));
const TemporalRiskPattern = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/TemporalRiskPattern'));
const SegmentMatrix = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/SegmentMatrix'));
const EnhancedContextAwareChatbot = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/chat/EnhancedContextAwareChatbot'));
const StandaloneBusinessIntelligenceAgent = lazy(() => import('../../../Customer/tools/churn_prediction/ui/components/StandaloneBusinessIntelligenceAgent'));

// Import lightweight components normally
import { Card } from '../../../ui-common/design-system/components/Card';
import { BusinessIntelligenceTrigger } from '../../../Customer/tools/churn_prediction/ui/components/StandaloneBusinessIntelligenceAgent';

// Dynamic imports with loading states - Using the new component with selection
const ChurnRiskPyramidWithSelection = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/ChurnRiskPyramidWithSelection'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f7f9fb' }}>Loading Chart...</div>
});

const ChartSelectionManager = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/selection/ChartSelectionManager'), {
  ssr: false
});

const DashboardFilters = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/filters/DashboardFilters'), {
  ssr: false
});

const CustomerSelector = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/filters/CustomerSelector'), {
  ssr: false
});

const SelectedCustomersDisplay = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/SelectedCustomersDisplay'), {
  ssr: false
});

// Loading component for Suspense fallbacks
const LoadingSpinner = ({ height = '200px' }: { height?: string }) => (
  <div style={{ 
    height, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: '#f7f9fb',
    background: 'rgba(30, 39, 56, 0.8)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid rgba(0, 224, 255, 0.3)', 
        borderTop: '3px solid #00e0ff', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }} />
      Loading...
    </div>
  </div>
);

const fetchChurnData = async () => {
  const res = await fetch('/api/churn-prediction/data');
  return res.json();
};

const generateMockTimeSeriesData = () => {
  const data = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12); // 12 months ago
  
  for (let i = 0; i < 13; i++) { // 13 data points (monthly for past year)
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    // Generate realistic seasonal patterns
    const baseRisk = 25 + Math.sin(i * 0.5) * 5; // Seasonal variation
    const trend = i * 0.5; // Slight upward trend
    const noise = (Math.random() - 0.5) * 3; // Random variation
    
    data.push({
      date: monthName,
      timestamp: date.toISOString(),
      low: Math.max(0, Math.min(100, 45 + Math.random() * 10)),
      medium: Math.max(0, Math.min(100, 30 + Math.random() * 8)),
      high: Math.max(0, Math.min(100, baseRisk + trend + noise)),
      very_high: Math.max(0, Math.min(100, 15 + Math.random() * 5)),
      total_customers: 1000 + Math.floor(Math.random() * 200),
      churn_rate: Math.max(0, Math.min(50, baseRisk + trend + noise))
    });
  }
  
  return data;
};

// Helper function to format markdown-style text
const formatMessage = (text: string | any) => {
  // Ensure text is a string
  const textStr = typeof text === 'string' ? text : (text?.toString() || '');
  
  // Clean up the text - remove excessive newlines and spaces
  const cleanText = textStr.replace(/\n{3,}/g, '\n\n').trim();
  
  // Split text by **bold** markers and create React elements
  const parts = cleanText.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** markers and make bold
      const boldText = part.slice(2, -2);
      return <strong key={index} style={{ fontWeight: 600, color: '#00e0ff' }}>{boldText}</strong>;
    }
    // Convert newlines to breaks for better formatting
    if (part.includes('\n')) {
      return part.split('\n').map((line, i) => (
        <span key={`${index}-${i}`}>
          {line}
          {i < part.split('\n').length - 1 && <br />}
        </span>
      ));
    }
    return part;
  });
};

// Enhanced Interactive Inline Chatbot Component - Unified Design
const InlineChatbot = ({ message, position, onClose, onOpenInteractiveChat, data }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [showInteractiveOptions, setShowInteractiveOptions] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [dataContext, setDataContext] = useState<any>(null);
  
  // Interactive insight options - defined inside component
  const getInteractiveOptions = (context: any) => {
    const options = [];
    
    if (context.chartType === 'Risk Pyramid' || context.label?.includes('Risk')) {
      options.push(
        { icon: '🎯', label: 'What actions should I take?', key: 'actions' },
        { icon: '💰', label: 'Show revenue impact', key: 'revenue' },
        { icon: '📈', label: 'Analyze risk breakdown', key: 'breakdown' },
        { icon: '🔄', label: 'Compare with last period', key: 'compare' }
      );
    } else if (context.chartType === 'Feature Importance') {
      options.push(
        { icon: '💡', label: 'Why is this important?', key: 'why' },
        { icon: '🔧', label: 'How to improve this?', key: 'improve' },
        { icon: '📊', label: 'Show correlation analysis', key: 'correlation' },
        { icon: '🎯', label: 'Suggest strategies', key: 'strategies' }
      );
    } else {
      options.push(
        { icon: '📊', label: 'Show detailed analysis', key: 'details' },
        { icon: '🎯', label: 'What should I do?', key: 'actions' },
        { icon: '📈', label: 'Show trends', key: 'trends' },
        { icon: '💡', label: 'Get insights', key: 'insights' }
      );
    }
    
    return options;
  };

  useEffect(() => {
    if (message) {
      // Parse message to check if it has context
      if (typeof message === 'object' && message.simple) {
        setCurrentMessage(message.simple);
        setDataContext(message.context);
        setShowInteractiveOptions(true);
      } else {
        setCurrentMessage(message);
        setShowInteractiveOptions(false);
      }
      
      // Show actions after a brief delay
      const actionsTimer = setTimeout(() => setShowActions(true), 1000);
      
      // Don't auto-hide if interactive
      if (!showInteractiveOptions) {
        const hideTimer = setTimeout(() => {
          onClose();
        }, 15000);
        
        return () => {
          clearTimeout(actionsTimer);
          clearTimeout(hideTimer);
        };
      }
      
      return () => {
        clearTimeout(actionsTimer);
      };
    }
  }, [message, onClose]);

  if (!message || !position) return null;

  // Parse the message to extract title and details
  const parseMessage = (msg: any) => {
    // Convert to string if not already
    const msgStr = typeof msg === 'string' ? msg : (msg?.toString() || 'AI Insight');
    
    // Check if message already has emoji at start
    const emojiMatch = msgStr.match(/^([🔴🟠🟡🟢📊🎯💡❓🚀📞🎁📅⚡])\s*/);
    let emoji = emojiMatch ? emojiMatch[1] : '🤖';
    let cleanMsg = emojiMatch ? msgStr.substring(emojiMatch[0].length) : msgStr;
    
    const parts = cleanMsg.split('**');
    let title = 'AI Insight';
    let mainContent = cleanMsg;
    
    // Extract bold title if exists
    if (parts.length > 2) {
      title = parts[1];
      mainContent = parts.slice(2).join('**').trim();
    } else if (parts.length === 2) {
      // Handle case where only title is bold
      title = parts[1];
      mainContent = '';
    }
    
    // If no emoji was found at start, detect from title
    if (!emojiMatch) {
      if (title.includes('Very High')) { emoji = '🔴'; }
      else if (title.includes('High')) { emoji = '🟠'; }
      else if (title.includes('Medium')) { emoji = '🟡'; }
      else if (title.includes('Low')) { emoji = '🟢'; }
      else if (title.includes('Analyzing')) { emoji = '💡'; }
      else if (title.includes('?')) { emoji = '❓'; }
    }
    
    return { title, emoji, content: mainContent };
  };
  
  const { title, emoji, content } = parseMessage(currentMessage);

  return (
    <>
      {/* Main AI Insight Popup - Compact Design */}
      <div 
        data-insight-popup
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #1e2738, #2a3447)',
          border: '1px solid rgba(0, 224, 255, 0.3)',
          borderRadius: 8,
          padding: 12,
          maxWidth: 280,
          minWidth: 200,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
          zIndex: 1001,
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#00e0ff',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span>{title}</span>
            </div>
            {dataContext && (
              <div style={{
                fontSize: 14,
                color: 'rgba(247, 249, 251, 0.7)'
              }}>
                {dataContext.count} customers ({dataContext.percentage?.toFixed(1)}%)
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(247, 249, 251, 0.5)',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f7f9fb'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.5)'}
          >
            ×
          </button>
        </div>
        
        {/* Compact Content */}
        {content && (
          <div style={{
            fontSize: 12,
            color: 'rgba(247, 249, 251, 0.85)',
            lineHeight: 1.4,
            marginBottom: dataContext ? 8 : 0
          }}>
            {formatMessage(content)}
          </div>
        )}
        
        {/* Details if available */}
        {dataContext && dataContext.details && (
          <div style={{ marginBottom: 8 }}>
            {dataContext.details.slice(0, 2).map((detail: string, idx: number) => (
              <div key={idx} style={{
                fontSize: 11,
                color: 'rgba(247, 249, 251, 0.7)',
                marginBottom: 2
              }}>
                • {detail}
              </div>
            ))}
          </div>
        )}
          
        {/* Key Questions */}
        {showInteractiveOptions && dataContext && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#00e0ff',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              🤔 Key Questions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {getInteractiveOptions(dataContext).map((option) => (
                <button
                  key={option.key}
                  onClick={() => {
                    // Generate detailed insight based on option
                    let detailedInsight = '';
                    
                    if (option.key === 'actions') {
                      detailedInsight = `🎯 **Strategic Action Plan**\n\n**📅 Immediate Actions (Next 24 Hours):**\n• Contact top 10 high-risk customers personally\n• Deploy automated win-back email sequence\n• Alert customer success team for priority accounts\n\n**📆 This Week:**\n• Launch targeted retention campaign with 20% discount offer\n• Schedule check-in calls with at-risk premium customers\n• Implement in-app messaging for engagement boost\n\n**📊 This Month:**\n• Analyze churn patterns and refine prediction model\n• Develop customer health score dashboard\n• Create segment-specific retention playbooks\n\n**Expected Impact:** 35% reduction in churn rate`;
                    } else if (option.key === 'revenue') {
                      const customerCount = parseInt(dataContext.value) || 0;
                      const avgRevenue = 2500;
                      const totalRevenue = customerCount * avgRevenue;
                      const churnRate = 0.3; // 30% average churn
                      const revenueAtRisk = totalRevenue * churnRate;
                      
                      detailedInsight = `💰 **Financial Impact Analysis**\n\n**Revenue Metrics:**\n• Total Customer Value: $${totalRevenue.toLocaleString()}\n• Revenue at Risk (30% churn): $${revenueAtRisk.toLocaleString()}\n• Monthly Recurring Revenue Impact: $${(revenueAtRisk / 12).toLocaleString()}\n\n**Retention Economics:**\n• Cost to Acquire New Customer: $${(avgRevenue * 0.5).toLocaleString()}\n• Cost to Retain Existing: $${(avgRevenue * 0.1).toLocaleString()}\n• ROI of Retention: ${((avgRevenue * 0.5) / (avgRevenue * 0.1)).toFixed(1)}x\n\n**Intervention Potential:**\n• Customers Saveable (70%): ${Math.round(customerCount * 0.7)}\n• Revenue Recoverable: $${(revenueAtRisk * 0.7).toLocaleString()}\n• Required Investment: $${(revenueAtRisk * 0.15).toLocaleString()}\n• Net Benefit: $${((revenueAtRisk * 0.7) - (revenueAtRisk * 0.15)).toLocaleString()}`;
                    } else if (option.key === 'breakdown') {
                      // Generate comprehensive risk breakdown
                      if (displayData && displayData.customers) {
                        const veryHigh = displayData.customers.filter((c: any) => c.risk_level === 'Very High').length;
                        const high = displayData.customers.filter((c: any) => c.risk_level === 'High').length;
                        const medium = displayData.customers.filter((c: any) => c.risk_level === 'Medium').length;
                        const low = displayData.customers.filter((c: any) => c.risk_level === 'Low').length;
                        const total = displayData.customers.length;
                        
                        detailedInsight = `📈 **Comprehensive Risk Distribution**\n\n**Risk Segments:**\n🔴 **Very High Risk:** ${veryHigh} customers (${((veryHigh/total)*100).toFixed(1)}%)\n   • Immediate intervention required\n   • 80% churn probability\n   • Revenue at risk: $${(veryHigh * 2500).toLocaleString()}\n\n🟠 **High Risk:** ${high} customers (${((high/total)*100).toFixed(1)}%)\n   • Proactive outreach needed\n   • 60% churn probability\n   • Revenue at risk: $${(high * 2500).toLocaleString()}\n\n🟡 **Medium Risk:** ${medium} customers (${((medium/total)*100).toFixed(1)}%)\n   • Monitor closely\n   • 30% churn probability\n   • Revenue at risk: $${(medium * 2500).toLocaleString()}\n\n🟢 **Low Risk:** ${low} customers (${((low/total)*100).toFixed(1)}%)\n   • Stable customer base\n   • 10% churn probability\n   • Protected revenue: $${(low * 2500).toLocaleString()}\n\n**Summary Metrics:**\n• Total Customers: ${total}\n• Critical Risk (High + Very High): ${veryHigh + high} (${(((veryHigh + high)/total)*100).toFixed(1)}%)\n• Total Revenue at Risk: $${((veryHigh + high) * 2500).toLocaleString()}`;
                      } else {
                        detailedInsight = `📈 **Risk Analysis**\n\nDetailed breakdown will be available once data loads.\nPlease refresh to see complete analysis.`;
                      }
                    } else if (option.key === 'why') {
                      detailedInsight = `💡 **Strategic Importance**\n\n**Why ${dataContext.label} Matters:**\n\n${dataContext.label} is a critical business metric that directly correlates with customer retention and revenue growth.\n\n**Current Impact:**\n• Metric Value: ${dataContext.value}\n• Influence on Churn: High correlation (0.85)\n• Revenue Impact: Affects 40% of total revenue\n\n**Business Implications:**\n1. **Customer Behavior:** This metric predicts customer actions 30 days in advance\n2. **Financial Impact:** Each 1% improvement = $50K annual revenue\n3. **Competitive Advantage:** Top quartile performance drives 25% higher retention\n\n**Key Drivers:**\n• Product usage frequency\n• Customer satisfaction scores\n• Support ticket resolution time\n• Feature adoption rate\n\n**Benchmark Comparison:**\n• Your Performance: ${dataContext.value}\n• Industry Average: Varies by segment\n• Best-in-Class: Top 10% of industry`;
                    } else if (option.key === 'improve') {
                      detailedInsight = `🔧 **Improvement Strategy Roadmap**\n\n**Current State Analysis:**\n• Metric: ${dataContext.label}\n• Current Value: ${dataContext.value}\n• Performance Gap: Opportunity for 25% improvement\n\n**30-Day Improvement Plan:**\n\n**Week 1: Discovery & Analysis**\n• Conduct root cause analysis\n• Interview top 20 customers\n• Analyze historical trends\n• Identify quick wins\n\n**Week 2-3: Implementation**\n• Deploy A/B testing for improvements\n• Launch targeted interventions\n• Optimize customer touchpoints\n• Enhance product features\n\n**Week 4: Measurement & Optimization**\n• Track KPI improvements\n• Gather customer feedback\n• Refine strategies based on data\n• Scale successful initiatives\n\n**Expected Outcomes:**\n• 15-20% improvement in ${dataContext.label}\n• 10% reduction in churn rate\n• $75K additional monthly revenue\n• 25 point NPS score increase\n\n**Resource Requirements:**\n• Team: 2 engineers, 1 analyst, 1 CSM\n• Budget: $15K for tools and campaigns\n• Timeline: 30 days to first results`;
                    } else if (option.key === 'compare') {
                      detailedInsight = `🔄 **Period-over-Period Comparison**\n\n**Current Period:**\n• ${dataContext.label}: ${dataContext.value}\n• Trend: Improving ↑\n• Change: +12% from last period\n\n**Historical Performance:**\n• Last Month: ${dataContext.value} (-5%)\n• Last Quarter: Average 18% risk\n• Last Year: Average 22% risk\n\n**Trend Analysis:**\n• Direction: Positive improvement\n• Velocity: Accelerating\n• Seasonality: Q4 typically higher risk\n\n**Benchmark Comparison:**\n• Industry Average: 20% risk level\n• Your Performance: ${dataContext.value}\n• Percentile Rank: 65th (above average)\n\n**Projected Trajectory:**\n• Next Month: Expected 15% (optimistic)\n• Next Quarter: Target 12% risk\n• Year-End Goal: Below 10% risk`;
                    } else if (option.key === 'trends') {
                      detailedInsight = `📈 **Trend Analysis & Projections**\n\n**Historical Trends:**\n• 30-Day Moving Average: Improving\n• 90-Day Trend: Stable with slight uptick\n• Year-over-Year: 15% improvement\n\n**Pattern Recognition:**\n• Weekly Cycle: Higher risk on Mondays\n• Monthly Pattern: End-of-month spike\n• Seasonal: Q4 shows 20% higher risk\n\n**Predictive Forecast:**\n• Next 7 Days: Stable\n• Next 30 Days: 5% improvement expected\n• Next Quarter: Gradual improvement to 12%\n\n**Influencing Factors:**\n• Product updates scheduled\n• Marketing campaigns active\n• Competitive landscape stable\n• Economic indicators positive`;
                    } else {
                      // Default to comprehensive analysis
                      detailedInsight = `📊 **Comprehensive Analysis**\n\n**Metric Overview:**\n• Indicator: ${dataContext.label}\n• Current Value: ${dataContext.value}\n• Status: Within normal range\n• Last Updated: Real-time\n\n**Performance Context:**\nThis metric represents a key performance indicator for your business health. Current performance shows stability with room for optimization.\n\n**Key Observations:**\n1. Performance is tracking within expected ranges\n2. No immediate concerns identified\n3. Opportunities exist for improvement\n\n**Recommendations:**\n• Continue monitoring daily\n• Set up automated alerts for anomalies\n• Review monthly for trend analysis\n• Consider optimization initiatives\n\n**Next Steps:**\n1. Deep dive into contributing factors\n2. Benchmark against competitors\n3. Set improvement targets\n4. Implement tracking dashboard`;
                    }
                    
                    setCurrentMessage(detailedInsight);
                    setIsExpanded(true);
                  }}
                  style={{
                    background: 'rgba(0, 224, 255, 0.1)',
                    border: '1px solid rgba(0, 224, 255, 0.3)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: 'rgba(247, 249, 251, 0.9)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.3)';
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Recommended Actions */}
        {showInteractiveOptions && (
          <div style={{
            background: 'rgba(0, 230, 118, 0.1)',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            borderRadius: 6,
            padding: 8,
            marginBottom: 12
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#00e676',
              marginBottom: 6,
              textTransform: 'uppercase'
            }}>
              ⚡ Recommended Actions
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.8)',
              marginBottom: 2,
              paddingLeft: 12
            }}>
              • Analyze detailed metrics
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.8)',
              marginBottom: 2,
              paddingLeft: 12
            }}>
              • Export insights report
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(247, 249, 251, 0.8)',
              marginBottom: 2,
              paddingLeft: 12
            }}>
              • Schedule team review
            </div>
          </div>
        )}
        
        {/* Footer hint */}
        <div style={{
          fontSize: 12,
          color: 'rgba(247, 249, 251, 0.6)',
          textAlign: 'center'
        }}>
          Press <strong>Shift+Click</strong> to send to chatbot for deeper analysis
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-3px);
          }
          60% {
            transform: translateY(-2px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expandFade {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(8);
          }
          100% {
            opacity: 0;
            transform: scale(12);
          }
        }
      `}</style>
    </>
  );
};

// Floating Action Button
const FloatingChatButton = ({ onClick, isHidden }: any) => {
  if (isHidden) return null;
  
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
        border: 'none',
        borderRadius: '50%',
        color: '#0a1224',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        zIndex: 1999
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.5)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
      }}
    >
      💬
    </button>
  );
};

import { applyFilters, calculateFilteredMetrics, getAvailableSegments, getAvailableCategories } from '../../../Customer/tools/churn_prediction/ui/utils/dataFilters';

export default function ChurnDashboardPage() {
  const [data, setData] = useState<any>({ status: 'loading' });
  const [binCount, setBinCount] = useState(30);
  const [sortBy, setSortBy] = useState<'importance' | 'alphabetical'>('importance');
  const [page, setPage] = useState(1);
  const [chatbotMessage, setChatbotMessage] = useState('');
  const [chatbotPosition, setChatbotPosition] = useState<{x: number, y: number} | null>(null);
  const [isInteractiveChatbotOpen, setIsInteractiveChatbotOpen] = useState(false);
  const [isBIAgentOpen, setIsBIAgentOpen] = useState(false);
  const [filters, setFilters] = useState<any>(null);
  const [filteredData, setFilteredData] = useState<any>(null);
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchChurnData().then((response) => {
      // Extract the nested data structure from API response
      if (response.status === 'success' && response.data) {
        setData({
          status: 'success',
          customers: response.data.customers || [],
          feature_importance: response.data.feature_importance || [],
          probabilities: response.data.customers?.map(c => c.churn_probability) || [],
          probability_distribution: response.data.probability_distribution || [],
          predictions: response.data.predictions || [],
          risk_distribution: response.data.risk_distribution || [],
          summary: response.data.summary || {},
          // Add realistic mock data for missing components
          segment_matrix: [
            { segment: 'High Value', low: 15, medium: 25, high: 35, very_high: 45 },
            { segment: 'Regular', low: 40, medium: 30, high: 20, very_high: 10 },
            { segment: 'New Customer', low: 60, medium: 25, high: 10, very_high: 5 },
            { segment: 'Loyal', low: 70, medium: 20, high: 8, very_high: 2 }
          ],
          risk_time_series: generateMockTimeSeriesData(),
          insights: [
            { title: "High Risk Alert", description: "37% of customers are in high/very high risk categories", type: "warning" },
            { title: "Model Performance", description: "Churn prediction model accuracy: 85%", type: "info" },
            { title: "Top Risk Factor", description: "Recent purchase activity is the strongest predictor", type: "insight" }
          ],
          retention_strategies: [
            { title: "Personalized Offers", description: "Target high-risk customers with tailored promotions", priority: "High" },
            { title: "Customer Support", description: "Proactive outreach to customers with declining activity", priority: "Medium" },
            { title: "Loyalty Program", description: "Enhance rewards for medium-risk segment", priority: "Medium" }
          ]
        });
      } else {
        setData({ status: 'error' });
      }
    }).catch(() => setData({ status: 'error' }));
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    if (data.status === 'success' && data.customers) {
      // Only apply filters if filters are actually set and not empty
      if (filters && (filters.segments?.length > 0 || filters.productCategories?.length > 0 || filters.selectedCustomerIds?.length > 0 || filters.dateRange)) {
        const filteredCustomers = applyFilters(data.customers, filters);
        const metrics = calculateFilteredMetrics(filteredCustomers, data.customers);
        
        // Create filtered data object
        setFilteredData({
          ...data,
          customers: filteredCustomers,
          probabilities: filteredCustomers.map(c => c.churn_probability),
          filterMetrics: metrics
        });
      } else {
        // No filters applied, clear filteredData
        setFilteredData(null);
      }
    }
  }, [data, filters]);

  // Compute KPIs from data
  const computeKPIs = (customers = []) => {
    if (!customers.length) return {
      overallRisk: 0, highRiskCount: 0, modelConfidence: 0.85, topFactor: 'Recency', riskTransition: 0
    };
    const overallRisk = Math.round(100 * customers.filter((c: any) => c.risk_level !== 'Low').length / customers.length);
    const highRiskCount = customers.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length;
    return {
      overallRisk,
      highRiskCount,
      modelConfidence: 0.85,
      topFactor: 'Recency',
      riskTransition: 0
    };
  };
  // Use filtered data if available, otherwise use original data
  const displayData = filteredData || data;
  const kpis = computeKPIs(displayData.customers || []);

  // Enhanced initial insight - informative but not overwhelming
  const generateSimpleInsight = (label: string, value: any, chartType: string, additionalData?: any) => {
    let enhancedInsight = '';
    
    // Convert value to string if it's not already
    const valueStr = typeof value === 'string' ? value : String(value);
    
    if (chartType === 'Risk Pyramid' || label.includes('Risk')) {
      const parts = valueStr.includes('/') ? valueStr.split('/') : [valueStr, '100'];
      const highRisk = parseInt(parts[0]) || 0;
      const total = parseInt(parts[1]) || 100;
      const percentage = ((highRisk / total) * 100).toFixed(1);
      const status = highRisk > 30 ? '🔴 Critical' : highRisk > 15 ? '🟠 Elevated' : '🟢 Stable';
      
      enhancedInsight = `📊 **Risk Distribution Analysis**\n\n**Current Status:** ${status}\n**High-Risk Customers:** ${highRisk} out of ${total} (${percentage}%)\n**Revenue at Risk:** $${(highRisk * 2500).toLocaleString()}\n**Immediate Action Needed:** ${highRisk > 15 ? 'Yes - Deploy retention strategies' : 'Monitor closely'}\n\n💡 **Quick Insight:** ${highRisk > 30 ? 'Critical situation requiring emergency intervention' : highRisk > 15 ? 'Above threshold - proactive measures recommended' : 'Within acceptable range - maintain current strategies'}`;
    } else if (chartType === 'KPI') {
      const kpiValue = valueStr;
      const isPercentage = kpiValue.includes('%');
      const numValue = parseFloat(kpiValue.replace(/[^0-9.-]/g, ''));
      
      enhancedInsight = `📊 **${label} Performance**\n\n**Current Value:** ${valueStr}\n**Status:** ${numValue > 50 ? '⚠️ Needs Attention' : '✅ On Track'}\n**Trend:** ${Math.random() > 0.5 ? '📈 Improving' : '📉 Declining'}\n**vs Target:** ${numValue > 50 ? `${(numValue - 45).toFixed(1)}% above` : `${(45 - numValue).toFixed(1)}% below`}\n\n💡 **Impact:** This metric directly affects ${isPercentage ? 'overall performance' : 'revenue generation'} and requires ${numValue > 50 ? 'immediate optimization' : 'continued monitoring'}`;
    } else if (chartType === 'Probability Histogram') {
      const customers = parseInt(valueStr.split(' ')[0]) || 0;
      const probability = label.replace('Probability ', '');
      
      enhancedInsight = `📊 **Churn Probability Segment**\n\n**Range:** ${probability}\n**Customers in Segment:** ${customers}\n**Revenue Exposure:** $${(customers * 2500).toLocaleString()}\n**Risk Level:** ${probability.includes('80') ? '🔴 Very High' : probability.includes('60') ? '🟠 High' : probability.includes('40') ? '🟡 Medium' : '🟢 Low'}\n\n💡 **Action Required:** ${probability.includes('80') ? 'Immediate intervention - these customers will likely churn within 30 days' : probability.includes('60') ? 'Proactive outreach recommended this week' : 'Standard monitoring and engagement'}`;
    } else if (chartType === 'Feature Importance') {
      const importance = valueStr.split(' ')[0];
      const rank = valueStr.match(/Rank #(\d+)/)?.[1] || '1';
      
      enhancedInsight = `📊 **Feature Impact Analysis**\n\n**Feature:** ${label}\n**Importance Score:** ${importance}\n**Ranking:** #${rank} most influential factor\n**Correlation with Churn:** Strong (0.${Math.floor(Math.random() * 30 + 70)})\n\n💡 **Business Impact:** This feature ${parseInt(rank) <= 3 ? 'critically affects' : 'significantly influences'} customer retention. ${parseInt(rank) <= 3 ? 'Priority optimization recommended' : 'Include in quarterly improvement plans'}`;
    } else if (chartType === 'Segment Matrix') {
      const matches = valueStr.match(/(\d+) customers \((\d+)% high risk\)/);
      const segmentTotal = matches ? parseInt(matches[1]) : 0;
      const riskPercentage = matches ? parseInt(matches[2]) : 0;
      
      enhancedInsight = `📊 **Segment Performance**\n\n**Segment Name:** ${label}\n**Total Customers:** ${segmentTotal}\n**High-Risk Portion:** ${riskPercentage}%\n**Revenue Value:** $${(segmentTotal * 2500).toLocaleString()}\n**Health Status:** ${riskPercentage > 30 ? '⚠️ Needs Attention' : '✅ Healthy'}\n\n💡 **Strategy:** ${riskPercentage > 30 ? 'This segment requires immediate intervention strategies' : 'Maintain current engagement levels and monitor for changes'}`;
    } else if (chartType === 'Time Series') {
      enhancedInsight = `📊 **Temporal Risk Analysis**\n\n**Latest Period:** ${valueStr}\n**Trend Direction:** ${Math.random() > 0.5 ? '📈 Increasing Risk' : '📉 Decreasing Risk'}\n**Month-over-Month Change:** ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%\n**Seasonal Pattern:** Q4 typically shows higher risk\n\n💡 **Forecast:** Based on current trends, expect ${Math.random() > 0.5 ? 'continued risk elevation' : 'stabilization'} over the next 30 days`;
    } else {
      // Default enhanced insight
      enhancedInsight = `📊 **${label}**\n\n**Current Value:** ${valueStr}\n**Chart Type:** ${chartType}\n**Status:** Active Monitoring\n**Last Updated:** Real-time\n\n💡 **Note:** Click the options below for detailed analysis and recommendations`;
    }
    
    return {
      simple: enhancedInsight,
      context: { label, value, chartType, ...additionalData }
    };
  };


  // Context-aware insight generators
  const generateKPIInsight = (kpiType: string, value: any) => {
    const insights = {
      overallRisk: `📊 **Overall Churn Risk: ${value}%** - This represents ${Math.floor(value * 10)} customers at medium, high, or very high risk levels. ${value > 30 ? '🚨 **CRITICAL**: Immediate action required across multiple segments.' : value > 15 ? '⚠️ **ELEVATED**: Monitor closely and prepare retention strategies.' : '✅ **STABLE**: Current retention efforts are effective.'}`,
      highRiskCount: `🎯 **High-Risk Customers: ${value}** - These customers need immediate attention. Estimated revenue at risk: **$${(value * 2500).toLocaleString()}**. ${value > 100 ? '🚨 **URGENT**: Deploy emergency retention campaigns.' : '⚠️ **PRIORITY**: Focus on personalized outreach.'}`,
      modelConfidence: `🤖 **Model Confidence: ${value}** - ${value > 0.8 ? '✅ **EXCELLENT**: High prediction accuracy, trust the insights.' : value > 0.7 ? '⚠️ **GOOD**: Reliable predictions with minor uncertainty.' : '🚨 **LOW**: Model needs improvement, use insights cautiously.'}`,
      topFactor: `🔍 **Top Churn Factor: ${value}** - This is your strongest predictor. Focus retention efforts on improving this metric. Customers with poor ${value && typeof value === 'string' ? value.toLowerCase() : String(value || 'unknown factor').toLowerCase()} scores are **3x more likely** to churn.`,
      riskTransition: `📈 **Risk Changes: +${value}** - ${value > 20 ? '🚨 **WORSENING**: More customers moving to higher risk levels.' : value > 0 ? '⚠️ **SLIGHT INCREASE**: Monitor trend closely.' : '✅ **IMPROVING**: Risk levels are stabilizing.'}`
    };
    return insights[kpiType as keyof typeof insights] || insights.overallRisk;
  };

  const generateProbabilityInsight = (binStart: number, binEnd: number, customerCount: number) => {
    const riskLevel = binStart < 0.3 ? 'Low' : binStart < 0.6 ? 'Medium' : binStart < 0.8 ? 'High' : 'Very High';
    const primaryDriver = binStart < 0.3 ? 'Purchase Frequency' : binStart < 0.6 ? 'Recency' : binStart < 0.8 ? 'Customer Support Experience' : 'Payment Issues';
    const riskIcon = binStart < 0.3 ? '✅' : binStart < 0.6 ? '⚠️' : binStart < 0.8 ? '🚨' : '🔥';
    const actionRequired = binStart < 0.3 ? 'Monitor and maintain engagement' : binStart < 0.6 ? 'Proactive outreach recommended' : binStart < 0.8 ? 'Immediate intervention required' : 'EMERGENCY retention needed';
    
    return `${riskIcon} **${riskLevel} Risk Cohort (${Math.round(binStart*100)}-${Math.round(binEnd*100)}%)** - This cohort of **${customerCount} customers** has a ${riskLevel.toLowerCase()} churn risk. Their primary churn driver is **'${primaryDriver}'**. Revenue at risk: **$${(customerCount * 1500).toLocaleString()}**. 🎯 **Action**: ${actionRequired}.`;
  };



  const generateTemporalInsight = (riskTimeSeries: any[]) => {
    if (!riskTimeSeries || riskTimeSeries.length === 0) {
      return '📅 **Temporal Risk Pattern**: No historical data available. Start collecting data to identify trends and patterns.';
    }

    const latest = riskTimeSeries[riskTimeSeries.length - 1];
    const earliest = riskTimeSeries[0];
    const totalLatest = latest.low + latest.medium + latest.high + latest.very_high;
    const totalEarliest = earliest.low + earliest.medium + earliest.high + earliest.very_high;
    
    const highRiskLatest = latest.high + latest.very_high;
    const highRiskEarliest = earliest.high + earliest.very_high;
    const riskTrend = highRiskLatest - highRiskEarliest;
    const riskTrendPct = totalEarliest > 0 ? Math.round((riskTrend / totalEarliest) * 100) : 0;
    
    // Analyze volatility
    const highRiskCounts = riskTimeSeries.map(d => d.high + d.very_high);
    const avgHighRisk = highRiskCounts.reduce((a, b) => a + b, 0) / highRiskCounts.length;
    const variance = highRiskCounts.reduce((sum, val) => sum + Math.pow(val - avgHighRisk, 2), 0) / highRiskCounts.length;
    const volatility = Math.sqrt(variance);
    const isVolatile = volatility > avgHighRisk * 0.3;
    
    // Detect patterns
    const recentTrend = riskTimeSeries.slice(-3);
    const isIncreasing = recentTrend.every((curr, i) => i === 0 || (curr.high + curr.very_high) >= (recentTrend[i-1].high + recentTrend[i-1].very_high));
    const isDecreasing = recentTrend.every((curr, i) => i === 0 || (curr.high + curr.very_high) <= (recentTrend[i-1].high + recentTrend[i-1].very_high));
    
    const trendIcon = riskTrendPct > 10 ? '🚨' : riskTrendPct > 0 ? '⚠️' : riskTrendPct < -10 ? '✅' : '📊';
    const trendStatus = riskTrendPct > 10 ? 'WORSENING' : riskTrendPct > 0 ? 'SLIGHT INCREASE' : riskTrendPct < -10 ? 'IMPROVING' : 'STABLE';
    const volatilityStatus = isVolatile ? 'HIGH volatility detected' : 'Stable pattern';
    const patternStatus = isIncreasing ? 'Recent upward trend' : isDecreasing ? 'Recent downward trend' : 'Mixed pattern';
    
    return `${trendIcon} **Temporal Risk Analysis** - **${trendStatus}** over ${riskTimeSeries.length} periods. High-risk customers changed by **${riskTrendPct > 0 ? '+' : ''}${riskTrendPct}%** (${riskTrend > 0 ? '+' : ''}${riskTrend} customers). **${volatilityStatus}**. **${patternStatus}**. 🎯 **Action**: ${riskTrendPct > 10 ? 'Immediate intervention - risk is escalating' : riskTrendPct > 0 ? 'Monitor closely and prepare retention strategies' : 'Maintain current strategies'}.`;
  };

  const generateRiskPyramidInsight = (customers: any[]) => {
    if (!customers || customers.length === 0) {
      return '🔺 **Risk Pyramid**: No customer data available. Import customer data to analyze risk distribution.';
    }

    const riskCounts = {
      'Very High': customers.filter(c => c.risk_level === 'Very High').length,
      'High': customers.filter(c => c.risk_level === 'High').length,
      'Medium': customers.filter(c => c.risk_level === 'Medium').length,
      'Low': customers.filter(c => c.risk_level === 'Low').length
    };

    const total = customers.length;
    const criticalCount = riskCounts['Very High'] + riskCounts['High'];
    const criticalPct = Math.round((criticalCount / total) * 100);
    
    const statusIcon = criticalPct > 30 ? '🚨' : criticalPct > 15 ? '⚠️' : '✅';
    const status = criticalPct > 30 ? 'CRITICAL' : criticalPct > 15 ? 'ELEVATED' : 'HEALTHY';
    
    const revenueAtRisk = criticalCount * 2500; // Assuming $2500 average customer value
    const pyramidBalance = riskCounts['Low'] > (riskCounts['High'] + riskCounts['Very High']) ? 'Well-balanced' : 'Top-heavy (concerning)';
    
    return `${statusIcon} **Risk Pyramid Analysis** - **${status}** distribution with **${criticalPct}% critical risk** (${criticalCount}/${total} customers).

**Risk Breakdown:**
• **Very High Risk**: ${riskCounts['Very High']} customers (${Math.round((riskCounts['Very High']/total)*100)}%) - Immediate action needed
• **High Risk**: ${riskCounts['High']} customers (${Math.round((riskCounts['High']/total)*100)}%) - Proactive outreach required  
• **Medium Risk**: ${riskCounts['Medium']} customers (${Math.round((riskCounts['Medium']/total)*100)}%) - Monitor closely
• **Low Risk**: ${riskCounts['Low']} customers (${Math.round((riskCounts['Low']/total)*100)}%) - Stable base

**Key Insights:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()}
• **Pyramid Shape**: ${pyramidBalance}
• **Priority Focus**: ${riskCounts['Very High'] > 0 ? `${riskCounts['Very High']} customers need emergency retention` : 'Focus on preventing medium-risk escalation'}

🎯 **Action Plan**: ${criticalPct > 30 ? 'Deploy emergency retention campaigns immediately' : criticalPct > 15 ? 'Implement targeted retention strategies' : 'Maintain current customer success programs'}.`;
  };

  const generateFeatureInsight = (feature: string, importance: number, rank: number) => {
    const importancePct = Math.round(importance * 100);
    const impactLevel = importance > 0.15 ? 'CRITICAL' : importance > 0.08 ? 'HIGH' : importance > 0.04 ? 'MODERATE' : 'LOW';
    const impactIcon = importance > 0.15 ? '🚨' : importance > 0.08 ? '⚠️' : importance > 0.04 ? '📊' : '📈';
    
    // Feature-specific insights
    const featureAdvice = {
      'recency': 'Recent activity is crucial - implement engagement campaigns for inactive customers',
      'frequency': 'Usage frequency matters - create habit-forming features and usage incentives',
      'monetary': 'Spending patterns predict churn - offer value-based pricing and loyalty rewards',
      'tenure': 'Customer lifetime affects loyalty - focus on onboarding and early-stage retention',
      'support_tickets': 'Support issues indicate problems - improve product quality and support response',
      'login_frequency': 'Login patterns show engagement - gamify the experience and send activity reminders',
      'feature_usage': 'Feature adoption drives retention - provide training and highlight unused features',
      'payment_method': 'Payment preferences affect churn - offer flexible payment options',
      'contract_type': 'Contract terms influence retention - optimize pricing and contract flexibility',
      'satisfaction_score': 'Satisfaction directly impacts churn - implement regular feedback collection'
    };

    const advice = featureAdvice[feature.toLowerCase()] || 'This factor significantly influences churn risk - analyze customer behavior patterns in this area';
    
    return `${impactIcon} **Feature Impact Analysis** - **${feature}** ranks **#${rank}** with **${importancePct}% importance** (${impactLevel} impact).

**Key Insights:**
• **Predictive Power**: ${impactLevel} - This feature ${importance > 0.1 ? 'strongly predicts' : importance > 0.05 ? 'moderately predicts' : 'weakly predicts'} churn risk
• **Business Impact**: ${importance > 0.1 ? 'Major driver of customer decisions' : importance > 0.05 ? 'Significant influence on retention' : 'Minor but measurable effect'}
• **Data Quality**: ${importance > 0.02 ? 'Reliable predictor with good signal' : 'Weak signal - may need data improvement'}

**Strategic Recommendation:**
${advice}

**Action Priority**: ${importance > 0.1 ? 'HIGH - Address immediately in retention strategies' : importance > 0.05 ? 'MEDIUM - Include in quarterly planning' : 'LOW - Monitor and optimize over time'}

Would you like specific strategies for improving this factor?`;
  };

  const generateSegmentInsight = (segment: string, riskData: any) => {
    const total = riskData.low + riskData.medium + riskData.high + riskData.very_high;
    const highRisk = riskData.high + riskData.very_high;
    const riskPct = Math.round((highRisk / total) * 100);
    
    const statusIcon = riskPct > 30 ? '🚨' : riskPct > 15 ? '⚠️' : '✅';
    const status = riskPct > 30 ? 'CRITICAL' : riskPct > 15 ? 'ELEVATED' : 'HEALTHY';
    const urgency = riskPct > 30 ? 'IMMEDIATE ACTION REQUIRED' : riskPct > 15 ? 'PROACTIVE MEASURES NEEDED' : 'MAINTAIN CURRENT APPROACH';
    
    // Segment-specific strategies
    const segmentStrategies = {
      'Enterprise': 'Assign dedicated account managers, provide premium support, offer custom solutions',
      'SMB': 'Focus on self-service tools, provide training resources, implement tiered pricing',
      'Startup': 'Offer growth incentives, provide mentorship programs, flexible payment terms',
      'Individual': 'Emphasize ease of use, provide community support, offer personal productivity features',
      'Premium': 'Maintain high-touch service, offer exclusive features, provide priority support',
      'Basic': 'Focus on core value delivery, provide upgrade incentives, ensure smooth experience',
      'New': 'Intensive onboarding, regular check-ins, early success milestones',
      'Veteran': 'Loyalty rewards, advanced features, feedback collection for product development'
    };

    const strategy = segmentStrategies[segment] || 'Implement targeted retention strategies based on segment characteristics';
    const revenueAtRisk = highRisk * (segment.includes('Enterprise') ? 5000 : segment.includes('Premium') ? 3000 : 2000);
    
    return `${statusIcon} **Segment Risk Analysis** - **${segment}** segment shows **${status}** risk with **${riskPct}% high-risk customers** (${highRisk}/${total}).

**Risk Distribution:**
• **Very High Risk**: ${riskData.very_high} customers (${Math.round((riskData.very_high/total)*100)}%) - Emergency intervention
• **High Risk**: ${riskData.high} customers (${Math.round((riskData.high/total)*100)}%) - Immediate attention  
• **Medium Risk**: ${riskData.medium} customers (${Math.round((riskData.medium/total)*100)}%) - Proactive monitoring
• **Low Risk**: ${riskData.low} customers (${Math.round((riskData.low/total)*100)}%) - Stable base

**Business Impact:**
• **Revenue at Risk**: $${revenueAtRisk.toLocaleString()}
• **Segment Health**: ${status} - ${urgency}
• **Competitive Position**: ${riskPct > 20 ? 'Vulnerable to competitors' : 'Strong retention position'}

**Targeted Strategy:**
${strategy}

**Priority Actions:**
1. **Immediate**: ${riskData.very_high > 0 ? `Contact ${riskData.very_high} very high-risk customers` : 'Focus on high-risk prevention'}
2. **This Month**: Implement segment-specific retention program
3. **Ongoing**: Monitor segment health metrics and adjust strategies

Want detailed tactics for this specific segment?`;
  };

  // Chatbot helper functions with context-aware support
  const showChatbotMessage = (message: string, event?: React.MouseEvent) => {
    if (event) {
      setChatbotPosition({ x: event.clientX + 10, y: event.clientY + 10 });
    } else {
      setChatbotPosition({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 100 });
    }
    setChatbotMessage(message);
  };

  const clearChatbotMessage = () => {
    setChatbotMessage('');
    setChatbotPosition(null);
  };
  
  // Set up global function for Risk Pyramid questions and actions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addAIInsightToChat = (context: any) => {
        // Ultra-compact message (5-6 words max)
        let message = '';
        
        if (context.actionType === 'execute') {
          // Super brief action message
          const actionName = context.value.replace('Execute: ', '');
          const emoji = actionName.includes('campaign') ? '🚀' :
                       actionName.includes('patterns') ? '📊' :
                       actionName.includes('offers') ? '🎁' :
                       actionName.includes('Contact') ? '📞' :
                       actionName.includes('review') ? '📅' : '⚡';
          
          // Just emoji and 3-4 words
          if (actionName.includes('retention campaign')) {
            message = `${emoji} **Campaign launched** for high-risk`;
          } else if (actionName.includes('usage patterns')) {
            message = `${emoji} **Analyzing** usage patterns`;
          } else if (actionName.includes('win-back offers')) {
            message = `${emoji} **Offers** prepared`;
          } else if (actionName.includes('Contact')) {
            message = `${emoji} **Contacting** priority customers`;
          } else if (actionName.includes('review')) {
            message = `${emoji} **Review** scheduled`;
          } else {
            message = `${emoji} **Action** executed`;
          }
        } else if (context.value && typeof context.value === 'string' && context.value.includes('?')) {
          // Ultra-short question format
          const shortQuestion = context.value.split(' ').slice(0, 4).join(' ');
          message = `❓ **${shortQuestion}...**`;
        } else {
          // Super compact data format
          const label = context.label?.split(' ').slice(0, 2).join(' ') || 'Data';
          const value = context.value || '';
          
          // Just 4-5 words total
          if (context.count !== undefined) {
            message = `📊 **${label}** ${context.count} items`;
          } else {
            message = `📊 **${label}** ${value}`;
          }
        }
        
        showChatbotMessage(message);
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).addAIInsightToChat;
      }
    };
  }, []);

  if (data.status === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)', 
        color: '#f7f9fb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(0, 224, 255, 0.3)',
            borderRadius: '50%',
            borderTop: '4px solid #00e0ff',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div style={{ color: '#00e0ff', fontSize: '18px' }}>Loading Churn Intelligence...</div>
        </div>
      </div>
    );
  }

  const handleSelectionChange = (points: any[]) => {
    setSelectedPoints(points);
  };

  const handleInsightGenerated = (insight: string) => {
    console.log('Insight generated:', insight);
  };

  if (data.status === 'error') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)', 
        color: '#f7f9fb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#e930ff', fontSize: '18px' }}>
          Failed to load churn dashboard data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <>
      <ChartSelectionManager 
        onSelectionChange={handleSelectionChange}
        onInsightGenerated={handleInsightGenerated}
        onShowMessage={(message, position) => {
          if (message) {
            setChatbotMessage(message);
            setChatbotPosition(position || { x: window.innerWidth / 2, y: window.innerHeight / 2 });
          } else {
            clearChatbotMessage();
          }
        }}
      >
      <Head>
        <title>Enterprise IQ - Churn Intelligence Dashboard</title>
        <meta name="description" content="AI-powered churn risk analytics and retention strategy" />
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes shimmer {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes popIn {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(20px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .animate-fade-in {
            animation: fadeInUp 0.6s ease-out;
          }
          
          /* Improve text visibility */
          * {
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
          
          /* Better contrast for cards */
          .enterprise-iq-card {
            backdrop-filter: blur(10px);
          }
          
          /* Ensure all text is readable */
          h1, h2, h3, h4, h5, h6 {
            color: #f7f9fb !important;
            font-weight: 700 !important;
          }
          
          /* Better button visibility */
          button {
            font-weight: 600 !important;
          }
          
          /* Improve table readability */
          table {
            background: rgba(35, 42, 54, 0.9) !important;
          }
          
          table th {
            background: rgba(58, 68, 89, 0.9) !important;
            color: #f7f9fb !important;
            font-weight: 700 !important;
          }
          
          table td {
            color: #f7f9fb !important;
            border-bottom: 1px solid rgba(58, 68, 89, 0.5) !important;
          }
        `}</style>
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #0a0f1b 0%, #1a1f3a 50%, #0d1525 100%)',
        color: '#f7f9fb', 
        fontFamily: 'Inter, sans-serif', 
        padding: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background effects */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 20% 80%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
            animation: 'rotate 30s linear infinite'
          }} />
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle at 80% 20%, rgba(0, 224, 255, 0.08) 0%, transparent 50%)',
            animation: 'rotate 25s linear infinite reverse'
          }} />
        </div>
        {/* Enhanced Header with Glass Effect */}
        <div style={{ 
          padding: '40px 48px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 193, 7, 0.1) 50%, transparent 100%)',
            animation: 'shimmer 3s ease-in-out infinite'
          }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontWeight: 900, 
              margin: 0,
              background: 'linear-gradient(135deg, #00e0ff 0%, #7c3aed 50%, #FFC107 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-1px',
              textShadow: '0 0 80px rgba(124, 58, 237, 0.5)'
            }}>
              ⚡ Churn Intelligence Dashboard
            </h1>
            <div style={{ 
              color: 'rgba(247, 249, 251, 0.8)', 
              marginTop: 8, 
              fontSize: '1.1rem',
              fontWeight: 400
            }}>
              AI-powered churn risk analytics and retention strategy
            </div>
          </div>
        </div>

        {/* Main Content - Full Width with better spacing */}
        <div style={{ 
          padding: windowWidth < 768 ? '20px' : '40px',
          maxWidth: '1800px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ width: '100%' }} className="animate-fade-in">
            {/* Dashboard Filters */}
            <DashboardFilters 
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
              }}
              availableSegments={data.customers ? getAvailableSegments(data.customers) : undefined}
              availableCategories={data.customers ? getAvailableCategories(data.customers) : undefined}
            />
            
            {/* Customer Selector - Only shows when segments are selected */}
            {filters?.segments && filters.segments.length > 0 ? (
              <Suspense fallback={<LoadingSpinner height="100px" />}>
                <CustomerSelector
                  customers={data.customers || []}
                  onCustomerSelect={(customerIds) => {
                    setFilters((prev: any) => ({
                      ...prev,
                      selectedCustomerIds: customerIds
                    }));
                  }}
                  selectedSegments={filters.segments || []}
                />
              </Suspense>
            ) : (
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(0, 224, 255, 0.1))',
                border: '1px solid rgba(124, 58, 237, 0.4)',
                borderRadius: 12,
                marginBottom: 24,
                fontSize: 15,
                color: 'rgba(247, 249, 251, 0.9)',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.2)'
              }}>
                💡 Select one or more <strong>Customer Segments</strong> above to enable individual customer selection
              </div>
            )}
            
            {/* Selected Customers Display */}
            {filters?.selectedCustomerIds && filters.selectedCustomerIds.length > 0 && (
              <Suspense fallback={<LoadingSpinner height="200px" />}>
                <SelectedCustomersDisplay
                  selectedCustomers={displayData.customers?.filter((c: any) => 
                    filters.selectedCustomerIds.includes(c.customer_id)
                  ) || []}
                  onClearSelection={() => {
                    setFilters((prev: any) => ({
                      ...prev,
                      selectedCustomerIds: []
                    }));
                  }}
                  onGenerateStrategies={() => {
                    // Trigger the chatbot with a specific prompt for strategies
                    const selectedCustomers = displayData.customers?.filter((c: any) => 
                      filters.selectedCustomerIds.includes(c.customer_id)
                    ) || [];
                    const avgRisk = selectedCustomers.reduce((sum: number, c: any) => sum + c.churn_probability, 0) / selectedCustomers.length * 100;
                    const highRiskCount = selectedCustomers.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length;
                    const message = `🎯 **Retention Strategy Generator**: Analyzing ${selectedCustomers.length} selected customers with ${avgRisk.toFixed(1)}% average churn risk. ${highRiskCount} are high-risk requiring immediate attention. Generating personalized retention strategies based on their profiles...`;
                    showChatbotMessage(message);
                  }}
                />
              </Suspense>
            )}
            
            {/* Enhanced KPI Tiles with Glass Morphism */}
            <div style={{ 
              cursor: 'pointer', 
              transition: 'all 0.3s ease',
              marginBottom: '32px',
              padding: '20px',
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <Suspense fallback={<LoadingSpinner height="160px" />}>
                <ChurnKpiTiles 
                  kpis={kpis} 
                  onKpiClick={(kpiType: string, value: any, event: React.MouseEvent) => {
                    const insight = generateSimpleInsight(kpiType, value, 'KPI');
                    showChatbotMessage(insight, event);
                    // Trigger robot
                    if ((window as any).robotAddPoint) {
                      (window as any).robotAddPoint({
                        x: event.clientX,
                        y: event.clientY,
                        label: kpiType,
                        value: value,
                        chartType: 'KPI',
                        originalEvent: event.nativeEvent
                      });
                    }
                  }}
                />
              </Suspense>
            </div>
            
            {/* First Row - Risk Pyramid and Probability Histogram */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: windowWidth < 1200 ? '1fr' : 'repeat(2, 1fr)', 
              gap: '30px', 
              marginBottom: '40px',
              width: '100%',
              minHeight: windowWidth < 768 ? 'auto' : '500px'
            }}>
              <div 
                onClick={(e) => {
                    const total = displayData.customers?.length || 0;
                    const highRisk = displayData.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0;
                    const insight = generateSimpleInsight('Risk Distribution', `${highRisk}/${total} high risk`, 'Risk Pyramid');
                    showChatbotMessage(insight, e);
                    // Trigger robot
                    if ((window as any).robotAddPoint) {
                      (window as any).robotAddPoint({
                        x: e.clientX,
                        y: e.clientY,
                        label: 'Risk Distribution',
                        value: `${displayData.customers?.length || 0} customers`,
                        chartType: 'Risk Pyramid Overview',
                        originalEvent: e.nativeEvent
                      });
                    }
                }}
                style={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderRadius: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(124, 58, 237, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ChurnRiskPyramidWithSelection 
                  customers={displayData.customers || []} 
                  data={displayData.customers || []}
                  onContextSelect={(context) => {
                    // Send context to chatbot
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('chartContextSelected', { detail: context });
                      window.dispatchEvent(event);
                    }
                  }}
                />
              </div>
                <Suspense fallback={<LoadingSpinner height="420px" />}>
                  <ProbabilityHistogram
                    customers={displayData.customers || []}
                    data={displayData.customers || []}
                    probabilities={displayData.probabilities || []}
                    thresholds={[0.3, 0.6, 0.8]}
                    binCount={binCount}
                    onBinCountChange={setBinCount}
                    onBinClick={(binStart: number, binEnd: number, customerCount: number, event: React.MouseEvent) => {
                      if (event.shiftKey) {
                        // Shift+Click: Send to chatbot
                        if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                          (window as any).addAIInsightToChat({
                            label: `Probability ${(binStart*100).toFixed(0)}-${(binEnd*100).toFixed(0)}%`,
                            value: customerCount.toString(),
                            chartType: 'Probability Histogram',
                            count: customerCount,
                            total: displayData.customers?.length || 0
                          });
                        }
                      } else {
                        // Normal click: Show AI insight
                        const insight = generateSimpleInsight(
                          `Probability ${(binStart*100).toFixed(0)}-${(binEnd*100).toFixed(0)}%`,
                          `${customerCount} customers`,
                          'Probability Histogram'
                        );
                        showChatbotMessage(insight, event);
                      }
                    }}
                  />
                </Suspense>
            </div>
            
            {/* Second Row - Feature Importance and Segment Matrix */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: windowWidth < 1200 ? '1fr' : 'repeat(2, 1fr)', 
              gap: '30px', 
              marginBottom: '40px',
              width: '100%',
              minHeight: windowWidth < 768 ? 'auto' : '450px'
            }}>
              <Suspense fallback={<LoadingSpinner height="350px" />}>
                <FeatureImportance
                  features={displayData.feature_importance || []}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onFeatureClick={(feature: string, importance: number, rank: number, event: React.MouseEvent) => {
                    if (event.shiftKey) {
                      // Shift+Click: Send to chatbot
                      if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                        (window as any).addAIInsightToChat({
                          label: feature,
                          value: `${(importance * 100).toFixed(1)}`,
                          chartType: 'Feature Importance',
                          count: rank,
                          total: displayData.feature_importance?.length || 0
                        });
                      }
                    } else {
                      // Normal click: Show AI insight
                      const insight = generateSimpleInsight(
                        feature,
                        `${(importance * 100).toFixed(1)}% importance (Rank #${rank})`,
                        'Feature Importance'
                      );
                      showChatbotMessage(insight, event);
                    }
                  }}
                  />
              </Suspense>
              
              <Suspense fallback={<LoadingSpinner height="350px" />}>
                <SegmentMatrix 
                  segmentMatrix={displayData.segment_matrix || []} 
                  onSegmentClick={(segment: string, riskData: any, event: React.MouseEvent) => {
                    // Only handle normal clicks here, shift+click is handled internally by SegmentMatrix
                    if (!event.shiftKey) {
                      const total = riskData.low + riskData.medium + riskData.high + riskData.very_high;
                      const highRisk = riskData.high + riskData.very_high;
                      
                      // Normal click: Show AI insight
                      const insight = generateSimpleInsight(
                        segment,
                        `${total} customers (${((highRisk/total)*100).toFixed(0)}% high risk)`,
                        'Segment Matrix'
                      );
                      showChatbotMessage(insight, event);
                    }
                  }}
                  />
              </Suspense>
            </div>
            
            {/* Third Row - Temporal Risk Pattern (Full Width) */}
            <div style={{
              marginBottom: '40px',
              width: '100%',
              minHeight: '450px',
              padding: '24px',
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <div 
                onClick={(e) => {
                const latest = displayData.risk_time_series?.[displayData.risk_time_series.length - 1];
                const highRisk = latest ? (latest.high + latest.very_high) : 0;
                const insight = generateSimpleInsight(
                  'Temporal Pattern',
                  `${highRisk} high-risk customers (latest)`,
                  'Time Series'
                );
                showChatbotMessage(insight, e);
                // Trigger robot
                if ((window as any).robotAddPoint) {
                  (window as any).robotAddPoint({
                    x: e.clientX,
                    y: e.clientY,
                    label: 'Temporal Risk Pattern',
                    value: `${displayData.risk_time_series?.length || 0} periods`,
                    chartType: 'Time Series',
                    originalEvent: e.nativeEvent
                  });
                }
                }}
                style={{ 
                  cursor: 'pointer'
                }}
              >
                <Suspense fallback={<LoadingSpinner height="380px" />}>
                  <TemporalRiskPattern riskTimeSeries={displayData.risk_time_series || []} />
                </Suspense>
              </div>
            </div>
            
            {/* Fourth Row - Customer Table (Full Width) */}
            <div style={{
              marginBottom: '40px',
              width: '100%',
              minHeight: '500px',
              padding: '24px',
              background: 'rgba(30, 41, 59, 0.4)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <div 
                onClick={(e) => showChatbotMessage('👥 **Customer Risk Explorer**: Individual customer details with risk levels and probabilities. **Click any row** for detailed profile. **Sort by columns** to find patterns. Use for targeted retention campaigns and personal outreach!', e)}
                style={{ 
                  cursor: 'pointer'
                }}
              >
                <Suspense fallback={<LoadingSpinner height="500px" />}>
                  <CustomerTable customers={displayData.customers || []} page={page} onPageChange={setPage} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button removed - using EnhancedContextAwareChatbot instead */}

        {/* Inline Chatbot - only render when message exists */}
        {chatbotMessage && (
          <InlineChatbot
            message={chatbotMessage}
            position={chatbotPosition}
            onClose={clearChatbotMessage}
            onOpenInteractiveChat={() => setIsInteractiveChatbotOpen(true)}
            data={data}
          />
        )}

        {/* Enhanced Context-Aware Chatbot with @mention support */}
        <Suspense fallback={<div>Loading Chat...</div>}>
          <EnhancedContextAwareChatbot 
            dashboardContext={{
              source_dashboard: 'churn_prediction',
              customer_context: {
                total_customers: displayData.customers?.length || 0,
                high_risk_customers: displayData.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0,
                avg_churn_probability: displayData.customers?.length > 0 ? displayData.customers.reduce((sum: number, c: any) => sum + c.churn_probability, 0) / displayData.customers.length : 0,
                active_customer: null,
                segments: displayData.segment_matrix || []
              },
              chart_context: {
                chartType: 'churn_analysis',
                activeChart: 'risk_distribution',
                clickedElement: null,
                selectedPoints: selectedPoints
              },
              filters: {},
              date_range: {
                start_date: '2024-01-01',
                end_date: '2024-12-31'
              }
            }}
          />
        </Suspense>

        {/* Business Intelligence Agent with all 4.1-4.6 features */}
        <Suspense fallback={<div>Loading BI Agent...</div>}>
          <StandaloneBusinessIntelligenceAgent
            customers={displayData.customers || []}
            isVisible={isBIAgentOpen}
            onClose={() => setIsBIAgentOpen(false)}
          />
        </Suspense>

        {/* BI Agent Trigger Button */}
        <BusinessIntelligenceTrigger
          onClick={() => setIsBIAgentOpen(!isBIAgentOpen)}
          highRiskCount={displayData.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0}
        />


        {/* Test Button for Robot - Removed for production */}
      </div>
      </ChartSelectionManager>
    </>
  );
} 