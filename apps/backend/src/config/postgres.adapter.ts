// PostgreSQL Database Adapter
import { Pool } from "pg";
import { DatabaseAdapter, DatabaseResult } from './database.adapter';
import { pool } from './db';

export class PostgreSQLAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor() {
    // Use existing pool from db.ts
    this.pool = pool;
  }

  async connect(): Promise<void> {
    // Pool connects automatically when first query is made
    console.log('PostgreSQL adapter initialized');
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('PostgreSQL connection pool closed');
  }

  async query(text: string, values?: any[]): Promise<DatabaseResult> {
    const result = await this.pool.query(text, values);

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command
    };
  }

  async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const res = await client.query('SELECT NOW()');
      console.log('✅ PostgreSQL database connected at:', res.rows[0].now);
      client.release();
    } catch (err) {
      console.error('❌ PostgreSQL database connection error:', err);
      throw err;
    }
  }
}