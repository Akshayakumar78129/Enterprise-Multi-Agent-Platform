import { ProductAnalysisResult } from '../types';

/**
 * API client for ProductPerformanceAnalyzer
 * This service connects to the backend API which interfaces with the actual database
 */
export const productPerformanceApi = {
  /**
   * Fetch product performance data from the backend
   */
  async fetchProductPerformance(params: {
    start_date: string;
    end_date: string;
    metrics: string[];
    category_level: string;
    min_sales_threshold: number | null;
    time_granularity: string;
  }): Promise<ProductAnalysisResult> {
    try {
      const response = await fetch('/api/sales/product-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch product performance data');
      }

      const data: ProductAnalysisResult = await response.json();
      
      // Only return the actual analysis results, not the logging messages
      if (data.status === 'success') {
        return {
          status: 'success',
          period: data.period,
          results: data.results
        };
      } else {
        return {
          status: 'error',
          message: data.message
        };
      }
    } catch (error) {
      console.error('Error fetching product performance data:', error);
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  },

  /**
   * Fetch available categories from the backend
   */
  async fetchCategories(): Promise<string[]> {
    try {
      const response = await fetch('/api/sales/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  /**
   * Fetch subcategories for a specific category
   */
  async fetchSubcategories(category: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/sales/subcategories?category=${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subcategories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      return [];
    }
  },
};

export default productPerformanceApi; 