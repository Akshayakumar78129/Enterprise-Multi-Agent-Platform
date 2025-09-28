import React from 'react';
import { WarehouseanalyticsProvider } from './context';

export default function WarehouseanalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WarehouseanalyticsProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Warehouse Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Analyze storage optimization and movement
          </p>
        </div>
        {children}
      </div>
    </WarehouseanalyticsProvider>
  );
}