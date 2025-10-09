"use client";

import React from "react";
import { SelectedPoint, Message } from "components";
import { SelectionManager, getSelectionManager } from "./services/SelectionManager";

export interface BehaviorFilters {
  timePeriod: string;
  segmentId: string | null;
  segmentIds?: string[];  // Support multiple segments
  behaviorTypes: string[,
      chatMessages,
      chatInput,
      chatIsLoading,
      chatSessionId,
      chatUserId];
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
    content: "Hello! I'm your AI assistant. How can I help you analyze your customer behavior data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);


  // Data sharing for BI panel
  const [behaviorCustomers, setBehaviorCustomers] = React.useState<any[]>([]);

  const [filters, setFilters] = React.useState<BehaviorFilters>(() => {
    // Default to 2017-2021 (consistent with sales and product performance)
    const defaultFilters = {
      timePeriod: "2017-01-01:2021-12-31",
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
      behaviorCustomers,
      setBehaviorCustomers,
    ,
      chatMessages,
      setChatMessages,
      chatInput,
      setChatInput,
      chatIsLoading,
      setChatIsLoading,
      chatSessionId,
      chatUserId}),
    [filters, selectedPoints, selectionManager, isChatOpen, isBIModalOpen, behaviorCustomers]
  );

  return <BehaviorContext.Provider value={value}>{children}</BehaviorContext.Provider>;
}