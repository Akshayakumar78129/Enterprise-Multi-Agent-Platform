"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface SalesTrendsFilters {
  dateFrom: string;
  dateTo: string;
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  metric: 'revenue' | 'units' | 'aov' | 'margin';
  dimension?: 'product' | 'category' | 'region' | 'customer' | null;
  topN?: number;
  customerCategory?: string[];
  customerRegion?: string[];
  itemName?: string[];
}

interface SalesTrendsContextType {
  filters: SalesTrendsFilters;
  setFilters: (filters: SalesTrendsFilters) => void;
  updateFilter: <K extends keyof SalesTrendsFilters>(key: K, value: SalesTrendsFilters[K]) => void;
  resetFilters: () => void;
  salesData: any;
  setSalesData: (data: any) => void;
}

const defaultFilters: SalesTrendsFilters = {
  dateFrom: '2017-01-01',
  dateTo: '2021-12-31',
  granularity: 'monthly',
  metric: 'revenue',
  dimension: null,
  topN: 10,
  customerCategory: [],
  customerRegion: [],
  itemName: []
};

const SalesTrendsContext = createContext<SalesTrendsContextType | undefined>(undefined);

export function SalesTrendsProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<SalesTrendsFilters>(defaultFilters);
  const [salesData, setSalesData] = useState<any>(null);

  const setFilters = useCallback((newFilters: SalesTrendsFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof SalesTrendsFilters>(
    key: K,
    value: SalesTrendsFilters[K]
  ) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  return (
    <SalesTrendsContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        salesData,
        setSalesData
      }}
    >
      {children}
    </SalesTrendsContext.Provider>
  );
}

export function useSalesTrendsContext() {
  const context = useContext(SalesTrendsContext);
  if (context === undefined) {
    throw new Error('useSalesTrendsContext must be used within a SalesTrendsProvider');
  }
  return context;
}
