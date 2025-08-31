const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class DebugQueries {
  constructor() {
    this.dbPath = path.resolve(
      process.cwd(),
      "Customer/database/customers.db"
    );
  }

  async checkDateRanges() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        SELECT 
          MIN(cl."Last Activity Date") as earliest_date,
          MAX(cl."Last Activity Date") as latest_date,
          COUNT(*) as total_records
        FROM 
          dbo_D_Customer c
        LEFT JOIN 
          dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE 
          cl."Last Activity Date" IS NOT NULL;
      `;

      db.get(query, (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async checkLoyaltyStatuses() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        SELECT 
          cl."Loyalty Status",
          COUNT(*) as count
        FROM 
          dbo_D_Customer c
        LEFT JOIN 
          dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE 
          cl."Loyalty Status" IS NOT NULL
        GROUP BY 
          cl."Loyalty Status"
        ORDER BY count DESC;
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async checkSampleCustomerNames() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      const query = `
        SELECT 
          c."Customer Name",
          c."Customer Number",
          cl."Last Activity Date",
          cl."Loyalty Status"
        FROM 
          dbo_D_Customer c
        LEFT JOIN 
          dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE 
          c."Customer Name" IS NOT NULL
        LIMIT 10;
      `;

      db.all(query, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = { DebugQueries };