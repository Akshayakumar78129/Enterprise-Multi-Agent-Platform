import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import ChurnKpiTiles from '../../../Customer/tools/churn_prediction/ui/components/kpi/ChurnKpiTiles';
import { Card } from '../../../ui-common/design-system/components/Card';
import { Grid } from '../../../ui-common/design-system/components/Grid';
import ProbabilityHistogram from '../../../Customer/tools/churn_prediction/ui/components/visualizations/ProbabilityHistogram';
import FeatureImportance from '../../../Customer/tools/churn_prediction/ui/components/visualizations/FeatureImportance';
import CustomerTable from '../../../Customer/tools/churn_prediction/ui/components/CustomerTable';
import TemporalRiskPattern from '../../../Customer/tools/churn_prediction/ui/components/visualizations/TemporalRiskPattern';
import SegmentMatrix from '../../../Customer/tools/churn_prediction/ui/components/visualizations/SegmentMatrix';
import InsightsDrawer from '../../../Customer/tools/churn_prediction/ui/components/InsightsDrawer';
import RetentionStrategies from '../../../Customer/tools/churn_prediction/ui/components/RetentionStrategies';
import EnhancedContextAwareChatbot from '../../../Customer/tools/churn_prediction/ui/components/chat/EnhancedContextAwareChatbot';
import StandaloneBusinessIntelligenceAgent, { BusinessIntelligenceTrigger } from '../../../Customer/tools/churn_prediction/ui/components/StandaloneBusinessIntelligenceAgent';

const ChurnRiskPyramid = dynamic(() => import('../../../Customer/tools/churn_prediction/ui/components/visualizations/ChurnRiskPyramid'), { ssr: false });

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
const formatMessage = (text: string) => {
  // Split text by **bold** markers and create React elements
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** markers and make bold
      const boldText = part.slice(2, -2);
      return <strong key={index} style={{ fontWeight: 700, color: '#FFC107' }}>{boldText}</strong>;
    }
    return part;
  });
};

// Enhanced Interactive Inline Chatbot Component
const InlineChatbot = ({ message, position, onClose, onOpenInteractiveChat }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  useEffect(() => {
    if (message) {
      // Show actions after a brief delay
      const actionsTimer = setTimeout(() => setShowActions(true), 1000);
      
      // Auto-hide after 12 seconds (increased for better UX)
      const hideTimer = setTimeout(() => {
        onClose();
      }, 12000);
      
      return () => {
        clearTimeout(actionsTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [message, onClose]);

  if (!message || !position) return null;

  const maxWidth = isExpanded ? 450 : 350;
  const maxHeight = isExpanded ? 300 : 200;

  return (
    <>
      {/* Click position indicator */}
      <div style={{
        position: 'fixed',
        left: position.x - 3,
        top: position.y - 3,
        width: '6px',
        height: '6px',
        background: '#FFC107',
        borderRadius: '50%',
        zIndex: 998,
        animation: 'expandFade 0.8s ease-out',
        pointerEvents: 'none'
      }} />

      {/* Backdrop blur effect */}
      <div style={{
        position: 'fixed',
        left: position.x - 50,
        top: position.y - 50,
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(255, 193, 7, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 999,
        animation: 'pulse 2s infinite',
        pointerEvents: 'none'
      }} />

      {/* Main chatbot */}
      <div 
        style={{
          position: 'fixed',
          left: Math.min(position.x, window.innerWidth - maxWidth - 20),
          top: Math.min(position.y, window.innerHeight - maxHeight - 20),
          width: `${maxWidth}px`,
          maxHeight: `${maxHeight}px`,
          background: isHovered 
            ? 'linear-gradient(135deg, #1e2738 0%, #2a3441 100%)'
            : 'linear-gradient(135deg, #1a1f2e 0%, #232a36 100%)',
          border: `2px solid ${isHovered ? '#FFD54F' : '#FFC107'}`,
          borderRadius: '16px',
          boxShadow: isHovered 
            ? '0 20px 60px rgba(255, 193, 7, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 12px 40px rgba(255, 193, 7, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
          fontFamily: 'Inter, sans-serif',
          animation: 'slideInBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated header */}
        <div style={{
          padding: '14px 18px',
          background: isHovered 
            ? 'linear-gradient(135deg, #FFD54F 0%, #FFA726 100%)'
            : 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
          color: '#0a1224',
          fontWeight: 700,
          borderRadius: '14px 14px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Animated background effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
            animation: isHovered ? 'shimmer 1.5s infinite' : 'none'
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <span style={{ 
              fontSize: '16px',
              animation: 'bounce 2s infinite'
            }}>🤖</span>
            <span>AI Insight</span>
            {isHovered && (
              <span style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                animation: 'fadeIn 0.3s ease-in'
              }}>
                • Click to expand
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', zIndex: 1 }}>
            {/* Expand/Collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'rgba(10, 18, 36, 0.1)',
                border: 'none',
                color: '#0a1224',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                fontWeight: 600
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(10, 18, 36, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(10, 18, 36, 0.1)'}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '⬇' : '⬆'}
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#0a1224',
                fontSize: '18px',
                cursor: 'pointer',
                padding: 0,
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(10, 18, 36, 0.2)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{
          padding: '18px',
          color: '#f7f9fb',
          fontSize: '14px',
          lineHeight: '1.6',
          maxHeight: isExpanded ? '220px' : '140px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#FFC107 transparent'
        }}>
          <div style={{
            background: isHovered 
              ? 'rgba(255, 193, 7, 0.2)'
              : 'rgba(255, 193, 7, 0.15)',
            padding: '16px',
            borderRadius: '12px',
            borderLeft: '4px solid #FFC107',
            position: 'relative',
            transition: 'all 0.3s ease'
          }}>
            {/* Floating particles effect */}
            {isHovered && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '4px',
                  height: '4px',
                  background: '#FFC107',
                  borderRadius: '50%',
                  animation: 'float 3s ease-in-out infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  right: '25px',
                  width: '3px',
                  height: '3px',
                  background: '#FF9800',
                  borderRadius: '50%',
                  animation: 'float 3s ease-in-out infinite 1s'
                }} />
              </>
            )}
            
            {formatMessage(message)}
          </div>
        </div>

        {/* Interactive action buttons */}
        {showActions && (
          <div style={{
            padding: '12px 18px',
            borderTop: '1px solid rgba(255, 193, 7, 0.2)',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            animation: 'slideUp 0.4s ease-out'
          }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(message);
                setShowCopyFeedback(true);
                setTimeout(() => setShowCopyFeedback(false), 2000);
              }}
              style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                color: '#FFC107',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 500
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 193, 7, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {showCopyFeedback ? '✅ Copied!' : '📋 Copy'}
            </button>
            
            <button
              onClick={() => {
                onClose(); // Close the inline chatbot
                onOpenInteractiveChat && onOpenInteractiveChat(); // Open the interactive chatbot
              }}
              style={{
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                color: '#2196F3',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 500
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              💬 Ask More
            </button>
          </div>
        )}
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes slideInBounce {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.8);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
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
        zIndex: 999
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

export default function ChurnDashboardPage() {
  const [data, setData] = useState<any>({ status: 'loading' });
  const [binCount, setBinCount] = useState(30);
  const [sortBy, setSortBy] = useState<'importance' | 'alphabetical'>('importance');
  const [page, setPage] = useState(1);
  const [chatbotMessage, setChatbotMessage] = useState('');
  const [chatbotPosition, setChatbotPosition] = useState<{x: number, y: number} | null>(null);
  const [isInteractiveChatbotOpen, setIsInteractiveChatbotOpen] = useState(false);
  const [isBIAgentOpen, setIsBIAgentOpen] = useState(false);

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
  const kpis = computeKPIs(data.customers || []);

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
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)', 
        color: '#f7f9fb', 
        fontFamily: 'Inter, sans-serif', 
        padding: 0 
      }}>
        {/* Enhanced Header */}
        <div style={{ 
          padding: '32px 40px', 
          borderBottom: '2px solid #232a36', 
          background: 'linear-gradient(135deg, #232a36 0%, #3a4459 100%)',
          position: 'relative',
          overflow: 'hidden'
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
              fontSize: '2.5rem', 
              fontWeight: 800, 
              margin: 0,
              background: 'linear-gradient(135deg, #f7f9fb 0%, #FFC107 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Churn Intelligence Dashboard
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

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32, padding: '32px 40px' }}>
          <div style={{ flex: 3, minWidth: 0 }} className="animate-fade-in">
            {/* Enhanced KPI Tiles with context-aware click handlers */}
            <div style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}>
              <ChurnKpiTiles 
                kpis={kpis} 
                onKpiClick={(kpiType: string, value: any, event: React.MouseEvent) => {
                  const insight = generateKPIInsight(kpiType, value);
                  showChatbotMessage(insight, event);
                }}
              />
            </div>
            
            <Grid columns={2} gap={32} style={{ marginTop: 32 }}>
              <div 
                onClick={(e) => {
                  const insight = generateRiskPyramidInsight(data.customers || []);
                  showChatbotMessage(insight, e);
                }}
                style={{ cursor: 'pointer' }}
              >
                <ChurnRiskPyramid customers={data.customers || []} data={data.customers || []} />
              </div>
              <ProbabilityHistogram
                probabilities={data.probabilities || []}
                thresholds={[0.3, 0.6, 0.8]}
                binCount={binCount}
                onBinCountChange={setBinCount}
                onBinClick={(binStart: number, binEnd: number, customerCount: number, event: React.MouseEvent) => {
                  const insight = generateProbabilityInsight(binStart, binEnd, customerCount);
                  showChatbotMessage(insight, event);
                }}
              />
            </Grid>
            
            <Grid columns={2} gap={32} style={{ marginTop: 32 }}>
              <FeatureImportance
                features={data.feature_importance || []}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onFeatureClick={(feature: string, importance: number, rank: number, event: React.MouseEvent) => {
                  console.log('Feature clicked:', feature, importance, rank, event);
                  const insight = generateFeatureInsight(feature, importance, rank);
                  showChatbotMessage(insight, event);
                }}
              />
              <SegmentMatrix 
                segmentMatrix={data.segment_matrix || []} 
                onSegmentClick={(segment: string, riskData: any, event: React.MouseEvent) => {
                  console.log('Segment clicked:', segment, riskData, event);
                  const insight = generateSegmentInsight(segment, riskData);
                  showChatbotMessage(insight, event);
                }}
              />
            </Grid>
            
            <div 
              onClick={(e) => {
                const insight = generateTemporalInsight(data.risk_time_series || []);
                showChatbotMessage(insight, e);
              }}
              style={{ cursor: 'pointer' }}
            >
              <TemporalRiskPattern riskTimeSeries={data.risk_time_series || []} />
            </div>
            
            <div 
              onClick={(e) => showChatbotMessage('👥 **Customer Risk Explorer**: Individual customer details with risk levels and probabilities. **Click any row** for detailed profile. **Sort by columns** to find patterns. Use for targeted retention campaigns and personal outreach!', e)}
              style={{ cursor: 'pointer' }}
            >
              <CustomerTable customers={data.customers || []} page={page} onPageChange={setPage} />
            </div>
          </div>
          
          <div style={{ flex: 1, minWidth: 340, maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 32 }} className="animate-fade-in">
            <div 
              onClick={(e) => showChatbotMessage('💡 **AI Insights**: Automated observations about your churn data. Highlights **important patterns**, **anomalies**, and **trends** that need attention. These insights update automatically as your data changes!', e)}
              style={{ cursor: 'pointer' }}
            >
              <InsightsDrawer insights={data.insights || []} />
            </div>
            <div 
              onClick={(e) => showChatbotMessage('🎯 **Retention Strategies**: Actionable recommendations based on your churn analysis. **High Priority** = immediate action needed. **Medium Priority** = plan for next quarter. Strategies are tailored to your specific customer segments!', e)}
              style={{ cursor: 'pointer' }}
            >
              <RetentionStrategies strategies={data.retention_strategies || []} />
            </div>
          </div>
        </div>

        {/* Floating Action Button removed - using EnhancedContextAwareChatbot instead */}

        {/* Inline Chatbot */}
        <InlineChatbot
          message={chatbotMessage}
          position={chatbotPosition}
          onClose={clearChatbotMessage}
          onOpenInteractiveChat={() => setIsInteractiveChatbotOpen(true)}
        />

        {/* Enhanced Context-Aware Chatbot with @mention support */}
        <EnhancedContextAwareChatbot 
          dashboardContext={{
            source_dashboard: 'churn_prediction',
            customer_context: {
              total_customers: data.customers?.length || 0,
              high_risk_customers: data.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0,
              avg_churn_probability: data.customers?.length > 0 ? data.customers.reduce((sum: number, c: any) => sum + c.churn_probability, 0) / data.customers.length : 0,
              active_customer: null,
              segments: data.segment_matrix || []
            },
            chart_context: {
              chartType: 'churn_analysis',
              activeChart: 'risk_distribution',
              clickedElement: null
            },
            filters: {},
            date_range: {
              start_date: '2024-01-01',
              end_date: '2024-12-31'
            }
          }}
        />

        {/* Business Intelligence Agent with all 4.1-4.6 features */}
        <StandaloneBusinessIntelligenceAgent
          customers={data.customers || []}
          isVisible={isBIAgentOpen}
          onClose={() => setIsBIAgentOpen(false)}
        />

        {/* BI Agent Trigger Button */}
        <BusinessIntelligenceTrigger
          onClick={() => setIsBIAgentOpen(!isBIAgentOpen)}
          highRiskCount={data.customers?.filter((c: any) => c.risk_level === 'High' || c.risk_level === 'Very High').length || 0}
        />
      </div>
    </>
  );
} 