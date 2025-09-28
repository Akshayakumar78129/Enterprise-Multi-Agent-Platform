"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager } from './services/SelectionManager';

interface SegmentationFilters {
  dateFrom: string;
  dateTo: string;
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
}

const SegmentationContext = createContext<SegmentationContextType | undefined>(undefined);

export function SegmentationProvider({ children }: { children: React.ReactNode }) {
  // Initialize filters
  const [filters, setFilters] = useState<SegmentationFilters>(() => {
    // Use 2021 dates as default
    const dateFrom = '2021-01-01';
    const dateTo = '2021-12-31';

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('segmentation_filters');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load saved filters:', e);
        }
      }
    }

    return {
      dateFrom: dateFrom,
      dateTo: dateTo,
      customerSegments: [],
      valueCategories: [],
      behaviorTypes: []
    };
  });

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

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
        setInsights
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