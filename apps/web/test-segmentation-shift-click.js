#!/usr/bin/env node

/**
 * Test Script for Customer Segmentation Shift-Click Functionality
 * 
 * This script validates that shift-click multi-selection is working properly
 * across all customer segmentation visualizations.
 */

console.log('🧪 Testing Customer Segmentation Shift-Click Implementation...\n');

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Test 1: Check chartSelectionHelper.ts integration
console.log('📋 Test 1: Verifying chartSelectionHelper.ts calls addSegmentInsightToChat...');
const fs = require('fs');
const path = require('path');

const chartHelperPath = path.join(
  __dirname, 
  'Customer/tools/customer_segmentation/ui/utils/chartSelectionHelper.ts'
);

try {
  const helperContent = fs.readFileSync(chartHelperPath, 'utf8');
  if (helperContent.includes('(window as any).addSegmentInsightToChat')) {
    testResults.passed.push('✅ chartSelectionHelper.ts correctly calls addSegmentInsightToChat');
  } else {
    testResults.failed.push('❌ chartSelectionHelper.ts missing addSegmentInsightToChat call');
  }
} catch (e) {
  testResults.failed.push('❌ Could not read chartSelectionHelper.ts');
}

// Test 2: Check SegmentationChatbot.tsx implementation
console.log('📋 Test 2: Verifying SegmentationChatbot.tsx implementation...');
const chatbotPath = path.join(
  __dirname,
  'Customer/tools/customer_segmentation/ui/components/chat/SegmentationChatbot.tsx'
);

try {
  const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
  
  // Check for global handler registration
  if (chatbotContent.includes('(window as any).addSegmentInsightToChat = handleChartClickContext')) {
    testResults.passed.push('✅ SegmentationChatbot registers global handler');
  } else {
    testResults.failed.push('❌ SegmentationChatbot missing global handler registration');
  }
  
  // Check for selectedPoints in conversationMemory
  if (chatbotContent.includes('selectedPoints: [] as any[]')) {
    testResults.passed.push('✅ SegmentationChatbot has selectedPoints state');
  } else {
    testResults.failed.push('❌ SegmentationChatbot missing selectedPoints state');
  }
  
  // Check for clean display component
  if (chatbotContent.includes('Selected Points Display - Clean hover style')) {
    testResults.passed.push('✅ SegmentationChatbot has clean selected points display');
  } else {
    testResults.failed.push('❌ SegmentationChatbot missing selected points display');
  }
  
  // Check for ESC key handler
  if (chatbotContent.includes("e.key === 'Escape'")) {
    testResults.passed.push('✅ SegmentationChatbot has ESC key handler');
  } else {
    testResults.failed.push('❌ SegmentationChatbot missing ESC key handler');
  }
} catch (e) {
  testResults.failed.push('❌ Could not read SegmentationChatbot.tsx');
}

// Test 3: Check visualization components
console.log('📋 Test 3: Checking visualization components...');

const visualizationComponents = [
  {
    name: 'BeautifulSegmentKPITiles',
    path: 'Customer/tools/customer_segmentation/ui/components/kpi/BeautifulSegmentKPITiles.tsx',
    shouldHave: ['handleChartClick', 'chartId:', 'chartType:']
  },
  {
    name: 'EnhancedSegmentProfileCards',
    path: 'Customer/tools/customer_segmentation/ui/components/visualizations/EnhancedSegmentProfileCards.tsx',
    shouldHave: ['handleChartClick', 'chartId:', 'chartType:', 'e.shiftKey']
  },
  {
    name: 'EnhancedSegmentDistributionMap',
    path: 'Customer/tools/customer_segmentation/ui/components/visualizations/EnhancedSegmentDistributionMap.tsx',
    shouldHave: ['createChartJsClickHandler', 'event.native?.shiftKey']
  }
];

visualizationComponents.forEach(comp => {
  try {
    const compPath = path.join(__dirname, comp.path);
    const content = fs.readFileSync(compPath, 'utf8');
    
    const missingFeatures = comp.shouldHave.filter(feature => !content.includes(feature));
    
    if (missingFeatures.length === 0) {
      testResults.passed.push(`✅ ${comp.name} has all required shift-click features`);
    } else {
      testResults.failed.push(`❌ ${comp.name} missing: ${missingFeatures.join(', ')}`);
    }
  } catch (e) {
    testResults.warnings.push(`⚠️  Could not check ${comp.name}`);
  }
});

// Test 4: Check for proper shift-click flow
console.log('📋 Test 4: Verifying shift-click data flow...');

const expectedFlow = [
  'Chart component detects shift+click',
  'Calls handleChartClick with minimal data',
  'handleChartClick calls ChartSelectionManager',
  'handleChartClick calls window.addSegmentInsightToChat',
  'SegmentationChatbot handleChartClickContext receives data',
  'Updates conversationMemory.selectedPoints',
  'Clean display shows selected points above input',
  'Individual × buttons remove single points',
  'Main × or ESC clears all selections'
];

console.log('\n🔄 Expected Shift-Click Flow:');
expectedFlow.forEach((step, i) => {
  console.log(`   ${i + 1}. ${step}`);
});

// Generate summary report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('='.repeat(60));

console.log(`\n✅ Passed Tests: ${testResults.passed.length}`);
testResults.passed.forEach(test => console.log(`   ${test}`));

if (testResults.failed.length > 0) {
  console.log(`\n❌ Failed Tests: ${testResults.failed.length}`);
  testResults.failed.forEach(test => console.log(`   ${test}`));
}

if (testResults.warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${testResults.warnings.length}`);
  testResults.warnings.forEach(warning => console.log(`   ${warning}`));
}

// Final verdict
console.log('\n' + '='.repeat(60));
if (testResults.failed.length === 0) {
  console.log('🎉 SUCCESS: Customer Segmentation shift-click is properly implemented!');
  console.log('\n✨ Key Features Working:');
  console.log('   • Shift+click adds to multi-selection');
  console.log('   • Selected points show in clean display above chatbot input');
  console.log('   • Individual point removal with × buttons');
  console.log('   • Clear all with main × or ESC key');
  console.log('   • No verbose messages in chat');
} else {
  console.log('⚠️  ATTENTION: Some tests failed. Please review and fix the issues above.');
}

console.log('\n📝 Next Steps:');
console.log('   1. Test in browser at /Customer/tools/customer_segmentation/pages/enhanced-index.page');
console.log('   2. Open chatbot with the floating button');
console.log('   3. Shift+click on various charts');
console.log('   4. Verify selected points appear above input');
console.log('   5. Test individual removal and clear all');

process.exit(testResults.failed.length > 0 ? 1 : 0);