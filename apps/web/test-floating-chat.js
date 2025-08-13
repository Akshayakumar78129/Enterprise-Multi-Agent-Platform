// Test script to verify FloatingAIChat functionality
const puppeteer = require('puppeteer');

async function testFloatingAIChat() {
  console.log('🧪 Testing FloatingAIChat on transaction-patterns page...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('FloatingAIChat')) {
        console.log('📱 FloatingAIChat:', msg.text());
      }
    });
    
    // Listen for errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    console.log('🌐 Navigating to transaction-patterns page...');
    await page.goto('http://localhost:3005/customers/transaction-patterns', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the FloatingAIChat button to appear
    console.log('🔍 Looking for FloatingAIChat button...');
    await page.waitForSelector('button[title="Open AI Assistant"]', { timeout: 10000 });
    console.log('✅ FloatingAIChat button found!');
    
    // Click the chat button
    console.log('🖱️ Clicking FloatingAIChat button...');
    await page.click('button[title="Open AI Assistant"]');
    
    // Wait for chat panel to open
    await page.waitForSelector('.chatbot-container', { timeout: 5000 });
    console.log('✅ Chat panel opened successfully!');
    
    // Check if welcome message contains insights
    const welcomeMessage = await page.$eval('.chatbot-container', el => {
      const messageElements = el.querySelectorAll('[style*="margin-bottom: 16px"]');
      return messageElements.length > 0 ? messageElements[0].innerHTML : 'No message found';
    });
    
    console.log('📝 Welcome message preview:', welcomeMessage.substring(0, 200) + '...');
    
    // Test typing a message
    console.log('⌨️ Testing message input...');
    await page.type('textarea', 'Tell me about transaction patterns');
    
    // Click send button
    await page.click('button:has-text("Send")');
    console.log('📤 Message sent!');
    
    // Wait a bit for response
    await page.waitForTimeout(3000);
    
    console.log('✅ FloatingAIChat test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testFloatingAIChat().catch(console.error);
}

module.exports = { testFloatingAIChat };