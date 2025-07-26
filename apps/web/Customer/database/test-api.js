/**
 * Test script to verify the transaction patterns API endpoint
 */

const fetch = require('node-fetch');

async function testApiEndpoint() {
  const baseUrl = 'http://localhost:3000/api/transaction-patterns/data';
  
  // Set default date range that should have data
  const startDate = '2019-01-01';
  const endDate = '2019-12-31';
  
  const url = `${baseUrl}?start=${startDate}&end=${endDate}`;
  
  console.log(`Testing API endpoint: ${url}`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    
    console.log(`Response status: ${status}`);
    
    if (status === 200) {
      const data = await response.json();
      console.log('API response successful!');
      console.log('Stats:', JSON.stringify(data.stats, null, 2));
      console.log('Transaction count:', data.transactions?.length || 0);
      console.log('Has temporal heatmap:', !!data.temporalHeatmap);
      console.log('Product associations count:', data.productAssociations?.length || 0);
    } else {
      const errorText = await response.text();
      console.error('API request failed:', errorText);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testApiEndpoint().catch(err => {
  console.error('Test failed:', err);
}); 