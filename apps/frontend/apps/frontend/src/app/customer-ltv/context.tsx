// Customer Lifetime Value Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Customer Lifetime Value data
export interface CustomerLtvCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface CustomerLtvFilters {
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

interface CustomerLtvContextType {
  filters: CustomerLtvFilters;
  setFilters: (filters: CustomerLtvFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: CustomerLtvCustomer[];
  setCustomers: (customers: CustomerLtvCustomer[]) => void;
}

const CustomerLtvContext = createContext<CustomerLtvContextType | undefined>(undefined);

export function CustomerLtvProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<CustomerLtvFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<CustomerLtvCustomer[]>([]);

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
    <CustomerLtvContext.Provider value={value}>
      {children}
    </CustomerLtvContext.Provider>
  );
}

export function useCustomerLtvContext() {
  const context = useContext(CustomerLtvContext);
  if (!context) {
    throw new Error("useCustomerLtvContext must be used within CustomerLtvProvider");
  }
  return context;
}
