"use client";
import React from "react";
import { PFAgentPopup } from "./pf-agent-popup";
import { createPurchaseFrequencyConfig } from "./pf-config";

// Lightweight hook to detect route for this dashboard locally if needed
function useIsPurchaseFrequencyPage(): boolean {
  if (typeof window === 'undefined') return true; // SSR-safe default, component only used on that page
  return /purchase-frequency/i.test(window.location.pathname);
}

export function FloatingPFAgent({ data, isLoading = false }: { data: any, isLoading?: boolean }) {
  const onThisPage = useIsPurchaseFrequencyPage();
  if (!onThisPage) return null;

  const tabs = createPurchaseFrequencyConfig(data || {});

  const statusText = (() => {
    const k = data?.kpis || {};
    const freq = Number(k.avgPurchaseFrequency || 0);
    const days = Number(k.avgDaysBetween || 0);
    if (freq >= 4 || days <= 45) return "Healthy";
    if (freq >= 2 || days <= 90) return "Monitoring";
    return "Action Required";
  })();

  const variant = statusText === 'Action Required' ? 'destructive' : statusText === 'Monitoring' ? 'default' : 'secondary';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '90px', // place above FloatingAIChat button (which is at 20px with 60px size)
        right: '20px',
        zIndex: 1002, // slightly above chat button container
      }}
    >
      <PFAgentPopup
        agentName="Purchase Frequency Intelligence Agent"
        status={{ text: statusText, variant: variant as any }}
        tabs={tabs as any}
        defaultTab="overview"
        isLoading={isLoading}
      />
    </div>
  );
}