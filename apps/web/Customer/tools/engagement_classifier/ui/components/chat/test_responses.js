// Test script to verify chatbot responses
// This can be run in browser console to test the response logic

const testQuestions = [
  "hi",
  "what is low engagement customers",
  "what are high engagement customers", 
  "what are medium engagement customers",
  "what are my KPIs",
  "how to improve engagement",
  "how to use filters",
  "explain the dashboard",
  "what is engagement scoring"
];

// Mock dashboard data for testing
const mockDashboardData = {
  kpis: {
    total_customers: 1250,
    avg_engagement_score: 6.8,
    avg_days_since_activity: 45,
    reengagement_opportunities: 320
  },
  distribution: [
    { engagement_level: 'High', customer_count: 375 },
    { engagement_level: 'Medium', customer_count: 550 },
    { engagement_level: 'Low', customer_count: 325 }
  ]
};

console.log("Testing chatbot responses...");
console.log("Mock data:", mockDashboardData);
console.log("\nTest questions and expected fast responses:");

testQuestions.forEach((question, index) => {
  console.log(`\n${index + 1}. Question: "${question}"`);
  console.log("Expected: Fast response without AI API call");
});

console.log("\nTo test in the actual chatbot:");
console.log("1. Open the engagement classifier dashboard");
console.log("2. Click the chat button");
console.log("3. Try the test questions above");
console.log("4. Responses should be instant (no loading delay)");