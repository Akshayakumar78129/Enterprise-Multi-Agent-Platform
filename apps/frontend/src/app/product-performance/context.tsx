"use client";

import React, { createContext, useContext, useState } from 'react';

interface ProductPerformanceContextType {
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  productData: any[];
  setProductData: (data: any[]) => void;
}

const ProductPerformanceContext = createContext<ProductPerformanceContextType | undefined>(undefined);

export function ProductPerformanceProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [productData, setProductData] = useState<any[]>([]);

  return (
    <ProductPerformanceContext.Provider
      value={{
        filters,
        setFilters,
        productData,
        setProductData,
      }}
    >
      {children}
    </ProductPerformanceContext.Provider>
  );
}

export function useProductPerformanceContext() {
  const context = useContext(ProductPerformanceContext);
  if (context === undefined) {
    throw new Error('useProductPerformanceContext must be used within a ProductPerformanceProvider');
  }
  return context;
}