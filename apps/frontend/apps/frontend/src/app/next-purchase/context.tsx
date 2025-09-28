// Next Purchase Predictor Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Next Purchase Predictor data
export interface NextPurchaseCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface NextPurchaseFilters {
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

interface NextPurchaseContextType {
  filters: NextPurchaseFilters;
  setFilters: (filters: NextPurchaseFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: NextPurchaseCustomer[];
  setCustomers: (customers: NextPurchaseCustomer[]) => void;
}

const NextPurchaseContext = createContext<NextPurchaseContextType | undefined>(undefined);

export function NextPurchaseProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<NextPurchaseFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<NextPurchaseCustomer[]>([]);

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
    <NextPurchaseContext.Provider value={value}>
      {children}
    </NextPurchaseContext.Provider>
  );
}

export function useNextPurchaseContext() {
  const context = useContext(NextPurchaseContext);
  if (!context) {
    throw new Error("useNextPurchaseContext must be used within NextPurchaseProvider");
  }
  return context;
}
