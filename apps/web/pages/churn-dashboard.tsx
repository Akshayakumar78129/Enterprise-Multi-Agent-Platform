import { useEffect } from 'react';
import { useRouter } from 'next/router';

// REDIRECT TO THE MAIN CHURN PAGE
// This page is deprecated - all functionality has been consolidated into /customers/churn
export default function ChurnDashboard() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the main churn page which has all features including:
    // - EnhancedContextAwareChatbot with shift-click support
    // - All visualization components
    // - Clean selected points display
    // - Working shift-click to chatbot integration
    router.replace('/customers/churn');
  }, [router]);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
      color: '#f7f9fb',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(0, 224, 255, 0.3)',
          borderRadius: '50%',
          borderTop: '4px solid #00e0ff',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div>Redirecting to Churn Intelligence Dashboard...</div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}