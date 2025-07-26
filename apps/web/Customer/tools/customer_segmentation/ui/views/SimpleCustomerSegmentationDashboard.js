import React, { useState, useEffect } from "react";

const SimpleCustomerSegmentationDashboard = () => {
  const [data, setData] = useState({
    segmentData: [],
    kpiData: null,
    segmentDistribution: [],
    segmentComparison: [],
    segmentAttributes: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚀 Fetching customer segmentation data...');
        const response = await fetch('/api/customer-segmentation/data');
        const result = await response.json();
        console.log('✅ Data received:', result);
        
        if (result.success) {
          setData({
            segmentData: result.data.segment_data || [],
            kpiData: result.data.kpi_data || null,
            segmentDistribution: result.data.segment_distribution || [],
            segmentComparison: result.data.segment_comparison || [],
            segmentAttributes: result.data.segment_attributes || null
          });
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        console.error('❌ Error:', err);
        setError('Network error: Unable to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a1224',
        color: '#f7f9fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #232a36',
            borderTop: '4px solid #00e0ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <div style={{ fontSize: '18px', color: '#00e0ff' }}>Loading Customer Segmentation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a1224',
        color: '#f7f9fb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center', color: '#ff6b6b' }}>
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1224',
      color: '#f7f9fb',
      fontFamily: 'Inter, sans-serif',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Customer Segmentation Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: '#5891cb', margin: '0' }}>
          AI-powered customer segmentation analytics and insights
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <button style={{
            background: '#00e0ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            Overview
          </button>
          <button style={{
            background: 'transparent',
            color: '#5891cb',
            border: '1px solid #3a4459',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}>
            Detailed
          </button>
          <button style={{
            background: '#e930ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Showing customers info */}
      <div style={{ marginBottom: '24px', color: '#5891cb' }}>
        Showing {data.segmentData.length} of {data.kpiData?.total_customers || 0} customers
      </div>

      {/* KPI Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#00e0ff', marginBottom: '8px' }}>
            {data.kpiData?.segments_with_data || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Customer Segments</div>
          <div style={{ fontSize: '12px', color: '#00e0ff', marginTop: '4px' }}>
            0%
          </div>
        </div>

        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#e930ff', marginBottom: '8px' }}>
            {data.kpiData?.retention_rate || 0}%
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Customer Retention</div>
          <div style={{ fontSize: '12px', color: '#e930ff', marginTop: '4px' }}>
            85%
          </div>
        </div>

        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#5fd4d6', marginBottom: '8px' }}>
            ${(data.kpiData?.avg_customer_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Avg Customer Value</div>
          <div style={{ fontSize: '12px', color: '#5fd4d6', marginTop: '4px' }}>
            By Avg Spend
          </div>
        </div>

        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#aa45dd', marginBottom: '8px' }}>
            {data.kpiData?.high_value_customers || 0}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>High Value Customers</div>
          <div style={{ fontSize: '12px', color: '#aa45dd', marginTop: '4px' }}>
            {data.kpiData?.total_customers > 0 ? 
              Math.round((data.kpiData.high_value_customers / data.kpiData.total_customers) * 100) : 0}% of total customers
          </div>
        </div>
      </div>

      {/* Segment Distribution */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Segment Distribution Map */}
        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f7f9fb' }}>Segment Distribution Map</h3>
          <div style={{ color: '#5891cb', marginBottom: '16px' }}>
            {data.segmentDistribution.length} segments • {data.kpiData?.total_customers || 0} customers
          </div>
          
          {data.segmentDistribution.slice(0, 6).map((segment, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: index < 5 ? '1px solid #3a4459' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: segment.segment_color
                }} />
                <span style={{ fontWeight: '500' }}>{segment.segment_name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600' }}>{segment.customer_count}</div>
                <div style={{ fontSize: '12px', color: '#5891cb' }}>
                  {segment.percentage.toFixed(1)}% of total customers
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Segment Profiles */}
        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f7f9fb' }}>Segment Profiles</h3>
          <div style={{ color: '#5891cb', marginBottom: '16px' }}>
            4 segments identified
          </div>
          
          {data.segmentDistribution.slice(0, 4).map((segment, index) => (
            <div key={index} style={{
              padding: '12px',
              marginBottom: '12px',
              background: '#1e2738',
              borderRadius: '8px',
              border: `1px solid ${segment.segment_color}33`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: '600', color: segment.segment_color }}>
                  {segment.segment_name}
                </span>
                <span style={{ fontSize: '14px', color: '#5891cb' }}>
                  {segment.customer_count} customers
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#5891cb' }}>
                Avg Lifetime Value: ${segment.avg_value?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#5891cb' }}>
                {segment.percentage.toFixed(1)}% of total customers
              </div>
            </div>
          ))}
        </div>
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

export default SimpleCustomerSegmentationDashboard; 