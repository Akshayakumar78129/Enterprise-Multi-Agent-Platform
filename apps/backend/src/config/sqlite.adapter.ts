// SQLite Database Adapter
const sqlite3 = require('sqlite3').verbose();
import path from 'path';
import { DatabaseAdapter, DatabaseResult } from './database.adapter';
import { churnSchema } from '../domains/churn-prediction/churnPrediction.schema';

export class SQLiteAdapter implements DatabaseAdapter {
  private databases: Map<string, sqlite3.Database> = new Map();
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '..', 'db');
  }

  async connect(): Promise<void> {
    // Initialize all SQLite databases
    const dbFiles = {
      customers: path.join(this.dbPath, 'customers.db'),
      sales: path.join(this.dbPath, 'sales_agent.db'),
      financial: path.join(this.dbPath, 'financial_agent.db'),
      inventory: path.join(this.dbPath, 'inventory.db')
    };

    for (const [name, filePath] of Object.entries(dbFiles)) {
      await new Promise<void>((resolve, reject) => {
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            console.error(`Failed to connect to ${name} database:`, err);
            reject(err);
          } else {
            console.log(` Connected to ${name} SQLite database`);
            this.databases.set(name, db);
            resolve();
          }
        });
      });
    }
  }

  async disconnect(): Promise<void> {
    for (const [name, db] of this.databases) {
      await new Promise<void>((resolve, reject) => {
        db.close((err) => {
          if (err) {
            console.error(`Error closing ${name} database:`, err);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    this.databases.clear();
  }

  async query(text: string, values?: any[]): Promise<DatabaseResult> {
    // Convert PostgreSQL query to SQLite format
    const sqliteQuery = this.convertToSQLiteFormat(text, values);

    // Determine which database to use based on the CONVERTED query
    // because table names are now in SQLite format
    const db = this.selectDatabase(sqliteQuery.text);

    if (!db) {
      console.error('Failed to select database for query:', sqliteQuery.text.substring(0, 200));
      console.error('Original query was:', text.substring(0, 200));
      throw new Error('Unable to determine database from query');
    }

    // Log for debugging
    if (text.includes('customer')) {
      console.log('Converting customer query...');
      console.log('Original:', text.substring(0, 150));
      console.log('Converted:', sqliteQuery.text.substring(0, 150));
    }

    return new Promise((resolve, reject) => {
      db.all(sqliteQuery.text, sqliteQuery.values || [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            rows: rows || [],
            rowCount: rows ? rows.length : 0,
            command: 'SELECT'
          });
        }
      });
    });
  }

  async testConnection(): Promise<void> {
    console.log('Testing SQLite database connections...');

    // Test each database with a simple query
    for (const [name, db] of this.databases) {
      await new Promise<void>((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1", (err, row) => {
          if (err) {
            console.error(`❌ ${name} database test failed:`, err);
            reject(err);
          } else {
            console.log(`✅ ${name} database test successful`);
            resolve();
          }
        });
      });
    }
  }

  private selectDatabase(query: string): sqlite3.Database | null {
    const queryLower = query.toLowerCase();
    const { tables } = churnSchema;

    // Check for Customer Loyalty table (in customers.db)
    if (queryLower.includes(tables.loyalty.toLowerCase()) ||
        queryLower.includes('"entity key"') ||
        queryLower.includes('"loyalty status"') ||
        queryLower.includes('"rfm score"')) {
      return this.databases.get('customers');
    }

    // Check for Sales Transaction and Customer tables (in sales database - sales_agent.db)
    if (queryLower.includes(tables.customer.toLowerCase()) ||
        queryLower.includes(tables.transaction.toLowerCase()) ||
        queryLower.includes('dbo_f_ar_detail') ||
        queryLower.includes('"customer key"') ||
        queryLower.includes('"sales txn key"') ||
        queryLower.includes('"txn date"') ||
        queryLower.includes('"customer name"') ||
        queryLower.includes('"customer type desc"')) {
      return this.databases.get('sales');
    }

    // Financial database tables
    if (queryLower.includes('financial_') || queryLower.includes('accounting_')) {
      return this.databases.get('financial');
    }

    // Inventory database tables
    if (queryLower.includes('inventory_') || queryLower.includes('stock_')) {
      return this.databases.get('inventory');
    }

    // Default to sales database as that's where most of our tables are
    return this.databases.get('sales');
  }

  private convertToSQLiteFormat(text: string, values?: any[]): { text: string; values?: any[] } {
    let sqliteQuery = text;
    const { tables } = churnSchema;

    // Remove schema prefixes (public.)
    sqliteQuery = sqliteQuery.replace(/public\./gi, '');

    // Table names are already correct from schema (dbo_D_Customer, etc.)
    // No conversion needed as we're using the schema constants

    // The queries already have quoted column names like c."Customer Key"
    // We don't need to convert them again, they're already in the correct format
    // Just ensure the filter engine generated conditions are also properly formatted

    // Handle filter engine column references that might not be quoted
    // Only replace if they're not already quoted
    if (sqliteQuery.includes(' AND t."Txn Date"') === false && sqliteQuery.includes('t.txn_date')) {
      sqliteQuery = sqliteQuery.replace(/\bt\.txn_date\b/gi, 't."Txn Date"');
    }
    if (sqliteQuery.includes(' AND c."Customer Type Desc"') === false && sqliteQuery.includes('c.customer_type_desc')) {
      sqliteQuery = sqliteQuery.replace(/\bc\.customer_type_desc\b/gi, 'c."Customer Type Desc"');
    }
    if (sqliteQuery.includes(' AND cl."Loyalty Status"') === false && sqliteQuery.includes('cl.loyalty_status')) {
      sqliteQuery = sqliteQuery.replace(/\bcl\.loyalty_status\b/gi, 'cl."Loyalty Status"');
    }

    // Convert PostgreSQL parameter placeholders ($1, $2, etc.) to SQLite (?)
    if (values && values.length > 0) {
      for (let i = values.length; i > 0; i--) {
        sqliteQuery = sqliteQuery.replace(new RegExp(`\\$${i}`, 'g'), '?');
      }
    }

    return { text: sqliteQuery, values };
  }
}