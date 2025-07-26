import React, { useEffect, useState } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Grid, GridItem } from '../../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import { CategoryOption } from '../../types';

interface FilterControlsProps {
  categories: CategoryOption[];
  subcategories: Record<string, CategoryOption[]>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  minSalesThreshold: number | null;
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  onDateRangeChange: (dateRange: { startDate: string; endDate: string }) => void;
  onCategoryChange: (category: string | null) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
  onMinSalesThresholdChange: (threshold: number | null) => void;
  onResetFilters: () => void;
}

/**
 * Filter controls for Product Performance Analyzer
 */
export const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  subcategories,
  dateRange,
  minSalesThreshold,
  selectedCategory,
  selectedSubcategory,
  onDateRangeChange,
  onCategoryChange,
  onSubcategoryChange,
  onMinSalesThresholdChange,
  onResetFilters,
}) => {
  const theme = useTheme();
  const [localStartDate, setLocalStartDate] = useState(dateRange.startDate);
  const [localEndDate, setLocalEndDate] = useState(dateRange.endDate);
  const [localThreshold, setLocalThreshold] = useState(
    minSalesThreshold !== null ? minSalesThreshold.toString() : ''
  );
  
  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(dateRange.startDate);
    setLocalEndDate(dateRange.endDate);
    setLocalThreshold(minSalesThreshold !== null ? minSalesThreshold.toString() : '');
  }, [dateRange, minSalesThreshold]);
  
  // Get available subcategories based on selected category
  const availableSubcategories = selectedCategory 
    ? subcategories[selectedCategory] || []
    : [];
  
  // Handle date range changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setLocalStartDate(newStartDate);
    
    if (new Date(newStartDate) <= new Date(localEndDate)) {
      onDateRangeChange({ startDate: newStartDate, endDate: localEndDate });
    }
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setLocalEndDate(newEndDate);
    
    if (new Date(newEndDate) >= new Date(localStartDate)) {
      onDateRangeChange({ startDate: localStartDate, endDate: newEndDate });
    }
  };
  
  // Handle category and subcategory changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onCategoryChange(value === '' ? null : value);
  };
  
  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSubcategoryChange(value === '' ? null : value);
  };
  
  // Handle threshold change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalThreshold(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onMinSalesThresholdChange(numValue);
    } else if (value === '') {
      onMinSalesThresholdChange(null);
    }
  };
  
  return (
    <Card title="Filters" elevation="sm">
      <Grid cols={12} gap={16}>
        {/* Date range controls */}
        <GridItem col={6}>
          <div>
            <label style={{ 
              color: theme.colors.cloudWhite,
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
            }}>
              Start Date
            </label>
            <input
              type="date"
              value={localStartDate}
              onChange={handleStartDateChange}
              style={{
                background: theme.colors.midnight,
                color: theme.colors.cloudWhite,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: '8px 12px',
                width: '100%',
              }}
            />
          </div>
        </GridItem>
        
        <GridItem col={6}>
          <div>
            <label style={{ 
              color: theme.colors.cloudWhite,
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
            }}>
              End Date
            </label>
            <input
              type="date"
              value={localEndDate}
              onChange={handleEndDateChange}
              style={{
                background: theme.colors.midnight,
                color: theme.colors.cloudWhite,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: '8px 12px',
                width: '100%',
              }}
            />
          </div>
        </GridItem>
        
        {/* Category and subcategory dropdowns */}
        <GridItem col={5}>
          <div>
            <label style={{ 
              color: theme.colors.cloudWhite,
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
            }}>
              Category
            </label>
            <select
              value={selectedCategory || ''}
              onChange={handleCategoryChange}
              style={{
                background: theme.colors.midnight,
                color: theme.colors.cloudWhite,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: '8px 12px',
                width: '100%',
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </GridItem>
        
        <GridItem col={5}>
          <div>
            <label style={{ 
              color: theme.colors.cloudWhite,
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
            }}>
              Subcategory
            </label>
            <select
              value={selectedSubcategory || ''}
              onChange={handleSubcategoryChange}
              disabled={!selectedCategory}
              style={{
                background: theme.colors.midnight,
                color: theme.colors.cloudWhite,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: '8px 12px',
                width: '100%',
                opacity: selectedCategory ? 1 : 0.5,
              }}
            >
              <option value="">All Subcategories</option>
              {availableSubcategories.map(subcategory => (
                <option key={subcategory.value} value={subcategory.value}>
                  {subcategory.label}
                </option>
              ))}
            </select>
          </div>
        </GridItem>
        
        {/* Min Sales Threshold */}
        <GridItem col={2}>
          <div>
            <label style={{ 
              color: theme.colors.cloudWhite,
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
            }}>
              Min Sales ($)
            </label>
            <input
              type="number"
              value={localThreshold}
              onChange={handleThresholdChange}
              min="0"
              step="100"
              style={{
                background: theme.colors.midnight,
                color: theme.colors.cloudWhite,
                border: `1px solid ${theme.colors.graphite}`,
                borderRadius: '4px',
                padding: '8px 12px',
                width: '100%',
              }}
              placeholder="Minimum"
            />
          </div>
        </GridItem>
        
        {/* Reset button */}
        <GridItem col={12}>
          <button
            onClick={onResetFilters}
            style={{
              background: 'transparent',
              color: theme.colors.electricCyan,
              border: `1px solid ${theme.colors.electricCyan}`,
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              float: 'right',
              fontSize: '14px',
            }}
          >
            Reset Filters
          </button>
        </GridItem>
      </Grid>
    </Card>
  );
};

export default FilterControls; 