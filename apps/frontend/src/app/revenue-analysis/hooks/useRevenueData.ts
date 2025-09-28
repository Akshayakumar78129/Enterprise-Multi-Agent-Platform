import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      // Mock data for revenue analysis
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            revenueStreams: {
              product_sales: 2500000,
              services: 800000,
              subscriptions: 450000,
              total: 3750000
            },
            revenueGrowth: {
              monthly_growth: [
                { month: 'Jan', revenue: 280000, growth: 5.2 },
                { month: 'Feb', revenue: 295000, growth: 5.4 },
                { month: 'Mar', revenue: 310000, growth: 5.1 },
                { month: 'Apr', revenue: 325000, growth: 4.8 },
                { month: 'May', revenue: 340000, growth: 4.6 },
                { month: 'Jun', revenue: 355000, growth: 4.4 }
              ],
              yearly_growth: 12.5
            },
            regionalPerformance: {
              regions: [
                { region: 'North America', revenue: 1875000, percentage: 50 },
                { region: 'Europe', revenue: 1125000, percentage: 30 },
                { region: 'Asia Pacific', revenue: 562500, percentage: 15 },
                { region: 'Other', revenue: 187500, percentage: 5 }
              ]
            },
            productRevenue: {
              categories: [
                { category: 'Electronics', revenue: 1500000, margin: 25 },
                { category: 'Software', revenue: 1000000, margin: 60 },
                { category: 'Services', revenue: 800000, margin: 40 },
                { category: 'Accessories', revenue: 450000, margin: 35 }
              ]
            },
            seasonalTrends: {
              quarterly: [
                { quarter: 'Q1', revenue: 885000, trend: 'up' },
                { quarter: 'Q2', revenue: 1020000, trend: 'up' },
                { quarter: 'Q3', revenue: 945000, trend: 'down' },
                { quarter: 'Q4', revenue: 900000, trend: 'stable' }
              ]
            },
            topProducts: [
              {
                product_id: 'P001',
                product_name: 'Premium Software Suite',
                revenue: 850000,
                growth_rate: 15.2,
                margin: 65,
                category: 'Software'
              },
              {
                product_id: 'P002',
                product_name: 'Enterprise Hardware',
                revenue: 720000,
                growth_rate: 8.5,
                margin: 22,
                category: 'Electronics'
              },
              {
                product_id: 'P003',
                product_name: 'Consulting Services',
                revenue: 650000,
                growth_rate: 12.1,
                margin: 45,
                category: 'Services'
              }
            ]
          });
        }, 1000);
      });
    }
  };
}

interface RevenueFilters {
  timePeriod: string;
  regionId: string | null;
  productCategories: string[];
  revenueStreams: string[];
  minRevenue: number;
  customerSegments: string[];
}

export function useRevenueData(filters: RevenueFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [revenueStreams, setRevenueStreams] = useState<any>(null);
  const [revenueGrowth, setRevenueGrowth] = useState<any>(null);
  const [regionalPerformance, setRegionalPerformance] = useState<any>(null);
  const [productRevenue, setProductRevenue] = useState<any>(null);
  const [seasonalTrends, setSeasonalTrends] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const client = useMemo(() => getDashboardClient("revenue-analysis"), []);

  function normalizeSummary(summary: any) {
    const s = summary || {};

    return {
      revenueStreams: s.revenueStreams || s.revenue_streams || {},
      revenueGrowth: s.revenueGrowth || s.revenue_growth || {},
      regionalPerformance: s.regionalPerformance || s.regional_performance || {},
      productRevenue: s.productRevenue || s.product_revenue || {},
      seasonalTrends: s.seasonalTrends || s.seasonal_trends || {},
      topProducts: s.topProducts || s.top_products || [],
    };
  }

  const emptyData = useMemo(() => ({
    revenueStreams: {},
    revenueGrowth: {},
    regionalPerformance: {},
    productRevenue: {},
    seasonalTrends: {},
    topProducts: [],
  }), []);

  useEffect(() => {
    let isMounted = true;

    // Abort previous request if exists
    if (abortControllerRef.current) abortControllerRef.current.abort('Filter changed');

    // Create new AbortController for this request
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filterParams: Record<string, any> = {
          time_period: filters.timePeriod,
          region_id: filters.regionId,
          product_categories: filters.productCategories.length > 0 ? filters.productCategories : undefined,
          revenue_streams: filters.revenueStreams.length > 0 ? filters.revenueStreams : undefined,
          min_revenue: filters.minRevenue || 1000,
          customer_segments: filters.customerSegments.length > 0 ? filters.customerSegments : undefined,
        };

        console.log('[useRevenueData] Fetching with params:', filterParams);
        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any);
        console.log('[useRevenueData] Response received:', summaryResponse);

        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;

        const isEmpty = !effective.topProducts || effective.topProducts.length === 0;
        setHasNoData(isEmpty);

        setData(effective);
        lastGoodDataRef.current = effective;

        // Process all revenue data
        setRevenueStreams(effective.revenueStreams);
        setRevenueGrowth(effective.revenueGrowth);
        setRegionalPerformance(effective.regionalPerformance);
        setProductRevenue(effective.productRevenue);
        setSeasonalTrends(effective.seasonalTrends);

        // Process top products
        setTopProducts(effective.topProducts.map((p: any) => ({
          ...p,
          id: p.productId || p.product_id,
          name: p.productName || p.product_name || `Product ${p.productId || p.product_id}`,
          revenue: p.revenue || 0,
          growthRate: p.growthRate || p.growth_rate || 0,
          margin: p.margin || 0,
          category: p.category || 'Unknown',
        })));

      } catch (err: any) {
        // Check if it's an abort error
        const isAbortError =
          err?.name === "AbortError" ||
          err?.code === 20 ||
          err?.message === "Filter changed" ||
          err?.message === "Cleanup" ||
          err?.message?.includes("abort") ||
          err?.message?.includes("cancelled");

        if (isAbortError) {
          console.log("[useRevenueData] Request cancelled (expected behavior)");
          return;
        }
        console.error("Error fetching revenue data:", err);

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.topProducts || stable.topProducts.length === 0);
          } else {
            setData(emptyData);
            setRevenueStreams(null);
            setRevenueGrowth(null);
            setRegionalPerformance(null);
            setProductRevenue(null);
            setSeasonalTrends(null);
            setTopProducts([]);
            setHasNoData(true);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort('Cleanup');
      }
      abortControllerRef.current = null;
    };
  }, [filters, client, emptyData]);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    if (!data || hasNoData) {
      return {
        totalRevenue: 0,
        monthlyGrowth: 0,
        avgMargin: 0,
        topRegion: 'N/A',
        bestCategory: 'N/A',
      };
    }

    const totalRevenue = revenueStreams?.total || 0;
    const monthlyGrowth = revenueGrowth?.yearly_growth || 0;

    // Calculate average margin from product revenue
    let avgMargin = 0;
    if (productRevenue?.categories && productRevenue.categories.length > 0) {
      const totalMargin = productRevenue.categories.reduce((sum: number, c: any) =>
        sum + (c.margin || 0), 0);
      avgMargin = totalMargin / productRevenue.categories.length;
    }

    // Get top region
    const topRegion = regionalPerformance?.regions?.[0]?.region || 'N/A';

    // Get best performing category
    const bestCategory = productRevenue?.categories?.[0]?.category || 'N/A';

    return {
      totalRevenue: totalRevenue.toLocaleString(),
      monthlyGrowth: monthlyGrowth.toFixed(1),
      avgMargin: avgMargin.toFixed(1),
      topRegion,
      bestCategory,
    };
  }, [data, revenueStreams, revenueGrowth, productRevenue, regionalPerformance, hasNoData]);

  return {
    loading,
    error,
    data,
    revenueStreams,
    revenueGrowth,
    regionalPerformance,
    productRevenue,
    seasonalTrends,
    topProducts,
    hasNoData,
    kpiMetrics,
    client
  };
}