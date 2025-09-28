import React from 'react';
import { InventorylevelProvider } from './context';

export default function InventorylevelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InventorylevelProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Inventory Levels</h1>
          <p className="text-muted-foreground mt-2">
            Monitor current stock levels and turnover
          </p>
        </div>
        {children}
      </div>
    </InventorylevelProvider>
  );
}