import React, { useEffect, useState, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Import the existing components from the churn prediction tool
const ChurnKpiTiles = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/kpi/ChurnKpiTiles'), {
  ssr: false,
  loading: () => <div>Loading KPIs...</div>
});

const ChurnRiskPyramidWithSelection = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/ChurnRiskPyramidWithSelection'), {
  ssr: false,
  loading: () => <div>Loading Risk Pyramid...</div>
});

const ProbabilityHistogram = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/ProbabilityHistogram'), {
  ssr: false,
  loading: () => <div>Loading Histogram...</div>
});

const FeatureImportance = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/FeatureImportance'), {
  ssr: false,
  loading: () => <div>Loading Feature Importance...</div>
});

const CustomerTable = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/CustomerTable'), {
  ssr: false,
  loading: () => <div>Loading Customer Table...</div>
});

const TemporalRiskPattern = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/TemporalRiskPattern'), {
  ssr: false,
  loading: () => <div>Loading Temporal Pattern...</div>
});

const SegmentMatrix = dynamic(() => import('../Customer/tools/churn_prediction/ui/components/visualizations/SegmentMatrix'), {
  ssr: false,
  loading: () => <div>Loading Segment Matrix...</div>
});

// Mock data generator functions
const generateMockCustomers = () => {
  const customers = [];
  const names = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Digital Ventures', 'Cloud Systems', 'Data Analytics Co', 'Smart Industries', 'Future Tech', 'Innovation Labs', 'NextGen Solutions'];
  const riskLevels = ['Low', 'Medium', 'High', 'Very High'];
  
  for (let i = 1; i <= 100; i++) {
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const churnProbability = riskLevel === 'Very High' ? 0.75 + Math.random() * 0.2 :
                            riskLevel === 'High' ? 0.5 + Math.random() * 0.25 :
                            riskLevel === 'Medium' ? 0.25 + Math.random() * 0.25 :
                            Math.random() * 0.25;
    
    customers.push({
      customer_id: i,
      name: `${names[Math.floor(Math.random() * names.length)]} ${i}`,
      rfm: Math.floor(Math.random() * 10) + 1,
      recency: Math.floor(Math.random() * 365),
      frequency: Math.floor(Math.random() * 50) + 1,
      monetary: Math.floor(Math.random() * 10000) + 100,
      churn_probability: churnProbability,
      risk_level: riskLevel,
      last_purchase_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      avg_order_value: Math.floor(Math.random() * 500) + 50,
      total_spent: Math.floor(Math.random() * 50000) + 1000,
      customer_lifetime_value: Math.floor(Math.random() * 100000) + 5000,
      days_since_last_purchase: Math.floor(Math.random() * 365)
    });
  }
  
  return customers;
};

const generateMockFeatureImportance = () => {
  return [
    { feature: 'Recency', importance: 0.25 },
    { feature: 'Frequency', importance: 0.20 },
    { feature: 'Monetary Value', importance: 0.18 },
    { feature: 'Customer Tenure', importance: 0.12 },
    { feature: 'Support Tickets', importance: 0.10 },
    { feature: 'Product Usage', importance: 0.08 },
    { feature: 'Payment Method', importance: 0.04 },
    { feature: 'Contract Type', importance: 0.03 }
  ];
};

const generateMockTimeSeriesData = () => {
  const data = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  
  for (let i = 0; i < 13; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    data.push({
      date: monthName,
      timestamp: date.toISOString(),
      low: Math.floor(Math.random() * 20) + 30,
      medium: Math.floor(Math.random() * 15) + 20,
      high: Math.floor(Math.random() * 15) + 15,
      very_high: Math.floor(Math.random() * 10) + 5,
      total_customers: 1000 + Math.floor(Math.random() * 200),
      churn_rate: Math.random() * 30 + 10
    });
  }
  
  return data;
};

const generateMockSegmentMatrix = () => {
  return [
    { segment: 'Enterprise', low: 45, medium: 25, high: 20, very_high: 10 },
    { segment: 'Mid-Market', low: 35, medium: 30, high: 25, very_high: 10 },
    { segment: 'Small Business', low: 25, medium: 30, high: 30, very_high: 15 },
    { segment: 'Startup', low: 20, medium: 25, high: 35, very_high: 20 }
  ];
};

export default function ChurnDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [binCount, setBinCount] = useState(10);
  const [sortBy, setSortBy] = useState<'importance' | 'alphabetical'>('importance');
  const [page, setPage] = useState(1);
  const [chatContext, setChatContext] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      const customers = generateMockCustomers();
      const mockData = {
        status: 'success',
        customers: customers,
        feature_importance: generateMockFeatureImportance(),
        probabilities: customers.map(c => c.churn_probability),
        risk_time_series: generateMockTimeSeriesData(),
        segment_matrix: generateMockSegmentMatrix(),
        summary: {
          total_customers: customers.length,
          high_risk_count: customers.filter(c => c.risk_level === 'High' || c.risk_level === 'Very High').length,
          avg_churn_probability: customers.reduce((sum, c) => sum + c.churn_probability, 0) / customers.length
        }
      };
      setData(mockData);
      setLoading(false);
    }, 1000);
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
      riskTransition: Math.floor(Math.random() * 20) - 10
    };
  };

  if (loading || !data) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)', 
        color: '#f7f9fb', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(0, 224, 255, 0.3)',
            borderRadius: '50%',
            borderTop: '3px solid #00e0ff',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div style={{ color: '#00e0ff', fontSize: '20px' }}>Loading Churn Intelligence Dashboard...</div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const kpis = computeKPIs(data.customers || []);

  return (
    <>
      <Head>
        <title>Churn Intelligence Dashboard</title>
        <meta name="description" content="AI-powered customer churn prediction and analytics" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)', 
        color: '#f7f9fb', 
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '30px 40px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
          background: 'rgba(30, 39, 56, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            margin: 0,
            color: '#f7f9fb'
          }}>
            🎯 Churn Intelligence Dashboard
          </h1>
          <div style={{ 
            color: 'rgba(247, 249, 251, 0.7)', 
            marginTop: '8px', 
            fontSize: '16px'
          }}>
            AI-powered customer retention analytics and risk prediction
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: '30px 40px' }}>
          {/* KPI Tiles */}
          <div style={{ marginBottom: '30px' }}>
            <ChurnKpiTiles kpis={kpis} />
          </div>

          {/* First Row - Risk Pyramid and Probability Histogram */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
            gap: '24px', 
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'rgba(30, 39, 56, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <ChurnRiskPyramidWithSelection 
                customers={data.customers || []} 
                data={data.customers || []}
                onContextSelect={(context) => {
                  setChatContext(context);
                  setIsChatOpen(true);
                  if (typeof window !== 'undefined') {
                    (window as any).sendToChatbot = (ctx: any) => {
                      setChatContext(ctx);
                      setIsChatOpen(true);
                    };
                  }
                }}
              />
            </div>
            <div style={{
              background: 'rgba(30, 39, 56, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <ProbabilityHistogram
                probabilities={data.probabilities || []}
                thresholds={[0.3, 0.6, 0.8]}
                binCount={binCount}
                onBinCountChange={setBinCount}
              />
            </div>
          </div>

          {/* Second Row - Feature Importance and Segment Matrix */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
            gap: '24px', 
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'rgba(30, 39, 56, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <FeatureImportance
                features={data.feature_importance || []}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
            <div style={{
              background: 'rgba(30, 39, 56, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <SegmentMatrix segmentMatrix={data.segment_matrix || []} />
            </div>
          </div>

          {/* Third Row - Temporal Risk Pattern */}
          <div style={{
            background: 'rgba(30, 39, 56, 0.8)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '24px'
          }}>
            <TemporalRiskPattern riskTimeSeries={data.risk_time_series || []} />
          </div>

          {/* Customer Table */}
          <div style={{
            background: 'rgba(30, 39, 56, 0.8)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CustomerTable 
              customers={data.customers || []} 
              page={page} 
              onPageChange={setPage} 
            />
          </div>
        </div>
        
        {/* Chat Interface */}
        {isChatOpen && (
          <div style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            width: 400,
            height: 500,
            background: 'linear-gradient(135deg, #1e2738, #2a3447)',
            borderRadius: 16,
            border: '1px solid rgba(0, 224, 255, 0.3)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AI Analysis Assistant
              </h3>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f7f9fb',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4,
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              flex: 1,
              padding: 20,
              overflowY: 'auto'
            }}>
              {chatContext && (
                <div style={{
                  background: 'rgba(0, 224, 255, 0.1)',
                  border: '1px solid rgba(0, 224, 255, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16
                }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#00e0ff',
                    marginBottom: 8
                  }}>
                    📊 Context Received
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: 'rgba(247, 249, 251, 0.9)',
                    lineHeight: 1.5
                  }}>
                    {chatContext.message}
                  </div>
                  {(chatContext.selectedPoint || chatContext.selectedPoints) && (
                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ fontSize: 12, color: 'rgba(247, 249, 251, 0.7)', marginBottom: 8 }}>
                        Risk Level Details:
                      </div>
                      {chatContext.selectedPoint ? (
                        <div style={{
                          display: 'inline-block',
                          background: 'rgba(124, 58, 237, 0.2)',
                          border: '1px solid rgba(124, 58, 237, 0.5)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          marginRight: 8,
                          marginBottom: 8,
                          fontSize: 12,
                          color: '#f7f9fb'
                        }}>
                          {chatContext.selectedPoint.level}: {chatContext.selectedPoint.count} customers ({chatContext.selectedPoint.percentage.toFixed(1)}%)
                        </div>
                      ) : chatContext.selectedPoints?.map((point: any, idx: number) => (
                        <div key={idx} style={{
                          display: 'inline-block',
                          background: 'rgba(124, 58, 237, 0.2)',
                          border: '1px solid rgba(124, 58, 237, 0.5)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          marginRight: 8,
                          marginBottom: 8,
                          fontSize: 12,
                          color: '#f7f9fb'
                        }}>
                          {point.level}: {point.count} customers
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div style={{
                padding: 16,
                background: 'rgba(15, 20, 25, 0.5)',
                borderRadius: 12,
                fontSize: 14,
                color: 'rgba(247, 249, 251, 0.8)',
                lineHeight: 1.6
              }}>
                <div style={{ marginBottom: 12, fontWeight: 600, color: '#f7f9fb' }}>
                  💡 How to use:
                </div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li><strong>Click</strong> on any risk level to see AI insights</li>
                  <li><strong>Shift + Click</strong> to send context to this chatbot</li>
                  <li>Ask questions about the data sent here</li>
                  <li>Get detailed analysis and recommendations</li>
                </ul>
              </div>
            </div>
            
            <div style={{
              padding: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <input
                type="text"
                placeholder="Ask about the selected data..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(15, 20, 25, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  color: '#f7f9fb',
                  fontSize: 14,
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
            </div>
          </div>
        )}
        
        {/* Floating Chat Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e0ff, #7c3aed)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0, 224, 255, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              zIndex: 999,
              transition: 'transform 0.3s',
              animation: chatContext ? 'pulse 2s infinite' : 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            💬
          </button>
        )}
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(0, 224, 255, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 4px 30px rgba(0, 224, 255, 0.6);
          }
        }
      `}</style>
    </>
  );
}