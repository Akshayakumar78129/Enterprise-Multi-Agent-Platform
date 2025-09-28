import React from 'react';
import { EngagementClassifierProvider } from './context';

export default function EngagementClassifierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EngagementClassifierProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Customer Engagement Classification</h1>
          <p className="text-muted-foreground mt-2">
            Classify customers by engagement levels and behavior patterns
          </p>
        </div>
        {children}
      </div>
    </EngagementClassifierProvider>
  );
}