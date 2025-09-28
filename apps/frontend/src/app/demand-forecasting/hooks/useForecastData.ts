import { useEffect, useState, useMemo, useRef } from "react";

function getDashboardClient(dashboardType: string) {
  return {
    fetchSummary: async (params: any, options?: RequestInit) => {
      // Mock data for demand forecasting
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            demandTrends: {
              historical: [
                { date: '2021-01', actual: 1200, forecast: 1150 },
                { date: '2021-02', actual: 1350, forecast: 1320 },
                { date: '2021-03', actual: 1180, forecast: 1200 },
                { date: '2021-04', actual: 1420, forecast: 1380 },
                { date: '2021-05', actual: 1580, forecast: 1550 },
                { date: '2021-06', actual: 1720, forecast: 1680 }
              ],
              future: [
                { date: '2021-07', forecast: 1850, confidence_lower: 1750, confidence_upper: 1950 },
                { date: '2021-08', forecast: 1920, confidence_lower: 1800, confidence_upper: 2040 },
                { date: '2021-09', forecast: 1780, confidence_lower: 1650, confidence_upper: 1910 }
              ]
            },
            forecastAccuracy: {
              overall_accuracy: 92.5,
              by_period: [
                { period: 'Last 30 days', accuracy: 94.2 },
                { period: 'Last 60 days', accuracy: 92.8 },
                { period: 'Last 90 days', accuracy: 91.1 }
              ],
              model_performance: {
                mape: 7.5,
                rmse: 145.2,
                mae: 98.7
              }
            },
            seasonalPatterns: {
              patterns: [
                { season: 'Q1', factor: 0.85, trend: 'low' },
                { season: 'Q2', factor: 1.15, trend: 'high' },
                { season: 'Q3', factor: 0.95, trend: 'medium' },
                { season: 'Q4', factor: 1.25, trend: 'peak' }
              ],
              weekly_pattern: [
                { day: 'Monday', factor: 1.1 },
                { day: 'Tuesday', factor: 1.2 },
                { day: 'Wednesday', factor: 1.0 },
                { day: 'Thursday', factor: 0.9 },
                { day: 'Friday', factor: 0.8 }
              ]
            },
            productDemand: {
              products: [
                { product: 'Product A', current: 850, forecast: 920, variance: 0.08 },
                { product: 'Product B', current: 720, forecast: 780, variance: 0.12 },
                { product: 'Product C', current: 650, forecast: 600, variance: 0.25 },
                { product: 'Product D', current: 580, forecast: 620, variance: 0.15 }
              ]
            },
            regionalDemand: {
              regions: [
                { region: 'North', forecast: 2200, growth: 8.5 },
                { region: 'South', forecast: 1850, growth: 5.2 },
                { region: 'East', forecast: 1650, growth: 12.1 },
                { region: 'West', forecast: 1400, growth: 3.8 }
              ]
            },
            forecastItems: [
              {
                item_id: 'F001',
                item_name: 'Premium Widget',
                forecast_demand: 920,
                actual_demand: 850,
                accuracy: 92.4,
                variance: 0.08,
                category: 'Electronics'
              },
              {
                item_id: 'F002',
                item_name: 'Standard Component',
                forecast_demand: 780,
                actual_demand: 720,
                accuracy: 88.7,
                variance: 0.12,
                category: 'Components'
              },
              {
                item_id: 'F003',
                item_name: 'Specialized Tool',
                forecast_demand: 600,
                actual_demand: 650,
                accuracy: 85.2,
                variance: 0.25,
                category: 'Tools'
              }
            ]
          });
        }, 1000);
      });
    }
  };
}

interface ForecastFilters {
  timePeriod: string;
  forecastHorizon: number;
  products: string[];
  regions: string[];
  modelType: string;
  confidenceLevel: number;
}

export function useForecastData(filters: ForecastFilters) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const lastGoodDataRef = useRef<any>(null);
  const [demandTrends, setDemandTrends] = useState<any>(null);
  const [forecastAccuracy, setForecastAccuracy] = useState<any>(null);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any>(null);
  const [productDemand, setProductDemand] = useState<any>(null);
  const [regionalDemand, setRegionalDemand] = useState<any>(null);
  const [forecastItems, setForecastItems] = useState<any[]>([]);
  const [hasNoData, setHasNoData] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const client = useMemo(() => getDashboardClient("demand-forecasting"), []);

  function normalizeSummary(summary: any) {
    const s = summary || {};
    return {
      demandTrends: s.demandTrends || s.demand_trends || {},
      forecastAccuracy: s.forecastAccuracy || s.forecast_accuracy || {},
      seasonalPatterns: s.seasonalPatterns || s.seasonal_patterns || {},
      productDemand: s.productDemand || s.product_demand || {},
      regionalDemand: s.regionalDemand || s.regional_demand || {},
      forecastItems: s.forecastItems || s.forecast_items || [],
    };
  }

  const emptyData = useMemo(() => ({
    demandTrends: {},
    forecastAccuracy: {},
    seasonalPatterns: {},
    productDemand: {},
    regionalDemand: {},
    forecastItems: [],
  }), []);

  useEffect(() => {
    let isMounted = true;
    if (abortControllerRef.current) abortControllerRef.current.abort('Filter changed');
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const filterParams: Record<string, any> = {
          time_period: filters.timePeriod,
          forecast_horizon: filters.forecastHorizon,
          products: filters.products.length > 0 ? filters.products : undefined,
          regions: filters.regions.length > 0 ? filters.regions : undefined,
          model_type: filters.modelType,
          confidence_level: filters.confidenceLevel,
        };

        const summaryResponse = await client.fetchSummary(filterParams, { signal: ac.signal } as any);
        const effective = summaryResponse ? normalizeSummary(summaryResponse) : emptyData;
        const isEmpty = !effective.forecastItems || effective.forecastItems.length === 0;
        setHasNoData(isEmpty);
        setData(effective);
        lastGoodDataRef.current = effective;

        setDemandTrends(effective.demandTrends);
        setForecastAccuracy(effective.forecastAccuracy);
        setSeasonalPatterns(effective.seasonalPatterns);
        setProductDemand(effective.productDemand);
        setRegionalDemand(effective.regionalDemand);
        setForecastItems(effective.forecastItems.map((item: any) => ({
          ...item,
          id: item.itemId || item.item_id,
          name: item.itemName || item.item_name || `Item ${item.itemId || item.item_id}`,
          forecastDemand: item.forecastDemand || item.forecast_demand || 0,
          actualDemand: item.actualDemand || item.actual_demand || 0,
          accuracy: item.accuracy || 0,
          variance: item.variance || 0,
          category: item.category || 'Unknown',
        })));

      } catch (err: any) {
        const isAbortError = err?.name === "AbortError" || err?.message?.includes("abort");
        if (isAbortError) return;

        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch data");
          if (lastGoodDataRef.current) {
            const stable = lastGoodDataRef.current;
            setData(stable);
            setHasNoData(!stable.forecastItems || stable.forecastItems.length === 0);
          } else {
            setData(emptyData);
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

  const kpiMetrics = useMemo(() => {
    if (!data || hasNoData) {
      return {
        overallAccuracy: 0,
        avgVariance: 0,
        forecastHorizon: 0,
        totalForecasts: 0,
        bestModel: 'N/A',
      };
    }

    const overallAccuracy = forecastAccuracy?.overall_accuracy || 0;
    const avgVariance = productDemand?.products?.reduce((sum: number, p: any) => sum + (p.variance || 0), 0) / (productDemand?.products?.length || 1) || 0;
    const totalForecasts = forecastItems.length;

    return {
      overallAccuracy: overallAccuracy.toFixed(1),
      avgVariance: (avgVariance * 100).toFixed(1),
      forecastHorizon: filters.forecastHorizon.toString(),
      totalForecasts: totalForecasts.toString(),
      bestModel: filters.modelType,
    };
  }, [data, forecastAccuracy, productDemand, forecastItems, filters, hasNoData]);

  return {
    loading, error, data, demandTrends, forecastAccuracy, seasonalPatterns,
    productDemand, regionalDemand, forecastItems, hasNoData, kpiMetrics, client
  };
}