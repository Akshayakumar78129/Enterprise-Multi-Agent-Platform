import React, { useEffect } from 'react';

async function fetchJSON(url: string, params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined) as [string,string][]);
  const res = await fetch(`${url}?${qs.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const SalesFilterDataBridge: React.FC<{
  filters: Record<string, string | undefined>;
  setDashboardState: (updater: (prev: any) => any) => void;
}> = ({ filters, setDashboardState }) => {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ts, kpis, season] = await Promise.all([
        fetchJSON('/api/sales-filters/transactions', { ...filters, grain: 'month' }),
        fetchJSON('/api/sales-filters/kpis', filters),
        fetchJSON('/api/sales-filters/seasonality', filters),
      ]);

      if (cancelled) return;

      const mainData = (ts.data || []).map((d: any) => ({
        period: d.period,
        revenue: Number(d.revenue || 0),
        units: Number(d.units || 0),
      }));

      const seasonality = (season.seasonality || []).map((r: any) => ({
        year: r.year,
        month: r.month,
        revenue: Number(r.revenue || 0),
      }));

      setDashboardState(prev => ({
        ...prev,
        filters: {
          ...prev?.filters,
          startDate: (filters as any).date_from || prev?.filters?.startDate,
          endDate: (filters as any).date_to || prev?.filters?.endDate,
          timePeriod: 'month',
          metric: 'revenue',
        },
        data: {
          ...prev?.data,
          mainData,
          kpis: (kpis as any).kpis,
          seasonality,
        },
      }));
    })().catch(console.error);

    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

  return null;
};