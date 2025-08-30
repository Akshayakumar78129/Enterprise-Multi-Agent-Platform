// Customer segment mappings endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return empty mappings for now - will be populated from database
    const mappings = {
      customerSegments: {},
      categoryMappings: {},
      lastUpdated: new Date().toISOString()
    };
    
    return res.status(200).json(mappings);
  } catch (error) {
    console.error('Error fetching mappings:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch mappings',
      message: error.message 
    });
  }
}