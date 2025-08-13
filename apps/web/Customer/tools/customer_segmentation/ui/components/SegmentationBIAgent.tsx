import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

interface SegmentationBIAgentProps {
  onClose: () => void;
}

export default function SegmentationBIAgent({ onClose }: SegmentationBIAgentProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'query' | 'insights' | 'recommendations'>('query');

  // Predefined insights
  const insights = [
    {
      title: 'Segment Growth Opportunity',
      value: '+32%',
      description: 'Champions segment shows highest growth potential',
      action: 'Focus on upselling strategies'
    },
    {
      title: 'At-Risk Revenue',
      value: '$450K',
      description: '15% of customers need immediate attention',
      action: 'Deploy retention campaigns'
    },
    {
      title: 'New Customer Acquisition',
      value: '185',
      description: 'Monthly new customer average',
      action: 'Optimize onboarding process'
    },
    {
      title: 'Cross-Sell Opportunity',
      value: '67%',
      description: 'Loyal segment receptive to new products',
      action: 'Launch targeted product campaigns'
    }
  ];

  const recommendations = [
    {
      priority: 'High',
      title: 'Implement VIP Program for Champions',
      impact: 'Expected 25% revenue increase',
      timeline: '2 weeks',
      color: '#ef4444'
    },
    {
      priority: 'High',
      title: 'Retention Campaign for At-Risk Segment',
      impact: 'Save $450K in potential churn',
      timeline: '1 week',
      color: '#f97316'
    },
    {
      priority: 'Medium',
      title: 'Personalized Offers for Loyal Customers',
      impact: '15% increase in order value',
      timeline: '3 weeks',
      color: '#eab308'
    },
    {
      priority: 'Low',
      title: 'Optimize New Customer Journey',
      impact: 'Improve retention by 10%',
      timeline: '1 month',
      color: '#22c55e'
    }
  ];

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const responses = {
        default: `Based on your segmentation data:\n\n📊 **Key Findings:**\n• Champions segment contributes 48% of revenue\n• At-Risk segment has grown by 23% this quarter\n• New customer acquisition rate: 6.2% monthly\n\n💡 **Recommendations:**\n1. Focus retention efforts on At-Risk segment\n2. Implement VIP benefits for Champions\n3. Develop nurture campaigns for New customers\n\n📈 **Predicted Impact:**\n• Revenue increase: +$750K (next quarter)\n• Churn reduction: -18%\n• Customer satisfaction: +12 NPS points`,
        
        champions: `**Champions Segment Analysis:**\n\n👑 **Profile:**\n• 1,600 customers (32% of base)\n• Avg. Order Value: $3,200\n• Purchase Frequency: 8x/year\n• Revenue Contribution: $1.2M (48%)\n\n📈 **Trends:**\n• Growing at 15% YoY\n• 92% retention rate\n• High engagement with loyalty programs\n\n🎯 **Opportunities:**\n• Upselling premium services (+$400K potential)\n• Referral program (est. 50 new customers/month)\n• Exclusive product launches`,
        
        risk: `**At-Risk Segment Alert:**\n\n⚠️ **Current Status:**\n• 750 customers (15% of base)\n• Declining engagement: -45% last 60 days\n• Revenue at risk: $450K\n• Churn probability: 68%\n\n🔍 **Root Causes:**\n• Service issues (34%)\n• Competitive offers (28%)\n• Product dissatisfaction (22%)\n• Price sensitivity (16%)\n\n🚀 **Intervention Strategy:**\n• Immediate: Personal outreach to top 100 accounts\n• Week 1: Launch win-back campaign\n• Week 2: Implement loyalty incentives\n• Success rate: 45% recovery expected`
      };
      
      const key = query.toLowerCase().includes('champion') ? 'champions' : 
                  query.toLowerCase().includes('risk') ? 'risk' : 'default';
      
      setResponse(responses[key]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: '90%',
        maxWidth: 900,
        maxHeight: '85vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: 20,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 24,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: 24, fontWeight: 700 }}>
              🤖 Segmentation Intelligence Agent
            </h2>
            <p style={{ margin: '8px 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
              Advanced analytics and recommendations for customer segments
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: 24,
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          {['query', 'insights', 'recommendations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                flex: 1,
                padding: '16px 24px',
                background: activeTab === tab ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                color: activeTab === tab ? '#3b82f6' : '#94a3b8',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'query' ? '🔍 Query' : tab === 'insights' ? '💡 Insights' : '🎯 Recommendations'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeTab === 'query' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8, display: 'block' }}>
                  Ask about your customer segments
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleQuery()}
                    placeholder="e.g., What are the characteristics of our Champions segment?"
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      borderRadius: 10,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      fontSize: 15,
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleQuery}
                    disabled={isLoading}
                    style={{
                      padding: '14px 28px',
                      borderRadius: 10,
                      background: isLoading ? '#64748b' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: isLoading ? 'default' : 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </div>

              {/* Quick queries */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Quick queries:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    'Analyze Champions segment',
                    'Show At-Risk customers',
                    'Growth opportunities',
                    'Retention strategies'
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        setQuery(q);
                        setTimeout(handleQuery, 100);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 20,
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#3b82f6',
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response */}
              {response && (
                <div style={{
                  padding: 20,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  fontSize: 14,
                  lineHeight: 1.6
                }}>
                  {response}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>
                    {insight.value}
                  </div>
                  <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: 16 }}>
                    {insight.title}
                  </h3>
                  <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: 13 }}>
                    {insight.description}
                  </p>
                  <div style={{
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 6,
                    color: '#22c55e',
                    fontSize: 12,
                    display: 'inline-block'
                  }}>
                    {insight.action}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${rec.color}30`,
                    borderLeft: `4px solid ${rec.color}`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: `${rec.color}20`,
                        borderRadius: 4,
                        color: rec.color,
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 8
                      }}>
                        {rec.priority} Priority
                      </div>
                      <h3 style={{ margin: '0 0 8px', color: '#f1f5f9', fontSize: 16 }}>
                        {rec.title}
                      </h3>
                      <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 14 }}>
                        💰 {rec.impact}
                      </p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                        ⏱️ Timeline: {rec.timeline}
                      </p>
                    </div>
                    <button
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${rec.color}80, ${rec.color}60)`,
                        border: 'none',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      Implement
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}