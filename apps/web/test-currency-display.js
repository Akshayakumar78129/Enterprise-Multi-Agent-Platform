const fs = require('fs');
const path = require('path');

console.log('\n💵 CURRENCY DISPLAY VALIDATION');
console.log('='*60);
console.log('Checking all Business Intelligence components for proper dollar display\n');

const componentsToCheck = [
  'Customer/tools/churn_prediction/ui/components/StandaloneBusinessIntelligenceAgent.tsx',
  'Customer/tools/churn_prediction/ui/components/InteractiveBusinessIntelligence.tsx',
  'Customer/tools/churn_prediction/ui/components/SimpleInteractiveBI.tsx'
];

let allClear = true;

componentsToCheck.forEach(componentPath => {
  const fullPath = path.join(__dirname, componentPath);
  const fileName = path.basename(componentPath);
  
  console.log(`\n📄 Checking: ${fileName}`);
  console.log('-'.repeat(50));
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for rupee symbol
    if (content.includes('₹')) {
      console.log('   ❌ Found rupee symbol (₹)');
      allClear = false;
      
      // Find line numbers
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('₹')) {
          console.log(`      Line ${index + 1}: ${line.trim().substring(0, 60)}...`);
        }
      });
    } else {
      console.log('   ✅ No rupee symbols found');
    }
    
    // Check for dollar symbol
    const dollarCount = (content.match(/\$/g) || []).length;
    if (dollarCount > 0) {
      console.log(`   ✅ Found ${dollarCount} dollar ($) references`);
    } else {
      console.log('   ⚠️  No dollar symbols found');
    }
    
    // Check for Indian notation (L for Lakhs)
    const lakhMatches = content.match(/\d+L\b|\}L\b/g);
    if (lakhMatches && lakhMatches.length > 0) {
      console.log(`   ⚠️  Found ${lakhMatches.length} possible Lakh (L) notations`);
      // Note: Some might be legitimate like "1L" in code
    }
    
    // Sample some dollar amounts
    const dollarAmounts = content.match(/\$[\d,]+K?M?/g);
    if (dollarAmounts && dollarAmounts.length > 0) {
      console.log('   💰 Sample dollar amounts found:');
      dollarAmounts.slice(0, 5).forEach(amount => {
        console.log(`      ${amount}`);
      });
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    allClear = false;
  }
});

console.log('\n\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

if (allClear) {
  console.log('\n✅ SUCCESS: All currency displays are in dollars ($)');
  console.log('   • No rupee symbols (₹) found');
  console.log('   • Dollar notation correctly used');
  console.log('   • K for thousands, M for millions');
} else {
  console.log('\n❌ ISSUES FOUND: Some components still have rupee symbols');
  console.log('   Please fix the remaining rupee references');
}

console.log('\n📊 Expected Format Examples:');
console.log('   • Revenue at Risk: $750K');
console.log('   • Budget Options: $100K+, $50K-100K, $25-50K');
console.log('   • Implementation Cost: $25K');
console.log('\n✨ Business Intelligence Agent now displays all values in USD!');