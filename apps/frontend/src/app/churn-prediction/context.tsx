"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export type TimeRange = "30d" | "90d";

export interface ChurnFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  riskLevels: string[];
  segments: string[];
  productCategories: string[];
}

type ChurnContextValue = {
  filters: ChurnFilters;
  setFilters: React.Dispatch<React.SetStateAction<ChurnFilters>>;
  timeRange: TimeRange;
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRange>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  churnCustomers: any[];
  setChurnCustomers: React.Dispatch<React.SetStateAction<any[]>>;
};

const ChurnContext = React.createContext<ChurnContextValue | undefined>(undefined);

export function useChurnContext(): ChurnContextValue {
  const ctx = React.useContext(ChurnContext);
  if (!ctx) throw new Error("useChurnContext must be used within ChurnProvider");
  return ctx;
}

export function ChurnProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [churnCustomers, setChurnCustomers] = React.useState<any[]>([]);

  const [timeRange, setTimeRange] = React.useState<TimeRange>(() => {
    if (typeof window === "undefined") return "30d";
    return (localStorage.getItem("churnTimeRange") as TimeRange) || "30d";
  });

  const [filters, setFilters] = React.useState<ChurnFilters>(() => {
    // Calculate default date range (last 30 days from 2021-12-31 since our data is from 2017-2021)
    const defaultEndDate = "2021-12-31";
    const endDate = new Date(defaultEndDate);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    const defaultStartDate = startDate.toISOString().split('T')[0];

    const defaultFilters = {
      dateRange: { startDate: defaultStartDate, endDate: defaultEndDate },
      riskLevels: [],
      segments: [],
      productCategories: [],
      search: "",
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("churnFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Keep the saved dateRange values
        return parsed;
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

  // Subscribe to selection manager
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

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
      selectedPoints,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      churnCustomers,
      setChurnCustomers,
    }),
    [filters, memoizedSetFilters, timeRange, memoizedSetTimeRange, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, churnCustomers]
  );

  return <ChurnContext.Provider value={value}>{children}</ChurnContext.Provider>;
}


