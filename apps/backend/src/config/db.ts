// src/config/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  ssl: process.env.SSL_MODE === "disable" ? false : { rejectUnauthorized: false },
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("✅ Database connected at:", res.rows[0].now);
    client.release();
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
}
