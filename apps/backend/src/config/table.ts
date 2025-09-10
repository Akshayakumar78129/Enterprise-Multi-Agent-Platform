import { Pool } from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  ssl: process.env.SSL_MODE === "disable" ? false : { rejectUnauthorized: false },
});

async function checkDb() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map((r) => r.table_name);

    const result: any = {};

    for (const table of tables) {
      console.log(`Inspecting table: ${table}`);

      const columnsRes = await pool.query(
        `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `,
        [table]
      );

      let sampleRows: any[] = [];
      try {
        const sampleRes = await pool.query(
          `SELECT * FROM public."${table}" LIMIT 5;`
        );
        sampleRows = sampleRes.rows;
      } catch (err) {
        console.warn(`Could not fetch rows from ${table}:`, (err as Error).message);
      }

      result[table] = {
        columns: columnsRes.rows,
        sample: sampleRows,
      };
    }

    fs.writeFileSync("db_inspection.json", JSON.stringify(result, null, 2));
    console.log("Saved full schema + samples to db_inspection.json");

    await pool.end();
  } catch (err) {
    console.error("Error while inspecting DB:", err);
    await pool.end();
  }
}

checkDb();
