// Customer Segmentation Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Customer Segmentation data
export interface CustomerSegmentationCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface CustomerSegmentationFilters {
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

interface CustomerSegmentationContextType {
  filters: CustomerSegmentationFilters;
  setFilters: (filters: CustomerSegmentationFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: CustomerSegmentationCustomer[];
  setCustomers: (customers: CustomerSegmentationCustomer[]) => void;
}

const CustomerSegmentationContext = createContext<CustomerSegmentationContextType | undefined>(undefined);

export function CustomerSegmentationProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<CustomerSegmentationFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<CustomerSegmentationCustomer[]>([]);

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
    <CustomerSegmentationContext.Provider value={value}>
      {children}
    </CustomerSegmentationContext.Provider>
  );
}

export function useCustomerSegmentationContext() {
  const context = useContext(CustomerSegmentationContext);
  if (!context) {
    throw new Error("useCustomerSegmentationContext must be used within CustomerSegmentationProvider");
  }
  return context;
}
