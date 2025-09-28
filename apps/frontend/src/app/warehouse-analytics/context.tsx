'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WarehouseanalyticsContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const WarehouseanalyticsContext = createContext<WarehouseanalyticsContextType | undefined>(undefined);

export function WarehouseanalyticsProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <WarehouseanalyticsContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </WarehouseanalyticsContext.Provider>
  );
}

export function useWarehouseanalyticsContext() {
  const context = useContext(WarehouseanalyticsContext);
  if (context === undefined) {
    throw new Error('useWarehouseanalyticsContext must be used within WarehouseanalyticsProvider');
  }
  return context;
}