import React, { useState, useEffect, useMemo, useCallback } from "react";
import SegmentKPITiles from "../components/kpi/SegmentKPITiles";
import SegmentDistributionMap from "../components/visualizations/SegmentDistributionMap";
import SegmentProfileCards from "../components/visualizations/SegmentProfileCards";
import SegmentMetricComparison from "../components/visualizations/SegmentMetricComparison";

const CustomerSegmentationDashboard = ({
  initialFilters = {},
  onFiltersChange,
  className = ''
}) => {
  // State management
  const [data, setData] = useState({
    segmentData: [],
    kpiData: null,
    segmentDistribution: [],
    segmentComparison: [],
    segmentAttributes: null
  });
  
  const [uiState, setUIState] = useState({
    loading: true,
    error: null,
    selectedSegments: [],
    selectedCustomer: null,
    selectedSegment: null,
    selectedMetric: 'avg_lifetime_value',
    showPercentageView: false,
    sortBy: 'value',
    sortOrder: 'desc'
  });

  const [filters, setFilters] = useState(initialFilters);
  const [customerDetailPanel, setCustomerDetailPanel] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'detailed'

  // Memoized data processing for performance
  const processedData = useMemo(() => {
    if (!data.segmentData.length) return { sampledData: [], fullData: [] };
    
    // For performance, limit the visualization to a sample for overview mode
    const sampledData = viewMode === 'overview' 
      ? data.segmentData.slice(0, 1000) // Show first 1000 customers for performance
      : data.segmentData;
    
    return {
      sampledData,
      fullData: data.segmentData,
      sampleSize: sampledData.length,
      totalSize: data.segmentData.length
    };
  }, [data.segmentData, viewMode]);

  // Fetch data on component mount and filter changes
  useEffect(() => {
    fetchSegmentationData();
  }, [filters]);

  const fetchSegmentationData = useCallback(async () => {
    console.log('🚀 CustomerSegmentationDashboard: Starting data fetch');
    setUIState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('📊 Fetching from /api/customer-segmentation/data');
      const response = await fetch('/api/customer-segmentation/data');
      const result = await response.json();
      console.log('✅ API Response:', result);
      
      if (result.success) {
        const newData = {
          segmentData: result.data.segment_data || [],
          kpiData: result.data.kpi_data || null,
          segmentDistribution: result.data.segment_distribution || [],
          segmentComparison: result.data.segment_comparison || [],
          segmentAttributes: result.data.segment_attributes || null
        };
        console.log('📈 Setting dashboard data:', newData);
        setData(newData);
      } else {
        console.error('❌ API returned error:', result.error);
        setUIState(prev => ({ 
          ...prev, 
          error: result.error || 'Failed to fetch segmentation data' 
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching segmentation data:', error);
      setUIState(prev => ({ 
        ...prev, 
        error: 'Network error: Unable to fetch data' 
      }));
    } finally {
      console.log('🏁 Setting loading to false');
      setUIState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Optimized event handlers with useCallback
  const handleSegmentFilter = useCallback((segments) => {
    setUIState(prev => ({ ...prev, selectedSegments: segments }));
  }, []);

  const handleCustomerSelect = useCallback((customer) => {
    setUIState(prev => ({ ...prev, selectedCustomer: customer }));
    setCustomerDetailPanel(!!customer);
  }, []);

  const handleSegmentSelect = useCallback((segmentName) => {
    setUIState(prev => ({ ...prev, selectedSegment: segmentName }));
  }, []);

  const handleMetricChange = useCallback((metric) => {
    setUIState(prev => ({ ...prev, selectedMetric: metric }));
  }, []);

  const handleViewToggle = useCallback((showPercentage) => {
    setUIState(prev => ({ ...prev, showPercentageView: showPercentage }));
  }, []);

  const handleSortChange = useCallback((sortBy, order) => {
    setUIState(prev => ({ ...prev, sortBy, sortOrder: order }));
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleKPIClick = useCallback((kpiType) => {
    // Handle KPI tile clicks for drilling down
    switch (kpiType) {
      case 'segments':
        // Focus on segment distribution
        break;
      case 'quality':
        // Show quality metrics
        break;
      case 'distribution':
        // Highlight largest segment
        if (data.segmentDistribution.length > 0) {
          const largestSegment = data.segmentDistribution.reduce((max, segment) => 
            segment.customer_count > max.customer_count ? segment : max
          );
          handleSegmentFilter([largestSegment.segment_name]);
        }
        break;
      case 'valuable':
        // Highlight most valuable segment
        if (data.kpiData?.most_valuable_segment) {
          handleSegmentFilter([data.kpiData.most_valuable_segment]);
        }
        break;
      case 'stability':
        // Show stability metrics
        break;
      default:
        break;
    }
  }, [data.segmentDistribution, data.kpiData, handleSegmentFilter]);

  // Memoized filtered data for performance
  const filteredData = useMemo(() => {
    const dataToFilter = processedData.sampledData;
    
    const filteredSegmentData = dataToFilter.filter(customer => {
      if (uiState.selectedSegments.length === 0) return true;
      return uiState.selectedSegments.includes(customer.segment_name);
    });

    const filteredDistribution = data.segmentDistribution.filter(segment => {
      if (uiState.selectedSegments.length === 0) return true;
      return uiState.selectedSegments.includes(segment.segment_name);
    });

    const filteredComparison = data.segmentComparison.filter(segment => {
      if (uiState.selectedSegments.length === 0) return true;
      return uiState.selectedSegments.includes(segment.segment_name);
    });

    return {
      segmentData: filteredSegmentData,
      distribution: filteredDistribution,
      comparison: filteredComparison
    };
  }, [processedData.sampledData, data.segmentDistribution, data.segmentComparison, uiState.selectedSegments]);

  const handleSegmentExport = useCallback((segmentName) => {
    // Export segment data using full dataset
    const segmentCustomers = processedData.fullData.filter(
      customer => customer.segment_name === segmentName
    );
    
    const csvContent = [
      ['Customer Name', 'RFM-RL Score', 'Lifetime Value', 'Avg Order Value', 'Transaction Count', 'Days Since Last Activity'],
      ...segmentCustomers.map(customer => [
        customer.customer_name,
        customer.rfm_rl_score,
        customer.lifetime_value,
        customer.avg_order_value,
        customer.transaction_count,
        customer.days_since_last_activity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segment_${segmentName}_customers.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [processedData.fullData]);

  // Debug logging
  console.log('🔍 Dashboard render - loading:', uiState.loading, 'error:', uiState.error, 'dataLength:', data.segmentData.length);
  
  // Loading state
  if (uiState.loading) {
    console.log('🔄 Rendering loading state');
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#181e2a', 
        color: '#f7f9fb', 
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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

  // Error state
  if (uiState.error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#181e2a', 
        color: '#f7f9fb', 
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          textAlign: 'center',
          padding: '40px',
          borderRadius: '16px',
          background: '#1e2738',
          border: '1px solid #e930ff'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px', color: '#e930ff' }}>⚠️ Error</div>
          <div style={{ fontSize: '16px', marginBottom: '20px' }}>{uiState.error}</div>
          <button 
            onClick={fetchSegmentationData}
            style={{
              padding: '12px 24px',
              background: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#181e2a', 
      color: '#f7f9fb', 
      fontFamily: 'Inter, sans-serif',
      padding: 0
    }}>
      {/* Header */}
      <div style={{ 
        padding: '32px 40px 0 40px', 
        borderBottom: '2px solid #232a36', 
        background: '#232a36'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '800', 
              margin: '0',
              background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Customer Segmentation Dashboard
            </h1>
            <div style={{ 
              color: '#b0b8c9', 
              marginTop: '4px', 
              marginBottom: '16px',
              fontSize: '16px'
            }}>
              AI-powered customer segmentation analytics and insights
            </div>
          </div>
          
          {/* View Mode Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ 
              display: 'flex', 
              background: '#1e2738',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #232a36'
            }}>
              <button
                onClick={() => handleViewModeChange('overview')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'overview' ? '#00e0ff' : 'transparent',
                  color: viewMode === 'overview' ? '#0a1224' : '#f7f9fb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Overview
              </button>
              <button
                onClick={() => handleViewModeChange('detailed')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'detailed' ? '#00e0ff' : 'transparent',
                  color: viewMode === 'detailed' ? '#0a1224' : '#f7f9fb',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Detailed
              </button>
            </div>
            
            <button
              onClick={fetchSegmentationData}
              style={{
                padding: '8px 16px',
                background: '#232a36',
                color: '#00e0ff',
                border: '1px solid #00e0ff',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>
        
        {/* Performance Warning */}
        {viewMode === 'detailed' && processedData.totalSize > 2000 && (
          <div style={{
            background: 'rgba(233, 48, 255, 0.1)',
            border: '1px solid #e930ff',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '14px',
            color: '#e930ff'
          }}>
            ⚠️ Detailed view with {processedData.totalSize.toLocaleString()} customers may impact performance. Consider using Overview mode for faster interaction.
          </div>
        )}
        
        {/* Data Counter */}
        <div style={{ 
          fontSize: '14px', 
          color: '#b0b8c9', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <span>
            Showing {processedData.sampleSize.toLocaleString()} of {processedData.totalSize.toLocaleString()} customers
          </span>
          {uiState.selectedSegments.length > 0 && (
            <span style={{ color: '#00e0ff' }}>
              • Filtered to {uiState.selectedSegments.length} segment{uiState.selectedSegments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '32px', 
        padding: '32px 40px'
      }}>
        {/* Left Column - Main Visualizations */}
        <div style={{ flex: 3, minWidth: 0 }}>
          {/* KPI Tiles */}
          <SegmentKPITiles 
            kpiData={data.kpiData}
            segmentDistribution={data.segmentDistribution}
            loading={uiState.loading}
            onKPIClick={handleKPIClick}
          />
          
          {/* Top Row - Distribution Map and Profile Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '32px', 
            marginTop: '32px' 
          }}>
            <SegmentDistributionMap
              data={filteredData.segmentData}
              selectedSegments={uiState.selectedSegments}
              onSegmentFilter={handleSegmentFilter}
              onCustomerSelect={handleCustomerSelect}
              selectedCustomer={uiState.selectedCustomer}
              width={760}
              height={560}
              viewMode={viewMode}
              performanceMode={processedData.totalSize > 2000}
            />
            
            <SegmentProfileCards
              segmentDistribution={filteredData.distribution}
              segmentComparison={filteredData.comparison}
              onSegmentSelect={handleSegmentSelect}
              onSegmentExport={handleSegmentExport}
              selectedSegment={uiState.selectedSegment}
              width={320}
              height={400}
            />
          </div>
          
          {/* Bottom Row - Metric Comparison */}
          <div style={{ marginTop: '32px' }}>
            <SegmentMetricComparison
              segmentComparison={filteredData.comparison}
              selectedMetric={uiState.selectedMetric}
              onMetricChange={handleMetricChange}
              showPercentageView={uiState.showPercentageView}
              onViewToggle={handleViewToggle}
              sortBy={uiState.sortBy}
              sortOrder={uiState.sortOrder}
              onSortChange={handleSortChange}
              width={760}
              height={440}
            />
          </div>
        </div>
        
        {/* Right Column - Insights and Details */}
        <div style={{ 
          flex: 1, 
          minWidth: '340px', 
          maxWidth: '400px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '32px' 
        }}>
          {/* Segment Insights */}
          <div style={{
            background: 'linear-gradient(135deg, #232a36, #2c3341)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #3a4459',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00e0ff, #0099cc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🤖
              </div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#f7f9fb'
              }}>
                Segment Insights
              </h3>
            </div>
            
            <div style={{
              background: '#1e2738',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              borderLeft: '4px solid #00e0ff'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#00e0ff',
                marginBottom: '8px'
              }}>
                Key Finding
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                {data.segmentDistribution.length > 0 ? (
                  <>
                    Your largest segment ({data.segmentDistribution[0]?.segment_name}) contains{' '}
                    {((data.segmentDistribution[0]?.customer_count / processedData.totalSize) * 100).toFixed(1)}% 
                    of customers with an average lifetime value of{' '}
                    ${data.segmentDistribution[0]?.avg_lifetime_value?.toFixed(2) || 'N/A'}.
                  </>
                ) : (
                  'Analyzing segment characteristics...'
                )}
              </div>
            </div>
            
            <div style={{
              background: '#1e2738',
              borderRadius: '12px',
              padding: '16px',
              borderLeft: '4px solid #e930ff'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#e930ff',
                marginBottom: '8px'
              }}>
                Recommendation
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Focus retention efforts on high-value segments and develop targeted acquisition strategies for underrepresented valuable customer profiles.
              </div>
            </div>
          </div>
          
          {/* Segment Actions */}
          <div style={{
            background: 'linear-gradient(135deg, #232a36, #2c3341)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #3a4459',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#f7f9fb'
            }}>
              Quick Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleSegmentExport('all')}
                style={{
                  padding: '12px 16px',
                  background: '#00e0ff',
                  color: '#0a1224',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Export All Segments
              </button>
              
              <button
                onClick={() => setUIState(prev => ({ ...prev, selectedSegments: [] }))}
                style={{
                  padding: '12px 16px',
                  background: '#232a36',
                  color: '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Detail Panel */}
      {customerDetailPanel && uiState.selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          background: '#1e2738',
          borderLeft: '1px solid #3a4459',
          padding: '24px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '-4px 0 16px rgba(0,0,0,0.25)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              margin: 0,
              color: '#f7f9fb'
            }}>
              Customer Details
            </h3>
            <button
              onClick={() => setCustomerDetailPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b0b8c9',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            background: '#232a36',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#f7f9fb'
            }}>
              {uiState.selectedCustomer.customer_name}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#b0b8c9',
              marginBottom: '12px'
            }}>
              Segment: {uiState.selectedCustomer.segment_name}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#b0b8c9' }}>Lifetime Value</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#00e0ff' }}>
                  ${uiState.selectedCustomer.lifetime_value?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#b0b8c9' }}>Avg Order Value</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#00e0ff' }}>
                  ${uiState.selectedCustomer.avg_order_value?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#b0b8c9' }}>Transactions</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#00e0ff' }}>
                  {uiState.selectedCustomer.transaction_count || 'N/A'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#b0b8c9' }}>Days Since Last</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#00e0ff' }}>
                  {uiState.selectedCustomer.days_since_last_activity || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Styles */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default CustomerSegmentationDashboard; 