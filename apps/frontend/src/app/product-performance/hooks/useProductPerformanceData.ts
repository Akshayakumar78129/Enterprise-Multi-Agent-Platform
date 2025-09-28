import { useState, useEffect } from 'react';

export function useProductPerformanceData(filters: Record<string, any>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    setTimeout(() => {
      setData({
        kpiMetrics: {
          totalProducts: 1250,
          topSeller: 'Product A',
          averageRating: '4.2',
          stockLevel: '85%'
        },
        mainData: {
          productOverview: {
            totalSales: 2340000,
            averagePrice: 89.50,
            totalUnits: 15432,
            categories: 24
          },
          topProducts: [
            { name: 'Product A', sales: 450000, units: 2100 },
            { name: 'Product B', sales: 380000, units: 1800 },
            { name: 'Product C', sales: 320000, units: 1500 }
          ],
          categoryAnalysis: {
            electronics: 35,
            clothing: 28,
            books: 22,
            home: 15
          },
          productTrends: {
            monthly: [180000, 220000, 250000],
            weekly: [45000, 52000, 48000, 55000]
          },
          inventoryStatus: {
            inStock: 1050,
            lowStock: 180,
            outOfStock: 20
          }
        }
      });
      setLoading(false);
    }, 1000);
  }, [filters]);

  return {
    loading,
    error,
    productOverview: data?.mainData?.productOverview || {},
    topProducts: data?.mainData?.topProducts || [],
    categoryAnalysis: data?.mainData?.categoryAnalysis || {},
    productTrends: data?.mainData?.productTrends || {},
    inventoryStatus: data?.mainData?.inventoryStatus || {},
    kpiMetrics: data?.kpiMetrics || {},
    hasNoData: !data?.mainData || Object.keys(data?.mainData || {}).length === 0
  };
}