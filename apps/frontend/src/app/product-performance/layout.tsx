import React from 'react';
import { ProductPerformanceProvider } from './context';

export default function ProductPerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProductPerformanceProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Product Performance</h1>
          <p className="text-muted-foreground mt-2">
            Analyze product sales and performance metrics
          </p>
        </div>
        {children}
      </div>
    </ProductPerformanceProvider>
  );
}