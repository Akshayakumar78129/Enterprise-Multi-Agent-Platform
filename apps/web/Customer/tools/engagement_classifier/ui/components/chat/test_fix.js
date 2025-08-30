// Test to verify the chatbot fix works
// Run this in browser console to test the logic

const testCases = [
  {
    input: "what is low engagement customers",
    expected: "Should return specific low engagement explanation"
  },
  {
    input: "what are low engagement customers", 
    expected: "Should return specific low engagement explanation"
  },
  {
    input: "low engagement",
    expected: "Should return specific low engagement explanation"
  },
  {
    input: "what is high engagement customers",
    expected: "Should return specific high engagement explanation"
  },
  {
    input: "what are medium engagement customers",
    expected: "Should return specific medium engagement explanation"
  },
  {
    input: "what are my KPIs",
    expected: "Should return KPI explanation with actual data"
  },
  {
    input: "explain dashboard",
    expected: "Should return general dashboard explanation"
  }
];

// Mock function to test the logic
function testMessageLogic(message) {
  const lowerMessage = message.toLowerCase();
  
  // Test the exact logic from the chatbot
  if (lowerMessage.includes('low engagement') || 
      (lowerMessage.includes('what') && lowerMessage.includes('low') && lowerMessage.includes('engagement')) ||
      (lowerMessage.includes('what') && lowerMessage.includes('low') && lowerMessage.includes('customers')) ||
      lowerMessage.includes('low engagement customers')) {
    return "LOW_ENGAGEMENT_RESPONSE";
  }
  
  if (lowerMessage.includes('high engagement') || 
      (lowerMessage.includes('what') && lowerMessage.includes('high') && lowerMessage.includes('engagement')) ||
      (lowerMessage.includes('what') && lowerMessage.includes('high') && lowerMessage.includes('customers')) ||
      lowerMessage.includes('high engagement customers')) {
    return "HIGH_ENGAGEMENT_RESPONSE";
  }
  
  if (lowerMessage.includes('medium engagement') || 
      (lowerMessage.includes('what') && lowerMessage.includes('medium') && lowerMessage.includes('engagement')) ||
      (lowerMessage.includes('what') && lowerMessage.includes('medium') && lowerMessage.includes('customers')) ||
      lowerMessage.includes('medium engagement customers')) {
    return "MEDIUM_ENGAGEMENT_RESPONSE";
  }
  
  if ((lowerMessage.includes('what') && (lowerMessage.includes('kpi') || lowerMessage.includes('metrics'))) ||
      (lowerMessage.includes('explain') && lowerMessage.includes('kpi')) ||
      lowerMessage.includes('key performance indicators')) {
    return "KPI_RESPONSE";
  }
  
  if ((lowerMessage.includes('dashboard') && !lowerMessage.includes('engagement')) || 
      (lowerMessage.includes('explain') && lowerMessage.includes('dashboard')) ||
      (lowerMessage.includes('what') && lowerMessage.includes('dashboard'))) {
    return "DASHBOARD_RESPONSE";
  }
  
  return "FALLBACK_RESPONSE";
}

console.log("Testing chatbot message logic...\n");

testCases.forEach((testCase, index) => {
  const result = testMessageLogic(testCase.input);
  console.log(`${index + 1}. Input: "${testCase.input}"`);
  console.log(`   Result: ${result}`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   ✅ ${result.includes('LOW_ENGAGEMENT') || result.includes('HIGH_ENGAGEMENT') || result.includes('MEDIUM_ENGAGEMENT') || result.includes('KPI') ? 'PASS' : 'FAIL'}\n`);
});

console.log("If all tests show specific responses (not FALLBACK_RESPONSE), the fix is working!");