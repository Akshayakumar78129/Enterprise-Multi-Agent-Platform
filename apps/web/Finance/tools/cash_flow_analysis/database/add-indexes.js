const Database = require('better-sqlite3');
const path = require('path');

function addIndexes() {
  const dbPath = path.join(process.cwd(), '..', '..', '..', 'database', 'financial_agent.db');
  console.log('Opening database at:', dbPath);
  
  const db = new Database(dbPath, { readonly: false });
  
  try {
    console.log('Adding indexes for cash flow analysis performance...');
    
    // Create indexes for common query patterns
    const indexes = [
      // Index for date range queries
      'CREATE INDEX IF NOT EXISTS idx_txn_date ON """dbo_F_GL_Transaction""" ("Txn Date")',
      
      // Index for GL Account Number queries (used in LIKE operations)
      'CREATE INDEX IF NOT EXISTS idx_gl_account ON """dbo_F_GL_Transaction""" ("GL Account Number")',
      
      // Composite index for date + company code
      'CREATE INDEX IF NOT EXISTS idx_date_company ON """dbo_F_GL_Transaction""" ("Txn Date", "Company Code")',
      
      // Composite index for GL account + date (for filtered aggregations)
      'CREATE INDEX IF NOT EXISTS idx_gl_date ON """dbo_F_GL_Transaction""" ("GL Account Number", "Txn Date")',
      
      // Index for company code filtering
      'CREATE INDEX IF NOT EXISTS idx_company_code ON """dbo_F_GL_Transaction""" ("Company Code")',
      
      // Composite index for amount queries with GL account
      'CREATE INDEX IF NOT EXISTS idx_gl_amount ON """dbo_F_GL_Transaction""" ("GL Account Number", "Txn Amount")'
    ];
    
    indexes.forEach((indexSql, i) => {
      console.log(`Creating index ${i + 1}/${indexes.length}...`);
      try {
        db.prepare(indexSql).run();
        console.log(`✓ Index ${i + 1} created successfully`);
      } catch (error) {
        console.log(`⚠ Index ${i + 1} might already exist:`, error.message);
      }
    });
    
    // Analyze the database to update statistics
    console.log('Analyzing database for query optimization...');
    db.prepare('ANALYZE').run();
    
    // Get table statistics
    const tableInfo = db.prepare(`
      SELECT COUNT(*) as row_count 
      FROM """dbo_F_GL_Transaction"""
    `).get();
    
    console.log(`\n✅ Indexing complete!`);
    console.log(`Table has ${tableInfo.row_count.toLocaleString()} rows`);
    
    // Test query performance
    console.log('\nTesting query performance...');
    console.time('Test Query');
    
    const testResult = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM("Txn Amount") as total
      FROM """dbo_F_GL_Transaction"""
      WHERE "Txn Date" BETWEEN '2021-01-01' AND '2021-12-31'
        AND "GL Account Number" LIKE '41%'
    `).get();
    
    console.timeEnd('Test Query');
    console.log('Test result:', testResult);
    
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    db.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run if executed directly
if (require.main === module) {
  addIndexes();
}

module.exports = { addIndexes };