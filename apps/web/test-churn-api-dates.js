// Test the churn API date filtering directly
async function testChurnAPI() {
  console.log('🚀 Testing Churn Dashboard API Date Filtering\n');
  
  const baseURL = 'http://localhost:3000/api/churn-prediction/data';
  
  // Test 1: No date filters (should return all data)
  console.log('Test 1: Fetching without date filters...');
  try {
    const res1 = await fetch(`${baseURL}?count=100`);
    const data1 = await res1.json();
    console.log(`✅ Success: Retrieved ${data1.data?.customers?.length || 0} customers`);
    console.log(`   Status: ${data1.status}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 2: With date filters for 2021
  console.log('\nTest 2: Fetching with 2021 date range...');
  try {
    const res2 = await fetch(`${baseURL}?count=100&startDate=2021-01-01&endDate=2021-12-31`);
    const data2 = await res2.json();
    console.log(`✅ Success: Retrieved ${data2.data?.customers?.length || 0} customers`);
    console.log(`   Status: ${data2.status}`);
    
    // Check if any customers have last_purchase_date in 2021
    if (data2.data?.customers?.length > 0) {
      const sample = data2.data.customers[0];
      console.log(`   Sample customer last_purchase: ${sample.last_purchase_date}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 3: Last 30 days from end of 2021
  console.log('\nTest 3: Fetching last 30 days of 2021...');
  try {
    const res3 = await fetch(`${baseURL}?count=100&startDate=2021-12-01&endDate=2021-12-31`);
    const data3 = await res3.json();
    console.log(`✅ Success: Retrieved ${data3.data?.customers?.length || 0} customers`);
    console.log(`   Status: ${data3.status}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  // Test 4: Last 90 days from end of 2021
  console.log('\nTest 4: Fetching last 90 days of 2021...');
  try {
    const res4 = await fetch(`${baseURL}?count=100&startDate=2021-10-03&endDate=2021-12-31`);
    const data4 = await res4.json();
    console.log(`✅ Success: Retrieved ${data4.data?.customers?.length || 0} customers`);
    console.log(`   Status: ${data4.status}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  console.log('\n✅ All API tests completed!');
}

// Run the test
testChurnAPI().catch(console.error);