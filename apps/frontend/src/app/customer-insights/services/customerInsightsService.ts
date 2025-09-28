const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class CustomerInsightsService {
  async getDashboardSummary(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/customer-insights/summary`, {
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

  async getEngagement(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/customer-insights/engagement`, {
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

  async getProfiles(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/customer-insights/profiles`, {
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
    const response = await fetch(`${API_BASE_URL}/customer-insights/export`, {
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

export const customerInsightsService = new CustomerInsightsService();