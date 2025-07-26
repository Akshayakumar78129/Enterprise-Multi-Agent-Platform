import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * API handler for fetching subcategories by parent category
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  // Get category from query parameter
  const { category } = req.query;
  
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Category parameter is required' 
    });
  }

  try {
    // Open database connection in read-only mode
    const db = await open({
      filename: 'Sales/database/sales_agent.db',
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY,
    });

    // Query subcategories for the specified category
    const subcategories = await db.all(`
      SELECT DISTINCT "Item Subcategory Desc" as subcategory
      FROM "dbo_D_Item"
      WHERE "Item Category Desc" = ? 
        AND "Item Subcategory Desc" IS NOT NULL 
        AND "Item Subcategory Desc" != ''
      ORDER BY "Item Subcategory Desc"
    `, [category]);

    // Extract subcategory names
    const subcategoryList = subcategories.map(item => item.subcategory);

    // Close the database connection
    await db.close();

    return res.status(200).json(subcategoryList);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: (error as Error).message || 'An unexpected error occurred'
    });
  }
} 