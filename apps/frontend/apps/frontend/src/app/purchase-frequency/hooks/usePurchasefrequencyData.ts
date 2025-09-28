// Purchase Frequency Data Hook - Following churn pattern
import { useState, useEffect } from "react";
import { usePurchaseFrequencyContext } from "../context";

export function usePurchaseFrequencyData(filters: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [mainData, setMainData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/purchase-frequency/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(filters),
        });

        if (response.ok) {
          const result = await response.json();
          setData(result);
          setKpiMetrics(result.kpiMetrics || {});
          setMainData(result.mainData || {});
        } else {
          console.error("Failed to fetch Purchase Frequency data");
          // Set default empty data
          setData({});
          setKpiMetrics({});
          setMainData({});
        }
      } catch (error) {
        console.error("Error fetching Purchase Frequency data:", error);
        setData({});
        setKpiMetrics({});
        setMainData({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Extract specific chart data from mainData
  const extractChartData = () => {
    if (!mainData) return {};

    return {
      frequencydistributionData: mainData.frequencydistribution || [], rfmmatrixData: mainData.rfmmatrix || [], frequencytrendData: mainData.frequencytrend || [], seasonalpatternsData: mainData.seasonalpatterns || []
    };
  };

  const chartData = extractChartData();

  return {
    loading,
    data,
    kpiMetrics,
    ...chartData,
    insights: data?.insights || [],
    metadata: data?.metadata || {},
  };
}
