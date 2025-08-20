import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function CustomerSegmentationTestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/customer-segmentation/data')
      .then(res => res.json())
      .then(response => {
        console.log('API Response:', response);
        setData(response);
        setLoading(false);
      })
      .catch(err => {
        console.error('API Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Head>
        <title>Customer Segmentation Test - Enterprise IQ</title>
        <meta name="description" content="Testing customer segmentation page" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ 
        padding: '40px',
        minHeight: '100vh',
        background: '#1a1f2e',
        color: 'white'
      }}>
        <h1>Customer Segmentation Test Page</h1>
        
        {loading && <p>Loading data...</p>}
        
        {error && (
          <div style={{ color: 'red', marginTop: '20px' }}>
            Error: {error}
          </div>
        )}
        
        {data && (
          <div>
            <h2>Data Loaded Successfully!</h2>
            <div style={{ marginTop: '20px' }}>
              <h3>API Response:</h3>
              <pre style={{ 
                background: '#2d3748', 
                padding: '20px', 
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
            
            {data.success && data.data && (
              <div style={{ marginTop: '20px' }}>
                <h3>Summary:</h3>
                <ul>
                  <li>Segment Data Count: {data.data.segment_data?.length || 0}</li>
                  <li>Segment Distribution Count: {data.data.segment_distribution?.length || 0}</li>
                  <li>Has KPI Data: {data.data.kpi_data ? 'Yes' : 'No'}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}