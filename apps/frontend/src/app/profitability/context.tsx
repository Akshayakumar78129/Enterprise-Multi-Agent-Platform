"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface ProfitabilityFilters {
  timePeriod: string;
  profitType: string;
  segments: string[];
  products: string[];
  minMargin: number;
  costCategories: string[];
}

type ProfitabilityContextValue = {
  filters: ProfitabilityFilters;
  setFilters: React.Dispatch<React.SetStateAction<ProfitabilityFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profitabilityData: any[];
  setProfitabilityData: React.Dispatch<React.SetStateAction<any[]>>;
};

const ProfitabilityContext = React.createContext<ProfitabilityContextValue | undefined>(undefined);

export function useProfitabilityContext(): ProfitabilityContextValue {
  const ctx = React.useContext(ProfitabilityContext);
  if (!ctx) throw new Error("useProfitabilityContext must be used within ProfitabilityProvider");
  return ctx;
}

export function ProfitabilityProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  const [profitabilityData, setProfitabilityData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<ProfitabilityFilters>(() => {
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      profitType: "gross",
      segments: [],
      products: [],
      minMargin: 0,
      costCategories: [],
    };

    if (typeof window === "undefined") return defaultFilters;

    try {
      const saved = localStorage.getItem("profitabilityFilters");
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
      localStorage.setItem("profitabilityFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });
    return () => unsubscribe();
  }, [selectionManager]);

  const value = React.useMemo(
    () => ({
      filters, setFilters, selectedPoints, selectionManager,
      isChatOpen, setIsChatOpen, isBIModalOpen, setIsBIModalOpen,
      profitabilityData, setProfitabilityData,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, profitabilityData]
  );

  return <ProfitabilityContext.Provider value={value}>{children}</ProfitabilityContext.Provider>;
}