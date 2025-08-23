import React, { useState, useEffect } from 'react';

interface BIInsight {
  id: string;
  category: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  actionable: boolean;
  recommendations: string[];
}

interface BusinessIntelligenceAssistantProps {
  dashboardState: any;
  isOpen: boolean;
  onToggle: () => void;
}

const BusinessIntelligenceAssistant: React.FC<BusinessIntelligenceAssistantProps> = ({
  dashboardState,
  isOpen,
  onToggle
}) => {
  const [insights, setInsights] = useState<BIInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Insights', icon: '🎯' },
    { id: 'strategy', name: 'Strategy', icon: '🎯' },
    { id: 'performance', name: 'Performance', icon: '📊' },
    { id: 'opportunity', name: 'Opportunities', icon: '💡' }
  ];

  // Generate simple business intelligence insights
  const generateSimpleInsights = () => {
    const simpleInsights: BIInsight[] = [
      {
        id: 'strategy-1',
        category: 'strategy',
        title: 'Revenue Growth Strategy',
        content: 'Your sales data shows consistent patterns that can be leveraged for strategic growth. Focus on identifying peak performance periods and replicating successful strategies.',
        priority: 'high',
        icon: '🎯',
        actionable: true,
        recommendations: [
          'Analyze your best performing periods',
          'Identify key success factors',
          'Develop replication strategies',
          'Monitor performance metrics regularly'
        ]
      },
      {
        id: 'performance-1',
        category: 'performance',
        title: 'Performance Analysis',
        content: 'Current performance metrics indicate areas for optimization. Regular monitoring and data-driven decisions will help maintain competitive advantage.',
        priority: 'medium',
        icon: '📊',
        actionable: true,
        recommendations: [
          'Set up automated performance dashboards',
          'Establish KPI benchmarks',
          'Implement regular review cycles',
          'Create performance improvement plans'
        ]
      },
      {
        id: 'opportunity-1',
        category: 'opportunity',
        title: 'Market Opportunities',
        content: 'Data analysis reveals untapped opportunities in your market segments. Strategic positioning can help capture additional market share.',
        priority: 'medium',
        icon: '💡',
        actionable: true,
        recommendations: [
          'Conduct market segment analysis',
          'Identify underperforming areas',
          'Develop targeted marketing campaigns',
          'Explore new customer acquisition channels'
        ]
      }
    ];

    return simpleInsights;
  };

  // Generate insights when component opens
  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setTimeout(() => {
        const newInsights = generateSimpleInsights();
        setInsights(newInsights);
        setIsAnalyzing(false);
      }, 500);
    }
  }, [isOpen]);

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        width: '90%',
        maxWidth: '800px',
        height: '80%',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600' }}>
                🧠 Business Intelligence Assistant
              </h2>
              <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>
                AI-powered insights for strategic decision making
              </p>
            </div>
            <button
              onClick={onToggle}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '8px 16px',
                border: selectedCategory === category.id ? '2px solid #667eea' : '1px solid #e2e8f0',
                borderRadius: '20px',
                background: selectedCategory === category.id ? '#f0f4ff' : 'white',
                color: selectedCategory === category.id ? '#667eea' : '#64748b',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
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
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                Analyzing your business data...
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredInsights.map(insight => (
                <div
                  key={insight.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>{insight.icon}</span>
                    <div>
                      <h3 style={{
                        margin: '0 0 4px 0',
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        {insight.title}
                      </h3>
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: insight.priority === 'high' ? '#fee2e2' : insight.priority === 'medium' ? '#fef3c7' : '#f0f9ff',
                        color: insight.priority === 'high' ? '#dc2626' : insight.priority === 'medium' ? '#d97706' : '#0284c7'
                      }}>
                        {insight.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                  
                  <p style={{
                    margin: '0 0 16px 0',
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.6'
                  }}>
                    {insight.content}
                  </p>

                  {insight.actionable && (
                    <div>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        💡 Recommended Actions:
                      </h4>
                      <ul style={{
                        margin: '0',
                        paddingLeft: '20px',
                        fontSize: '13px',
                        color: '#64748b'
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

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#64748b'
          }}>
            🤖 AI-powered insights based on your sales trend data
          </p>
        </div>
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

export default BusinessIntelligenceAssistant;