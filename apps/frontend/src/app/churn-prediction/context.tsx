"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
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

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your churn prediction data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Data sharing for BI panel
  const [churnCustomers, setChurnCustomers] = React.useState<any[]>([]);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [kpiMetrics, setKpiMetrics] = React.useState<any>({});

  const [timeRange, setTimeRange] = React.useState<TimeRange>(() => {
    if (typeof window === "undefined") return "30d";
    return (localStorage.getItem("churnTimeRange") as TimeRange) || "30d";
  });

  const [filters, setFilters] = React.useState<ChurnFilters>(() => {
    // Default to full data range 2017-2021 (complete data for comprehensive analysis)
    const defaultStartDate = "2017-01-01";
    const defaultEndDate = "2021-12-31";

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

        // Migration: Update old 2021-only date range to full 2017-2021 range
        if (parsed.dateRange?.startDate === "2021-01-01") {
          parsed.dateRange.startDate = "2017-01-01";
          // Save the migrated value back to localStorage
          localStorage.setItem("churnFilters", JSON.stringify(parsed));
        }

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
      chatUserId,
    }),
    [filters, memoizedSetFilters, timeRange, memoizedSetTimeRange, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, churnCustomers, insights, kpiMetrics, chatMessages, chatInput, chatIsLoading, chatSessionId, chatUserId]
  );

  return <ChurnContext.Provider value={value}>{children}</ChurnContext.Provider>;
}


