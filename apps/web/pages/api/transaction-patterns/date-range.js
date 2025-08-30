import { getDateRange } from '../../../Customer/tools/transaction_patterns/api/internal-date-range';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dateRange = await getDateRange();
    return res.status(200).json(dateRange);
  } catch (error) {
    console.error('Error fetching date range:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch date range',
      message: error.message 
    });
  }
}