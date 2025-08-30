import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { fetchWithErrorHandling } from '../../../../../../ui-common/utils/apiUtils.js';

export interface SegmentsCategoriesFilterProps {
  selectedSegments: Record<string, string[]> | undefined;
  selectedCategories: string[] | undefined;
  onChange: (segments: Record<string, string[]>, categories: string[]) => void;
  isLoading?: boolean;
  className?: string;
}

type SegmentItem = { id: string; label: string; count?: number };

export const SegmentsCategoriesFilter: React.FC<SegmentsCategoriesFilterProps> = ({
  selectedSegments,
  selectedCategories,
  onChange,
  isLoading = false,
  className
}) => {
  const theme = useTheme();

  // Server-driven options from real DB
  const [segmentItems, setSegmentItems] = useState<{
    market: SegmentItem[];
    monetary: SegmentItem[];
    loyalty: SegmentItem[];
    country: SegmentItem[];
  }>({ market: [], monetary: [], loyalty: [], country: [] });
  const [categoryItems, setCategoryItems] = useState<SegmentItem[]>([]);

  // Local UI state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchSegment, setSearchSegment] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  const segState = selectedSegments || {};
  const catState = selectedCategories || [];

  // Fetch real segments/categories from API (SQLite-backed)
  const loadOptions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const resp = await fetchWithErrorHandling('/api/transaction-patterns/segments', { method: 'GET' });
      // API may return either direct data or wrapped
      const segs = (resp?.segments ?? resp?.data?.segments) || {};
      const cats = (resp?.categories ?? resp?.data?.categories) || [];

      setSegmentItems({
        market: (segs.market || []).map((x: any) => ({ id: x.id || `market:${x.label}`, label: x.label, count: x.count })),
        monetary: (segs.monetary || []).map((x: any) => ({ id: x.id || `monetary:${x.label}`, label: x.label, count: x.count })),
        loyalty: (segs.loyalty || []).map((x: any) => ({ id: x.id || `loyalty:${x.label}`, label: x.label, count: x.count })),
        country: (segs.country || []).map((x: any) => ({ id: x.id || `country:${x.label}`, label: x.label, count: x.count })),
      });
      setCategoryItems((cats || []).map((x: any) => ({ id: x.id || `cat:${x.label || x}`, label: x.label || x })));
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering helpers
  const filteredSegs = useMemo(() => {
    const norm = (s: any) => String(s || '').toLowerCase();
    const f = (arr: SegmentItem[]) => arr.filter((x) => norm(x.label).includes(norm(searchSegment)));
    return {
      market: f(segmentItems.market),
      monetary: f(segmentItems.monetary),
      loyalty: f(segmentItems.loyalty),
      country: f(segmentItems.country)
    };
  }, [segmentItems, searchSegment]);

  const filteredCats = useMemo(() => {
    const norm = (s: any) => String(s || '').toLowerCase();
    return categoryItems.filter((x) => norm(x.label).includes(norm(searchCategory)));
  }, [categoryItems, searchCategory]);

  // Change handlers
  const updateSeg = (type: keyof typeof segState, value: string) => {
    const updated: Record<string, string[]> = { ...(segState || {}) };
    const list = new Set(updated[type] || []);
    if (list.has(value)) list.delete(value); else list.add(value);
    updated[type] = Array.from(list);
    onChange(updated, catState);
  };

  const selectAllSeg = (type: keyof typeof segState, items: SegmentItem[]) => {
    const updated: Record<string, string[]> = { ...(segState || {}) };
    updated[type] = items.map((x) => x.label);
    onChange(updated, catState);
  };

  const clearSeg = (type: keyof typeof segState) => {
    const updated: Record<string, string[]> = { ...(segState || {}) };
    updated[type] = [];
    onChange(updated, catState);
  };

  const toggleCategory = (label: string) => {
    const set = new Set(catState);
    if (set.has(label)) set.delete(label); else set.add(label);
    onChange(segState as Record<string, string[]>, Array.from(set));
  };

  const selectAllCats = (items: SegmentItem[]) => {
    onChange(segState as Record<string, string[]>, items.map((x) => x.label));
  };

  const clearCats = () => {
    onChange(segState as Record<string, string[]>, []);
  };

  // Small badges showing selected counts
  const badge = (n: number) => (
    <span style={{
      marginLeft: 8,
      background: 'rgba(148,163,184,0.15)',
      border: '1px solid rgba(148,163,184,0.25)',
      color: '#dbe7ff',
      fontSize: 11,
      borderRadius: 10,
      padding: '2px 6px'
    }}>{n}</span>
  );

  // Header element for each segment block
  const SegmentHeader: React.FC<{ title: string; onAll: () => void; onClear: () => void; selectedCount: number }>
    = ({ title, onAll, onClear, selectedCount }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
      <div style={{ color: theme.colors.electricCyan, fontSize: 13, fontWeight: 600 }}>
        {title}
        {selectedCount > 0 && badge(selectedCount)}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onAll} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #2b3648', background: '#1f2937', color: '#dbe7ff', fontSize: 12, cursor: 'pointer' }}>Select All</button>
        <button onClick={onClear} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #2b3648', background: '#1f2937', color: '#dbe7ff', fontSize: 12, cursor: 'pointer' }}>Clear</button>
      </div>
    </div>
  );

  return (
    <div className={className} style={{
      background: 'rgba(30,41,59,0.7)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      boxShadow: '0 2px 8px rgba(0,224,255,0.08)',
      border: '1px solid #00e0ff22',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>
      <h3 style={{ color: theme.colors.electricCyan, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
        Customer Segmentation & Product Category
      </h3>

      {(loading || isLoading) && !loadError && (
        <div style={{ color: theme.colors.neutral }}>Loading options...</div>
      )}

      {loadError && (
        <div style={{
          color: '#fecaca', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)',
          borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>Error loading options: {loadError}</span>
          <button onClick={loadOptions} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #991b1b', background: '#7f1d1d', color: '#fff', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loadError && (
        <>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {/* Segments */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <h4 style={{ color: theme.colors.cloudWhite, fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Segments</h4>
              <input
                type="text"
                placeholder="Search segments..."
                value={searchSegment}
                onChange={e => setSearchSegment(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid #232a36', background: '#232a36', color: '#f7f9fb' }}
              />

              {([
                { key: 'market', title: 'Market', items: filteredSegs.market },
                { key: 'monetary', title: 'Monetary', items: filteredSegs.monetary },
                { key: 'loyalty', title: 'Loyalty', items: filteredSegs.loyalty },
                { key: 'country', title: 'Country', items: filteredSegs.country },
              ] as const).map(({ key, title, items }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <SegmentHeader
                    title={title}
                    onAll={() => selectAllSeg(key as any, items)}
                    onClear={() => clearSeg(key as any)}
                    selectedCount={(segState?.[key] || []).length}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                    {items.map((option) => {
                      const checked = !!(segState?.[key] || []).includes(option.label);
                      return (
                        <label key={option.id} title={option.count ? `${option.label} • ${option.count.toLocaleString()} customers` : option.label}
                          style={{ background: checked ? theme.colors.electricCyan : '#232a36', color: checked ? '#0a1224' : '#f7f9fb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => updateSeg(key as any, option.label)}
                            style={{ marginRight: 4 }}
                          />
                          <span>{option.label}</span>
                          {typeof option.count === 'number' && badge(option.count)}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Categories */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <h4 style={{ color: theme.colors.cloudWhite, fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Product Categories</h4>
              <input
                type="text"
                placeholder="Search categories..."
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: 6, borderRadius: 6, border: '1px solid #232a36', background: '#232a36', color: '#f7f9fb' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ height: 1 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => selectAllCats(filteredCats)} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #2b3648', background: '#1f2937', color: '#dbe7ff', fontSize: 12, cursor: 'pointer' }}>Select All</button>
                  <button onClick={clearCats} style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #2b3648', background: '#1f2937', color: '#dbe7ff', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {filteredCats.map((option) => {
                  const checked = catState.includes(option.label);
                  return (
                    <label key={option.id} title={option.label}
                      style={{ background: checked ? theme.colors.electricCyan : '#232a36', color: checked ? '#0a1224' : '#f7f9fb', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(option.label)}
                        style={{ marginRight: 4 }}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};