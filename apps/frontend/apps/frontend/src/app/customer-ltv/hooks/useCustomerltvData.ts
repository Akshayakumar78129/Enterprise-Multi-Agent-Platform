// Customer Lifetime Value Data Hook - Following churn pattern
import { useState, useEffect } from "react";
import { useCustomerLtvContext } from "../context";

export function useCustomerLtvData(filters: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [mainData, setMainData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/customer-ltv/summary", {
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
          console.error("Failed to fetch Customer Lifetime Value data");
          // Set default empty data
          setData({});
          setKpiMetrics({});
          setMainData({});
        }
      } catch (error) {
        console.error("Error fetching Customer Lifetime Value data:", error);
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
      ltvdistributionData: mainData.ltvdistribution || [], ltvtrendData: mainData.ltvtrend || [], valuematrixData: mainData.valuematrix || [], ltvbysegmentData: mainData.ltvbysegment || []
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
