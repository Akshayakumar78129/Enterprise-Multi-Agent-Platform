import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { setDateRange, selectDateRange, fetchTransactionData } from '../../state/transactionSlice';
import { fetchAnomalyData } from '../../state/anomalySlice';
import { DateRange } from '../../types/transaction';

interface DateRangeSelectorProps {
  className?: string;
  compact?: boolean; // compact layout for top bar
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ className, compact = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch<any>();
  const currentDateRange = useSelector(selectDateRange);
  
  const [startDate, setStartDate] = useState(currentDateRange.startDate);
  const [endDate, setEndDate] = useState(currentDateRange.endDate);
  const [error, setError] = useState<string | null>(null);

  // Validate dates
  const isValid = useMemo(() => {
    if (!startDate || !endDate) return false;
    const s = new Date(startDate);
    const e = new Date(endDate);
    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && s <= e;
  }, [startDate, endDate]);

  // Predefined date range options
  const datePresets: { label: string; calc: () => { start: string; end: string } }[] = [
    { label: 'Today', calc: () => { const n = new Date(); const d = n.toISOString().split('T')[0]; return { start: d, end: d }; } },
    { label: 'Yesterday', calc: () => { const n = new Date(); n.setDate(n.getDate() - 1); const d = n.toISOString().split('T')[0]; return { start: d, end: d }; } },
    { label: 'Last 7 Days', calc: () => { const n = new Date(); const e = n.toISOString().split('T')[0]; const p = new Date(); p.setDate(p.getDate() - 6); return { start: p.toISOString().split('T')[0], end: e }; } },
    { label: 'Last 30 Days', calc: () => { const n = new Date(); const e = n.toISOString().split('T')[0]; const p = new Date(); p.setDate(p.getDate() - 29); return { start: p.toISOString().split('T')[0], end: e }; } },
    { label: 'Last 90 Days', calc: () => { const n = new Date(); const e = n.toISOString().split('T')[0]; const p = new Date(); p.setDate(p.getDate() - 89); return { start: p.toISOString().split('T')[0], end: e }; } },
    { label: 'Last 12 Months', calc: () => { const n = new Date(); const e = n.toISOString().split('T')[0]; const p = new Date(); p.setFullYear(p.getFullYear() - 1); p.setDate(p.getDate() + 1); return { start: p.toISOString().split('T')[0], end: e }; } },
    { label: 'YTD', calc: () => { const n = new Date(); return { start: `${n.getFullYear()}-01-01`, end: n.toISOString().split('T')[0] }; } },
    { label: 'Full Dataset (2017–2021)', calc: () => ({ start: '2017-01-01', end: '2021-12-31' }) },
  ];
  
  const apply = (range: DateRange) => {
    setError(null);
    dispatch(setDateRange(range));
    dispatch(fetchTransactionData(range));
    dispatch(fetchAnomalyData(range));
  };
  
  const handleApply = () => {
    if (!isValid) {
      setError('Please select a valid date range. Start must be before End.');
      return;
    }
    apply({ startDate, endDate });
  };
  
  const handlePresetClick = (calc: () => { start: string; end: string }) => {
    const { start, end } = calc();
    setStartDate(start);
    setEndDate(end);
    apply({ startDate: start, endDate: end });
  };
  
  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.colors.graphiteDark,
    border: `1px solid ${theme.colors.graphite}`,
    borderRadius: '4px',
    padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
    color: theme.colors.cloudWhite,
    fontSize: theme.typography.fontSize.sm,
    minWidth:  compact ? 140 : 180,
  };

  return (
    <Card title={compact ? undefined : 'Date Range'} elevation="sm" className={className}>
      <div style={{ padding: compact ? theme.spacing[2] : theme.spacing[3] }}>
        <div style={{ 
          display: 'flex', 
          gap: theme.spacing[3], 
          marginBottom: theme.spacing[2],
          alignItems: 'end',
          flexWrap: 'wrap'
        }}>
          <div>
            {!compact && (
              <label 
                htmlFor="start-date" 
                style={{ display: 'block', marginBottom: theme.spacing[1], color: theme.colors.cloudWhite, fontSize: theme.typography.fontSize.sm }}
              >Start Date</label>
            )}
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          
          <div>
            {!compact && (
              <label 
                htmlFor="end-date" 
                style={{ display: 'block', marginBottom: theme.spacing[1], color: theme.colors.cloudWhite, fontSize: theme.typography.fontSize.sm }}
              >End Date</label>
            )}
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!isValid}
          >
            Apply
          </Button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: theme.spacing[2], 
          marginBottom: compact ? 0 : theme.spacing[2],
          flexWrap: 'wrap'
        }}>
          {datePresets.map((p) => (
            <Button
              key={p.label}
              variant="secondary"
              size="sm"
              onClick={() => handlePresetClick(p.calc)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', marginTop: theme.spacing[2], fontSize: theme.typography.fontSize.sm }}>
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}; 