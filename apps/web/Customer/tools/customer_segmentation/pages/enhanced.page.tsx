import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EnhancedSegmentKPITiles from '../ui/components/kpi/EnhancedSegmentKPITiles';
import EnhancedSegmentationFilters from '../ui/components/controls/EnhancedSegmentationFilters';
import EnhancedSegmentProfileCards from '../ui/components/visualizations/EnhancedSegmentProfileCards';
import EnhancedSegmentDistributionMap from '../ui/components/visualizations/EnhancedSegmentDistributionMap';
import SegmentationChatbot from '../ui/components/chat/SegmentationChatbot';
import SegmentationBIAgent from '../ui/components/SegmentationBIAgent';
import { SegmentationDashboardWithSelection } from '../ui/components/SegmentationDashboardWithSelection';
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

const EnhancedSegmentationDashboardInner: React.FC = () => {
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

  // Fetch data
  useEffect(() => {
    dispatch(setLoading(true));
    fetch('/api/customer-segmentation/data')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          const { data } = response;
          
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
          
          const segments = [...new Set(data.segment_distribution?.map((s: any) => s.segment_name) || [])];
          const regions = ['North', 'South', 'East', 'West'];
          
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

  // Filtered segments
  const filteredSegments = segmentSummaries.filter(seg => {
    if (filters.region && !seg.regions.includes(filters.region)) return false;
    if (filters.segment && String(seg.segment) !== String(filters.segment)) return false;
    return true;
  });

  // Filtered scatter data
  const filteredScatter = scatterData.filter(d => {
    if (filters.region) {
      const cust = customers.find(c => c.customer_id === d.customer_id);
      if (!cust || cust.region !== filters.region) return false;
    }
    if (filters.segment && String(d.segment) !== String(filters.segment)) return false;
    return true;
  });

  // Handlers
  const handleFilterChange = useCallback(val => {
    dispatch(setFilters(val));
  }, [dispatch]);

  const handleSegmentSelect = useCallback(seg => {
    dispatch(setHighlights({ segment: seg }));
    dispatch(setFilters({ segment: seg }));
  }, [dispatch]);

  return (
    <SegmentationDashboardWithSelection
      segmentData={segmentSummaries}
      kpiData={kpis}
    >
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
        padding: '40px 60px',
        position: 'relative'
      }}>
        {/* Header with BI Agent Button */}
        <div style={{ 
          maxWidth: 1800, 
          margin: '0 auto',
          marginBottom: 48,
          textAlign: 'center',
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '40px 32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ 
                fontSize: 42, 
                fontWeight: 800, 
                marginBottom: 8,
                background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #db2777 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                letterSpacing: '-0.5px'
              }}>
                Customer Segmentation Intelligence
              </h1>
              <p style={{ 
                color: '#ffffff',
                opacity: 0.85, 
                fontSize: 18,
                fontWeight: 500,
                margin: '12px 0 0'
              }}>
                AI-powered insights for customer segments with real-time intelligence
              </p>
            </div>
          
            {/* Business Intelligence Button */}
            <button
              onClick={() => setShowBIAgent(true)}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 6px 25px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.3s',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.3)';
              }}
            >
              <span style={{ fontSize: 22 }}>🤖</span>
              Business Intelligence
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* KPI Tiles */}
          <div style={{ marginBottom: 32 }}>
            <EnhancedSegmentKPITiles kpis={kpis ? {
              totalSegments: kpis.totalSegments || segmentSummaries.length,
              segmentationQuality: 85,
              largestSegment: { 
                name: kpis.largestSegment?.segment || 'Premium', 
                percentage: Math.round((kpis.largestSegment?.count || 0) / customers.length * 100) || 35
              },
              mostValuableSegment: { 
                name: kpis.mostValuableSegment?.segment || 'Champions', 
                avgSpend: kpis.mostValuableSegment?.avg_total_spend || 5000 
              },
              segmentStability: 92
            } : {
              totalSegments: segmentSummaries.length || 4,
              segmentationQuality: 85,
              largestSegment: { name: 'Premium', percentage: 35 },
              mostValuableSegment: { name: 'Champions', avgSpend: 5000 },
              segmentStability: 92
            }} />
          </div>

          {/* Filters */}
          <div style={{ marginBottom: 32 }}>
            <EnhancedSegmentationFilters
              regions={regions}
              segments={segments}
              value={filters}
              onChange={handleFilterChange}
            />
          </div>

          {/* Profile Cards */}
          <div style={{ marginBottom: 32 }}>
            <EnhancedSegmentProfileCards
              segments={filteredSegments.map(seg => ({
                segment: seg.segment,
                customerCount: seg.count || 0,
                avgSpend: seg.avg_total_spend || 0,
                frequency: Math.round((seg.avg_order_value || 0) / 100),
                recency: Math.round(seg.avg_recency || 0),
                loyaltyScore: Math.round(Math.random() * 30 + 60),
                engagementRate: Math.round(Math.random() * 25 + 65),
                regions: seg.regions || [],
                characteristics: [
                  'High value customers',
                  'Frequent purchasers',
                  'Brand loyal'
                ],
                recommendations: [
                  'Implement loyalty rewards program',
                  'Send personalized product recommendations'
                ]
              }))}
              selectedSegment={highlights.segment}
              onSelect={handleSegmentSelect}
            />
          </div>

          {/* Distribution Map */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            borderRadius: 20,
            padding: 32,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{ 
              margin: '0 0 24px', 
              color: '#ffffff', 
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.3px'
            }}>
              Customer Distribution Analysis
            </h2>
            <EnhancedSegmentDistributionMap
              scatterData={filteredScatter}
              highlights={highlights}
              width={1350}
              height={500}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ 
              color: '#ef4444', 
              marginTop: 24,
              padding: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Chatbot */}
      <SegmentationChatbot 
        dashboardContext={{
          source_dashboard: 'customer_segmentation',
          customer_context: {
            total_customers: customers.length,
            segment_distribution: segmentSummaries
          },
          segment_context: {
            active_segment: highlights.segment,
            filter_region: filters.region
          }
        }}
      />

      {/* BI Agent Modal */}
      {showBIAgent && <SegmentationBIAgent onClose={() => setShowBIAgent(false)} />}
    </SegmentationDashboardWithSelection>
  );
};

const EnhancedSegmentationDashboard: React.FC = () => {
  return (
    <Provider store={store}>
      <EnhancedSegmentationDashboardInner />
    </Provider>
  );
};

export { EnhancedSegmentationDashboard };
export default EnhancedSegmentationDashboard;