// Packs current dashboard context for agent consumption.
export const packContextForAgents = () => {
  // Placeholder context; extend with real dashboard state, filters, KPIs, etc.
  return {
    timestamp: new Date().toISOString(),
    dashboard: 'next_purchase',
    filters: {},
    kpis: {},
    version: 1
  };
};
