import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { motion } from 'framer-motion';
// Remove the global store import since we're using a local store
import {
  setSegmentSummaries,
  setKPIs,
  setScatterData,
  setCustomers,
  setFilters,
  setHighlights,
  setLoading,
  setError
} from '../ui/state/customerSegmentationSlice';
import customerSegmentationReducer from '../ui/state/customerSegmentationSlice';
import { segmentationTheme } from '../ui/styles/theme';
import BeautifulSegmentKPITiles from '../ui/components/kpi/BeautifulSegmentKPITiles';
import EnhancedSegmentProfileCards from '../ui/components/visualizations/EnhancedSegmentProfileCards';
import EnhancedSegmentDistributionMap from '../ui/components/visualizations/EnhancedSegmentDistributionMap';
import SegmentMetricComparison from '../ui/components/visualizations/SegmentMetricComparison';
// import EnhancedSegmentationFilters from '../ui/components/controls/EnhancedSegmentationFilters';
import SegmentationDashboardWithSelection from '../ui/components/SegmentationDashboardWithSelection';
import BusinessIntelligenceAgent from '../ui/components/BusinessIntelligenceAgent';
import SegmentationFilters from '../ui/components/filters/SegmentationFilters';

const store = configureStore({
  reducer: {
    customerSegmentation: customerSegmentationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

type RootState = ReturnType<typeof store.getState>;

const EnhancedCustomerSegmentationDashboardInner: React.FC = () => {
  const dispatch = useDispatch();
  const {
    segmentSummaries,
    kpis,
    scatterData,
    customers,
    filters,
    highlights,
    loading,
    error
  } = useSelector((state: RootState) => state.customerSegmentation);

  const [regions, setRegions] = useState<string[]>([]);
  const [segments, setSegments] = useState<Array<string | number>>([]);
  const [showBIAgent, setShowBIAgent] = useState(false);

  useEffect(() => {
    dispatch(setLoading(true));
    fetch('/api/customer-segmentation/data')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          const { data } = response;
          
          // Map API response to Redux state structure
          dispatch(setSegmentSummaries(data.segment_distribution || []));
          dispatch(setKPIs(data.kpi_data || null));
          dispatch(setScatterData(data.segment_data?.map((customer: any) => ({
            x: customer.recency_days || 0,
            y: customer.frequency || 0,
            z: customer.lifetime_value || 0,
            segment: customer.segment || 'Unknown',
            customer_id: customer.customer_id || ''
          })) || []));
          dispatch(setCustomers(data.segment_data?.map((customer: any) => ({
            customer_id: customer.customer_id || '',
            customer_type: 'Standard',
            status: 'Active',
            region: 'Unknown',
            industry: 'Unknown',
            transaction_count: customer.frequency || 0,
            avg_order_value: customer.avg_order_value || 0,
            total_spend: customer.lifetime_value || 0,
            last_purchase_date: customer.last_purchase_date || '',
            credit_limit: 0,
            recency: customer.recency_days || 0,
            segment: customer.segment || 'Unknown'
          })) || []));
          
          // Extract regions and segments from the data
          const segments = [...new Set(data.segment_distribution?.map((s: any) => s.segment_name) || [])];
          const regions = ['North', 'South', 'East', 'West']; // Default regions since not in API
          
          setRegions(regions);
          setSegments(segments);
          dispatch(setError(null));
        } else {
          dispatch(setError(response.error || 'Failed to load data'));
        }
      })
      .catch(e => dispatch(setError(e.message)))
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);

  const processedKPIs = {
    totalSegments: segments.length,
    segmentationQuality: 85,
    largestSegment: segmentSummaries && segmentSummaries.length > 0 
      ? {
          name: segmentSummaries[0]?.segment_name || 'N/A',
          percentage: segmentSummaries[0]?.percentage || 0
        }
      : { name: 'N/A', percentage: 0 },
    mostValuableSegment: segmentSummaries && segmentSummaries.length > 0
      ? {
          name: segmentSummaries[0]?.segment_name || 'N/A',
          avgSpend: segmentSummaries[0]?.avg_customer_value || 0
        }
      : { name: 'N/A', avgSpend: 0 },
    segmentStability: 78,
  };

  const processedSegmentProfiles = (segmentSummaries || []).map((seg: any) => ({
    segment: seg.segment_name || seg.segment,
    customerCount: seg.customer_count || 0,
    avgSpend: seg.avg_customer_value || 0,
    frequency: Math.random() * 10, // Not available in API
    recency: Math.random() * 30, // Not available in API
    loyaltyScore: Math.random() * 100,
    engagementRate: Math.random() * 100,
    regions: ['North', 'South', 'East', 'West'], // Default regions
    characteristics: [
      'High value customers',
      'Frequent purchasers',
      'Brand loyal'
    ],
    recommendations: [
      'Target with premium product offerings',
      'Implement loyalty rewards program'
    ],
  }));

  const processedSegmentMetrics = (segmentSummaries || []).map((seg: any) => ({
    segment: seg.segment_name || seg.segment,
    avgOrderValue: seg.avg_customer_value || Math.random() * 1000,
    purchaseFrequency: Math.random() * 10,
    customerLifetimeValue: seg.total_value || Math.random() * 10000,
    recencyDays: Math.random() * 30,
    loyaltyScore: Math.random() * 100,
    engagementRate: Math.random() * 100,
  }));

  const filteredSegments = processedSegmentProfiles.filter((seg: any) => {
    if (filters?.region && !seg.regions.includes(filters.region)) return false;
    if (filters?.segment && String(seg.segment) !== String(filters.segment)) return false;
    return true;
  });

  const filteredScatter = (scatterData || []).filter((d: any) => {
    if (filters?.region) {
      const cust = (customers || []).find((c: any) => c.customer_id === d.customer_id);
      if (!cust || cust.region !== filters.region) return false;
    }
    if (filters?.segment && String(d.segment) !== String(filters.segment)) return false;
    return true;
  });

  const handleFilterChange = useCallback((val: any) => {
    dispatch(setFilters(val));
  }, [dispatch]);

  const handleSegmentSelect = useCallback((seg: number) => {
    dispatch(setHighlights({ segment: seg }));
    dispatch(setFilters({ segment: seg }));
  }, [dispatch]);

  const handlePointClick = useCallback((point: any) => {
    console.log('Selected customer:', point);
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1b 0%, #0f1923 25%, #1a202c 50%, #0f1923 75%, #0a0f1b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(0, 224, 255, 0.2)',
            borderTop: '3px solid #00e0ff',
            borderRadius: '50%',
          }}
        />
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'rgba(247, 249, 251, 0.8)',
          background: 'rgba(30, 39, 56, 0.9)',
          backdropFilter: 'blur(20px)',
          padding: '16px 32px',
          borderRadius: 20,
          border: '1px solid rgba(0, 224, 255, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)'
        }}>
          🎯 Loading Customer Segmentation Analytics...
        </div>
      </div>
    );
  }

  return (
    <>
    <SegmentationDashboardWithSelection segmentData={segmentSummaries} kpiData={processedKPIs}>
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-10px) rotate(1deg); }
            66% { transform: translateY(5px) rotate(-1deg); }
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
          
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .chart-container {
            position: relative;
            overflow: hidden;
            box-sizing: border-box;
            padding: 8px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .chart-container:hover {
            transform: translateY(-4px);
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12), 0 0 60px rgba(59, 130, 246, 0.08);
          }
          
          .dashboard-grid {
            box-sizing: border-box;
            max-width: 1600px;
            margin: 0 auto;
          }
        `}
      </style>
      
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1b 0%, #0f1923 25%, #1a202c 50%, #0f1923 75%, #0a0f1b 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Beautiful floating background elements */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(0, 224, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite'
        }} />

        <div style={{ 
          maxWidth: 1800, 
          margin: '0 auto', 
          position: 'relative', 
          zIndex: 1,
          padding: '0 20px'
        }}>
          {/* Modern Header Section */}
          <div style={{ 
            marginBottom: 48,
            textAlign: 'center',
            background: 'rgba(30, 39, 56, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            padding: '40px 32px',
            border: '1px solid rgba(0, 224, 255, 0.2)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(0, 224, 255, 0.1)'
          }}>
            <h1 style={{ 
              fontSize: 42, 
              fontWeight: 800, 
              marginBottom: 12,
              background: 'linear-gradient(135deg, #00e0ff 0%, #7c3aed 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              🎯 Customer Segmentation Analytics
            </h1>
            <div style={{ 
              color: 'rgba(247, 249, 251, 0.8)', 
              fontSize: 16,
              fontWeight: 500,
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6
            }}>
              Discover customer segments, analyze behavioral patterns, and develop targeted marketing strategies with AI-powered insights
            </div>
          </div>

          {/* KPI Section */}
          <BeautifulSegmentKPITiles kpis={processedKPIs} />

          {/* New Filters Section like Churn Dashboard */}
          <SegmentationFilters
            onFiltersChange={(newFilters) => {
              console.log('Filters changed:', newFilters);
              // You can dispatch filter changes here if needed
              // dispatch(setFilters(newFilters));
            }}
          />

          {/* Segment Profile Cards */}
          <div style={{ marginBottom: 60 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f7f9fb',
                background: 'linear-gradient(135deg, #00e0ff 0%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                📊 Segment Profiles
              </h3>
              <div style={{
                fontSize: 14,
                color: 'rgba(247, 249, 251, 0.8)',
                background: 'rgba(0, 224, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid rgba(0, 224, 255, 0.2)'
              }}>
                {filteredSegments.length} segments identified
              </div>
            </div>
            <EnhancedSegmentProfileCards
              segments={filteredSegments}
              selectedSegment={highlights?.segment}
              onSelect={handleSegmentSelect}
            />
          </div>

          {/* Visualizations Grid - Spacious Layout */}
          <div 
            className="dashboard-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', 
              gap: 48, 
              marginBottom: 60,
              gridAutoRows: '650px',
              padding: '20px 0'
            }}>
            <div 
              className="chart-container"
              style={{ 
                width: '100%',
                height: '100%',
                minHeight: '650px'
              }}>
              <EnhancedSegmentDistributionMap
                scatterData={filteredScatter}
                highlights={highlights || {}}
                onPointClick={handlePointClick}
              />
            </div>
            <div 
              className="chart-container"
              style={{ 
                width: '100%',
                height: '100%',
                minHeight: '650px'
              }}>
              <SegmentMetricComparison
                segments={processedSegmentMetrics}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: 20,
              marginTop: 32,
              color: '#dc2626',
              textAlign: 'center',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </SegmentationDashboardWithSelection>
    
    {/* Business Intelligence Agent */}
    {showBIAgent && (
      <BusinessIntelligenceAgent onClose={() => setShowBIAgent(false)} />
    )}
    
    {/* Floating BI Agent Button */}
    <button
      onClick={() => setShowBIAgent(true)}
      style={{
        position: 'fixed',
        bottom: 100,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        border: 'none',
        color: 'white',
        fontSize: 28,
        cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        zIndex: 999
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.6)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4)';
      }}
      title="Open Business Intelligence Agent"
    >
      🤖
    </button>
    </>
  );
};

const EnhancedCustomerSegmentationDashboard: React.FC = () => {
  return (
    <Provider store={store}>
      <EnhancedCustomerSegmentationDashboardInner />
    </Provider>
  );
};

export default EnhancedCustomerSegmentationDashboard;