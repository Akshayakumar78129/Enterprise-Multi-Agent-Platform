"use client";

import React from "react";
import { SelectedPoint } from "components/index";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface AnomalyFilters {
  dateFrom: string;
  dateTo: string;
  severityLevels: number[];
  segments: string[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId];
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
  const [selectedPoints, setSelectedPoints,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId] = React.useState<SelectedPoint[]>([]);
  const [selectionManager] = React.useState(() => getSelectionManager());

  // Panel state management
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isBIModalOpen, setIsBIModalOpen] = React.useState(false);
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your anomaly detection data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);


  // Data sharing for BI panel
  const [anomalyCustomers, setAnomalyCustomers] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<AnomalyFilters>(() => {
    // Default to 2017-2021 (consistent with sales performance)
    const defaultFilters = {
      dateFrom: "2017-01-01",
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
  }, [filters,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

  // Subscribe to selection manager
  React.useEffect(() => {
    const unsubscribe = selectionManager.subscribe((points) => {
      setSelectedPoints(points);
    });

    return () => {
      unsubscribe();
    };
  }, [selectionManager,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId]);

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
    ,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId}),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, anomalyCustomers]
  );

  return <AnomalyContext.Provider value={value}>{children}</AnomalyContext.Provider>;
}