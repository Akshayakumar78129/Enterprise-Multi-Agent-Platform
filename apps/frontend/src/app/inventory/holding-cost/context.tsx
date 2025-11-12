"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface HoldingCostFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  warehouseIds: string[];
  excessiveOnly: boolean;
  annualHoldingCostRate: number;
  opportunityCostRate: number;
  excessiveCostThreshold: number; // Percentage above which costs are flagged as excessive
}

type HoldingCostContextValue = {
  filters: HoldingCostFilters;
  setFilters: React.Dispatch<React.SetStateAction<HoldingCostFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
  highCostItems: any[];
  setHighCostItems: React.Dispatch<React.SetStateAction<any[]>>;
  insights: string[];
  setInsights: React.Dispatch<React.SetStateAction<string[]>>;
  kpiMetrics: any;
  setKpiMetrics: React.Dispatch<React.SetStateAction<any>>;
  // Chat state
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  chatIsLoading: boolean;
  setChatIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionId: string;
  chatUserId: string;
};

const HoldingCostContext = React.createContext<HoldingCostContextValue | undefined>(undefined);

export function useHoldingCostContext(): HoldingCostContextValue {
  const ctx = React.useContext(HoldingCostContext);
  if (!ctx) throw new Error("useHoldingCostContext must be used within HoldingCostProvider");
  return ctx;
}

export function HoldingCostProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze inventory holding costs today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Data sharing for BI panel
  const [highCostItems, setHighCostItems] = React.useState<any[]>([]);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [kpiMetrics, setKpiMetrics] = React.useState<any>({});

  // Default filters - always used for SSR to prevent hydration mismatch
  const defaultFilters: HoldingCostFilters = React.useMemo(() => ({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    categories: [],
    warehouseIds: [],
    excessiveOnly: false,
    annualHoldingCostRate: 0.25,
    opportunityCostRate: 0.08,
    excessiveCostThreshold: 0.30 // 30% threshold
  }), []);

  const [filters, setFilters] = React.useState<HoldingCostFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("holdingCostFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(prev => ({
          ...prev,
          ...parsed,
          // Ensure numbers are not strings
          annualHoldingCostRate: typeof parsed.annualHoldingCostRate === 'number'
            ? parsed.annualHoldingCostRate
            : 0.25,
          opportunityCostRate: typeof parsed.opportunityCostRate === 'number'
            ? parsed.opportunityCostRate
            : 0.08
        }));
      }
    } catch (e) {
      console.error("Failed to load saved filters:", e);
    }
  }, []);

  // Save filters to localStorage when they change (client-side only)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("holdingCostFilters", JSON.stringify(filters));
    }
  }, [filters]);

  // Sync selections with manager
  React.useEffect(() => {
    const handleSelectionChange = (points: SelectedPoint[]) => {
      setSelectedPoints(points);
    };

    selectionManager.addListener(handleSelectionChange);
    return () => selectionManager.removeListener(handleSelectionChange);
  }, [selectionManager]);

  const value: HoldingCostContextValue = {
    filters,
    setFilters,
    selectedPoints,
    selectionManager,
    isChatOpen,
    setIsChatOpen,
    isBIModalOpen,
    setIsBIModalOpen,
    highCostItems,
    setHighCostItems,
    insights,
    setInsights,
    kpiMetrics,
    setKpiMetrics,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    chatIsLoading,
    setChatIsLoading,
    chatSessionId,
    chatUserId
  };

  return (
    <HoldingCostContext.Provider value={value}>
      {children}
    </HoldingCostContext.Provider>
  );
}
