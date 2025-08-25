import React, { useEffect, useState } from 'react';

type Filters = {
  date_from?: string;
  date_to?: string;
  salesperson?: string;
  territory?: string;
  customer_category?: string;
  customer_region?: string;
  item_name?: string;
};

type Options = {
  periods: string[];
  salesperson: string[];
  territory: string[];
  customer_category: string[];
  customer_region: string[];
  item_name: string[];
};

export const SalesFilterBar: React.FC<{
  value: Filters;
  onChange: (v: Filters) => void;
}> = ({ value, onChange }) => {
  const [options, setOptions] = useState<Options>({ periods: [], salesperson: [], territory: [], customer_category: [], customer_region: [], item_name: [] }); // salesperson/territory disabled
  const [loading, setLoading] = useState<boolean>(true);
  const [pending, setPending] = useState<Filters>(value);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Helper: fallback months list (covers dataset range 2017-01..2021-12)
  const buildFallbackPeriods = () => {
    const start = new Date('2017-01-01T00:00:00Z');
    const end = new Date('2021-12-01T00:00:00Z');
    const out: string[] = [];
    const d = new Date(start);
    while (d <= end) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      out.push(`${y}-${m}`);
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
    return out;
  };

  // Fetch options scoped by selected date range only (non-date options are specific, top by revenue)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams(
          Object.entries({ date_from: pending.date_from, date_to: pending.date_to })
            .filter(([, v]) => v !== undefined) as [string, string][]
        ).toString();
        const res = await fetch(`/api/sales-filters/options?${qs}`);
        const json = res.ok ? await res.json() : { options: null };
        const nextOpts = json?.options || { periods: [], salesperson: [], territory: [], customer_category: [], customer_region: [], item_name: [] };
        // Fallback periods if server returned none
        if (!nextOpts.periods?.length) {
          nextOpts.periods = buildFallbackPeriods();
        }
        // Ensure dropdowns have at least an "All" placeholder
        if (!nextOpts.customer_category?.length) nextOpts.customer_category = ['All Categories'];
        if (!nextOpts.customer_region?.length) nextOpts.customer_region = ['All Regions'];
        if (!cancelled) setOptions(nextOpts);
      } catch (e: any) {
        console.warn('[SalesFilterBar] options fetch failed:', e);
        if (!cancelled) setOptions({
          periods: buildFallbackPeriods(),
          salesperson: [],
          territory: [],
          customer_category: ['All Categories'],
          customer_region: ['All Regions'],
          item_name: []
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pending.date_from, pending.date_to]);

  // Keep pending in sync with applied value
  useEffect(() => { setPending(value); }, [value]);

  const apply = () => {
    const next = { ...pending };
    // Auto-fill missing dates from available periods
    if (!next.date_from && options.periods.length > 0) {
      next.date_from = `${options.periods[0]}-01`;
    }
    if (!next.date_to && options.periods.length > 0) {
      next.date_to = `${options.periods[options.periods.length - 1]}-28`;
    }
    onChange(next);
  };
  const clearAll = () => onChange({});

  // Do not block UI actions while loading options; keep selects enabled and buttons clickable
  const disabled = false;
  const wrap = (label: string, node: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      <label style={{ color: 'rgba(247,249,251,0.75)', fontSize: 12 }}>{label}</label>
      {node}
      {/* Hint if options list is empty */}
      {!loading && React.isValidElement(node) &&
        ((node as any).type === 'select') &&
        (Array.isArray((options as any)[(label.toLowerCase().includes('category') ? 'customer_category' : label.toLowerCase().includes('region') ? 'customer_region' : '')]) &&
          (options as any)[(label.toLowerCase().includes('category') ? 'customer_category' : label.toLowerCase().includes('region') ? 'customer_region' : '')].length === 0) && (
          <small style={{ position: 'absolute', bottom: -18, color: '#fbbf24', opacity: 0.9 }}>
            No options available for current date range
          </small>
      )}
      {loading && <small style={{ opacity: 0.6, color: 'rgba(247,249,251,0.6)' }}>Loading...</small>}
    </div>
  );

  // Active filter count (non-date only, simplified)
  const activeFilterCount = [pending.customer_category, pending.customer_region, pending.item_name].filter(Boolean).length;

  return (
    <div style={{
      background: 'rgba(10, 18, 36, 0.85)', // Interactive Background #0a1224
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      border: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? 16 : 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#f7f9fb'
          }}>
            🎯 Filters
          </h3>
          {activeFilterCount > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600
            }}>
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAll}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'rgba(247, 249, 251, 0.7)',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00e0ff';
                e.currentTarget.style.color = '#f7f9fb';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,224,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'rgba(247, 249, 251, 0.7)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00e0ff',
              fontSize: 20,
              cursor: 'pointer',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.3s'
            }}
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            ▼
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(8, minmax(0,1fr))', alignItems: 'end' }}>
            {/* Date From */}
            {wrap('Start Period', (
              <select
                disabled={disabled}
                value={pending.date_from || ''}
                onChange={e => setPending({ ...pending, date_from: e.target.value || undefined })}
                style={{
                  background: 'rgba(10, 18, 36, 0.85)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 8px'
                }}
              >
                <option value="">Start Period</option>
                {options.periods.map(p => (
                  <option key={`from-${p}`} value={`${p}-01`}>{p}</option>
                ))}
              </select>
            ))}

            {/* Date To */}
            {wrap('End Period', (
              <select
                disabled={disabled}
                value={pending.date_to || ''}
                onChange={e => setPending({ ...pending, date_to: e.target.value || undefined })}
                style={{
                  background: 'rgba(10, 18, 36, 0.85)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 8px'
                }}
              >
                <option value="">End Period</option>
                {options.periods.map(p => (
                  <option key={`to-${p}`} value={`${p}-28`}>{p}</option>
                ))}
              </select>
            ))}

            {/* Customer Category */}
            {wrap('Customer Category', (
              <select
                disabled={disabled}
                value={pending.customer_category || ''}
                onChange={e => setPending({ ...pending, customer_category: e.target.value || undefined })}
                style={{
                  background: 'rgba(10, 18, 36, 0.85)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 8px'
                }}
              >
                <option value="">All Categories</option>
                {options.customer_category
                  .filter(v => v && v !== 'All Categories')
                  .map(v => (
                    <option key={`cat-${v}`} value={v}>{v}</option>
                  ))}
              </select>
            ))}

            {/* Customer Region */}
            {wrap('Customer Region', (
              <select
                disabled={disabled}
                value={pending.customer_region || ''}
                onChange={e => setPending({ ...pending, customer_region: e.target.value || undefined })}
                style={{
                  background: 'rgba(10, 18, 36, 0.85)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 8px'
                }}
              >
                <option value="">All Regions</option>
                {options.customer_region
                  .filter(v => v && v !== 'All Regions')
                  .map(v => (
                    <option key={`reg-${v}`} value={v}>{v}</option>
                  ))}
              </select>
            ))}

            {/* Item / Product */}
            {wrap('Item / Product', (
              <select
                disabled={disabled}
                value={pending.item_name || ''}
                onChange={e => setPending({ ...pending, item_name: e.target.value || undefined })}
                style={{
                  background: 'rgba(10, 18, 36, 0.85)',
                  color: '#f7f9fb',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 8px'
                }}
              >
                <option value="">All Items</option>
                {options.item_name
                  .map(v => (
                    <option key={`item-${v}`} value={v}>{v}</option>
                  ))}
              </select>
            ))}

            {/* Spacer */}
            <div style={{ gridColumn: 'span 2' }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={apply}
              disabled={disabled}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #00e0ff, #e930ff)',
                border: 'none',
                color: '#0a1224',
                fontWeight: 600,
                borderRadius: 8,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              Apply
            </button>
            <button
              onClick={clearAll}
              disabled={disabled}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(247,249,251,0.75)',
                borderRadius: 8,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00e0ff'; e.currentTarget.style.color = '#f7f9fb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(247,249,251,0.75)'; }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};