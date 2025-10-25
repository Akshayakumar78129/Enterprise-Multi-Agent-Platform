"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "../churn-prediction/services/SelectionManager";
import { RegionalSalesData } from "./services/regionalSalesService";

export interface RegionalSalesFiltersState {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  countries: string[];
  states: string[];
}

type RegionalSalesContextValue = {
  filters: RegionalSalesFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<RegionalSalesFiltersState>>;
  selectedPoints: SelectedPoint[];
  selectionManager: SelectionManager;
  // Panel state management
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBIModalOpen: boolean;
  setIsBIModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Data sharing for BI panel and context
  regionalSalesData: RegionalSalesData | null;
  setRegionalSalesData: React.Dispatch<React.SetStateAction<RegionalSalesData | null>>;
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

const RegionalSalesContext = React.createContext<RegionalSalesContextValue | undefined>(undefined);

export function useRegionalSalesContext(): RegionalSalesContextValue {
  const ctx = React.useContext(RegionalSalesContext);
  if (!ctx) throw new Error("useRegionalSalesContext must be used within RegionalSalesProvider");
  return ctx;
}

export function RegionalSalesProvider({ children }: { children: React.ReactNode }) {
  const [selectedPoints, setSelectedPoints] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);

  // Data sharing for BI panel
  const [regionalSalesData, setRegionalSalesData] = React.useState<RegionalSalesData | null>(null);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your regional sales data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Always start with default filters to avoid hydration mismatch
  const [filters, setFilters] = React.useState<RegionalSalesFiltersState>({
    dateRange: { startDate: "2017-01-01", endDate: "2021-12-31" },
    countries: [],
    states: []
  });

  // Load filters from localStorage after hydration
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("regionalSalesFilters");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      }
    } catch {
      // Ignore errors
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("regionalSalesFilters", JSON.stringify(filters));
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
    (newFilters: React.SetStateAction<RegionalSalesFiltersState>) => {
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
      regionalSalesData,
      setRegionalSalesData,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId,
    }),
    [
      filters,
      memoizedSetFilters,
      selectedPoints,
      selectionManager,
      isChatOpen,
      isBIModalOpen,
      regionalSalesData,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId
    ]
  );

  return <RegionalSalesContext.Provider value={value}>{children}</RegionalSalesContext.Provider>;
}
