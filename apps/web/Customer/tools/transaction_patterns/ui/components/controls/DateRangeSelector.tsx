import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { setDateRange, selectDateRange, fetchTransactionData } from '../../state/transactionSlice';
import { fetchAnomalyData } from '../../state/anomalySlice';
import { DateRange } from '../../types/transaction';

interface DateRangeSelectorProps {
  className?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ className }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentDateRange = useSelector(selectDateRange);
  
  const [startDate, setStartDate] = useState(currentDateRange.startDate);
  const [endDate, setEndDate] = useState(currentDateRange.endDate);
  
  // Predefined date range options
  const datePresets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Year to Date', preset: 'ytd' }
  ];
  
  const handleApply = () => {
    const newDateRange: DateRange = { startDate, endDate };
    dispatch(setDateRange(newDateRange));
    dispatch(fetchTransactionData(newDateRange));
    dispatch(fetchAnomalyData(newDateRange));
  };
  
  const handlePresetClick = (preset: { days?: number, preset?: string }) => {
    const now = new Date();
    let newStartDate = '';
    let newEndDate = now.toISOString().split('T')[0];
    
    if (preset.days) {
      // Calculate date X days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - preset.days);
      newStartDate = pastDate.toISOString().split('T')[0];
    } else if (preset.preset === 'ytd') {
      // Year to date: Jan 1st of current year
      newStartDate = `${now.getFullYear()}-01-01`;
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    const newDateRange: DateRange = { 
      startDate: newStartDate, 
      endDate: newEndDate 
    };
    
    dispatch(setDateRange(newDateRange));
    dispatch(fetchTransactionData(newDateRange));
    dispatch(fetchAnomalyData(newDateRange));
  };
  
  return (
    <Card title="Date Range" elevation="sm" className={className}>
      <div style={{ padding: theme.spacing[3] }}>
        <div style={{ 
          display: 'flex', 
          gap: theme.spacing[3], 
          marginBottom: theme.spacing[3] 
        }}>
          <div>
            <label 
              htmlFor="start-date" 
              style={{ 
                display: 'block', 
                marginBottom: theme.spacing[1],
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm
              }}
            >
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                backgroundColor: theme.colors.graphiteDark,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm
              }}
            />
          </div>
          
          <div>
            <label 
              htmlFor="end-date" 
              style={{ 
                display: 'block', 
                marginBottom: theme.spacing[1],
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm
              }}
            >
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                backgroundColor: theme.colors.graphiteDark,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
                color: theme.colors.cloudWhite,
                fontSize: theme.typography.fontSize.sm
              }}
            />
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: theme.spacing[2], 
          marginBottom: theme.spacing[3],
          flexWrap: 'wrap'
        }}>
          {datePresets.map((preset, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        
        <Button
          variant="primary"
          onClick={handleApply}
        >
          Apply Date Range
        </Button>
      </div>
    </Card>
  );
}; 