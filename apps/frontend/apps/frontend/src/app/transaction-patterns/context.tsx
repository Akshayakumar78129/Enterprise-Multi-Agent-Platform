// Transaction Patterns Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Transaction Patterns data
export interface TransactionPatternsCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface TransactionPatternsFilters {
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

interface TransactionPatternsContextType {
  filters: TransactionPatternsFilters;
  setFilters: (filters: TransactionPatternsFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: TransactionPatternsCustomer[];
  setCustomers: (customers: TransactionPatternsCustomer[]) => void;
}

const TransactionPatternsContext = createContext<TransactionPatternsContextType | undefined>(undefined);

export function TransactionPatternsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<TransactionPatternsFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<TransactionPatternsCustomer[]>([]);

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
    <TransactionPatternsContext.Provider value={value}>
      {children}
    </TransactionPatternsContext.Provider>
  );
}

export function useTransactionPatternsContext() {
  const context = useContext(TransactionPatternsContext);
  if (!context) {
    throw new Error("useTransactionPatternsContext must be used within TransactionPatternsProvider");
  }
  return context;
}
