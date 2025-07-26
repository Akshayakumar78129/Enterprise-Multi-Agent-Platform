/**
 * React Hook for API Client Integration
 * Phase 6: Configuration & Deployment
 * 
 * Provides React-friendly API client with state management and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DomainApiClient, ApiError, ResponseValidator } from '../utils/api/ApiClient';

/**
 * Custom hook for API client with React state management
 * @param {Object} options Configuration options
 * @returns {Object} API client state and methods
 */
export function useApiClient(options = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  // Ref to maintain API client instance
  const apiClientRef = useRef(null);
  
  // Initialize API client
  useEffect(() => {
    const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    apiClientRef.current = new DomainApiClient(baseUrl);
  }, [options.baseUrl]);

  /**
   * Execute API call with state management
   * @param {Function} apiCall Function that returns a Promise
   * @param {Object} callOptions Options for the API call
   * @returns {Promise} API response
   */
  const executeCall = useCallback(async (apiCall, callOptions = {}) => {
    const {
      onSuccess,
      onError,
      clearPreviousData = true,
      skipLoading = false,
      transform
    } = callOptions;

    if (!skipLoading) {
      setIsLoading(true);
    }
    
    if (clearPreviousData) {
      setData(null);
    }
    
    setError(null);

    try {
      const response = await apiCall();
      
      // Transform data if transformer provided
      const processedData = transform ? transform(response) : response;
      
      setData(processedData);
      
      if (onSuccess) {
        onSuccess(processedData);
      }
      
      return processedData;
      
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError(
        err.message || 'An unexpected error occurred',
        'UNKNOWN_ERROR',
        500
      );
      
      setError(apiError);
      
      if (onError) {
        onError(apiError);
      } else {
        console.error('[useApiClient] API call failed:', apiError);
      }
      
      throw apiError;
      
    } finally {
      if (!skipLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Clear current state
   */
  const clearState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  /**
   * Clear API client cache
   * @param {string} pattern Optional pattern to match
   */
  const clearCache = useCallback((pattern) => {
    if (apiClientRef.current) {
      apiClientRef.current.clearCache(pattern);
    }
  }, []);

  return {
    // State
    isLoading,
    error,
    data,
    
    // API client instance
    apiClient: apiClientRef.current,
    
    // Methods
    executeCall,
    clearState,
    clearCache,
    
    // Convenience state checks
    hasError: !!error,
    hasData: !!data,
    isEmpty: !isLoading && !error && !data
  };
}

/**
 * Hook for transaction patterns data
 * @param {Object} initialFilters Initial filter values
 * @returns {Object} Transaction patterns state and methods
 */
export function useTransactionPatterns(initialFilters = {}) {
  const { isLoading, error, data, executeCall, clearState, apiClient } = useApiClient();
  
  const fetchTransactionPatterns = useCallback(async (filters = {}) => {
    const mergedFilters = { ...initialFilters, ...filters };
    
    return executeCall(
      () => apiClient.getTransactionPatterns(mergedFilters),
      {
        transform: (response) => {
          // Validate and extract transaction patterns data
          ResponseValidator.validateApiResponse(response);
          return response.data;
        }
      }
    );
  }, [apiClient, executeCall, initialFilters]);

  // Auto-fetch on mount if initial filters provided
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      fetchTransactionPatterns();
    }
  }, []); // Only run on mount

  return {
    isLoading,
    error,
    data,
    transactions: data?.transactions || [],
    kpis: data?.kpis || {},
    fetchTransactionPatterns,
    clearState
  };
}

/**
 * Hook for customer segmentation data
 * @param {Object} initialParams Initial parameters
 * @returns {Object} Customer segmentation state and methods
 */
export function useCustomerSegmentation(initialParams = {}) {
  const { isLoading, error, data, executeCall, clearState, apiClient } = useApiClient();
  
  const fetchCustomerSegmentation = useCallback(async (params = {}) => {
    const mergedParams = { ...initialParams, ...params };
    
    return executeCall(
      () => apiClient.getCustomerSegmentation(mergedParams),
      {
        transform: (response) => {
          ResponseValidator.validateApiResponse(response);
          return response.data;
        }
      }
    );
  }, [apiClient, executeCall, initialParams]);

  // Auto-fetch on mount if initial params provided
  useEffect(() => {
    if (Object.keys(initialParams).length > 0) {
      fetchCustomerSegmentation();
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    segments: data?.segment_data || [],
    kpis: data?.kpi_data || {},
    distribution: data?.segment_distribution || [],
    fetchCustomerSegmentation,
    clearState
  };
}

/**
 * Hook for churn prediction data
 * @param {Object} initialParams Initial parameters
 * @returns {Object} Churn prediction state and methods
 */
export function useChurnPrediction(initialParams = {}) {
  const { isLoading, error, data, executeCall, clearState, apiClient } = useApiClient();
  
  const fetchChurnPrediction = useCallback(async (params = {}) => {
    const mergedParams = { ...initialParams, ...params };
    
    return executeCall(
      () => apiClient.getChurnPrediction(mergedParams),
      {
        transform: (response) => {
          // Handle both old and new response formats
          if (response.status === 'success') {
            return response; // Old format
          } else {
            ResponseValidator.validateApiResponse(response);
            return response.data; // New format
          }
        }
      }
    );
  }, [apiClient, executeCall, initialParams]);

  // Auto-fetch on mount if initial params provided
  useEffect(() => {
    if (Object.keys(initialParams).length > 0) {
      fetchChurnPrediction();
    }
  }, []);

  return {
    isLoading,
    error,
    data,
    customers: data?.customers || [],
    probabilities: data?.probabilities || [],
    insights: data?.insights || [],
    fetchChurnPrediction,
    clearState
  };
}

/**
 * Hook for health checks
 * @param {Object} options Configuration options
 * @returns {Object} Health check state and methods
 */
export function useHealthCheck(options = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const { isLoading, error, data, executeCall, clearState, apiClient } = useApiClient();
  
  const checkHealth = useCallback(async () => {
    return executeCall(
      () => apiClient.healthCheck(),
      {
        skipLoading: true, // Don't show loading for health checks
        transform: (response) => response
      }
    );
  }, [apiClient, executeCall]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(checkHealth, refreshInterval);
      
      // Initial check
      checkHealth();
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, checkHealth]);

  return {
    isLoading,
    error,
    data,
    isHealthy: data?.status === 'healthy',
    checkHealth,
    clearState
  };
}

/**
 * Hook for managing multiple API calls
 * @returns {Object} Multi-call state and methods
 */
export function useMultipleApiCalls() {
  const [calls, setCalls] = useState(new Map());
  
  const addCall = useCallback((id, apiCallHook) => {
    setCalls(prev => new Map(prev.set(id, apiCallHook)));
  }, []);
  
  const removeCall = useCallback((id) => {
    setCalls(prev => {
      const newCalls = new Map(prev);
      newCalls.delete(id);
      return newCalls;
    });
  }, []);
  
  const clearAllCalls = useCallback(() => {
    setCalls(new Map());
  }, []);
  
  // Aggregate states
  const isAnyLoading = Array.from(calls.values()).some(call => call.isLoading);
  const hasAnyError = Array.from(calls.values()).some(call => call.error);
  const allErrors = Array.from(calls.values())
    .map(call => call.error)
    .filter(Boolean);
  
  return {
    calls: Object.fromEntries(calls),
    addCall,
    removeCall,
    clearAllCalls,
    isAnyLoading,
    hasAnyError,
    allErrors
  };
}