// Database Factory - Selects appropriate adapter based on environment
import { DatabaseAdapter } from './database.adapter';
import { PostgreSQLAdapter } from './postgres.adapter';
import { SQLiteAdapter } from './sqlite.adapter';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseFactory {
  private static adapter: DatabaseAdapter | null = null;

  static async getAdapter(): Promise<DatabaseAdapter> {
    if (!this.adapter) {
      await this.initializeAdapter();
    }
    return this.adapter!;
  }

  private static async initializeAdapter(): Promise<void> {
    const dbMode = process.env.DB_MODE || 'postgres';

    console.log(`Initializing database adapter: ${dbMode}`);

    switch (dbMode.toLowerCase()) {
      case 'sqlite':
      case 'local':
        this.adapter = new SQLiteAdapter();
        break;
      case 'postgres':
      case 'postgresql':
      default:
        this.adapter = new PostgreSQLAdapter();
        break;
    }

    await this.adapter.connect();
    await this.adapter.testConnection();
  }

  static async shutdown(): Promise<void> {
    if (this.adapter) {
      await this.adapter.disconnect();
      this.adapter = null;
    }
  }

  // Maintain backward compatibility
  static async query(text: string, values?: any[]) {
    const adapter = await this.getAdapter();
    return adapter.query(text, values);
  }
}

// Export a singleton instance for backward compatibility
export const database = DatabaseFactory;