import React from 'react';
import { SupplierperformanceProvider } from './context';

export default function SupplierperformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupplierperformanceProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Supplier Performance</h1>
          <p className="text-muted-foreground mt-2">
            Track vendor metrics and lead times
          </p>
        </div>
        {children}
      </div>
    </SupplierperformanceProvider>
  );
}