"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager } from './services/SelectionManager';
import { Message } from 'components';

interface SegmentationFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  customerSegments: string[];
  valueCategories: string[];
  behaviorTypes: string[];
}

interface SegmentationContextType {
  filters: SegmentationFilters;
  setFilters: (filters: SegmentationFilters) => void;
  selectedSegment: string | null;
  setSelectedSegment: (segment: string | null) => void;
  selectionManager: SelectionManager;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  segments: any[];
  setSegments: (segments: any[]) => void;
  insights: string[];
  setInsights: (insights: string[]) => void;
  // Chat state
  chatMessages: Message[];
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  chatIsLoading: boolean;
  setChatIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessionId: string;
  chatUserId: string;
}

const SegmentationContext = createContext<SegmentationContextType | undefined>(undefined);

export function SegmentationProvider({ children }: { children: React.ReactNode }) {
  // Initialize filters
  const [filters, setFilters] = useState<SegmentationFilters>(() => {
    // Default date range
    const defaultFilters = {
      dateRange: {
        startDate: '2017-01-01',
        endDate: '2021-12-31'
      },
      customerSegments: [],
      valueCategories: [],
      behaviorTypes: []
    };

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('segmentation_filters');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);

          // Migration: Convert old dateFrom/dateTo to new dateRange format
          if (parsed.dateFrom && parsed.dateTo) {
            return {
              dateRange: {
                startDate: parsed.dateFrom,
                endDate: parsed.dateTo
              },
              customerSegments: parsed.customerSegments || [],
              valueCategories: parsed.valueCategories || [],
              behaviorTypes: parsed.behaviorTypes || []
            };
          }

          return parsed;
        } catch (e) {
          console.error('Failed to load saved filters:', e);
        }
      }
    }

    return defaultFilters;
  });

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // Chat state - persists across expand/collapse
  const [chatMessages, setChatMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hello! I'm your AI assistant. How can I help you analyze your customer segmentation data today?"
  }]);
  const [chatInput, setChatInput] = useState("");
  const [chatIsLoading, setChatIsLoading] = useState(false);
  const [chatSessionId] = useState(() => `session_${Date.now()}`);
  const [chatUserId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);

  // Initialize selection manager
  const selectionManager = React.useMemo(() => new SelectionManager(), []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('segmentation_filters', JSON.stringify(filters));
    }
  }, [filters]);

  return (
    <SegmentationContext.Provider
      value={{
        filters,
        setFilters,
        selectedSegment,
        setSelectedSegment,
        selectionManager,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen,
        isChatPanelOpen,
        setIsChatPanelOpen,
        segments,
        setSegments,
        insights,
        setInsights,
        chatMessages,
        setChatMessages,
        chatInput,
        setChatInput,
        chatIsLoading,
        setChatIsLoading,
        chatSessionId,
        chatUserId
      }}
    >
      {children}
    </SegmentationContext.Provider>
  );
}

export function useSegmentationContext() {
  const context = useContext(SegmentationContext);
  if (!context) {
    throw new Error('useSegmentationContext must be used within SegmentationProvider');
  }
  return context;
}

// Export the provider with both names for compatibility
export { SegmentationProvider as CustomerSegmentationProvider };