"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "../churn-prediction/services/SelectionManager";

export interface DemandForecastFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories: string[];
  regions: string[];
}

type DemandforecastContextType = {
  filters: DemandForecastFilters;
  setFilters: React.Dispatch<React.SetStateAction<DemandForecastFilters>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel
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

const DemandforecastContext = React.createContext<DemandforecastContextType | undefined>(undefined);

export function useDemandforecastContext(): DemandforecastContextType {
  const ctx = React.useContext(DemandforecastContext);
  if (!ctx) throw new Error("useDemandforecastContext must be used within DemandforecastProvider");
  return ctx;
}

export function DemandforecastProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your demand forecast data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Data sharing for BI panel
  const [insights, setInsights] = React.useState<string[]>([]);
  const [kpiMetrics, setKpiMetrics] = React.useState<any>({});

  // Default filters - always used for SSR to prevent hydration mismatch
  const defaultFilters: DemandForecastFilters = React.useMemo(() => ({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    categories: [],
    regions: []
  }), []);

  const [filters, setFilters] = React.useState<DemandForecastFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("demandForecastFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch (error) {
      console.error('[DemandForecastContext] Failed to load saved filters:', error);
    }
  }, []); // Run once on mount

  // Save filters to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem("demandForecastFilters", JSON.stringify(filters));
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

  // Memoize setFilters to prevent unnecessary recreations
  const memoizedSetFilters = React.useCallback(
    (newFilters: React.SetStateAction<DemandForecastFilters>) => {
      setFilters(newFilters);
    },
    []
  );

  const value = React.useMemo(
    () => ({
      filters,
      setFilters: memoizedSetFilters,
      selectedPoints,
      selectionManager,
      isChatOpen,
      setIsChatOpen,
      isBIModalOpen,
      setIsBIModalOpen,
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
    [filters, memoizedSetFilters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, insights, kpiMetrics, chatMessages, chatInput, chatIsLoading, chatSessionId, chatUserId]
  );

  return <DemandforecastContext.Provider value={value}>{children}</DemandforecastContext.Provider>;
}
