const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class NextPurchaseService {
  async getDashboardSummary(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/next-purchase/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getPredictions(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/next-purchase/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async exportData(filters: Record<string, any> = {}, format: 'csv' | 'json' = 'csv') {
    const response = await fetch(`${API_BASE_URL}/next-purchase/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...filters, format }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return format === 'csv' ? response.text() : response.json();
  }
}

export const nextPurchaseService = new NextPurchaseService();