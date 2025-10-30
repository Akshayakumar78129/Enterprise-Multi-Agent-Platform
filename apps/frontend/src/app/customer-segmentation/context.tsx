"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  // Default filters - always used for SSR to prevent hydration mismatch
  const defaultFilters: SegmentationFilters = useMemo(() => ({
    dateRange: {
      startDate: '2017-01-01',
      endDate: '2021-12-31'
    },
    customerSegments: [],
    valueCategories: [],
    behaviorTypes: []
  }), []);

  const [filters, setFilters] = useState<SegmentationFilters>(defaultFilters);

  // Load saved filters from localStorage AFTER hydration (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('segmentation_filters');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Migration: Convert old dateFrom/dateTo to new dateRange format
        if (parsed.dateFrom && parsed.dateTo) {
          setFilters({
            dateRange: {
              startDate: parsed.dateFrom,
              endDate: parsed.dateTo
            },
            customerSegments: parsed.customerSegments || [],
            valueCategories: parsed.valueCategories || [],
            behaviorTypes: parsed.behaviorTypes || []
          });
        } else {
          setFilters(parsed);
        }
      }
    } catch (e) {
      console.error('[SegmentationContext] Failed to load saved filters:', e);
    }
  }, []); // Run once on mount

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