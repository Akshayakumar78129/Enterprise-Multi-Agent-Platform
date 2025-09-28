"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface StockFilters {
  timePeriod: string;
  warehouseId: string | null;
  categories: string[];
  stockStatus: string[];
  minQuantity: number;
  suppliers: string[];
}

type StockContextValue = {
  filters: StockFilters;
  setFilters: React.Dispatch<React.SetStateAction<StockFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  stockData: any[];
  setStockData: React.Dispatch<React.SetStateAction<any[]>>;
};

const StockContext = React.createContext<StockContextValue | undefined>(undefined);

export function useStockContext(): StockContextValue {
  const ctx = React.useContext(StockContext);
  if (!ctx) throw new Error("useStockContext must be used within StockProvider");
  return ctx;
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [stockData, setStockData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<StockFilters>(() => {
    // Default to yearly analysis for 2021
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      warehouseId: null,
      categories: [],
      stockStatus: ["low_stock", "out_of_stock", "overstock"],
      minQuantity: 0,
      suppliers: [],
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("stockFilters");
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
      localStorage.setItem("stockFilters", JSON.stringify(filters));
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
      stockData,
      setStockData,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, stockData]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}