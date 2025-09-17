// Database Adapter Interface
export interface DatabaseResult {
  rows: any[];
  rowCount?: number;
  command?: string;
}

export interface DatabaseAdapter {
  query(text: string, values?: any[]): Promise<DatabaseResult>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  testConnection(): Promise<void>;
}

export interface QueryConfig {
  text: string;
  values?: any[];
}