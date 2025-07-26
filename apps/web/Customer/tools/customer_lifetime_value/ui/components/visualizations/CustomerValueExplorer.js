import React, { useState, useMemo } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import { Table } from '../../../../../../ui-common/design-system/components/Table';

const CustomerValueExplorer = ({ 
  data = [], 
  isLoading = false,
  onCustomerSelect = null 
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sortColumn, setSortColumn] = useState('predictedLTV');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  
  const pageSize = 20;

  // Get unique values for filters
  const customerTypes = useMemo(() => {
    const types = [...new Set(data.map(c => c.customerType || 'Unknown'))];
    return ['All', ...types];
  }, [data]);

  const regions = useMemo(() => {
    const regionList = [...new Set(data.map(c => c.region || 'Unknown'))];
    return ['All', ...regionList];
  }, [data]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data.filter(customer => {
      const matchesSearch = !searchTerm || 
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerId?.toString().includes(searchTerm);
      const matchesType = filterType === 'All' || customer.customerType === filterType;
      const matchesRegion = filterRegion === 'All' || customer.region === filterRegion;
      
      return matchesSearch && matchesType && matchesRegion;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [data, searchTerm, filterType, filterRegion, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    if (onCustomerSelect) {
      onCustomerSelect(customer);
    }
  };

  const toggleCustomerSelection = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const getValueTierColor = (ltv) => {
    if (ltv > 25000) return '#e930ff'; // Signal Magenta
    if (ltv > 15000) return '#00e0ff'; // Electric Cyan
    if (ltv > 7500) return '#5fd4d6';  // Lighter Cyan
    return '#5891cb'; // Default blue
  };

  const columns = [
    {
      header: '',
      accessor: 'select',
      width: '40px',
      cell: (row) => (
        <input
          type="checkbox"
          checked={selectedCustomers.includes(row.customerId)}
          onChange={() => toggleCustomerSelection(row.customerId)}
          style={{ cursor: 'pointer' }}
        />
      )
    },
    {
      header: 'Customer ID',
      accessor: 'customerId',
      sortable: true,
      width: '120px'
    },
    {
      header: 'Name',
      accessor: 'customerName',
      sortable: true,
      width: '180px'
    },
    {
      header: 'Type',
      accessor: 'customerType',
      sortable: true,
      width: '120px'
    },
    {
      header: 'Region',
      accessor: 'region',
      sortable: true,
      width: '100px'
    },
    {
      header: 'Predicted LTV',
      accessor: 'predictedLTV',
      sortable: true,
      width: '140px',
      cell: (row) => (
        <span style={{ 
          color: getValueTierColor(row.predictedLTV),
          fontWeight: '600'
        }}>
          ${row.predictedLTV?.toLocaleString() || '0'}
        </span>
      )
    },
    {
      header: 'Actual Spend',
      accessor: 'actualSpend',
      sortable: true,
      width: '120px',
      cell: (row) => `$${row.actualSpend?.toLocaleString() || '0'}`
    },
    {
      header: 'Error %',
      accessor: 'errorPercent',
      sortable: true,
      width: '80px',
      cell: (row) => {
        const error = row.errorPercent || 0;
        return (
          <span style={{ 
            color: Math.abs(error) > 20 ? '#e930ff' : '#f7f9fb'
          }}>
            {error.toFixed(1)}%
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      width: '100px',
      cell: (row) => (
        <button
          onClick={() => handleCustomerClick(row)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#00e0ff',
            color: '#0a1224',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Details
        </button>
      )
    }
  ];

  if (!data || data.length === 0) {
    return (
      <Card title="Customer Value Explorer" isLoading={isLoading}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#5891cb'
        }}>
          No customer data available
        </div>
      </Card>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#232a36', 
      borderRadius: '16px', 
      padding: '20px',
      height: '580px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#f7f9fb'
        }}>
          Customer Value Explorer
        </h3>
        
        {selectedCustomers.length > 0 && (
          <div style={{
            backgroundColor: '#00e0ff',
            color: '#0a1224',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {selectedCustomers.length} selected
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #3a4459',
            backgroundColor: '#1e2738',
            color: '#f7f9fb',
            fontSize: '14px',
            width: '200px'
          }}
        />
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #3a4459',
            backgroundColor: '#1e2738',
            color: '#f7f9fb',
            fontSize: '14px'
          }}
        >
          {customerTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #3a4459',
            backgroundColor: '#1e2738',
            color: '#f7f9fb',
            fontSize: '14px'
          }}
        >
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: 'calc(100% - 120px)' }}>
        {/* Table */}
        <div style={{ flex: 1 }}>
          <Table
            data={paginatedData}
            columns={columns}
            onSort={handleSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            isLoading={isLoading}
          />
          
          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            padding: '12px 0'
          }}>
            <span style={{ fontSize: '14px', color: '#5891cb' }}>
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
            </span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage === 1 ? '#1e2738' : '#3a4459',
                  color: currentPage === 1 ? '#5891cb' : '#f7f9fb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                Previous
              </button>
              
              <span style={{ 
                padding: '6px 12px', 
                color: '#f7f9fb',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center'
              }}>
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPage === totalPages ? '#1e2738' : '#3a4459',
                  color: currentPage === totalPages ? '#5891cb' : '#f7f9fb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Customer Detail Card */}
        {selectedCustomer && (
          <div style={{
            width: '400px',
            backgroundColor: '#1e2738',
            borderRadius: '16px',
            padding: '20px',
            border: `2px solid ${getValueTierColor(selectedCustomer.predictedLTV)}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h4 style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#f7f9fb'
                }}>
                  {selectedCustomer.customerName || selectedCustomer.customerId}
                </h4>
                <div style={{
                  backgroundColor: getValueTierColor(selectedCustomer.predictedLTV),
                  color: '#0a1224',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'inline-block'
                }}>
                  {selectedCustomer.predictedLTV > 25000 ? 'Premium' :
                   selectedCustomer.predictedLTV > 15000 ? 'High Value' :
                   selectedCustomer.predictedLTV > 7500 ? 'Medium Value' : 'Standard'}
                </div>
              </div>
              
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#5891cb',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ×
              </button>
            </div>

            {/* LTV Gauge */}
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: `8px solid ${getValueTierColor(selectedCustomer.predictedLTV)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto',
                backgroundColor: '#0a1224'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#f7f9fb'
                }}>
                  ${Math.round(selectedCustomer.predictedLTV / 1000)}K
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#5891cb'
                }}>
                  Predicted LTV
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#5891cb' }}>Actual Spend:</span>
                <span style={{ fontSize: '14px', color: '#f7f9fb', fontWeight: '600' }}>
                  ${selectedCustomer.actualSpend?.toLocaleString() || '0'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#5891cb' }}>Prediction Error:</span>
                <span style={{ 
                  fontSize: '14px', 
                  color: Math.abs(selectedCustomer.errorPercent || 0) > 20 ? '#e930ff' : '#f7f9fb',
                  fontWeight: '600'
                }}>
                  {selectedCustomer.errorPercent?.toFixed(1) || '0'}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#5891cb' }}>Customer Type:</span>
                <span style={{ fontSize: '14px', color: '#f7f9fb' }}>
                  {selectedCustomer.customerType || 'Unknown'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#5891cb' }}>Region:</span>
                <span style={{ fontSize: '14px', color: '#f7f9fb' }}>
                  {selectedCustomer.region || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#00e0ff',
                  color: '#0a1224',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Value Optimization
              </button>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#f7f9fb',
                  border: '1px solid #3a4459',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Customer Profile
              </button>
              <button
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#5891cb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Add to Segment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerValueExplorer; 