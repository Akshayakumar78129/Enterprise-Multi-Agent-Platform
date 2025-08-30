/**
 * Database Module - Handles SQL queries to customer.db
 * Provides methods to query customer data and format results for Gemini
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUIET = process.env.EC_QUIET === '1' || process.env.EC_QUIET === 'true';

class DatabaseManager {
  constructor(dbPath = null) {
    // Use provided path or default to the customer database
    const defaultPath = path.join(__dirname, '../database/customers.db');
    if (dbPath && typeof dbPath === 'string') {
      this.dbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(__dirname, dbPath);
    } else {
      this.dbPath = defaultPath;
    }
    if (!QUIET) console.log(`📁 Database path resolved to: ${this.dbPath}`);
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          if (!QUIET) console.log(`✅ Connected to database: ${this.dbPath}`);
          // Ensure a compatible 'customers' view exists that matches expected columns
          const createViewSQL = `
            CREATE VIEW IF NOT EXISTS customers AS
            SELECT 
              c."Customer Number" AS customer_id,
              c."Customer Name" AS customer_name,
              cl."RFM Score" AS engagement_score,
              CASE 
                WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
                WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
                ELSE 'Low'
              END AS engagement_level,
              cl."Number Sales Txns" AS total_transactions,
              COALESCE(cl."LTD Sales Amount", 0) AS total_spent,
              cl."Last Activity Date" AS last_activity_date
            FROM dbo_D_Customer c
            LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
            WHERE cl."Days Since Last Activity" IS NOT NULL;
          `;
          this.db.exec(createViewSQL, (viewErr) => {
            if (viewErr) {
              console.error('Error ensuring customers view:', viewErr);
              // Do not reject to allow non-view queries to still work
            } else {
              if (!QUIET) console.log('✅ Customers view is ready');
            }
            resolve();
          });
        }
      });
    });
  }

  /**
   * Close database connection
   */
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Execute a SQL query and return results
   */
  async ensureCustomersView() {
    return new Promise((resolve) => {
      const createViewSQL = `
        CREATE VIEW IF NOT EXISTS customers AS
        SELECT 
          c."Customer Number" AS customer_id,
          c."Customer Name" AS customer_name,
          cl."RFM Score" AS engagement_score,
          CASE 
            WHEN cl."Days Since Last Activity" <= 30 THEN 'High'
            WHEN cl."Days Since Last Activity" <= 90 THEN 'Medium'
            ELSE 'Low'
          END AS engagement_level,
          cl."Number Sales Txns" AS total_transactions,
          COALESCE(cl."LTD Sales Amount", 0) AS total_spent,
          cl."Last Activity Date" AS last_activity_date
        FROM dbo_D_Customer c
        LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
        WHERE cl."Days Since Last Activity" IS NOT NULL;
      `;
      this.db.exec(createViewSQL, (viewErr) => {
        if (viewErr) {
          console.error('Error ensuring customers view:', viewErr);
        } else {
          console.log('✅ Customers view is ready');
        }
        resolve();
      });
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      const execute = () => {
        console.log(`Executing query: ${sql}`);
        if (params.length > 0) {
          console.log(`Parameters: ${JSON.stringify(params)}`);
        }
        this.db.all(sql, params, async (err, rows) => {
          if (err) {
            // Auto-heal when customers view is missing
            if (err.message && err.message.includes('no such table: customers')) {
              console.warn('customers view missing. Attempting to create and retry once...');
              await this.ensureCustomersView();
              this.db.all(sql, params, (err2, rows2) => {
                if (err2) {
                  console.error('Retry failed:', err2);
                  reject(err2);
                } else {
                  console.log(`Query returned ${rows2.length} rows (after retry)`);
                  resolve(rows2);
                }
              });
              return;
            }
            console.error('Database query error:', err);
            reject(err);
          } else {
            console.log(`Query returned ${rows.length} rows`);
            resolve(rows);
          }
        });
      };

      execute();
    });
  }

  /**
   * Get database schema information
   */
  async getSchema() {
    try {
      const tables = await this.query(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      const schema = {};
      
      for (const table of tables) {
        const columns = await this.query(`PRAGMA table_info(${table.name})`);
        schema[table.name] = columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: !col.notnull,
          primaryKey: col.pk === 1
        }));
      }

      return schema;
    } catch (error) {
      console.error('Error getting schema:', error);
      throw error;
    }
  }

  /**
   * Get customer count by engagement level
   */
  async getCustomerCountByEngagement() {
    const sql = `
      SELECT 
        engagement_level,
        COUNT(*) as customer_count
      FROM dbo_D_Customer 
      GROUP BY engagement_level
      ORDER BY 
        CASE engagement_level 
          WHEN 'High' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'Low' THEN 3 
        END
    `;
    
    return await this.query(sql);
  }

  /**
   * Get total customer count
   */
  async getTotalCustomers() {
    const result = await this.query('SELECT COUNT(*) as total FROM dbo_D_Customer');
    return result[0]?.total || 0;
  }

  /**
   * Get average engagement score
   */
  async getAverageEngagementScore() {
    const result = await this.query('SELECT AVG(engagement_score) as avg_score FROM dbo_D_Customer');
    return Math.round((result[0]?.avg_score || 0) * 100) / 100;
  }

  /**
   * Get average days since last activity
   */
  async getAverageDaysSinceActivity() {
    const sql = `
      SELECT AVG(
        CASE 
          WHEN last_activity_date IS NOT NULL 
          THEN julianday('now') - julianday(last_activity_date)
          ELSE NULL 
        END
      ) as avg_days
      FROM dbo_D_Customer
      WHERE last_activity_date IS NOT NULL
    `;
    
    const result = await this.query(sql);
    return Math.round(result[0]?.avg_days || 0);
  }

  /**
   * Get customers with specific engagement level
   */
  async getCustomersByEngagement(level) {
    const sql = `
      SELECT * FROM dbo_D_Customer 
      WHERE engagement_level = ? 
      ORDER BY engagement_score DESC
      LIMIT 10
    `;
    
    return await this.query(sql, [level]);
  }

  /**
   * Get top customers by engagement score
   */
  async getTopCustomers(limit = 10) {
    const sql = `
      SELECT * FROM dbo_D_Customer 
      ORDER BY engagement_score DESC 
      LIMIT ?
    `;
    
    return await this.query(sql, [limit]);
  }

  /**
   * Get customers at risk (low engagement)
   */
  async getAtRiskCustomers() {
    const sql = `
      SELECT * FROM dbo_D_Customer 
      WHERE engagement_level = 'Low' 
      ORDER BY engagement_score ASC, last_activity_date ASC
      LIMIT 20
    `;
    
    return await this.query(sql);
  }

  /**
   * Get re-engagement opportunities count
   */
  async getReengagementOpportunities() {
    const sql = `
      SELECT COUNT(*) as count FROM dbo_D_Customer 
      WHERE engagement_level IN ('Low', 'Medium') 
      AND engagement_score BETWEEN 3 AND 6
    `;
    
    const result = await this.query(sql);
    return result[0]?.count || 0;
  }

  /**
   * Search customers by name or ID
   */
  async searchCustomers(searchTerm, limit = 10) {
    const sql = `
      SELECT * FROM dbo_D_Customer 
      WHERE customer_name LIKE ? OR customer_id LIKE ?
      ORDER BY engagement_score DESC
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await this.query(sql, [searchPattern, searchPattern, limit]);
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const stats = {};
    
    try {
      // Basic counts
      stats.totalCustomers = await this.getTotalCustomers();
      stats.avgEngagementScore = await this.getAverageEngagementScore();
      stats.avgDaysSinceActivity = await this.getAverageDaysSinceActivity();
      stats.reengagementOpportunities = await this.getReengagementOpportunities();
      
      // Engagement distribution
      stats.engagementDistribution = await this.getCustomerCountByEngagement();
      
      // Transaction stats
      const transactionStats = await this.query(`
        SELECT 
          AVG(total_spent) as avg_spent,
          AVG(total_transactions) as avg_transactions,
          MAX(total_spent) as max_spent,
          MIN(total_spent) as min_spent
        FROM dbo_D_Customer
        WHERE total_spent > 0
      `);
      
      stats.transactionStats = transactionStats[0] || {};
      
      return stats;
      
    } catch (error) {
      console.error('Error getting customer stats:', error);
      throw error;
    }
  }

  /**
   * Execute custom SQL query with safety checks
   */
  async executeCustomQuery(userQuery) {
    // Basic safety checks - only allow SELECT statements
    const cleanQuery = userQuery.trim().toLowerCase();
    
    if (!cleanQuery.startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for security reasons');
    }
    
    // Block potentially dangerous keywords
    const dangerousKeywords = ['drop', 'delete', 'update', 'insert', 'alter', 'create'];
    for (const keyword of dangerousKeywords) {
      if (cleanQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`);
      }
    }
    
    try {
      const results = await this.query(userQuery);
      return results;
    } catch (error) {
      console.error('Custom query error:', error);
      throw error;
    }
  }

  /**
   * Format query results for Gemini consumption
   */
  formatResultsForAI(results, queryType = 'general') {
    if (!results || results.length === 0) {
      return "No data found for the requested query.";
    }

    let formatted = `Query Results (${results.length} records):\n\n`;

    if (queryType === 'count' && results.length === 1) {
      // Simple count result
      const result = results[0];
      const key = Object.keys(result)[0];
      formatted += `${key}: ${result[key]}`;
    } else if (queryType === 'stats') {
      // Statistical results
      results.forEach((row, index) => {
        formatted += `${index + 1}. `;
        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === 'number') {
            value = Math.round(value * 100) / 100; // Round to 2 decimal places
          }
          formatted += `${key}: ${value}, `;
        });
        formatted = formatted.slice(0, -2) + '\n'; // Remove last comma and add newline
      });
    } else {
      // General table results
      if (results.length <= 10) {
        // Show all results if 10 or fewer
        results.forEach((row, index) => {
          formatted += `${index + 1}. `;
          Object.entries(row).forEach(([key, value]) => {
            formatted += `${key}: ${value}, `;
          });
          formatted = formatted.slice(0, -2) + '\n';
        });
      } else {
        // Show summary for large result sets
        formatted += `Showing first 5 of ${results.length} results:\n\n`;
        results.slice(0, 5).forEach((row, index) => {
          formatted += `${index + 1}. `;
          Object.entries(row).forEach(([key, value]) => {
            formatted += `${key}: ${value}, `;
          });
          formatted = formatted.slice(0, -2) + '\n';
        });
        formatted += `\n... and ${results.length - 5} more records.`;
      }
    }

    return formatted;
  }

  /**
   * Test database connection and basic queries
   */
  async testConnection() {
    try {
      console.log('🧪 Testing database connection...');
      
      await this.connect();
      
      // Test basic queries
      const totalCustomers = await this.getTotalCustomers();
      console.log(`✅ Total customers: ${totalCustomers}`);
      
      const avgScore = await this.getAverageEngagementScore();
      console.log(`✅ Average engagement score: ${avgScore}`);
      
      const distribution = await this.getCustomerCountByEngagement();
      console.log('✅ Engagement distribution:');
      distribution.forEach(d => {
        console.log(`   ${d.engagement_level}: ${d.customer_count} customers`);
      });
      
      const schema = await this.getSchema();
      console.log(`✅ Database schema loaded: ${Object.keys(schema).length} tables`);
      
      await this.close();
      console.log('✅ Database test completed successfully');
      
      return true;
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      return false;
    }
  }
}

export default DatabaseManager;