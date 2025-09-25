import { useState, useEffect } from 'react';

interface PerformanceFilters {
  dateFrom: string;
  dateTo: string;
  businessFunctions: string[];
  significanceThreshold: number;
  customerIds?: string[];
  productCategories?: string[];
}

interface PerformanceData {
  featureImportance: any;
  varianceDecomposition: any;
  performanceExplorer: any;
  kpis: any;
  businessFunctionComparison: any;
  deviationPatterns: any;
  factorCorrelations: any;
  metadata: any;
}

export function usePerformanceData(filters: PerformanceFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Always include all business functions if empty
        const businessFunctions = filters.businessFunctions && filters.businessFunctions.length > 0
          ? filters.businessFunctions
          : ['sales', 'customer', 'finance'];

        const response = await fetch('http://localhost:8000/api/performance/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            businessFunctions: businessFunctions,
            significanceThreshold: filters.significanceThreshold,
            customerIds: filters.customerIds || [],
            productCategories: filters.productCategories || []
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);
        console.log('KPIs from API:', result.kpis);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return {
    loading,
    error,
    data,
    featureImportance: data?.featureImportance || { aggregated: [], byKPI: {} },
    varianceDecomposition: data?.varianceDecomposition || { components: [] },
    performanceExplorer: data?.performanceExplorer || {},
    kpis: data?.kpis || {},
    businessComparison: data?.businessFunctionComparison || {},
    deviationPatterns: data?.deviationPatterns || { patterns: [], calendar: {}, monthlyStats: {} },
    factorCorrelations: data?.factorCorrelations || { series: {} }
  };
}