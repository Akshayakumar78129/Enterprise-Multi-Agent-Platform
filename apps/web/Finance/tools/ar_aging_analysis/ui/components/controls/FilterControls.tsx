import React, { useState, useEffect } from 'react';

interface FilterControlsProps {
  onFilterChange: (filters: any) => void;
  currentFilters?: any;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ onFilterChange, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters || {
    startDate: '2017-01-01',
    endDate: '2021-12-31',
    region: 'all',
    customerType: 'all',
    segment: 'all'
  });

  // Sync local state with parent filters
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Don't call onFilterChange here - only when Apply is clicked
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#232a36',
      border: '1px solid #1e2738',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <span style={{ color: '#00e0ff', fontSize: '18px' }}>📊</span>
        <h3 style={{ color: '#f7f9fb', margin: 0, fontSize: '16px' }}>Filters & Controls</h3>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            color: '#8892a8', 
            fontSize: '12px', 
            marginBottom: '4px' 
          }}>
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#1e2738',
              border: '1px solid #232a36',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            color: '#8892a8', 
            fontSize: '12px', 
            marginBottom: '4px' 
          }}>
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#1e2738',
              border: '1px solid #232a36',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            color: '#8892a8', 
            fontSize: '12px', 
            marginBottom: '4px' 
          }}>
            Customer Type
          </label>
          <select
            value={filters.customerType}
            onChange={(e) => handleFilterChange('customerType', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#1e2738',
              border: '1px solid #232a36',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            <option value="all">All Customer Types</option>
            <option value="enterprise">Enterprise</option>
            <option value="smb">Small-Medium Business</option>
            <option value="retail">Retail</option>
            <option value="government">Government</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            color: '#8892a8', 
            fontSize: '12px', 
            marginBottom: '4px' 
          }}>
            Region
          </label>
          <select
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#1e2738',
              border: '1px solid #232a36',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            <option value="all">All Regions</option>
            <option value="north">North</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            color: '#8892a8', 
            fontSize: '12px', 
            marginBottom: '4px' 
          }}>
            Segment
          </label>
          <select
            value={filters.segment}
            onChange={(e) => handleFilterChange('segment', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#1e2738',
              border: '1px solid #232a36',
              borderRadius: '4px',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            <option value="all">All Segments</option>
            <option value="high_value">High Value</option>
            <option value="medium_value">Medium Value</option>
            <option value="low_value">Low Value</option>
            <option value="new_customer">New Customer</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '16px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => {
            const resetFilters = {
              startDate: '2017-01-01',
              endDate: '2021-12-31',
              region: 'all',
              customerType: 'all',
              segment: 'all'
            };
            setFilters(resetFilters);
            onFilterChange(resetFilters);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #8892a8',
            borderRadius: '4px',
            color: '#8892a8',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Reset Filters
        </button>
        
        <button
          onClick={() => {
            console.log('🔧 FilterControls: Apply button clicked, sending filters:', filters);
            onFilterChange(filters);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00e0ff',
            border: 'none',
            borderRadius: '4px',
            color: '#0a1224',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterControls;