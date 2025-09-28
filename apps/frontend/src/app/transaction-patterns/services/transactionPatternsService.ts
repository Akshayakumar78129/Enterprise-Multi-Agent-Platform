const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class TransactionPatternsService {
  async getDashboardSummary(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/transaction-patterns/summary`, {
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

  async getPatternAnalysis(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/transaction-patterns/pattern-analysis`, {
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

  async getTimePatterns(filters: Record<string, any> = {}) {
    const response = await fetch(`${API_BASE_URL}/transaction-patterns/time-patterns`, {
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
    const response = await fetch(`${API_BASE_URL}/transaction-patterns/export`, {
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

export const transactionPatternsService = new TransactionPatternsService();