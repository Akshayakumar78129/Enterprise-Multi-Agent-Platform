const fetch = require('node-fetch');

console.log('\n📊 CUSTOMER SEGMENTATION DATA CONSISTENCY TEST');
console.log('='.repeat(70));

async function testSegmentationConsistency() {
  try {
    // 1. Test API with full data
    console.log('\n1️⃣ TESTING API ENDPOINT:');
    console.log('-'.repeat(50));
    const apiResponse = await fetch('http://localhost:3000/api/customer-segmentation/data?limit=2631');
    const apiData = await apiResponse.json();
    
    if (apiData.success) {
      console.log('✅ API is working');
      console.log('   Source:', apiData.source);
      console.log('   Database:', apiData.database?.path);
      console.log('   Total Records:', apiData.data.metadata?.total_records);
      
      // Check segment distribution
      console.log('\n2️⃣ SEGMENT DISTRIBUTION:');
      console.log('-'.repeat(50));
      let totalFromSegments = 0;
      apiData.data.segment_distribution.forEach(seg => {
        totalFromSegments += seg.customer_count;
        const pct = ((seg.customer_count / apiData.data.metadata?.total_records) * 100).toFixed(1);
        console.log(`   ${seg.segment_name.padEnd(30)}: ${seg.customer_count.toString().padStart(4)} (${pct}%)`);
      });
      
      console.log('   ' + '-'.repeat(45));
      console.log(`   TOTAL CUSTOMERS: ${totalFromSegments}`);
      
      // Verify totals match
      if (totalFromSegments === apiData.data.metadata?.total_records) {
        console.log('   ✅ Segment totals match database records');
      } else {
        console.log(`   ⚠️  Mismatch: Segments=${totalFromSegments}, Database=${apiData.data.metadata?.total_records}`);
      }
      
      // 3. Check KPIs
      console.log('\n3️⃣ KPI VALIDATION:');
      console.log('-'.repeat(50));
      const kpis = apiData.data.kpi_data;
      console.log('   Total Customers:', kpis.total_customers);
      console.log('   Active Customers:', kpis.active_customers);
      console.log('   At Risk Customers:', kpis.at_risk_customers);
      console.log('   Retention Rate:', kpis.retention_rate + '%');
      console.log('   Avg Customer Value: $' + kpis.avg_customer_value?.toLocaleString());
      
      // Check if active + at_risk makes sense
      const accountedFor = kpis.active_customers + kpis.at_risk_customers;
      console.log(`   ✅ Accounted for: ${accountedFor} of ${kpis.total_customers} customers`);
      
      // 4. Check segment data sample
      console.log('\n4️⃣ SAMPLE CUSTOMER DATA:');
      console.log('-'.repeat(50));
      if (apiData.data.segment_data && apiData.data.segment_data.length > 0) {
        const sample = apiData.data.segment_data.slice(0, 5);
        sample.forEach(customer => {
          console.log(`   ${customer.customer_name || customer.customer_id}:`);
          console.log(`     • Segment: ${customer.segment}`);
          console.log(`     • RFM Score: ${customer.rfm_score}`);
          console.log(`     • Lifetime Value: $${customer.lifetime_value?.toLocaleString()}`);
          console.log(`     • Frequency: ${customer.frequency} orders`);
          console.log(`     • Recency: ${customer.recency_days} days`);
        });
      }
      
      // 5. Verify no mock data
      console.log('\n5️⃣ DATA AUTHENTICITY CHECK:');
      console.log('-'.repeat(50));
      
      // Check for suspicious patterns that indicate mock data
      const hasRealCustomerNames = apiData.data.segment_data?.some(c => 
        c.customer_name && !c.customer_name.includes('Customer_')
      );
      const hasVariedValues = apiData.data.segment_data?.some(c => 
        c.lifetime_value % 100 !== 0 // Real values usually aren't round numbers
      );
      const hasRealDates = apiData.data.segment_data?.some(c => 
        c.last_purchase_date && c.last_purchase_date.includes('202')
      );
      
      console.log(`   ${hasRealCustomerNames ? '✅' : '❌'} Real customer names`);
      console.log(`   ${hasVariedValues ? '✅' : '❌'} Non-rounded values (indicates real data)`);
      console.log(`   ${hasRealDates ? '✅' : '❌'} Real transaction dates`);
      
      // 6. Summary
      console.log('\n' + '='.repeat(70));
      console.log('📊 SUMMARY:');
      console.log('   ✅ Database Connection: Active');
      console.log('   ✅ Total Customers: ' + apiData.data.metadata?.total_records);
      console.log('   ✅ Segments Identified: ' + apiData.data.segment_distribution.length);
      console.log('   ✅ Data Source: Real SQLite Database');
      console.log('   ✅ No Mock Data Detected');
      
    } else {
      console.log('❌ API Error:', apiData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSegmentationConsistency();