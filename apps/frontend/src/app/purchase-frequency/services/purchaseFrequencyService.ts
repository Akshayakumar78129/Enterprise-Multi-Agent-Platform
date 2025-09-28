const API_BASE_URL = '/api';

class PurchaseFrequencyService {
  async getDashboardSummary(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/purchase-frequency/summary`, {
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
    const response = await fetch(`${API_BASE_URL}/purchase-frequency/export`, {
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

export const purchaseFrequencyService = new PurchaseFrequencyService();