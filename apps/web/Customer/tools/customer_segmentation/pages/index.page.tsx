import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dynamic from 'next/dynamic';
import SegmentKPITiles from '../ui/components/kpi/SegmentKPITiles';
import SegmentationFilters from '../ui/components/controls/SegmentationFilters';
import SegmentProfileCards from '../ui/components/visualizations/SegmentProfileCards';
import SegmentDistributionMap from '../ui/components/visualizations/SegmentDistributionMap';

// Dynamic import of ChartSelectionManager
const ChartSelectionManager = dynamic(
  () => import('../../churn_prediction/ui/components/selection/ChartSelectionManager'),
  { ssr: false }
);
// Remove global store import - using local store
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

const CustomerSegmentationDashboardInner: React.FC = () => {
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
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [aiInsightContent, setAiInsightContent] = useState<any>(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });

  // Fetch data
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

  const handleSegmentSelect = useCallback((seg, event?: React.MouseEvent) => {
    // Check if shift key is pressed
    if (event?.shiftKey) {
      // Shift+click: Use ChartSelectionManager for multi-selection
      const selectionAPI = (window as any).chartSelectionAPI;
      if (selectionAPI) {
        const point = {
          chartId: 'segment-profile',
          chartType: 'segment-card',
          dataIndex: 0,
          label: seg,
          value: segmentSummaries.find(s => s.segment === seg)?.customer_count || 0,
          unit: ' customers',
          coordinates: { x: event.clientX, y: event.clientY }
        };
        selectionAPI.addPoint(point);
      }
    } else {
      // Regular click: Show AI insight
      dispatch(setHighlights({ segment: seg }));
      dispatch(setFilters({ segment: seg }));
      
      // Generate and show AI insight
      const segmentData = segmentSummaries.find(s => s.segment === seg);
      if (segmentData && event) {
        const insight = generateSegmentInsight(segmentData);
        setAiInsightContent(insight);
        setInsightPosition({ x: event.clientX, y: event.clientY });
        setShowAIInsight(true);
      }
    }
  }, [dispatch, segmentSummaries]);

  const generateSegmentInsight = (segment: any) => {
    return {
      title: segment.segment,
      summary: `${segment.customer_count || 0} customers with ${segment.avg_lifetime_value ? '$' + segment.avg_lifetime_value.toFixed(0) : 'unknown'} average lifetime value`,
      details: [
        `📊 Customer Count: ${segment.customer_count || 0}`,
        `💰 Avg Lifetime Value: ${segment.avg_lifetime_value ? '$' + segment.avg_lifetime_value.toFixed(0) : 'N/A'}`,
        `📈 Growth Rate: ${segment.growth_rate || '0'}%`
      ],
      recommendations: [
        'Increase engagement with personalized campaigns',
        'Offer loyalty rewards to high-value customers',
        'Monitor segment trends weekly'
      ]
    };
  };

  // Handle escape key to close AI insight popup
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAIInsight(false);
      }
    };
    
    if (showAIInsight) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showAIInsight]);

  return (
    <ChartSelectionManager
      onSelectionChange={(points) => {
        console.log('Selected points:', points);
      }}
      onShowMessage={(message, position) => {
        // This will be handled by ChartSelectionManager's built-in UI
        console.log('Selection message:', message);
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Customer Segmentation</h1>
        <div style={{ color: '#888', marginBottom: 24 }}>Explore customer segments, profiles, and distribution. Use filters to focus on specific regions or segments.</div>
        
        {/* Tip for users */}
        <div style={{
          marginBottom: 16,
          padding: '8px 12px',
          background: 'rgba(0, 224, 255, 0.1)',
          borderRadius: 8,
          border: '1px solid rgba(0, 224, 255, 0.3)',
          fontSize: 13,
          color: 'rgba(247, 249, 251, 0.8)'
        }}>
          💡 <strong>Tip:</strong> Click for AI insights | Shift+Click for multi-selection | ESC to clear
        </div>
        
        <SegmentKPITiles kpis={kpis} />
        <SegmentationFilters
          regions={regions}
          segments={segments}
          value={filters}
          onChange={handleFilterChange}
        />
        <SegmentProfileCards
          segments={filteredSegments}
          selectedSegment={highlights.segment}
          onSelect={handleSegmentSelect}
        />
        <SegmentDistributionMap
          data={filteredScatter}
          highlights={highlights}
          width={1100}
          height={420}
          onCustomerSelect={(customer: any, event?: React.MouseEvent) => {
            if (event && !event.shiftKey) {
              // Regular click: Show AI insight for customer
              const customerInsight = {
                title: `Customer ${customer.customer_id || 'Unknown'}`,
                summary: `${customer.segment || 'Unknown'} segment customer`,
                details: [
                  `📊 Segment: ${customer.segment || 'Unknown'}`,
                  `💰 Lifetime Value: $${customer.lifetime_value?.toFixed(0) || '0'}`,
                  `📈 RFM Score: ${customer.rfm_score || 'N/A'}`
                ],
                recommendations: [
                  'Analyze purchase history',
                  'Send personalized offers',
                  'Monitor engagement metrics'
                ]
              };
              setAiInsightContent(customerInsight);
              setInsightPosition({ x: event.clientX, y: event.clientY });
              setShowAIInsight(true);
            }
          }}
        />
        {error && <div style={{ color: 'red', marginTop: 24 }}>{error}</div>}
        
        {/* AI Insight Popup */}
        {showAIInsight && aiInsightContent && (
          <div
            style={{
              position: 'fixed',
              left: insightPosition.x,
              top: insightPosition.y,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, #1e2738, #2a3447)',
              border: '2px solid rgba(124, 58, 237, 0.5)',
              borderRadius: 12,
              padding: 20,
              maxWidth: 400,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
              zIndex: 1001,
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#f7f9fb', fontSize: 18 }}>
                {aiInsightContent.title}
              </h3>
              <button
                onClick={() => setShowAIInsight(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(247, 249, 251, 0.6)',
                  fontSize: 20,
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.9)', marginBottom: 12 }}>
              {aiInsightContent.summary}
            </div>
            
            {aiInsightContent.details && (
              <div style={{ marginBottom: 12 }}>
                {aiInsightContent.details.map((detail: string, idx: number) => (
                  <div key={idx} style={{ fontSize: 12, color: 'rgba(247, 249, 251, 0.8)', marginBottom: 4 }}>
                    {detail}
                  </div>
                ))}
              </div>
            )}
            
            {aiInsightContent.recommendations && (
              <div style={{
                background: 'rgba(0, 230, 118, 0.1)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: 6,
                padding: 8
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#00e676', marginBottom: 6 }}>
                  ⚡ Recommendations
                </div>
                {aiInsightContent.recommendations.map((rec: string, idx: number) => (
                  <div key={idx} style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.8)', marginBottom: 2 }}>
                    • {rec}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.6)', marginTop: 12, textAlign: 'center' }}>
              Press <strong>Shift+Click</strong> for multi-selection
            </div>
          </div>
        )}
      </div>
    </ChartSelectionManager>
  );
};

const CustomerSegmentationDashboard: React.FC = () => {
  return (
    <Provider store={store}>
      <CustomerSegmentationDashboardInner />
    </Provider>
  );
};

export { CustomerSegmentationDashboard };
export default CustomerSegmentationDashboard; 