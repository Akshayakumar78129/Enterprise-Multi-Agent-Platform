import React from 'react';
import Head from 'next/head';
import TransactionPatternsDashboard from '../../Customer/tools/transaction_patterns/ui/views/TransactionPatternsDashboard';

const TransactionPatternsPage = () => {
  return (
    <>
      <Head>
        <title>Transaction Patterns - Enterprise IQ</title>
        <meta name="description" content="Analyze transaction patterns, temporal trends, and anomalies across your business" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <TransactionPatternsDashboard />
    </>
  );
};

export default TransactionPatternsPage; 