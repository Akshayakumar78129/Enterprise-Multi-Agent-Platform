"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface InventoryOptimizationFilters {
  dateRange: { startDate: string; endDate: string };
  categories: string[];
  warehouseIds: string[];
  optimizationLevel: string;
}

interface InventoryOptimizationContextType {
  filters: InventoryOptimizationFilters;
  setFilters: (filters: InventoryOptimizationFilters) => void;
  updateFilters: (updates: Partial<InventoryOptimizationFilters>) => void;
}

const InventoryOptimizationContext = createContext<InventoryOptimizationContextType | undefined>(undefined);

export function InventoryOptimizationProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<InventoryOptimizationFilters>({
    dateRange: { startDate: '2017-01-01', endDate: '2021-12-31' },
    categories: [],
    warehouseIds: [],
    optimizationLevel: 'balanced',
  });

  const setFilters = useCallback((newFilters: InventoryOptimizationFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilters = useCallback((updates: Partial<InventoryOptimizationFilters>) => {
    setFiltersState(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <InventoryOptimizationContext.Provider value={{ filters, setFilters, updateFilters }}>
      {children}
    </InventoryOptimizationContext.Provider>
  );
}

export function useInventoryOptimizationContext() {
  const context = useContext(InventoryOptimizationContext);
  if (!context) {
    throw new Error('useInventoryOptimizationContext must be used within InventoryOptimizationProvider');
  }
  return context;
}
