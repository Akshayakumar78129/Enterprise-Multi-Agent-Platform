import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error but don't crash the app
    console.warn('ErrorBoundary caught an error:', error.message);
    console.warn('Error details:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#0a1224',
          border: '1px solid #3a4459',
          borderRadius: '8px',
          color: '#f7f9fb',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#00e0ff', marginBottom: '10px' }}>
            ⚠️ Loading Issue
          </h3>
          <p style={{ marginBottom: '15px' }}>
            There was a temporary issue loading this component.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#00e0ff',
              color: '#0a1224',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;