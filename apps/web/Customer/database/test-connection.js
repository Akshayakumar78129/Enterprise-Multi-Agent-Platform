/**
 * Test script to verify the SQLite database connection
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function testConnection() {
  // Test multiple path variants
  const paths = [
    // Relative to current directory
    './customers.db',
    // Absolute path
    '/Users/rahilharihar/Projects/multiagent-googleADK/Project/Customer/database/customers.db',
    // Relative to project root
    path.resolve(process.cwd(), 'Customer/database/customers.db'),
    // Using __dirname
    path.resolve(__dirname, './customers.db'),
  ];

  for (const dbPath of paths) {
    console.log(`\nTesting connection to: ${dbPath}`);
    try {
      const fileExists = require('fs').existsSync(dbPath);
      console.log(`File exists: ${fileExists}`);
      
      if (!fileExists) {
        console.error(`Database file not found at: ${dbPath}`);
        continue;
      }

      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      
      console.log(`Connected to database at: ${dbPath}`);
      
      // Test query
      try {
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table';");
        console.log(`Tables in database (${tables.length}):`, tables.map(t => t.name).join(', '));
        
        // Test specific table
        const salesTransactionCount = await db.get("SELECT COUNT(*) as count FROM dbo_F_Sales_Transaction");
        console.log(`Sales Transaction count: ${salesTransactionCount.count}`);
        
        await db.close();
        console.log(`Successfully closed connection to: ${dbPath}`);
      } catch (queryError) {
        console.error(`Query error:`, queryError);
      }
    } catch (error) {
      console.error(`Connection error:`, error);
    }
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Test failed:', err);
}); 