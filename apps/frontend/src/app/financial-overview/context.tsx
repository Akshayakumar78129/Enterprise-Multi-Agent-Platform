'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FinancialoverviewContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  data: any;
  setData: (data: any) => void;
}

const FinancialoverviewContext = createContext<FinancialoverviewContextType | undefined>(undefined);

export function FinancialoverviewProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);

  return (
    <FinancialoverviewContext.Provider
      value={{
        filters,
        setFilters,
        data,
        setData
      }}
    >
      {children}
    </FinancialoverviewContext.Provider>
  );
}

export function useFinancialoverviewContext() {
  const context = useContext(FinancialoverviewContext);
  if (context === undefined) {
    throw new Error('useFinancialoverviewContext must be used within FinancialoverviewProvider');
  }
  return context;
}