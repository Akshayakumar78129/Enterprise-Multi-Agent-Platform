import { useState, useEffect } from 'react';
import { salesPerformanceService } from '../services/salesPerformanceService';

export function useSalesPerformanceData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const dashboardData = await salesPerformanceService.getDashboardData(filters);

        setData({
          kpiMetrics: dashboardData.kpiMetrics,
          mainData: {
            salesOverview: {
              totalOrders: dashboardData.kpiMetrics.uniqueCustomers,
              averageOrderValue: dashboardData.kpiMetrics.avgOrderValue,
              conversionRate: dashboardData.kpiMetrics.conversionRate,
              revenue: dashboardData.kpiMetrics.totalRevenue
            },
            topProducts: dashboardData.mainData?.productPerformance?.map(p => ({
              name: p.productName,
              sales: p.revenue,
              units: p.unitsSold,
              category: p.category,
              avgPrice: p.avgPrice
            })) || [],
            teamPerformance: dashboardData.mainData?.regionPerformance?.map(r => ({
              region: r.regionName,
              revenue: r.revenue,
              customers: r.customerCount,
              units: r.units
            })) || [],
            salesTargets: dashboardData.mainData?.categoryPerformance?.map(c => ({
              category: c.category,
              revenue: c.revenue,
              units: c.units,
              productCount: c.productCount
            })) || [],
            revenueTrends: dashboardData.mainData?.salesTrends || []
          }
        });
      } catch (err) {
        console.error('Error fetching sales performance data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData({
          kpiMetrics: {
            totalRevenue: 0,
            totalUnits: 0,
            avgOrderValue: 0,
            uniqueCustomers: 0,
            revenueGrowth: 0,
            conversionRate: 0
          },
          mainData: {}
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [JSON.stringify(filters)]);

  return {
    loading,
    error,
    salesOverview: data?.mainData?.salesOverview || {},
    topProducts: data?.mainData?.topProducts || [],
    teamPerformance: data?.mainData?.teamPerformance || {},
    salesTargets: data?.mainData?.salesTargets || {},
    revenueTrends: data?.mainData?.revenueTrends || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}