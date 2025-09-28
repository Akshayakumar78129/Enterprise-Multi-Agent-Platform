"use client";

import React from "react";
import { SelectedPoint } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface BehaviorFilters {
  timePeriod: string;
  segmentId: string | null;
  segmentIds?: string[];  // Support multiple segments
  behaviorTypes: string[];
  minTransactions: number;
  customerIds: string[];
  loyaltyStatus: string[];
}

type BehaviorContextValue = {
  filters: BehaviorFilters;
  setFilters: React.Dispatch<React.SetStateAction<BehaviorFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  behaviorCustomers: any[];
  setBehaviorCustomers: React.Dispatch<React.SetStateAction<any[]>>;
};

const BehaviorContext = React.createContext<BehaviorContextValue | undefined>(undefined);

export function useBehaviorContext(): BehaviorContextValue {
  const ctx = React.useContext(BehaviorContext);
  if (!ctx) throw new Error("useBehaviorContext must be used within BehaviorProvider");
  return ctx;
}

export function BehaviorProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [behaviorCustomers, setBehaviorCustomers] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<BehaviorFilters>(() => {
    // Default to quarterly analysis for 2021
    const defaultFilters = {
      timePeriod: "2021-01-01:2021-12-31",
      segmentId: null,
      segmentIds: [],
      behaviorTypes: ["purchase_patterns", "product_preferences", "channel_usage", "engagement_metrics"],
      minTransactions: 2,
      customerIds: [],
      loyaltyStatus: [],
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("behaviorFilters");
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
      localStorage.setItem("behaviorFilters", JSON.stringify(filters));
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
      behaviorCustomers,
      setBehaviorCustomers,
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, behaviorCustomers]
  );

  return <BehaviorContext.Provider value={value}>{children}</BehaviorContext.Provider>;
}