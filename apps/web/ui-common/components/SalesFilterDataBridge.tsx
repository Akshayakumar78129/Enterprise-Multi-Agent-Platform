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

      // Compute growth rates from time series (month-over-month by revenue)
      const tsRows: { period: string; revenue?: number }[] = (ts.data || []).map((d: any) => ({
        period: String(d.period),
        revenue: Number(d.revenue || 0),
      }));

      const growthRatesRaw = tsRows
        .map((row, idx) => {
          if (idx === 0) return null; // need previous to compute growth
          const prev = tsRows[idx - 1]?.revenue ?? 0;
          const curr = row.revenue ?? 0;
          const rate = prev !== 0 ? (curr - prev) / prev : 0;
          return { period: row.period, revenue: curr, growth_rate: rate };
        })
        .filter(Boolean) as { period: string; revenue: number; growth_rate: number }[];

      const rates = growthRatesRaw.map(r => r.growth_rate);
      const avg = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      const min = rates.length ? Math.min(...rates) : 0;
      const max = rates.length ? Math.max(...rates) : 0;

      const growthRates = growthRatesRaw.map(r => ({
        period: r.period,
        revenue: r.revenue,
        growth_rate: r.growth_rate,
        avg_growth_rate: avg,
        min_growth_rate: min,
        max_growth_rate: max,
      }));

      setDashboardState(prev => ({
        ...prev,
        // Preserve existing non-date filters (metric/timePeriod), only sync date range from bridge
        filters: {
          ...prev?.filters,
          startDate: (filters as any).date_from || prev?.filters?.startDate,
          endDate: (filters as any).date_to || prev?.filters?.endDate,
          timePeriod: prev?.filters?.timePeriod || 'month',
          metric: prev?.filters?.metric || 'revenue',
        },
        data: {
          ...prev?.data,
          mainData,
          kpis: (kpis as any).kpis,
          seasonality,
          growthRates,
        },
        isLoading: false,
        error: null,
      }));
    })().catch(console.error);

    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

  return null;
};