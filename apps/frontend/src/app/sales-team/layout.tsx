import React from 'react';
import { SalesteamProvider } from './context';

export default function SalesteamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SalesteamProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Sales Team Performance</h1>
          <p className="text-muted-foreground mt-2">
            Track sales team metrics and quotas
          </p>
        </div>
        {children}
      </div>
    </SalesteamProvider>
  );
}