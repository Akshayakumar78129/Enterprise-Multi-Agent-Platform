import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function DemandForecastTestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/demand-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: '2021-01-01',
          end_date: '2021-06-24',
          forecast_horizon: 'month'
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Demand Forecast Test</title>
      </Head>
      
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>Demand Forecast API Test</h1>
        
        {loading && <p>Loading...</p>}
        
        {error && (
          <div style={{ color: 'red' }}>
            <h2>Error:</h2>
            <pre>{error}</pre>
          </div>
        )}
        
        {data && (
          <div>
            <h2>API Response:</h2>
            <p>Status: {data.status}</p>
            <p>Forecast Data Points: {data.data?.forecastData?.length || 0}</p>
            <p>Has Model Performance: {data.data?.modelPerformance ? 'Yes' : 'No'}</p>
            <p>Has Seasonal Patterns: {data.data?.seasonalPatterns ? 'Yes' : 'No'}</p>
            <p>Has Demand Drivers: {data.data?.demandDrivers ? 'Yes' : 'No'}</p>
            
            {data.data?.forecastData?.length > 0 && (
              <div>
                <h3>Sample Data (first 5 points):</h3>
                <pre>{JSON.stringify(data.data.forecastData.slice(0, 5), null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}