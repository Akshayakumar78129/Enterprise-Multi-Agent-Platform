import React from 'react';
import { RetentionPlannerProvider } from './context';

export default function RetentionPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RetentionPlannerProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Customer Retention Planning</h1>
          <p className="text-muted-foreground mt-2">
            Plan and optimize customer retention strategies
          </p>
        </div>
        {children}
      </div>
    </RetentionPlannerProvider>
  );
}