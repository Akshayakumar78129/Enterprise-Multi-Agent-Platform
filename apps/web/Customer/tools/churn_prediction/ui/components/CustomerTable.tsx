import React, { useState, useMemo } from 'react';
import { Card } from '../../../../../ui-common/design-system/components/Card';
import Table from '../../../../../ui-common/design-system/components/Table';
import { ChurnCustomer } from '../ui/types';

export interface CustomerTableProps {
  customers: ChurnCustomer[];
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onFilter?: (filters: any) => void;
  onSort?: (sortBy: string, direction: 'asc' | 'desc') => void;
}

export default function CustomerTable({ customers, page = 1, pageSize = 20, onPageChange }: CustomerTableProps) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [customers, search]);
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <Card style={{ marginTop: 32, background: '#232a36', padding: 0 }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>High Risk Customers</span>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: '#181e2a', color: '#f7f9fb', border: '1px solid #2c3341', borderRadius: 4, padding: '4px 12px' }}
        />
      </div>
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>RFM</th>
            <th>Last Purchase</th>
            <th>Frequency</th>
            <th>Avg Value</th>
            <th>Churn Prob</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(c => (
            <tr key={c.customer_id} style={{ background: c.risk_level === 'Very High' ? '#2c3341' : undefined }}>
              <td>{c.customer_id}</td>
              <td>{c.name}</td>
              <td>{c.rfm}</td>
              <td>{c.last_purchase_date}</td>
              <td>{c.frequency}</td>
              <td>{c.avg_order_value}</td>
              <td>{(c.churn_probability * 100).toFixed(1)}%</td>
              <td>{c.risk_level}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: 16, gap: 8 }}>
        <button onClick={() => onPageChange?.(Math.max(1, page - 1))} disabled={page === 1} style={{ background: '#232a36', color: '#00e0ff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Prev</button>
        <span style={{ color: '#b0b8c9' }}>{page} / {totalPages}</span>
        <button onClick={() => onPageChange?.(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={{ background: '#232a36', color: '#00e0ff', border: 'none', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}>Next</button>
      </div>
    </Card>
  );
} 