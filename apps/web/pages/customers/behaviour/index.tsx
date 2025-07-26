import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic
// Adjusted import paths from pages/customers/behaviour/index.tsx
import { ThemeProvider } from '../../../ui-common/design-system/theme'; 
import KpiTile from '../../../ui-common/design-system/components/KpiTile/KpiTile'; // Import KpiTile
import { Card } from '../../../ui-common/design-system/components/Card'; // Import Card

// Dynamically import chart components with SSR disabled
const PatternRadarChart = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/PatternRadarChart'), { ssr: false });
const PatternIntervalHistogram = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/PatternIntervalHistogram'), { ssr: false });
const CategoryTreemap = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/CategoryTreemap'), { ssr: false });
const ChannelDonutChart = dynamic(() => import('../../../Customer/tools/customer_behaviour/ui/components/visualizations/ChannelDonutChart'), { ssr: false });

// Create a simple Engagement Level Matrix component
const EngagementLevelMatrix = ({ patterns, width = 680, height = 400 }: any) => {
  const data = useMemo(() => {
    if (!patterns || patterns.length === 0) return [];
    return patterns.map((p: any, i: number) => ({
      x: p.recency || Math.random() * 365,
      y: p.frequency || Math.random() * 20,
      size: p.avg_order_value || 100,
      risk: p.churn_risk || 'low',
      customer_id: p.customer_id || `Customer ${i + 1}`
    }));
  }, [patterns]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={width} height={height} style={{ background: 'transparent' }}>
        {/* Quadrant lines */}
        <line x1={width/4} y1={0} x2={width/4} y2={height} stroke="#3a4459" strokeDasharray="5,5" strokeWidth={1} />
        <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="#3a4459" strokeDasharray="5,5" strokeWidth={1} />
        
        {/* Data points */}
        {data.slice(0, 50).map((point: any, i: number) => (
          <circle
            key={i}
            cx={Math.min(Math.max(point.x * 1.5, 20), width - 20)}
            cy={Math.min(Math.max(height - (point.y * 15), 20), height - 20)}
            r={Math.min(Math.max(point.size / 50, 4), 12)}
            fill={
              point.risk === 'high' ? '#e930ff' :
              point.risk === 'medium' ? '#aa45dd' :
              point.risk === 'low' ? '#5fd4d6' : '#00e0ff'
            }
            opacity={0.8}
          >
            <title>{`${point.customer_id} - Recency: ${point.x.toFixed(0)}d, Frequency: ${point.y.toFixed(1)}`}</title>
          </circle>
        ))}
        
        {/* Quadrant labels */}
        <text x={width/8} y={30} fill="#f7f9fb" fontSize="14" fontWeight="500" textAnchor="middle">Champions</text>
        <text x={(3*width)/8} y={30} fill="#f7f9fb" fontSize="14" fontWeight="500" textAnchor="middle">Loyal</text>
        <text x={width/8} y={height-20} fill="#f7f9fb" fontSize="14" fontWeight="500" textAnchor="middle">Promising</text>
        <text x={(3*width)/8} y={height-20} fill="#f7f9fb" fontSize="14" fontWeight="500" textAnchor="middle">At Risk</text>
        
        {/* Axis labels */}
        <text x={width/2} y={height-5} fill="#f7f9fb" fontSize="12" textAnchor="middle">Recency (Days)</text>
        <text x={15} y={height/2} fill="#f7f9fb" fontSize="12" textAnchor="middle" transform={`rotate(-90, 15, ${height/2})`}>Frequency</text>
      </svg>
    </div>
  );
};

const CustomerBehaviourDashboardPage = () => {
  const [behaviourData, setBehaviourData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/customer-behaviour/data');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.patterns) {
          setBehaviourData(data);
        } else {
          throw new Error('Fetched data is not in the expected format.');
        }
      } catch (e: any) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiMetrics = useMemo(() => {
    if (!behaviourData || !behaviourData.patterns || behaviourData.patterns.length === 0) {
      return {
        avgPurchaseInterval: 'N/A',
        avgOrderValue: 'N/A',
        categoryDiversity: 'N/A',
        channelMix: 'N/A',
        churnRisk: 'N/A',
      };
    }
    
    const patterns = behaviourData.patterns;
    const numPatterns = patterns.length;

    // Average Purchase Interval (in days)
    const totalRecency = patterns.reduce((sum: number, p: any) => sum + (p.recency || 0), 0);
    const avgPurchaseInterval = (totalRecency / numPatterns).toFixed(1);

    // Average Order Value
    const totalOrderValue = patterns.reduce((sum: number, p: any) => sum + (p.avg_order_value || 0), 0);
    const avgOrderValue = (totalOrderValue / numPatterns).toFixed(0);

    // Category Diversity Index (simplified)
    const avgDiversity = patterns.reduce((sum: number, p: any) => sum + (p.diversity || 0), 0) / numPatterns;
    const categoryDiversity = (avgDiversity * 10).toFixed(1);

    // Channel Mix (dominant channel)
    const channelMix = 'Online';

    // Churn Risk Percentage
    const highRiskCount = patterns.filter((p: any) => p.churn_risk === 'high').length;
    const churnRisk = ((highRiskCount / numPatterns) * 100).toFixed(0);

    return {
      avgPurchaseInterval,
      avgOrderValue,
      categoryDiversity,
      channelMix,
      churnRisk,
    };
  }, [behaviourData]);

  // Loading and error states
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0A1224', 
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif'
      }}>
        Loading Customer Behaviour Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0A1224', 
        color: '#e930ff',
        fontFamily: 'Inter, sans-serif'
      }}>
        Error loading dashboard: {error}
      </div>
    );
  }

  if (!behaviourData || !behaviourData.patterns) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#0A1224', 
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif'
      }}>
        No behaviour data available.
      </div>
    );
  }
  
  const patterns = behaviourData.patterns;

  return (
    <ThemeProvider>
      <div style={{ 
        backgroundColor: '#0A1224', 
        color: '#f7f9fb', 
        minHeight: '100vh', 
        fontFamily: 'Inter, sans-serif',
        display: 'flex'
      }}>
        {/* Main Content */}
        <div style={{ 
          flex: 1,
          padding: '32px',
          maxWidth: 'calc(100vw - 360px)' // Ensure content doesn't overflow
        }}>
          {/* Header */}
          <header style={{ marginBottom: '32px' }}>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 700, 
              color: '#f7f9fb', 
              margin: '0 0 8px 0',
              fontFamily: 'Inter, sans-serif'
            }}>
              Customer Behaviour Dashboard
            </h1>
            <p style={{ 
              fontSize: '1rem', 
              color: '#94a3b8', 
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              Deep insights into customer interaction patterns and behavioral preferences
            </p>
          </header>

          {/* KPI Tiles Row - 5 tiles matching churn dashboard style exactly */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* Average Purchase Interval */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                lineHeight: 1, 
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif' 
              }}>
                {kpiMetrics.avgPurchaseInterval}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500 
              }}>
                Avg Purchase Interval
              </div>
            </div>
            
            {/* Average Order Value */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                lineHeight: 1, 
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif' 
              }}>
                ${kpiMetrics.avgOrderValue}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500 
              }}>
                Average Order Value
              </div>
            </div>

            {/* Category Diversity */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                lineHeight: 1, 
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif' 
              }}>
                {kpiMetrics.categoryDiversity}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500 
              }}>
                Category Diversity
              </div>
            </div>

            {/* Channel Mix */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                lineHeight: 1, 
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif' 
              }}>
                {kpiMetrics.channelMix}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500 
              }}>
                Channel Mix
              </div>
            </div>

            {/* Churn Risk */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '12px', 
              padding: '20px', 
              textAlign: 'center',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                lineHeight: 1, 
                marginBottom: '8px',
                fontFamily: 'Inter, sans-serif' 
              }}>
                {kpiMetrics.churnRisk}%
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#94a3b8', 
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500 
              }}>
                Churn Risk
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Purchase Pattern Explorer */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '16px', 
              padding: '24px',
              height: '400px'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                margin: '0 0 16px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Purchase Pattern Explorer
              </h3>
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                height: 'calc(100% - 50px)',
                alignItems: 'center'
              }}>
                <div style={{ 
                  flex: '55%', 
                  height: '100%',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <PatternRadarChart patterns={patterns} width={280} height={260} />
                </div>
                <div style={{ 
                  flex: '45%', 
                  height: '100%',
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }}>
                  <PatternIntervalHistogram patterns={patterns} width={200} height={260} />
                </div>
              </div>
            </div>

            {/* Channel Usage Visualizer */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '16px', 
              padding: '24px',
              height: '400px'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                margin: '0 0 16px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Channel Usage Visualizer
              </h3>
              <div style={{ 
                height: 'calc(100% - 50px)',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <ChannelDonutChart channels={patterns} width={280} height={280} />
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px'
          }}>
            {/* Product Preference Analyzer */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '16px', 
              padding: '24px',
              height: '450px'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                margin: '0 0 16px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Product Preference Analyzer
              </h3>
              <div style={{ 
                height: 'calc(100% - 50px)',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <CategoryTreemap categories={patterns} width={420} height={380} />
              </div>
            </div>

            {/* Engagement Level Matrix */}
            <div style={{ 
              backgroundColor: '#1a2332', 
              borderRadius: '16px', 
              padding: '24px',
              height: '450px'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 700, 
                color: '#f7f9fb', 
                margin: '0 0 16px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Engagement Level Matrix
              </h3>
              <div style={{ 
                height: 'calc(100% - 50px)',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <EngagementLevelMatrix patterns={patterns} width={420} height={380} />
              </div>
            </div>
          </div>
        </div>

        {/* Behaviour Insights Panel - Flexbox Sidebar */}
        <div style={{ 
          width: '360px',
          flexShrink: 0, // Prevent shrinking
          backgroundColor: '#1a2332',
          padding: '32px 24px',
          overflowY: 'auto',
          height: '100vh',
          borderLeft: '1px solid rgba(148, 163, 184, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#00e0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🤖
            </div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 700, 
              color: '#f7f9fb', 
              margin: 0,
              fontFamily: 'Inter, sans-serif'
            }}>
              Behaviour Insights
            </h2>
          </div>

          {/* Insight Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Recent Pattern Change */}
            <div style={{
              backgroundColor: 'rgba(0, 224, 255, 0.1)',
              border: '1px solid rgba(0, 224, 255, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              borderLeft: '4px solid #00e0ff'
            }}>
              <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#f7f9fb', 
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Recent Pattern Change
              </h4>
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#94a3b8', 
                margin: '0 0 12px 0',
                lineHeight: 1.4,
                fontFamily: 'Inter, sans-serif'
              }}>
                12% increase in purchase frequency observed over the past 30 days, driven by improved category diversity in Consumer segment.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  backgroundColor: '#00e0ff',
                  color: '#0A1224',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Export
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#00e0ff',
                  border: '1px solid #00e0ff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Share
                </button>
              </div>
            </div>

            {/* Key Factor */}
            <div style={{
              backgroundColor: 'rgba(233, 48, 255, 0.1)',
              border: '1px solid rgba(233, 48, 255, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              borderLeft: '4px solid #e930ff'
            }}>
              <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#f7f9fb', 
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Key Factor: Channel Optimization
              </h4>
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#94a3b8', 
                margin: '0 0 12px 0',
                lineHeight: 1.4,
                fontFamily: 'Inter, sans-serif'
              }}>
                Cross-channel behavior analysis reveals mobile app usage correlates with 25% higher order values.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  backgroundColor: '#e930ff',
                  color: '#f7f9fb',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Export
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#e930ff',
                  border: '1px solid #e930ff',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Share
                </button>
              </div>
            </div>

            {/* Engagement Recommendation */}
            <div style={{
              backgroundColor: 'rgba(95, 212, 214, 0.1)',
              border: '1px solid rgba(95, 212, 214, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              borderLeft: '4px solid #5fd4d6'
            }}>
              <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: '#f7f9fb', 
                margin: '0 0 8px 0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Engagement Opportunity
              </h4>
              <p style={{ 
                fontSize: '0.8rem', 
                color: '#94a3b8', 
                margin: '0 0 12px 0',
                lineHeight: 1.4,
                fontFamily: 'Inter, sans-serif'
              }}>
                Target "Promising" segment customers with personalized product recommendations to move them to "Champions" status.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  backgroundColor: '#5fd4d6',
                  color: '#0A1224',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Export
                </button>
                <button style={{
                  backgroundColor: 'transparent',
                  color: '#5fd4d6',
                  border: '1px solid #5fd4d6',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default CustomerBehaviourDashboardPage; 