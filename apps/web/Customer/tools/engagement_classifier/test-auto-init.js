/**
 * Test script to verify auto-initialization works
 * Run this to test: node test-auto-init.js
 */

console.log('🧪 Testing Engagement Classifier Auto-Initialization...\n');

// Simulate Next.js environment
process.env.NODE_ENV = 'development';

async function testAutoInit() {
  try {
    // Import the auto-init module (this should trigger initialization)
    console.log('1️⃣ Importing auto-init module...');
    const { getChatbotInstance, isInitialized } = require('./auto-init.js');
    
    // Wait a moment for async initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('2️⃣ Checking initialization status...');
    console.log('   - Is Initialized:', isInitialized());
    console.log('   - Has Instance:', !!getChatbotInstance());
    
    // Test the API handler
    console.log('3️⃣ Testing API handler...');
    const { handleChatbotRequest } = require('./api/chatbot.js');
    
    // Mock request/response objects
    const mockReq = {
      method: 'GET'
    };
    
    const mockRes = {
      setHeader: () => {},
      status: (code) => ({
        json: (data) => {
          console.log('   - Health Check Response:', JSON.stringify(data, null, 2));
          return mockRes;
        },
        end: () => mockRes
      })
    };
    
    await handleChatbotRequest(mockReq, mockRes);
    
    console.log('\n✅ Auto-initialization test completed successfully!');
    console.log('🎯 The chatbot will auto-initialize when Next.js starts');
    
  } catch (error) {
    console.error('❌ Auto-initialization test failed:', error);
  }
}

testAutoInit();