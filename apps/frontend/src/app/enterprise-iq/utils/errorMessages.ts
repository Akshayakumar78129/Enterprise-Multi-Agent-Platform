/**
 * User-friendly error messages
 * Converts technical errors to human-readable messages
 */

export interface FriendlyError {
  title: string;
  message: string;
  suggestion?: string;
}

/**
 * Convert technical error to user-friendly message
 */
export function getFriendlyErrorMessage(error: Error | string): FriendlyError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorLower = errorMessage.toLowerCase();

  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('aborted')) {
    return {
      title: 'Request Timed Out',
      message: 'The analysis is taking longer than expected to complete.',
      suggestion: 'Please try again with a smaller date range or fewer filters.'
    };
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch failed')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server.',
      suggestion: 'Please check your internet connection and try again.'
    };
  }

  // Session errors
  if (errorLower.includes('session not found')) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired or is no longer valid.',
      suggestion: 'Please refresh the page to start a new session.'
    };
  }

  // Data errors
  if (errorLower.includes('no data') || errorLower.includes('empty')) {
    return {
      title: 'No Data Available',
      message: 'No data found for the selected filters.',
      suggestion: 'Try adjusting your filters or selecting a different time period.'
    };
  }

  // API errors
  if (errorLower.includes('http 500') || errorLower.includes('internal server error')) {
    return {
      title: 'Server Error',
      message: 'An unexpected error occurred on the server.',
      suggestion: 'Our team has been notified. Please try again in a few moments.'
    };
  }

  if (errorLower.includes('http 404')) {
    return {
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      suggestion: 'Please check your request and try again.'
    };
  }

  if (errorLower.includes('http 401') || errorLower.includes('unauthorized')) {
    return {
      title: 'Unauthorized',
      message: 'You do not have permission to access this resource.',
      suggestion: 'Please log in or contact your administrator.'
    };
  }

  // ML/AI specific errors
  if (errorLower.includes('model') || errorLower.includes('prediction')) {
    return {
      title: 'Analysis Error',
      message: 'Unable to complete the analysis.',
      suggestion: 'Please try again with different parameters.'
    };
  }

  // Database errors
  if (errorLower.includes('database') || errorLower.includes('query')) {
    return {
      title: 'Data Access Error',
      message: 'Unable to retrieve data from the database.',
      suggestion: 'Please try again in a few moments.'
    };
  }

  // Generic fallback
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred while processing your request.',
    suggestion: 'Please try again. If the problem persists, contact support.'
  };
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: Error | string): string {
  const friendly = getFriendlyErrorMessage(error);

  let message = `${friendly.title}: ${friendly.message}`;
  if (friendly.suggestion) {
    message += ` ${friendly.suggestion}`;
  }

  return message;
}

/**
 * Get short error message (title only)
 */
export function getShortErrorMessage(error: Error | string): string {
  const friendly = getFriendlyErrorMessage(error);
  return friendly.title;
}
