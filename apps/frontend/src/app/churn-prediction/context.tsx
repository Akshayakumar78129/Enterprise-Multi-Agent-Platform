"use client";

import React from "react";

export type TimeRange = "7d" | "30d" | "90d";

export interface ChurnFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  riskLevels: string[];
  segments: string[];
  search: string;
}

type ChurnContextValue = {
  filters: ChurnFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChurnFilters>>;
  timeRange: TimeRange;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;
};

const ChurnContext = React.createContext<ChurnContextValue | undefined>(undefined);

export function useChurnContext(): ChurnContextValue {
  const ctx = React.useContext(ChurnContext);
  if (!ctx) throw new Error("useChurnContext must be used within ChurnProvider");
  return ctx;
}

export function ChurnProvider({ children }: { children: React.ReactNode }) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>(() => {
    if (typeof window === "undefined") return "30d";
    return (localStorage.getItem("churnTimeRange") as TimeRange) || "30d";
  });

  const [filters, setFilters] = React.useState<ChurnFilters>(() => {
    // Use more recent dates that likely have data
    const defaultFilters = {
      dateRange: { startDate: "2020-01-01", endDate: "2023-12-31" },
      riskLevels: [],
      segments: [],
      search: "",
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("churnFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure date range is valid
        if (parsed.dateRange?.startDate && parsed.dateRange?.endDate) {
          return parsed;
        }
      }
      return defaultFilters;
    } catch {
      return defaultFilters;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("churnFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  React.useEffect(() => {
    try {
      localStorage.setItem("churnTimeRange", timeRange);
    } catch {}
  }, [timeRange]);

  // Memoize setFilters to prevent unnecessary recreations
  const memoizedSetFilters = React.useCallback(
    (newFilters: React.SetStateAction<ChurnFilters>) => {
      setFilters(newFilters);
    },
    []
  );

  // Memoize setTimeRange to prevent unnecessary recreations
  const memoizedSetTimeRange = React.useCallback(
    (newTimeRange: React.SetStateAction<TimeRange>) => {
      setTimeRange(newTimeRange);
    },
    []
  );

  const value = React.useMemo(
    () => ({
      filters,
      setFilters: memoizedSetFilters,
      timeRange,
      setTimeRange: memoizedSetTimeRange,
    }),
    [filters, memoizedSetFilters, timeRange, memoizedSetTimeRange]
  );

  return <ChurnContext.Provider value={value}>{children}</ChurnContext.Provider>;
}


