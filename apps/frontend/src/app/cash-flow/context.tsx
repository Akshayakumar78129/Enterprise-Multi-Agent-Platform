"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface CashFlowFilters {
  timePeriod: string;
  cashFlowType: string;
  departments: string[];
  projects: string[];
  minAmount: number;
  includeProjections: boolean;
}

type CashFlowContextValue = {
  filters: CashFlowFilters;
  setFilters: React.Dispatch<React.SetStateAction<CashFlowFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cashFlowData: any[];
  setCashFlowData: React.Dispatch<React.SetStateAction<any[]>>;
};

const CashFlowContext = React.createContext<CashFlowContextValue | undefined>(undefined);

export function useCashFlowContext(): CashFlowContextValue {
  const ctx = React.useContext(CashFlowContext);
  if (!ctx) throw new Error("useCashFlowContext must be used within CashFlowProvider");
  return ctx;
}

export function CashFlowProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  const [cashFlowData, setCashFlowData] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<CashFlowFilters>(() => {
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      cashFlowType: "all",
      departments: [],
      projects: [],
      minAmount: 1000,
      includeProjections: true,
    };

    if (typeof window === "undefined") return defaultFilters;

    try {
      const saved = localStorage.getItem("cashFlowFilters");
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
      localStorage.setItem("cashFlowFilters", JSON.stringify(filters));
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
      cashFlowData, setCashFlowData,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, cashFlowData]
  );

  return <CashFlowContext.Provider value={value}>{children}</CashFlowContext.Provider>;
}