import React from 'react';

interface KpiTileProps {
  title: string;
  value: string | number;
  unit?: string; // Optional unit like 'days', '%', '$'
  description?: string; // For lines like "Top Churn Factor"
}

const KpiTile: React.FC<KpiTileProps> = ({ title, value, unit, description }) => {
  return (
    <div style={{
      backgroundColor: '#1F2937', // Darker grey, similar to Churn KPI tiles
      padding: '20px',
      borderRadius: '8px',
      color: '#F9FAFB', 
      textAlign: 'center',
      width: '190px', // Adjusted width
      height: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      // boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // More subtle shadow or none
      border: '1px solid #374151', // Subtle border
    }}>
      <div style={{
        fontSize: '2.75rem', // Larger value font size
        fontWeight: 700,
        color: '#FFFFFF',
        lineHeight: 1,
        marginBottom: description ? '4px' : '10px',
      }}>
        {value}<span style={{ fontSize: '1.5rem', fontWeight: 600, opacity: 0.9, marginLeft: unit ==='%' ? '2px' : '5px' }}>{unit}</span>
      </div>
      {description ? (
         <h3 style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: '#9CA3AF',
          margin: 0,
          textTransform: 'none',
          lineHeight: 1.2,
        }}>
          {description}
        </h3>
      ) : (
        <h3 style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#9CA3AF', // Lighter grey for title
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {title}
        </h3>
      )}
    </div>
  );
};

export default KpiTile; 