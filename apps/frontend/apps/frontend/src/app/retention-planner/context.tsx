// Retention Planner Context - Following churn pattern
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { SelectionManager } from "components";

// Define interfaces for Retention Planner data
export interface RetentionPlannerCustomer {
  customer_id: string;
  name: string;
  segment?: string;
  value?: number;
  frequency?: number;
  recency?: number;
  engagement_level?: string;
  predicted_ltv?: number;
}

export interface RetentionPlannerFilters {
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

interface RetentionPlannerContextType {
  filters: RetentionPlannerFilters;
  setFilters: (filters: RetentionPlannerFilters) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedPoints: any[];
  selectionManager: SelectionManager;
  customers: RetentionPlannerCustomer[];
  setCustomers: (customers: RetentionPlannerCustomer[]) => void;
}

const RetentionPlannerContext = createContext<RetentionPlannerContextType | undefined>(undefined);

export function RetentionPlannerProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<RetentionPlannerFilters>({
    dateRange: { startDate: "", endDate: "" },
    segments: [],
    customerTypes: [],
  });

  const [timeRange, setTimeRange] = useState<string>("3M");
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [customers, setCustomers] = useState<RetentionPlannerCustomer[]>([]);

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
    <RetentionPlannerContext.Provider value={value}>
      {children}
    </RetentionPlannerContext.Provider>
  );
}

export function useRetentionPlannerContext() {
  const context = useContext(RetentionPlannerContext);
  if (!context) {
    throw new Error("useRetentionPlannerContext must be used within RetentionPlannerProvider");
  }
  return context;
}
