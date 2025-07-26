import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * API handler for fetching all product categories
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    // Open database connection in read-only mode
    const db = await open({
      filename: 'Sales/database/sales_agent.db',
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY,
    });

    // Query all distinct categories
    const categories = await db.all(`
      SELECT DISTINCT "Item Category Desc" as category
      FROM "dbo_D_Item"
      WHERE "Item Category Desc" IS NOT NULL AND "Item Category Desc" != ''
      ORDER BY "Item Category Desc"
    `);

    // Extract category names
    const categoryList = categories.map(item => item.category);

    // Close the database connection
    await db.close();

    return res.status(200).json(categoryList);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: (error as Error).message || 'An unexpected error occurred'
    });
  }
}