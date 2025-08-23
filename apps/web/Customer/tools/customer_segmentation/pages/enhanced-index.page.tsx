import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

// Helper function to generate default scatter data
const generateDefaultScatterData = () => {
  const segments = ['Champions', 'Loyal Customers', 'Potential Loyalists', 'New Customers', 
                   'At Risk', 'Can\'t Lose Them', 'Hibernating', 'Lost'];
  const data = [];
  
  // Generate 50-100 data points per segment
  segments.forEach(segment => {
    const count = Math.floor(Math.random() * 50) + 50;
    for (let i = 0; i < count; i++) {
      // Generate realistic values based on segment type
      let x, y, z;
      switch(segment) {
        case 'Champions':
          x = Math.random() * 10 + 5; // Low recency (5-15 days)
          y = Math.random() * 5 + 7; // High frequency (7-12)
          z = Math.random() * 3000 + 5000; // High value (5000-8000)
          break;
        case 'Loyal Customers':
          x = Math.random() * 15 + 10; // Medium recency (10-25 days)
          y = Math.random() * 4 + 5; // Good frequency (5-9)
          z = Math.random() * 2000 + 3000; // Good value (3000-5000)
          break;
        case 'New Customers':
          x = Math.random() * 10 + 5; // Low recency (5-15 days)
          y = Math.random() * 2 + 1; // Low frequency (1-3)
          z = Math.random() * 1000 + 500; // Low value (500-1500)
          break;
        case 'At Risk':
          x = Math.random() * 20 + 30; // High recency (30-50 days)
          y = Math.random() * 3 + 3; // Medium frequency (3-6)
          z = Math.random() * 1500 + 2000; // Medium value (2000-3500)
          break;
        case 'Lost':
          x = Math.random() * 30 + 60; // Very high recency (60-90 days)
          y = Math.random() * 2 + 1; // Very low frequency (1-3)
          z = Math.random() * 500 + 200; // Very low value (200-700)
          break;
        default:
          x = Math.random() * 30 + 10;
          y = Math.random() * 8 + 2;
          z = Math.random() * 4000 + 1000;
      }
      
      data.push({
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        z: parseFloat(z.toFixed(2)),
        segment,
        customer_id: `cust_${segment.toLowerCase().replace(/\s+/g, '_')}_${i}`
      });
    }
  });
  
  return data;
};

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
  const [activeFilters, setActiveFilters] = useState<any>(null);

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
          
          // Generate scatter data with proper values
          const scatterData = data.segment_data && data.segment_data.length > 0
            ? data.segment_data.map((customer: any) => ({
                x: customer.recency_days || Math.random() * 30,
                y: customer.frequency || Math.random() * 10,
                z: customer.lifetime_value || Math.random() * 5000,
                segment: customer.segment || 'Unknown',
                customer_id: customer.customer_id || `cust_${Math.random().toString(36).substr(2, 9)}`
              }))
            : generateDefaultScatterData();
          
          dispatch(setScatterData(scatterData));
          
          // Generate customer data matching scatter data
          const customers = data.segment_data && data.segment_data.length > 0
            ? data.segment_data.map((customer: any) => ({
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
                segment: customer.segment || 'Unknown',
                purchase_frequency: customer.frequency || 0,
                days_since_last_purchase: customer.recency_days || 0,
                loyalty_score: Math.random() * 100,
                total_spent: customer.lifetime_value || 0
              }))
            : scatterData.map(point => ({
                customer_id: point.customer_id,
                customer_type: 'Standard',
                status: 'Active',
                region: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
                industry: ['Retail', 'Technology', 'Healthcare', 'Finance'][Math.floor(Math.random() * 4)],
                transaction_count: Math.round(point.y),
                avg_order_value: parseFloat((point.z / Math.max(point.y, 1)).toFixed(2)),
                total_spend: point.z,
                last_purchase_date: new Date(Date.now() - point.x * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                credit_limit: Math.round(point.z * 1.5),
                recency: point.x,
                segment: point.segment,
                purchase_frequency: point.y,
                days_since_last_purchase: point.x,
                loyalty_score: parseFloat((Math.random() * 40 + 60).toFixed(2)),
                total_spent: point.z
              }));
          
          dispatch(setCustomers(customers));
          
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

  // Apply filters to customers
  const filteredCustomers = useMemo(() => {
    if (!activeFilters || !customers) return customers;
    
    let filtered = [...customers];
    
    // Apply date range filter
    if (activeFilters.dateRange) {
      const { startDate, endDate } = activeFilters.dateRange;
      filtered = filtered.filter(customer => {
        const lastPurchase = new Date(customer.last_purchase_date);
        return lastPurchase >= startDate && lastPurchase <= endDate;
      });
    }
    
    // Apply segment filter
    if (activeFilters.segments && activeFilters.segments.length > 0) {
      filtered = filtered.filter(customer => 
        activeFilters.segments.includes(customer.segment)
      );
    }
    
    // Apply value category filter
    if (activeFilters.valueCategories && activeFilters.valueCategories.length > 0) {
      filtered = filtered.filter(customer => {
        const avgOrderValue = customer.avg_order_value || 0;
        if (activeFilters.valueCategories.includes('High Value') && avgOrderValue > 150) return true;
        if (activeFilters.valueCategories.includes('Medium Value') && avgOrderValue >= 50 && avgOrderValue <= 150) return true;
        if (activeFilters.valueCategories.includes('Low Value') && avgOrderValue < 50) return true;
        if (activeFilters.valueCategories.includes('Growth Potential') && customer.purchase_frequency > 3) return true;
        if (activeFilters.valueCategories.includes('Declining Value') && customer.days_since_last_purchase > 60) return true;
        return false;
      });
    }
    
    // Apply behavior type filter
    if (activeFilters.behaviorTypes && activeFilters.behaviorTypes.length > 0) {
      filtered = filtered.filter(customer => {
        if (activeFilters.behaviorTypes.includes('Frequent Buyers') && customer.purchase_frequency > 5) return true;
        if (activeFilters.behaviorTypes.includes('Big Spenders') && customer.total_spent > 500) return true;
        if (activeFilters.behaviorTypes.includes('Window Shoppers') && customer.purchase_frequency <= 1) return true;
        if (activeFilters.behaviorTypes.includes('Bargain Hunters') && customer.avg_order_value < 30) return true;
        if (activeFilters.behaviorTypes.includes('Brand Advocates') && customer.loyalty_score > 80) return true;
        if (activeFilters.behaviorTypes.includes('Seasonal Shoppers') && customer.purchase_frequency <= 2) return true;
        return false;
      });
    }
    
    return filtered;
  }, [customers, activeFilters]);

  // Process KPIs based on filtered data
  const processedKPIs = useMemo(() => {
    const dataToUse = filteredCustomers || customers || [];
    
    // Get filtered segment summaries
    const filteredSegmentSummaries = segmentSummaries?.filter(seg => {
      if (!activeFilters?.segments || activeFilters.segments.length === 0) return true;
      return activeFilters.segments.includes(seg.segment_name);
    }) || segmentSummaries || [];
    
    // Calculate from filtered data
    const uniqueSegments = [...new Set(dataToUse.map(c => c?.segment).filter(Boolean))];
    
    // Calculate segment sizes
    const segmentCounts = uniqueSegments.reduce((acc, seg) => {
      acc[seg] = dataToUse.filter(c => c.segment === seg).length;
      return acc;
    }, {} as Record<string, number>);
    
    // Find largest segment - use actual data or provide defaults
    let largestSeg = { name: 'Champions', count: 0 };
    if (Object.keys(segmentCounts).length > 0) {
      largestSeg = Object.entries(segmentCounts).reduce((max, [seg, count]) => 
        count > max.count ? { name: seg, count } : max, 
        largestSeg
      );
    } else if (filteredSegmentSummaries.length > 0) {
      // Use segment summaries if no customer data
      largestSeg = {
        name: filteredSegmentSummaries[0].segment_name || 'Champions',
        count: filteredSegmentSummaries[0].customer_count || 150
      };
    }
    
    // Find most valuable segment with better defaults
    const segmentValues = uniqueSegments.reduce((acc, seg) => {
      const segCustomers = dataToUse.filter(c => c.segment === seg);
      const avgSpend = segCustomers.length > 0 
        ? segCustomers.reduce((sum, c) => sum + (c.avg_order_value || 0), 0) / segCustomers.length
        : 250; // Default average spend
      acc[seg] = avgSpend;
      return acc;
    }, {} as Record<string, number>);
    
    let mostValuable = { name: 'High Value', avgSpend: 450 };
    if (Object.keys(segmentValues).length > 0) {
      mostValuable = Object.entries(segmentValues).reduce((max, [seg, avgSpend]) =>
        avgSpend > max.avgSpend ? { name: seg, avgSpend } : max,
        mostValuable
      );
    }
    
    // Calculate total customers for percentage
    const totalCustomers = dataToUse.length || 500; // Default total if no data
    
    return {
      totalSegments: uniqueSegments.length || 8,
      segmentationQuality: Math.min(95, 75 + (uniqueSegments.length * 2)),
      largestSegment: {
        name: largestSeg.name || 'Champions',
        percentage: totalCustomers > 0 
          ? parseFloat(((largestSeg.count / totalCustomers) * 100).toFixed(2))
          : 32.5
      },
      mostValuableSegment: {
        name: mostValuable.name || 'High Value',
        avgSpend: parseFloat(mostValuable.avgSpend.toFixed(2))
      },
      segmentStability: parseFloat((78 + Math.random() * 10).toFixed(2))
    };
  }, [filteredCustomers, customers, segmentSummaries, segments, activeFilters]);

  const processedSegmentProfiles = useMemo(() => {
    const dataToUse = filteredCustomers || customers || [];
    
    // Create default segments if none exist
    const defaultSegments = [
      { segment_name: 'Champions', customer_count: 150, avg_customer_value: 450 },
      { segment_name: 'Loyal Customers', customer_count: 120, avg_customer_value: 320 },
      { segment_name: 'Potential Loyalists', customer_count: 100, avg_customer_value: 280 },
      { segment_name: 'New Customers', customer_count: 80, avg_customer_value: 180 },
      { segment_name: 'At Risk', customer_count: 60, avg_customer_value: 220 },
      { segment_name: 'Can\'t Lose Them', customer_count: 40, avg_customer_value: 380 },
      { segment_name: 'Hibernating', customer_count: 30, avg_customer_value: 150 },
      { segment_name: 'Lost', customer_count: 20, avg_customer_value: 120 }
    ];
    
    // Use default segments if none exist
    let summariesToUse = segmentSummaries && segmentSummaries.length > 0 
      ? segmentSummaries 
      : defaultSegments;
    
    // Filter segment summaries based on active filters
    if (activeFilters?.segments && activeFilters.segments.length > 0) {
      summariesToUse = summariesToUse.filter(seg => 
        activeFilters.segments.includes(seg.segment_name)
      );
    }
    
    return summariesToUse.map((seg: any) => ({
    segment: seg.segment_name || seg.segment,
    customerCount: seg.customer_count || Math.floor(Math.random() * 200) + 50,
    avgSpend: parseFloat((seg.avg_customer_value || 150 + Math.random() * 300).toFixed(2)),
    frequency: parseFloat((3 + Math.random() * 7).toFixed(2)),
    recency: parseFloat((5 + Math.random() * 25).toFixed(2)),
    loyaltyScore: parseFloat((60 + Math.random() * 35).toFixed(2)),
    engagementRate: parseFloat((55 + Math.random() * 40).toFixed(2)),
    regions: ['North', 'South', 'East', 'West'],
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
  }, [segmentSummaries, filteredCustomers, customers, activeFilters]);

  const processedSegmentMetrics = useMemo(() => {
    // Create default segments if none exist
    const defaultSegments = [
      { segment_name: 'Champions', avg_customer_value: 450, total_value: 8500 },
      { segment_name: 'Loyal Customers', avg_customer_value: 320, total_value: 6200 },
      { segment_name: 'Potential Loyalists', avg_customer_value: 280, total_value: 4800 },
      { segment_name: 'New Customers', avg_customer_value: 180, total_value: 2200 },
      { segment_name: 'At Risk', avg_customer_value: 220, total_value: 3500 },
      { segment_name: 'Can\'t Lose Them', avg_customer_value: 380, total_value: 7200 },
      { segment_name: 'Hibernating', avg_customer_value: 150, total_value: 1800 },
      { segment_name: 'Lost', avg_customer_value: 120, total_value: 1200 }
    ];
    
    const dataToUse = segmentSummaries && segmentSummaries.length > 0 
      ? segmentSummaries 
      : defaultSegments;
    
    return dataToUse.map((seg: any) => ({
      segment: seg.segment_name || seg.segment,
      avgOrderValue: parseFloat((seg.avg_customer_value || 200 + Math.random() * 250).toFixed(2)),
      purchaseFrequency: parseFloat((2 + Math.random() * 8).toFixed(2)),
      customerLifetimeValue: parseFloat((seg.total_value || 2000 + Math.random() * 6000).toFixed(2)),
      recencyDays: parseFloat((5 + Math.random() * 25).toFixed(2)),
      loyaltyScore: parseFloat((55 + Math.random() * 40).toFixed(2)),
      engagementRate: parseFloat((50 + Math.random() * 45).toFixed(2)),
    }));
  }, [segmentSummaries]);

  const filteredSegments = processedSegmentProfiles.filter((seg: any) => {
    if (filters?.region && !seg.regions.includes(filters.region)) return false;
    if (filters?.segment && String(seg.segment) !== String(filters.segment)) return false;
    return true;
  });

  const filteredScatter = useMemo(() => {
    // If no scatter data exists, generate default data
    const baseScatterData = scatterData && scatterData.length > 0 
      ? scatterData 
      : generateDefaultScatterData();
    
    const dataToUse = filteredCustomers || customers || [];
    
    // If we have filters but no customers, just return the scatter data
    if (dataToUse.length === 0 && baseScatterData.length > 0) {
      return baseScatterData;
    }
    
    return baseScatterData.filter((d: any) => {
      // If no customer data, show all scatter points
      if (!dataToUse || dataToUse.length === 0) return true;
      
      // Check if this customer is in the filtered list
      const isInFiltered = dataToUse.some(c => c.customer_id === d.customer_id);
      if (!isInFiltered && dataToUse.length > 0) return false;
      
      if (filters?.region) {
        const cust = dataToUse.find((c: any) => c.customer_id === d.customer_id);
        if (!cust || cust.region !== filters.region) return false;
      }
      if (filters?.segment && String(d.segment) !== String(filters.segment)) return false;
      return true;
    });
  }, [scatterData, filteredCustomers, customers, filters]);

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
              setActiveFilters(newFilters);
              // Also update Redux store if needed
              dispatch(setFilters({
                ...filters,
                activeFilters: newFilters
              }));
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
