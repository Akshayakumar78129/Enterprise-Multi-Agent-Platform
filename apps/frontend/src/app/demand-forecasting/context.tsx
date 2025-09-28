"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface ForecastFilters {
  timePeriod: string;
  forecastHorizon: number;
  products: string[];
  regions: string[];
  modelType: string;
  confidenceLevel: number;
}

type ForecastContextValue = {
  filters: ForecastFilters;
  setFilters: React.Dispatch<React.SetStateAction<ForecastFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  forecastData: any[];
  setForecastData: React.Dispatch<React.SetStateAction<any[]>>;
};

const ForecastContext = React.createContext<ForecastContextValue | undefined>(undefined);

export function useForecastContext(): ForecastContextValue {
  const ctx = React.useContext(ForecastContext);
  if (!ctx) throw new Error("useForecastContext must be used within ForecastProvider");
  return ctx;
}

export function ForecastProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [forecastData, setForecastData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<ForecastFilters>(() => {
    // Default to quarterly forecast for 2021
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      forecastHorizon: 90,
      products: [],
      regions: [],
      modelType: "auto",
      confidenceLevel: 95,
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("forecastFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultFilters, ...parsed };
      }
      return defaultFilters;
    } catch {
      return defaultFilters;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem("forecastFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  // Subscribe to selection manager
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager]);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      selectedPoints,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
      forecastData,
      setForecastData,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, forecastData]
  );

  return <ForecastContext.Provider value={value}>{children}</ForecastContext.Provider>;
}