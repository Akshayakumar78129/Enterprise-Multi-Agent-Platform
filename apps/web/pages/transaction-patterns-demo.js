import React, { useState, useEffect } from 'react';
import { 
  FormattedTable, 
  KPICard, 
  DataGrid,
  formatToTwoDecimals,
  formatCurrency,
  formatPercentage 
} from '../ui-common';

const TransactionPatternsDemo = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactionData();
  }, []);

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transaction-patterns/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: {
            start: '2020-01-01',
            end: '2020-12-31'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration if API fails
  const sampleData = {
    kpis: {
      totalTransactions: 15420,
      totalAmount: 2847563.45,
      avgAmount: 184.67,
      anomalyRate: 2.34,
      uniqueCustomers: 3421,
      uniqueItems: 156
    },
    transactions: [
      {
        transaction_id: 'TXN001',
        customer_name: 'John Smith',
        transaction_date: '2020-01-15',
        sales_amount: 245.67,
        sales_quantity: 3,
        payment_method: 'Credit Card',
        hour: '14'
      },
      {
        transaction_id: 'TXN002',
        customer_name: 'Jane Doe',
        transaction_date: '2020-01-15',
        sales_amount: 89.99,
        sales_quantity: 1,
        payment_method: 'Credit Card',
        hour: '16'
      },
      {
        transaction_id: 'TXN003',
        customer_name: 'Bob Johnson',
        transaction_date: '2020-01-16',
        sales_amount: 1567.89,
        sales_quantity: 8,
        payment_method: 'Credit Card',
        hour: '10'
      }
    ],
    paymentMethods: [
      {
        method: 'Credit Card',
        count: 12500,
        total_amount: 2345678.90,
        percentage: 81.08
      },
      {
        method: 'Debit Card',
        count: 2920,
        total_amount: 501884.55,
        percentage: 18.92
      }
    ]
  };

  const displayData = data || sampleData;

  // Table columns configuration
  const transactionColumns = [
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'transaction_date', label: 'Date' },
    { key: 'sales_amount', label: 'Amount' },
    { key: 'sales_quantity', label: 'Quantity' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'hour', label: 'Hour' }
  ];

  const paymentColumns = [
    { key: 'method', label: 'Payment Method' },
    { key: 'count', label: 'Count' },
    { key: 'total_amount', label: 'Total Amount' },
    { key: 'percentage', label: 'Percentage' }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f2e, #2a2f3e)',
        color: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Loading transaction patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1f2e, #2a2f3e)',
        color: '#f8fafc'
      }}>
        <div style={{
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button
            onClick={fetchTransactionData}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '12px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1f2e, #2a2f3e)',
      color: '#f8fafc',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Transaction Patterns Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          margin: 0
        }}>
          Enhanced with proper decimal formatting and alignment
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <KPICard
          title="Total Transactions"
          value={displayData.kpis.totalTransactions}
          formatType="number"
          trend={5.2}
          trendDirection="up"
        />
        <KPICard
          title="Total Revenue"
          value={displayData.kpis.totalAmount}
          formatType="currency"
          trend={12.8}
          trendDirection="up"
        />
        <KPICard
          title="Average Transaction"
          value={displayData.kpis.avgAmount}
          formatType="currency"
          trend={-2.1}
          trendDirection="down"
        />
        <KPICard
          title="Anomaly Rate"
          value={displayData.kpis.anomalyRate}
          formatType="percentage"
          trend={0.5}
          trendDirection="up"
        />
      </div>

      {/* Transaction Table */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f8fafc'
        }}>
          Recent Transactions
        </h2>
        <FormattedTable
          data={displayData.transactions}
          columns={transactionColumns}
          numericColumns={['sales_quantity', 'hour']}
          currencyColumns={['sales_amount']}
          style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        />
      </div>

      {/* Payment Methods Table */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f8fafc'
        }}>
          Payment Methods Analysis
        </h2>
        <FormattedTable
          data={displayData.paymentMethods}
          columns={paymentColumns}
          numericColumns={['count']}
          currencyColumns={['total_amount']}
          percentageColumns={['percentage']}
        />
      </div>

      {/* Data Grid with Pagination */}
      <div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f8fafc'
        }}>
          Detailed Transaction Data
        </h2>
        <DataGrid
          data={displayData.transactions}
          columns={transactionColumns}
          numericColumns={['sales_quantity', 'hour']}
          currencyColumns={['sales_amount']}
          pageSize={5}
        />
      </div>

      {/* Formatting Examples */}
      <div style={{
        marginTop: '40px',
        padding: '24px',
        background: 'rgba(30, 39, 56, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(58, 68, 89, 0.3)'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#f8fafc'
        }}>
          Formatting Examples
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <strong>Currency:</strong>
            <div style={{ fontFamily: 'monospace', color: '#10b981' }}>
              {formatCurrency(1234.5678)}
            </div>
          </div>
          <div>
            <strong>Percentage:</strong>
            <div style={{ fontFamily: 'monospace', color: '#f59e0b' }}>
              {formatPercentage(23.4567)}
            </div>
          </div>
          <div>
            <strong>Number (2 decimals):</strong>
            <div style={{ fontFamily: 'monospace', color: '#3b82f6' }}>
              {formatToTwoDecimals(987.654321)}
            </div>
          </div>
          <div>
            <strong>Large Number:</strong>
            <div style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>
              {formatToTwoDecimals(1234567.89, true)}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TransactionPatternsDemo;
