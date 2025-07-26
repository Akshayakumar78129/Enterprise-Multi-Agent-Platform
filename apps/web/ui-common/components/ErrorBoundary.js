/**
 * Error Boundary Component
 * Phase 6: Configuration & Deployment
 * 
 * Provides error boundaries for API calls and React component errors
 */

import React from 'react';

/**
 * API Error Display Component
 * Displays user-friendly error messages for API failures
 */
export function ApiErrorDisplay({ error, onRetry, className = '' }) {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (error.status >= 500) {
      return 'We\'re experiencing technical difficulties. Please try again later.';
    } else if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    } else if (error.status === 403) {
      return 'You don\'t have permission to access this resource.';
    } else if (error.status === 404) {
      return 'The requested resource was not found.';
    } else if (error.code === 'NETWORK_ERROR') {
      return 'Network connection error. Please check your internet connection.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  };

  const getErrorIcon = (error) => {
    if (error.status >= 500) {
      return '⚠️';
    } else if (error.status === 401 || error.status === 403) {
      return '🔒';
    } else if (error.status === 404) {
      return '🔍';
    } else if (error.code === 'NETWORK_ERROR') {
      return '🌐';
    } else {
      return '❌';
    }
  };

  return (
    <div className={`api-error-display ${className}`}>
      <div className="error-content">
        <div className="error-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {getErrorIcon(error)}
        </div>
        
        <h3 className="error-title" style={{ color: '#dc3545', marginBottom: '0.5rem' }}>
          Something went wrong
        </h3>
        
        <p className="error-message" style={{ color: '#6c757d', marginBottom: '1rem' }}>
          {getErrorMessage(error)}
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details" style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: '#007bff' }}>
              Technical Details
            </summary>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '1rem', 
              borderRadius: '4px',
              fontSize: '0.875rem',
              overflow: 'auto',
              marginTop: '0.5rem'
            }}>
              {JSON.stringify({
                message: error.message,
                code: error.code,
                status: error.status,
                details: error.details
              }, null, 2)}
            </pre>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="retry-button"
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 * Displays loading state for API calls
 */
export function LoadingSpinner({ message = 'Loading...', size = 'medium', className = '' }) {
  const sizeClasses = {
    small: { width: '20px', height: '20px' },
    medium: { width: '40px', height: '40px' },
    large: { width: '60px', height: '60px' }
  };

  const spinnerStyle = {
    ...sizeClasses[size],
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  };

  return (
    <div className={`loading-spinner ${className}`} style={{ textAlign: 'center', padding: '2rem' }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={spinnerStyle}></div>
      
      {message && (
        <p style={{ marginTop: '1rem', color: '#6c757d' }}>
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optional: Report to error tracking service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary" style={{ 
          padding: '2rem', 
          textAlign: 'center',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            🚫 Something went wrong
          </h2>
          
          <p style={{ marginBottom: '1rem' }}>
            {this.props.message || 'An unexpected error occurred in this component.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <pre style={{ 
                background: 'white', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * API Call Wrapper Component
 * Combines loading, error, and success states for API calls
 */
export function ApiCallWrapper({ 
  isLoading, 
  error, 
  data, 
  onRetry,
  loadingMessage,
  emptyMessage = 'No data available',
  children,
  className = ''
}) {
  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} className={className} />;
  }

  if (error) {
    return (
      <ApiErrorDisplay 
        error={error} 
        onRetry={onRetry} 
        className={className}
      />
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={`empty-state ${className}`} style={{ 
        textAlign: 'center', 
        padding: '2rem',
        color: '#6c757d'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

/**
 * Higher-Order Component for Error Boundary
 * Wraps any component with error boundary
 */
export function withErrorBoundary(Component, errorBoundaryProps = {}) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Hook for error reporting
 * Provides error reporting functionality
 */
export function useErrorReporting() {
  const reportError = React.useCallback((error, context = {}) => {
    console.error('[ErrorReporting]', error, context);
    
    // Optional: Send to error tracking service
    if (process.env.NEXT_PUBLIC_ERROR_REPORTING_URL) {
      fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(err => {
        console.error('Failed to report error:', err);
      });
    }
  }, []);

  return { reportError };
}