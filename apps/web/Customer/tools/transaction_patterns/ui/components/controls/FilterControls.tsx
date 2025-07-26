import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Button } from '../../../../../../ui-common/design-system/components/Button';
import { Select } from '../../../../../../ui-common/design-system/components/Select';
import { Checkbox } from '../../../../../../ui-common/design-system/components/Checkbox';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { setSelectedTimeFilter, selectTimeFilter } from '../../state/transactionSlice';

interface FilterControlsProps {
  className?: string;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ className }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const currentTimeFilter = useSelector(selectTimeFilter);
  
  // Local state for filter values
  const [selectedDay, setSelectedDay] = useState(currentTimeFilter?.day || '');
  const [selectedHour, setSelectedHour] = useState<number | undefined>(currentTimeFilter?.hour);
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  
  // Options for dropdowns
  const dayOptions = [
    { value: '', label: 'All Days' },
    { value: 'Monday', label: 'Monday' },
    { value: 'Tuesday', label: 'Tuesday' },
    { value: 'Wednesday', label: 'Wednesday' },
    { value: 'Thursday', label: 'Thursday' },
    { value: 'Friday', label: 'Friday' },
    { value: 'Saturday', label: 'Saturday' },
    { value: 'Sunday', label: 'Sunday' }
  ];
  
  const hourOptions = [
    { value: '', label: 'All Hours' },
    ...Array.from({ length: 24 }, (_, i) => ({
      value: i.toString(),
      label: `${i}:00 ${i < 12 ? 'AM' : 'PM'}`
    }))
  ];
  
  const paymentOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'cash', label: 'Cash' },
    { value: 'digital', label: 'Digital Wallet' },
    { value: 'transfer', label: 'Bank Transfer' }
  ];
  
  const handleApplyFilters = () => {
    // Apply time filter
    if (selectedDay || selectedHour !== undefined) {
      dispatch(setSelectedTimeFilter({
        day: selectedDay || undefined,
        hour: selectedHour
      }));
    } else {
      dispatch(setSelectedTimeFilter(null));
    }
    
    // Other filters would be applied here (anomalies, payment method, etc.)
    // These would require additional state and reducer actions
  };
  
  const handleClearFilters = () => {
    setSelectedDay('');
    setSelectedHour(undefined);
    setShowAnomaliesOnly(false);
    setSelectedPaymentMethod('');
    dispatch(setSelectedTimeFilter(null));
    // Clear other filters as needed
  };
  
  return (
    <Card title="Filter Transactions" elevation="sm" className={className}>
      <div style={{ padding: theme.spacing[3] }}>
        <div style={{ marginBottom: theme.spacing[3] }}>
          <label
            style={{ 
              display: 'block', 
              marginBottom: theme.spacing[1],
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm
            }}
          >
            Day of Week
          </label>
          <Select 
            options={dayOptions}
            value={selectedDay}
            onChange={(value) => setSelectedDay(value)}
            placeholder="Select day"
          />
        </div>
        
        <div style={{ marginBottom: theme.spacing[3] }}>
          <label
            style={{ 
              display: 'block', 
              marginBottom: theme.spacing[1],
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm
            }}
          >
            Hour of Day
          </label>
          <Select 
            options={hourOptions}
            value={selectedHour !== undefined ? selectedHour.toString() : ''}
            onChange={(value) => setSelectedHour(value ? parseInt(value) : undefined)}
            placeholder="Select hour"
          />
        </div>
        
        <div style={{ marginBottom: theme.spacing[3] }}>
          <label
            style={{ 
              display: 'block', 
              marginBottom: theme.spacing[1],
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm
            }}
          >
            Payment Method
          </label>
          <Select 
            options={paymentOptions}
            value={selectedPaymentMethod}
            onChange={(value) => setSelectedPaymentMethod(value)}
            placeholder="Select payment method"
          />
        </div>
        
        <div style={{ marginBottom: theme.spacing[4] }}>
          <Checkbox
            label="Show anomalies only"
            checked={showAnomaliesOnly}
            onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
          <Button
            variant="primary"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}; 