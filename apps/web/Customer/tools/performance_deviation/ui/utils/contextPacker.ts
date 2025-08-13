// apps/web/Customer/tools/performance_deviation/ui/utils/contextPacker.ts
export const packDashboardContext = (snapshot: any, focus: any) => {
  return {
    page: "customers/performance_deviation",
    kpis: snapshot?.kpis || null,
    focusPoint: focus || null,
    ts_len: snapshot?.timeSeries?.length || 0,
    r2: snapshot?.variance?.r2 || 0
  };
};
