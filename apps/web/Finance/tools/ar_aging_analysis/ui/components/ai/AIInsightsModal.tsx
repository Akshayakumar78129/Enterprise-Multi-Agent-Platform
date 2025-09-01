import React, { useState, useEffect } from 'react';

interface AIInsightsModalProps {
  data: any;
  onClose: () => void;
  onSendToChat: (data: any) => void;
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ data, onClose, onSendToChat }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      generateInsights();
    }
  }, [data]);

  const generateInsights = () => {
    setLoading(true);
    
    // Generate insights based on the data type and content
    const generatedInsights = getInsights(data);
    const generatedRecommendations = getRecommendations(data);
    
    setInsights(generatedInsights);
    setRecommendations(generatedRecommendations);
    setLoading(false);
  };

  const getInsights = (data: any) => {
    const { chartType, value, bucket, customerName, riskScore } = data;
    
    switch (chartType) {
      case 'kpi':
        return getKPIInsights(data);
      case 'aging_bucket':
        return getAgingBucketInsights(data);
      case 'customer_matrix':
        return getCustomerMatrixInsights(data);
      case 'collection_forecast':
        return getCollectionForecastInsights(data);
      case 'cash_conversion':
        return getCashConversionInsights(data);
      default:
        return getGenericInsights(data);
    }
  };

  const getKPIInsights = (data: any) => {
    const kpiType = data.title || data.metric;
    
    if (kpiType?.includes('Working Capital ROI')) {
      return [
        {
          type: 'financial',
          icon: '💰',
          title: 'Working Capital Efficiency Analysis',
          content: `Current ROI of ${data.value} indicates ${parseFloat(data.value) > 12 ? 'excellent' : 'moderate'} working capital efficiency. This metric directly impacts shareholder returns and cash flow optimization.`
        },
        {
          type: 'benchmark',
          icon: '📊',
          title: 'Industry Benchmarking',
          content: `Compared to industry median of 11.2%, your performance is ${parseFloat(data.value) > 11.2 ? 'above' : 'below'} average. Top quartile performers achieve 15-18% ROI through optimized collection processes.`
        }
      ];
    }
    
    if (kpiType?.includes('Economic Value')) {
      return [
        {
          type: 'risk',
          icon: '⚠️',
          title: 'Value Erosion Analysis',
          content: `Daily economic value erosion of $${(parseFloat(data.value.replace(/[$,]/g, '')) / 30).toLocaleString()} represents significant opportunity cost. Extended payment terms are destroying shareholder value.`
        },
        {
          type: 'opportunity',
          icon: '🎯',
          title: 'Recovery Opportunity',
          content: `Implementing aggressive collection strategies could recover 60-75% of this value within 90 days. Focus on accounts >45 days for maximum impact.`
        }
      ];
    }

    return [
      {
        type: 'metric',
        icon: '📈',
        title: 'Performance Insight',
        content: `This ${kpiType} metric of ${data.value} provides critical visibility into working capital performance and collection effectiveness.`
      }
    ];
  };

  const getAgingBucketInsights = (data: any) => {
    const { bucket, amount, percentage, npvImpact } = data;
    
    return [
      {
        type: 'analysis',
        icon: '📊',
        title: `${bucket} Analysis`,
        content: `This aging bucket represents ${percentage}% of total AR ($${(amount/1000000).toFixed(1)}M). The concentration suggests ${percentage > 25 ? 'concerning' : 'healthy'} payment patterns in this timeframe.`
      },
      {
        type: 'financial',
        icon: '💰',
        title: 'NPV Impact Assessment',
        content: `Economic impact of $${Math.abs(npvImpact).toLocaleString()} represents ${npvImpact < 0 ? 'value destruction' : 'value creation'} from time value of money effects. ${Math.abs(npvImpact) > 100000 ? 'Immediate action required.' : 'Monitor closely.'}`
      },
      {
        type: 'strategy',
        icon: '🎯',
        title: 'Collection Strategy',
        content: bucket.includes('0-30') ? 
          'Maintain current collection velocity. These accounts are performing well.' :
          bucket.includes('60+') ?
          'Immediate escalation required. Consider collection agencies or legal action.' :
          'Implement enhanced follow-up procedures. Prevent further aging.'
      }
    ];
  };

  const getCustomerMatrixInsights = (data: any) => {
    const { customerName, clv, riskScore, quadrant } = data;
    
    return [
      {
        type: 'customer',
        icon: '👤',
        title: `${customerName} Profile`,
        content: `Customer Lifetime Value of $${(clv/1000000).toFixed(1)}M with risk score ${riskScore} places them in the "${quadrant}" category. This positioning drives strategic collection approach.`
      },
      {
        type: 'strategy',
        icon: '🎯',
        title: 'Strategic Approach',
        content: getQuadrantStrategy(quadrant)
      },
      {
        type: 'risk',
        icon: '⚠️',
        title: 'Risk Assessment',
        content: `Risk score of ${riskScore} indicates ${riskScore > 50 ? 'elevated' : 'manageable'} collection risk. ${riskScore > 70 ? 'Consider credit insurance or COD terms.' : 'Standard collection procedures appropriate.'}`
      }
    ];
  };

  const getCollectionForecastInsights = (data: any) => {
    return [
      {
        type: 'forecast',
        icon: '🔮',
        title: 'Collection Prediction',
        content: `ML models predict ${data.confidence || '82%'} confidence in collection timing. Historical patterns suggest ${data.expectedDays || '28'} days average collection period for similar profiles.`
      },
      {
        type: 'cash_flow',
        icon: '💸',
        title: 'Cash Flow Impact',
        content: `Expected collection of $${data.amount?.toLocaleString() || 'XX,XXX'} will improve cash position. Accelerating by 7 days would save $${((data.amount || 100000) * 0.1 / 365 * 7).toLocaleString()} in carrying costs.`
      }
    ];
  };

  const getCashConversionInsights = (data: any) => {
    return [
      {
        type: 'probability',
        icon: '🎲',
        title: 'Conversion Probability',
        content: `Statistical models indicate ${data.probability || '75%'} probability of collection within standard terms. Risk factors include payment history and current economic conditions.`
      },
      {
        type: 'timing',
        icon: '⏱️',
        title: 'Optimal Collection Timing',
        content: `Best collection window is days 25-35 when customer cash flows typically peak. Avoid end-of-month collection attempts due to competitive priorities.`
      }
    ];
  };

  const getGenericInsights = (data: any) => {
    return [
      {
        type: 'general',
        icon: '💡',
        title: 'Data Insight',
        content: 'This data point provides valuable visibility into AR performance. Consider the broader portfolio context when making strategic decisions.'
      }
    ];
  };

  const getQuadrantStrategy = (quadrant: string) => {
    switch (quadrant) {
      case 'Strategic Partners':
        return 'Maintain premium service levels. Consider extended payment terms for volume commitments. These are your most valuable relationships.';
      case 'Growth Opportunities':
        return 'Implement intensive account management. Consider credit insurance. High value justifies additional collection investment.';
      case 'Efficiency Targets':
        return 'Automate collection processes. Standardize payment terms. Focus on operational efficiency over relationship investment.';
      case 'Value Destroyers':
        return 'Implement exit strategy. Convert to COD or prepaid terms. These customers destroy more value than they create.';
      default:
        return 'Assess customer strategically based on lifetime value and risk profile.';
    }
  };

  const getRecommendations = (data: any) => {
    const { chartType } = data;
    
    switch (chartType) {
      case 'kpi':
        return [
          { priority: 'High', action: 'Review collection policies for accounts >30 days', impact: 'Reduce DSO by 3-5 days' },
          { priority: 'Medium', action: 'Implement early payment discounts (2% 10 days)', impact: 'Accelerate cash flow by $500K monthly' },
          { priority: 'Low', action: 'Automate reminder processes', impact: 'Reduce collection costs by 15%' }
        ];
      case 'aging_bucket':
        return [
          { priority: 'High', action: 'Personal outreach to top 10 accounts in this bucket', impact: 'Collect 40-60% within 2 weeks' },
          { priority: 'Medium', action: 'Offer payment plan options', impact: 'Reduce bad debt risk by 25%' },
          { priority: 'Low', action: 'Update credit terms for future sales', impact: 'Prevent future aging concentration' }
        ];
      case 'customer_matrix':
        return [
          { priority: 'High', action: 'Segment-specific collection strategy', impact: 'Optimize ROI on collection efforts' },
          { priority: 'Medium', action: 'Credit limit adjustments', impact: 'Reduce exposure risk by 30%' },
          { priority: 'Low', action: 'Customer relationship scoring update', impact: 'Improve strategic decision making' }
        ];
      default:
        return [
          { priority: 'Medium', action: 'Monitor trends in this data', impact: 'Early identification of issues' },
          { priority: 'Low', action: 'Include in executive reporting', impact: 'Increased visibility and accountability' }
        ];
    }
  };

  const handleSendToChat = () => {
    onSendToChat({
      ...data,
      insights: insights,
      recommendations: recommendations,
      context: 'ar_aging_analysis'
    });
  };

  if (!data) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(10, 18, 36, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#232a36',
        border: '1px solid #00e0ff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🧠
            </div>
            <div>
              <h2 style={{ 
                color: '#f7f9fb', 
                fontSize: '20px', 
                fontWeight: '600',
                margin: 0 
              }}>
                AI Insights
              </h2>
              <p style={{ 
                color: '#8892a8', 
                fontSize: '12px',
                margin: 0 
              }}>
                Strategic analysis for AR optimization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8892a8',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2738'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#8892a8'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #00e0ff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '12px'
            }} />
            Generating insights...
          </div>
        ) : (
          <>
            {/* Insights Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                color: '#00e0ff', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💡 Key Insights
              </h3>
              {insights.map((insight, index) => (
                <div key={index} style={{
                  backgroundColor: '#1e2738',
                  border: '1px solid #232a36',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{insight.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        color: '#f7f9fb',
                        fontSize: '14px',
                        fontWeight: '600',
                        margin: '0 0 8px 0'
                      }}>
                        {insight.title}
                      </h4>
                      <p style={{
                        color: '#8892a8',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        margin: 0
                      }}>
                        {insight.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                color: '#ffc145', 
                fontSize: '16px', 
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎯 Recommendations
              </h3>
              {recommendations.map((rec, index) => (
                <div key={index} style={{
                  backgroundColor: '#1e2738',
                  border: '1px solid #232a36',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  borderLeft: `4px solid ${
                    rec.priority === 'High' ? '#e930ff' : 
                    rec.priority === 'Medium' ? '#ffc145' : '#5fd4d6'
                  }`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      color: rec.priority === 'High' ? '#e930ff' : 
                            rec.priority === 'Medium' ? '#ffc145' : '#5fd4d6',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <h4 style={{
                    color: '#f7f9fb',
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    {rec.action}
                  </h4>
                  <p style={{
                    color: '#8892a8',
                    fontSize: '13px',
                    margin: 0
                  }}>
                    Expected Impact: {rec.impact}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleSendToChat}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#00e0ff',
                  color: '#0a1224',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                💬 Send to Chat
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  color: '#8892a8',
                  border: '1px solid #8892a8',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AIInsightsModal;