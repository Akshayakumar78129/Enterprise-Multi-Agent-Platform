"use client";

import React from "react";
import { SelectedPoint } from "components/index";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface AnomalyFilters {
  dateFrom: string;
  dateTo: string;
  severityLevels: number[];
  segments: string[];
  regions: string[];
  contamination: number;
  search: string;
}

type AnomalyContextValue = {
  filters: AnomalyFilters;
  setFilters: React.Dispatch<React.SetStateAction<AnomalyFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  anomalyCustomers: any[];
  setAnomalyCustomers: React.Dispatch<React.SetStateAction<any[]>>;
};

const AnomalyContext = React.createContext<AnomalyContextValue | undefined>(undefined);

export function useAnomalyContext(): AnomalyContextValue {
  const ctx = React.useContext(AnomalyContext);
  if (!ctx) throw new Error("useAnomalyContext must be used within AnomalyProvider");
  return ctx;
}

export function AnomalyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [anomalyCustomers, setAnomalyCustomers] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<AnomalyFilters>(() => {
    // Default to full year 2021
    const defaultFilters = {
      dateFrom: "2021-01-01",
      dateTo: "2021-12-31",
      severityLevels: [],
      segments: [],
      regions: [],
      contamination: 0.1,
      search: "",
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("anomalyFilters");
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
      localStorage.setItem("anomalyFilters", JSON.stringify(filters));
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
      anomalyCustomers,
      setAnomalyCustomers,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, anomalyCustomers]
  );

  return <AnomalyContext.Provider value={value}>{children}</AnomalyContext.Provider>;
}