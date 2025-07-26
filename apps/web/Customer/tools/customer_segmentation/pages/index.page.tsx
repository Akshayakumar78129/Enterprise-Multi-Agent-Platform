import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SegmentationKpiTiles from '../ui/components/kpi/SegmentationKpiTiles';
import SegmentationFilters from '../ui/components/controls/SegmentationFilters';
import SegmentProfileCards from '../ui/components/visualizations/SegmentProfileCards';
import SegmentDistributionMap from '../ui/components/visualizations/SegmentDistributionMap';
import { RootState } from 'store';
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

const CustomerSegmentationDashboard: React.FC = () => {
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
      .then(data => {
        if (data.status === 'success') {
          dispatch(setSegmentSummaries(data.segmentSummaries));
          dispatch(setKPIs(data.kpis));
          dispatch(setScatterData(data.scatterData));
          dispatch(setCustomers(data.customers));
          setRegions([
            ...new Set(data.segmentSummaries.flatMap((s: any) => s.regions))
          ]);
          setSegments(data.segmentSummaries.map((s: any) => s.segment));
          dispatch(setError(null));
        } else {
          dispatch(setError(data.message || 'Unknown error'));
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
      <SegmentationKpiTiles kpis={kpis} />
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

export { CustomerSegmentationDashboard };
export default CustomerSegmentationDashboard; 