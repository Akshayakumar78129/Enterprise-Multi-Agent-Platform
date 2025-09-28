"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SelectionManager } from './services/SelectionManager';

interface LtvFilters {
  dateRange?: {
    from: string;
    to: string;
  };
  segment?: string;
  minLtv?: number;
  maxLtv?: number;
}

interface CustomerLtvContextType {
  filters: LtvFilters;
  setFilters: (filters: LtvFilters) => void;
  ltvData: any[];
  setLtvData: (data: any[]) => void;
  customers: any[];
  setCustomers: (customers: any[]) => void;
  selectionManager: SelectionManager;
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;
  isBusinessIntelligencePanelOpen: boolean;
  setIsBusinessIntelligencePanelOpen: (open: boolean) => void;
}

const CustomerLtvContext = createContext<CustomerLtvContextType | undefined>(undefined);

export function CustomerLtvProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<LtvFilters>(() => {
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(today.getFullYear() - 1);

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ltv_filters');
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

  const [ltvData, setLtvData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isBusinessIntelligencePanelOpen, setIsBusinessIntelligencePanelOpen] = useState(false);

  // Initialize selection manager
  const selectionManager = React.useMemo(() => new SelectionManager(), []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ltv_filters', JSON.stringify(filters));
    }
  }, [filters]);

  return (
    <CustomerLtvContext.Provider
      value={{
        filters,
        setFilters,
        ltvData,
        setLtvData,
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
    </CustomerLtvContext.Provider>
  );
}

export function useCustomerLtvContext() {
  const context = useContext(CustomerLtvContext);
  if (context === undefined) {
    throw new Error('useCustomerLtvContext must be used within a CustomerLtvProvider');
  }
  return context;
}