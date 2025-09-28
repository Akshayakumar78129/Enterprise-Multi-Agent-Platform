// Retention Planner Data Hook - Following churn pattern
import { useState, useEffect } from "react";
import { useRetentionPlannerContext } from "../context";

export function useRetentionPlannerData(filters: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [kpiMetrics, setKpiMetrics] = useState<any>(null);
  const [mainData, setMainData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/retention-planner/summary", {
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
          console.error("Failed to fetch Retention Planner data");
          // Set default empty data
          setData({});
          setKpiMetrics({});
          setMainData({});
        }
      } catch (error) {
        console.error("Error fetching Retention Planner data:", error);
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
      retentionfunnelData: mainData.retentionfunnel || [], riskmatrixData: mainData.riskmatrix || [], strategyeffectivenessData: mainData.strategyeffectiveness || [], interventionroiData: mainData.interventionroi || []
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
