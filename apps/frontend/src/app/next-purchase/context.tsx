"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SelectionManager, getSelectionManager } from './services/SelectionManager';

export interface NextPurchaseFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  productCategories: string[];
  probabilityThreshold: number;
  dayRange: {
    min: number;
    max: number;
  };
}

interface NextPurchaseContextType {
  filters: NextPurchaseFilters;
  setFilters: React.Dispatch<React.SetStateAction<NextPurchaseFilters>>;
  predictionData: any[];
  setPredictionData: (data: any[]) => void;
  kpiMetrics: any;
  setKpiMetrics: (metrics: any) => void;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectionManager: SelectionManager;
}

const NextPurchaseContext = createContext<NextPurchaseContextType | undefined>(undefined);

export function NextPurchaseProvider({ children }: { children: React.ReactNode }) {
  // Initialize SelectionManager singleton
  const [selectionManager] = useState(() => getSelectionManager());

  // Panel states
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  // Data sharing
  const [predictionData, setPredictionDataInternal] = useState<any[]>([]);
  const [kpiMetrics, setKpiMetricsInternal] = useState<any>({});

  // Always start with default filters (2017-2021)
  const [filters, setFiltersInternal] = useState<NextPurchaseFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    productCategories: [],
    probabilityThreshold: 0,
    dayRange: { min: 0, max: 60 }
  });

  // Load filters from localStorage after hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nextPurchaseFilters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure date range is present
        if (!parsed.dateRange || !parsed.dateRange.startDate || !parsed.dateRange.endDate) {
          parsed.dateRange = { startDate: '2017-01-01', endDate: '2021-12-31' };
        }
        setFiltersInternal(parsed);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nextPurchaseFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);

  // Memoized callbacks for setters
  const setPredictionData = useCallback((data: any) => {
    setPredictionDataInternal(data);
  }, []);

  const setKpiMetrics = useCallback((metrics: any) => {
    setKpiMetricsInternal(metrics);
  }, []);

  const setFilters = useCallback((newFilters: React.SetStateAction<NextPurchaseFilters>) => {
    setFiltersInternal(newFilters);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      filters,
      setFilters,
      predictionData,
      setPredictionData,
      kpiMetrics,
      setKpiMetrics,
      isChatPanelOpen,
      setIsChatPanelOpen,
      isBusinessIntelligencePanelOpen,
      setIsBusinessIntelligencePanelOpen,
      selectionManager,
    }),
    [
      filters,
      setFilters,
      predictionData,
      setPredictionData,
      kpiMetrics,
      setKpiMetrics,
      isChatPanelOpen,
      isBusinessIntelligencePanelOpen,
      selectionManager
    ]
  );

  return (
    <NextPurchaseContext.Provider value={value}>
      {children}
    </NextPurchaseContext.Provider>
  );
}

export function useNextPurchaseContext() {
  const context = useContext(NextPurchaseContext);
  if (context === undefined) {
    throw new Error('useNextPurchaseContext must be used within a NextPurchaseProvider');
  }
  return context;
}
