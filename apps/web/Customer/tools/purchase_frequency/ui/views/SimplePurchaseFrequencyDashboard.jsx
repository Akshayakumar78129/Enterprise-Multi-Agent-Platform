import React, { useState, useEffect } from "react";

const SimplePurchaseFrequencyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      console.log('🚀 Fetching purchase frequency data...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/purchase-frequency/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: {
            start: '2017-01-01',
            end: '2021-12-31'
          }
        }),
      });

      const result = await response.json();
      console.log('✅ Data received:', result);
      console.log('📊 KPIs in result:', result.data?.kpis);
      
      if (result.success && result.data) {
        setData(result.data);
        console.log('✅ Data set successfully');
      } else {
        setError(result.error || 'No data received from API');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Network error: ' + err.message);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    // Fallback: If still loading after 3 seconds, show the dashboard anyway
    const fallbackTimer = setTimeout(() => {
      if (loading) {
        console.log('⏰ Fallback timer: Showing dashboard anyway');
        setLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Show loading state
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
          <div style={{ fontSize: '18px', color: '#00e0ff', marginBottom: '20px' }}>
            Loading Purchase Frequency Data...
          </div>
          <button 
            onClick={() => setLoading(false)}
            style={{
              background: '#232a36',
              color: '#00e0ff',
              border: '1px solid #00e0ff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Show Dashboard Anyway
          </button>
        </div>
      </div>
    );
  }

  // Show error state
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
          <button 
            onClick={fetchData}
            style={{
              background: '#232a36',
              color: '#00e0ff',
              border: '1px solid #00e0ff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering dashboard with data:', data);
  console.log('🎯 KPIs for render:', data?.kpis);

  // Provide fallback data if none exists
  const kpis = data?.kpis || {
    totalCustomers: 0,
    avgPurchaseFrequency: 0,
    avgDaysBetween: 0,
    activeCustomerPercentage: 0,
    highValuePercentage: 0,
    avgCustomerValue: 0
  };

  const metadata = data?.metadata || {
    totalCustomers: 0,
    activeCustomers: 0,
    avgFrequency: 0
  };

  const valueSegments = data?.valueSegments || [];

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
          Purchase Frequency Analyzer
        </h1>
        <p style={{ fontSize: '16px', color: '#5891cb', margin: '0' }}>
          Real customer data analysis from historical transactions (2017-2021)
        </p>
        <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span style={{ color: '#5891cb' }}>
            Date Range: 2017-01-01 to 2021-12-31
          </span>
          <button 
            onClick={fetchData}
            style={{
              background: '#232a36',
              color: '#00e0ff',
              border: '1px solid #00e0ff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        background: data ? '#1a4d4d' : '#4d1a1a',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '24px',
        border: `1px solid ${data ? '#00e0ff' : '#ff6b6b'}`
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          {data ? '✅ Real database data loaded successfully' : '⚠️ No data loaded - showing placeholder values'}
        </div>
        {data && (
          <div style={{ fontSize: '12px', color: '#5891cb', marginTop: '4px' }}>
            Last updated: {new Date().toLocaleString()}
          </div>
        )}
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
            {kpis.totalCustomers?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Total Customers</div>
          <div style={{ fontSize: '12px', color: '#00e0ff', marginTop: '4px' }}>
            👥
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
            {kpis.avgPurchaseFrequency?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Avg Purchase Frequency</div>
          <div style={{ fontSize: '12px', color: '#e930ff', marginTop: '4px' }}>
            🔄
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
            {kpis.avgDaysBetween?.toFixed(1) || '0.0'}
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Avg Days Between</div>
          <div style={{ fontSize: '12px', color: '#5fd4d6', marginTop: '4px' }}>
            📅 days
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
            {kpis.activeCustomerPercentage?.toFixed(1) || '0.0'}%
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>Active Customers (90d)</div>
          <div style={{ fontSize: '12px', color: '#aa45dd', marginTop: '4px' }}>
            ⚡
          </div>
        </div>

        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffaa00', marginBottom: '8px' }}>
            {kpis.highValuePercentage?.toFixed(1) || '0.0'}%
          </div>
          <div style={{ fontSize: '14px', color: '#5891cb' }}>High Value Customers</div>
          <div style={{ fontSize: '12px', color: '#ffaa00', marginTop: '4px' }}>
            💎
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Dataset Overview */}
        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f7f9fb' }}>Dataset Overview</h3>
          <div style={{ color: '#5891cb', marginBottom: '16px' }}>
            {metadata.totalCustomers?.toLocaleString() || '0'} customers analyzed
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#8893a7', fontSize: '14px' }}>
              • {metadata.activeCustomers?.toLocaleString() || '0'} active customers (90 days)
            </div>
            <div style={{ color: '#8893a7', fontSize: '14px' }}>
              • {metadata.avgFrequency?.toFixed(2) || '0.00'} average purchases per customer
            </div>
            <div style={{ color: '#8893a7', fontSize: '14px' }}>
              • ${kpis.avgCustomerValue?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'} average customer value
            </div>
          </div>
        </div>

        {/* Value Segments Summary */}
        <div style={{
          background: '#232a36',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #3a4459'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f7f9fb' }}>Value Segments</h3>
          <div style={{ color: '#5891cb', marginBottom: '16px' }}>
            {valueSegments.length || 0} segments identified
          </div>
          
          {valueSegments.length > 0 ? valueSegments.slice(0, 4).map((segment, index) => (
            <div key={index} style={{
              padding: '8px 0',
              borderBottom: index < 3 ? '1px solid #3a4459' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '500', color: '#f7f9fb' }}>{segment.segment}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {segment.customerCount?.toLocaleString()} customers
                </div>
                <div style={{ fontSize: '12px', color: '#5891cb' }}>
                  {segment.percentage}% • ${segment.avgValue?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'} avg
                </div>
              </div>
            </div>
          )) : (
            <div style={{ color: '#8893a7', fontSize: '14px', fontStyle: 'italic' }}>
              No segment data available
            </div>
          )}
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

export default SimplePurchaseFrequencyDashboard; 