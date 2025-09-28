// Engagement Classifier Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Engagement Classifier data
export interface EngagementClassifierCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface EngagementClassifierFilters {
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

interface EngagementClassifierContextType {
  filters: EngagementClassifierFilters;
  setFilters: (filters: EngagementClassifierFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: EngagementClassifierCustomer[];
  setCustomers: (customers: EngagementClassifierCustomer[]) => void;
}

const EngagementClassifierContext = createContext<EngagementClassifierContextType | undefined>(undefined);

export function EngagementClassifierProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<EngagementClassifierFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<EngagementClassifierCustomer[]>([]);

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
    <EngagementClassifierContext.Provider value={value}>
      {children}
    </EngagementClassifierContext.Provider>
  );
}

export function useEngagementClassifierContext() {
  const context = useContext(EngagementClassifierContext);
  if (!context) {
    throw new Error("useEngagementClassifierContext must be used within EngagementClassifierProvider");
  }
  return context;
}
