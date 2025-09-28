"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager } from './services/SelectionManager';

interface InsightsFilters {
  dateRange?: {
    from: string;
    to: string;
  };
  insightType?: string;
  customerSegment?: string;
}

interface CustomerInsightsContextType {
  filters: InsightsFilters;
  setFilters: (filters: InsightsFilters) => void;
  insightData: any[];
  setInsightData: (data: any[]) => void;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  selectionManager: SelectionManager;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
}

const CustomerInsightsContext = createContext<CustomerInsightsContextType | undefined>(undefined);

export function CustomerInsightsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<InsightsFilters>(() => {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('insights_filters');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load saved filters:', e);
        }
      }
    }

    return {
      dateRange: {
        from: lastYear.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      }
    };
  });

  const [insightData, setInsightData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  // Initialize selection manager
  const selectionManager = React.useMemo(() => new SelectionManager(), []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('insights_filters', JSON.stringify(filters));
    }
  }, [filters]);

  return (
    <CustomerInsightsContext.Provider
      value={{
        filters,
        setFilters,
        insightData,
        setInsightData,
        customers,
        setCustomers,
        selectionManager,
        isChatPanelOpen,
        setIsChatPanelOpen,
        isBusinessIntelligencePanelOpen,
        setIsBusinessIntelligencePanelOpen
      }}
    >
      {children}
    </CustomerInsightsContext.Provider>
  );
}

export function useCustomerInsightsContext() {
  const context = useContext(CustomerInsightsContext);
  if (context === undefined) {
    throw new Error('useCustomerInsightsContext must be used within a CustomerInsightsProvider');
  }
  return context;
}