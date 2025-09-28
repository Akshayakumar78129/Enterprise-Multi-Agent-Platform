// Purchase Frequency Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Purchase Frequency data
export interface PurchaseFrequencyCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface PurchaseFrequencyFilters {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  segments?: string[];
  customerTypes?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
}

interface PurchaseFrequencyContextType {
  filters: PurchaseFrequencyFilters;
  setFilters: (filters: PurchaseFrequencyFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: PurchaseFrequencyCustomer[];
  setCustomers: (customers: PurchaseFrequencyCustomer[]) => void;
}

const PurchaseFrequencyContext = createContext<PurchaseFrequencyContextType | undefined>(undefined);

export function PurchaseFrequencyProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<PurchaseFrequencyFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<PurchaseFrequencyCustomer[]>([]);

  const selectionManager = React.useMemo(() => new SelectionManager(), []);

  const value = {
    filters,
    setFilters,
    timeRange,
    setTimeRange,
    selectedPoints,
    selectionManager,
    customers,
    setCustomers
  };

  return (
    <PurchaseFrequencyContext.Provider value={value}>
      {children}
    </PurchaseFrequencyContext.Provider>
  );
}

export function usePurchaseFrequencyContext() {
  const context = useContext(PurchaseFrequencyContext);
  if (!context) {
    throw new Error("usePurchaseFrequencyContext must be used within PurchaseFrequencyProvider");
  }
  return context;
}
