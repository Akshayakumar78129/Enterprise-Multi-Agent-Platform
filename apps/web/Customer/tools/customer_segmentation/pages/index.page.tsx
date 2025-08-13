import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SegmentKPITiles from '../ui/components/kpi/SegmentKPITiles';
import SegmentationFilters from '../ui/components/controls/SegmentationFilters';
import SegmentProfileCards from '../ui/components/visualizations/SegmentProfileCards';
import SegmentDistributionMap from '../ui/components/visualizations/SegmentDistributionMap';
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

  const handleSegmentSelect = useCallback(seg => {
    dispatch(setHighlights({ segment: seg }));
    dispatch(setFilters({ segment: seg }));
  }, [dispatch]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Customer Segmentation</h1>
      <div style={{ color: '#888', marginBottom: 24 }}>Explore customer segments, profiles, and distribution. Use filters to focus on specific regions or segments.</div>
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
        scatterData={filteredScatter}
        highlights={highlights}
        width={1100}
        height={420}
      />
      {error && <div style={{ color: 'red', marginTop: 24 }}>{error}</div>}
    </div>
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