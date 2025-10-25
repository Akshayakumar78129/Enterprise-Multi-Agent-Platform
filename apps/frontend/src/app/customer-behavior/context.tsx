"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface BehaviorFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
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
  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = React.useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your customer behavior data today?"
  }]);
  const [chatInput, setChatInput] = React.useState("");
  const [chatIsLoading, setChatIsLoading] = React.useState(false);
  const [chatSessionId] = React.useState(() => `session_${Date.now()}`);
  const [chatUserId] = React.useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);


  // Data sharing for BI panel
  const [behaviorCustomers, setBehaviorCustomers] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<BehaviorFilters>(() => {
    // Default to 2017-2021 (consistent with sales and product performance)
    const defaultFilters = {
      dateRange: {
        startDate: "2017-01-01",
        endDate: "2021-12-31"
      },
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

        // Migration: Convert old timePeriod format to dateRange
        if (parsed.timePeriod && typeof parsed.timePeriod === 'string') {
          const [startDate, endDate] = parsed.timePeriod.split(':');
          return {
            ...defaultFilters,
            ...parsed,
            dateRange: {
              startDate: startDate || defaultFilters.dateRange.startDate,
              endDate: endDate || defaultFilters.dateRange.endDate
            },
            timePeriod: undefined  // Remove old field
          };
        }

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
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId
    }),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, behaviorCustomers, chatMessages, chatInput, chatIsLoading, chatSessionId, chatUserId]
  );

  return <BehaviorContext.Provider value={value}>{children}</BehaviorContext.Provider>;
}