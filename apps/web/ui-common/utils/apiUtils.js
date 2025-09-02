/**
 * Utility functions for API calls with proper error handling
 */

/**
 * Enhanced fetch with better error handling for JSON responses
 * @param {string} url - The API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - The JSON response data
 */
export async function fetchWithErrorHandling(url, options = {}) {
    try {
      console.log(`🔍 API Call: ${options.method || 'GET'} ${url}`);
      if (options.body) {
        console.log(`📤 Request payload:`, JSON.parse(options.body));
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
  
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error (${response.status}):`, errorText.substring(0, 500));
        
        // Check if it's an HTML error page
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error(`Server error: ${response.status} ${response.statusText}. The API endpoint may not exist or there's a server configuration issue.`);
        }
        
        // Try to parse as JSON to get more specific error
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            throw new Error(`API Error: ${errorJson.error}`);
          }
        } catch (parseError) {
          // Not JSON, use original error text
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorText.substring(0, 200)}`);
      }
  
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response received:', text.substring(0, 200));
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error('Server returned an HTML page instead of JSON. The API endpoint may not exist or there\'s a routing issue.');
        }
        
        throw new Error('Server returned non-JSON response. Check server logs.');
      }
  
      const data = await response.json();
      console.log(`✅ API Success: ${url}`, Object.keys(data));
      
      return data;
    } catch (error) {
      console.error(`❌ API Call Failed: ${url}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch data with fallback to multiple endpoints
   * @param {string[]} urls - Array of URLs to try in order
   * @param {object} options - Fetch options
   * @returns {Promise<any>} - The JSON response data
   */
  export async function fetchWithFallback(urls, options = {}) {
    let lastError;
    
    for (let i = 0; i < urls.length; i++) {
      try {
        const data = await fetchWithErrorHandling(urls[i], options);
        
        // Handle internal API response format
        if (data.success && data.data) {
          return data.data;
        }
        
        return data;
      } catch (error) {
        lastError = error;
        console.log(`⚠️ Endpoint ${urls[i]} failed, trying next...`);
        
        // If this is the last URL, throw the error
        if (i === urls.length - 1) {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Create a standardized API call for dashboard tools
   * @param {string} toolName - Name of the tool (e.g., 'transaction-patterns', 'purchase-frequency')
   * @param {object} payload - Request payload
   * @param {object} options - Additional options
   * @returns {Promise<any>} - The response data
   */
  export async function callDashboardAPI(toolName, payload = {}, options = {}) {
    // For now, use only the original API endpoints that we know exist
    const url = `/api/${toolName}/data`;
    
    const fetchOptions = {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    };
    
    try {
      const data = await fetchWithErrorHandling(url, fetchOptions);
      
      // Handle different response formats
      if (data && typeof data === 'object') {
        // If it has a success field and data field, extract the data
        if (data.success && data.data) {
          return data.data;
        }
        // Otherwise return the data as-is
        return data;
      }
      
      return data;
    } catch (error) {
      console.error(`Dashboard API call failed for ${toolName}:`, error);
      throw error;
    }
  }
  
  /**
   * Handle common API errors with user-friendly messages
   * @param {Error} error - The error object
   * @returns {string} - User-friendly error message
   */
  export function getErrorMessage(error) {
    if (error.message.includes('<!DOCTYPE')) {
      return 'The server is not responding correctly. Please check if the server is running and try again.';
    }
    
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('404')) {
      return 'The requested data endpoint was not found. Please contact support.';
    }
    
    if (error.message.includes('500')) {
      return 'There was a server error. Please try again later or contact support.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  }