'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InventorylevelContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const InventorylevelContext = createContext<InventorylevelContextType | undefined>(undefined);

export function InventorylevelProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <InventorylevelContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </InventorylevelContext.Provider>
  );
}

export function useInventorylevelContext() {
  const context = useContext(InventorylevelContext);
  if (context === undefined) {
    throw new Error('useInventorylevelContext must be used within InventorylevelProvider');
  }
  return context;
}