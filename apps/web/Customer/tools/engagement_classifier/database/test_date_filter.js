const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Test script to check date filtering functionality  
const dbPath = path.resolve(process.cwd(), "Customer/database/customers.db");

console.log("Testing Date Filter Functionality");
console.log("=================================\n");

const db = new sqlite3.Database(dbPath);

// First, let's see what date ranges we have in the data
const dateRangeQuery = `
  SELECT 
    MIN(cl."Last Activity Date") as earliest_date,
    MAX(cl."Last Activity Date") as latest_date,
    COUNT(*) as total_customers
  FROM dbo_D_Customer c
  LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
  WHERE cl."Last Activity Date" IS NOT NULL
`;

db.get(dateRangeQuery, (err, row) => {
  if (err) {
    console.error("Error getting date range:", err);
    return;
  }
  
  console.log("Available Data Range:");
  console.log(`- Earliest Date: ${row.earliest_date}`);
  console.log(`- Latest Date: ${row.latest_date}`);
  console.log(`- Total Customers: ${row.total_customers}`);
  console.log("");
  
  // Now test filtering by year
  const years = ['2018', '2019', '2020', '2021'];
  
  years.forEach(year => {
    const yearQuery = `
      SELECT 
        COUNT(*) as customer_count,
        CASE 
          WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
          WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
          ELSE 'Low'
        END as engagement_level
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      WHERE cl."Last Activity Date" BETWEEN '${year}-01-01' AND '${year}-12-31'
        AND cl."Days Since Last Activity" IS NOT NULL
      GROUP BY engagement_level
      ORDER BY 
        CASE engagement_level
          WHEN 'High' THEN 1
          WHEN 'Medium' THEN 2
          WHEN 'Low' THEN 3
        END
    `;
    
    db.all(yearQuery, (err, rows) => {
      if (err) {
        console.error(`Error querying ${year}:`, err);
        return;
      }
      
      console.log(`${year} Engagement Distribution:`);
      if (rows.length === 0) {
        console.log("  No data available for this year");
      } else {
        rows.forEach(row => {
          console.log(`  ${row.engagement_level}: ${row.customer_count} customers`);
        });
      }
      console.log("");
    });
  });
  
  // Close database after a delay to allow all queries to complete
  setTimeout(() => {
    db.close();
  }, 2000);
});