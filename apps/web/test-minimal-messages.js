console.log('\n✅ ULTRA-MINIMAL MESSAGE FORMAT');
console.log('='.repeat(60));
console.log('Messages now show ONLY essential data (2-4 words)\n');

const examples = [
  {
    chart: 'Risk Pyramid',
    before: '📊 Risk Pyramid Analysis - Very High Risk (36.3%)\nRevenue at Risk: $13,860,000 USD...',
    after: 'Very High Risk: 924',
    description: 'Just risk level and count'
  },
  {
    chart: 'Feature Importance',
    before: '💡 Feature Analysis: Recency\nImportance: 85%\nRank: #1...',
    after: 'Recency: 85%',
    description: 'Feature and percentage only'
  },
  {
    chart: 'Probability Histogram',
    before: '📈 Probability Distribution 70-80%\n45 customers in this range...',
    after: '70-80%: 45',
    description: 'Range and count only'
  },
  {
    chart: 'Segment Matrix',
    before: '🎯 Segment Performance\nEnterprise: 2542 customers...',
    after: 'Enterprise: 2542',
    description: 'Segment and count only'
  },
  {
    chart: 'Time Series',
    before: '📅 Temporal Risk Analysis\nDec 2021: 425 at risk...',
    after: 'Dec 2021: 425',
    description: 'Period and value only'
  }
];

console.log('EXAMPLES:');
console.log('-'.repeat(50));

examples.forEach((ex, i) => {
  console.log(`\n${i + 1}. ${ex.chart}`);
  console.log('   ❌ BEFORE (verbose):');
  console.log('   ' + ex.before.split('\n')[0] + '...');
  console.log('   ✅ AFTER (minimal):');
  console.log('   "' + ex.after + '"');
  console.log('   → ' + ex.description);
});

console.log('\n\n📏 CHARACTER COUNT COMPARISON:');
console.log('-'.repeat(50));
console.log('BEFORE: 200-500+ characters with multiple lines');
console.log('AFTER:  10-20 characters, single line');
console.log('Reduction: ~95% less text');

console.log('\n\n✨ KEY PRINCIPLES:');
console.log('-'.repeat(50));
console.log('1. NO emojis');
console.log('2. NO explanations');
console.log('3. NO multiple lines');
console.log('4. NO extra context');
console.log('5. JUST label: value');

console.log('\n💬 This is what "minimal" means!');