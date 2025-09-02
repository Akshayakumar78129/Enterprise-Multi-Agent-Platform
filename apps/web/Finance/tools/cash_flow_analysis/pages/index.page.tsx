import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with chart libraries
const CashFlowAnalysisDashboard = dynamic(
  () => import('../ui/views/CashFlowAnalysisDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a1224 0%, #0d1a2d 100%)',
        color: '#00e0ff',
        fontSize: '1.2rem',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(0, 224, 255, 0.1)',
          borderTop: '3px solid #00e0ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        Loading Cash Flow Analysis Dashboard...
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
);

export default function CashFlowAnalysisPage() {
  return <CashFlowAnalysisDashboard />;
}