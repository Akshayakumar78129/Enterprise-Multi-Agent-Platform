// Test script to verify churn dashboard date filtering works without infinite loops
const puppeteer = require('puppeteer');

const DASHBOARD_URL = 'http://localhost:3000/customers/churn';
const MAX_API_CALLS = 10; // Maximum allowed API calls before considering it infinite

async function testChurnDashboard() {
  console.log('🚀 Testing churn dashboard date filtering...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Track API calls
  let apiCalls = {
    data: [],
    summary: []
  };
  
  // Intercept network requests to monitor API calls
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/churn-prediction/data')) {
      apiCalls.data.push({
        url,
        timestamp: new Date().toISOString()
      });
      console.log(`📊 Data API call #${apiCalls.data.length}: ${url}`);
      
      if (apiCalls.data.length > MAX_API_CALLS) {
        console.error('❌ ERROR: Too many data API calls - possible infinite loop!');
        console.log('API Call history:', apiCalls.data);
        process.exit(1);
      }
    } else if (url.includes('/api/churn-prediction/summary')) {
      apiCalls.summary.push({
        url,
        timestamp: new Date().toISOString()
      });
      console.log(`📈 Summary API call #${apiCalls.summary.length}: ${url}`);
    }
  });
  
  // Enable request interception
  await page.setRequestInterception(true);
  page.on('request', request => request.continue());
  
  // Navigate to dashboard
  console.log('📍 Navigating to churn dashboard...\n');
  await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Wait for initial load
  console.log('⏳ Waiting for dashboard to load...\n');
  await page.waitForTimeout(3000);
  
  // Check initial API calls
  console.log('\n📊 Initial Load Summary:');
  console.log(`  - Data API calls: ${apiCalls.data.length}`);
  console.log(`  - Summary API calls: ${apiCalls.summary.length}`);
  
  if (apiCalls.data.length > 2) {
    console.warn('⚠️  Warning: Multiple data API calls on initial load');
  } else {
    console.log('✅ Initial load OK - no excessive API calls');
  }
  
  // Test date filter interaction
  console.log('\n🔍 Testing date filter...\n');
  
  // Click on filters to expand
  const filterButton = await page.$('button[style*="transform"]');
  if (filterButton) {
    await filterButton.click();
    console.log('✅ Expanded filters');
    await page.waitForTimeout(1000);
    
    // Reset API call counters
    const preFilterCalls = apiCalls.data.length;
    
    // Click on a date range button
    const dateButtons = await page.$$('button');
    for (const button of dateButtons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Last 30 Days')) {
        console.log('📅 Clicking "Last 30 Days" filter...');
        await button.click();
        break;
      }
    }
    
    // Wait for API call
    await page.waitForTimeout(2000);
    
    const postFilterCalls = apiCalls.data.length;
    const filterApiCalls = postFilterCalls - preFilterCalls;
    
    console.log(`\n📊 Date Filter Summary:`);
    console.log(`  - API calls triggered: ${filterApiCalls}`);
    
    if (filterApiCalls === 0) {
      console.warn('⚠️  Warning: Date filter did not trigger API call');
    } else if (filterApiCalls === 1) {
      console.log('✅ Date filter triggered exactly 1 API call - correct!');
    } else {
      console.warn(`⚠️  Warning: Date filter triggered ${filterApiCalls} API calls`);
    }
    
    // Check the URL parameters
    if (apiCalls.data.length > preFilterCalls) {
      const lastCall = apiCalls.data[apiCalls.data.length - 1];
      console.log(`\n📝 Last API call URL:\n   ${lastCall.url}`);
      
      if (lastCall.url.includes('startDate') && lastCall.url.includes('endDate')) {
        console.log('✅ Date parameters included in API call');
      } else {
        console.warn('⚠️  Warning: Date parameters not found in API call');
      }
    }
  } else {
    console.error('❌ Could not find filter button');
  }
  
  // Final summary
  console.log('\n📋 Final Test Summary:');
  console.log(`  - Total data API calls: ${apiCalls.data.length}`);
  console.log(`  - Total summary API calls: ${apiCalls.summary.length}`);
  
  if (apiCalls.data.length <= 3) {
    console.log('\n✅ SUCCESS: Dashboard loads without infinite loops!');
  } else if (apiCalls.data.length <= 5) {
    console.log('\n⚠️  PARTIAL SUCCESS: Dashboard loads but makes more API calls than expected');
  } else {
    console.log('\n❌ FAILURE: Too many API calls detected');
  }
  
  // Keep browser open for manual inspection
  console.log('\n👀 Browser will remain open for manual inspection...');
  console.log('Press Ctrl+C to close when done.\n');
}

// Run the test
testChurnDashboard().catch(console.error);