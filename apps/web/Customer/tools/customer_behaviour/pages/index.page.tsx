import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '../../../../ui-common/design-system/theme'; // Adjust path as needed
import PatternRadarChart from '../ui/components/visualizations/PatternRadarChart';
import PatternIntervalHistogram from '../ui/components/visualizations/PatternIntervalHistogram';
import CategoryTreemap from '../ui/components/visualizations/CategoryTreemap';
import ChannelDonutChart from '../ui/components/visualizations/ChannelDonutChart';

// Placeholder component for missing visualizations or controls
const PlaceholderComponent = ({ name, width, height }: { name: string, width?: string | number, height?: string | number }) => (
  <div style={{
    border: '1px dashed #4A5568', // Using a theme-friendly border color
    padding: '20px',
    margin: '10px',
    width: width || '100%',
    height: height || '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3748', // Darker background for placeholder
    borderRadius: '8px',
    color: '#A0AEC0', // Lighter text for placeholder
    textAlign: 'center',
    boxSizing: 'border-box'
  }}>
    <p style={{ margin: 0, fontSize: '0.9rem' }}>{name}</p>
    {width && height && <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#718096' }}>Spec Dim: {width} × {height}</p>}
  </div>
);

const CustomerBehaviourDashboardPage = () => {
  const [behaviourData, setBehaviourData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/customer-behaviour/data');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.status === 'success' && data.patterns) {
          setBehaviourData(data);
        } else {
          throw new Error('Fetched data is not in the expected format.');
        }
      } catch (e: any) {
        setError(e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#1A202C', // Slightly lighter than page background for sections
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    color: '#E2E8F0',
    marginBottom: '15px',
    borderBottom: '1px solid #2D3748',
    paddingBottom: '10px',
  };

  const componentContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    alignItems: 'flex-start',
  };
  
  const chartWrapperStyle: React.CSSProperties = {
    backgroundColor: '#2D3748', 
    padding: '15px', 
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0F172A', color: '#E2E8F0' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0F172A', color: 'red' }}>Error loading dashboard: {error}</div>;
  }

  if (!behaviourData || !behaviourData.patterns) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0F172A', color: '#E2E8F0' }}>No data available to display.</div>;
  }
  
  const patterns = behaviourData.patterns;

  return (
    <ThemeProvider>
      <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0', padding: '20px', minHeight: '100vh' }}>
        <header style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #2D3748' }}>
          <h1 style={{ fontSize: '2.25rem', color: '#F8FAFC', margin: 0 }}>Customer Behaviour Dashboard</h1>
        </header>

        {/* Section 4.5: KPI Tiles Row - Placeholder */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Key Performance Indicators</h2>
          <div style={componentContainerStyle}>
            <PlaceholderComponent name="Average Purchase Interval (KPI)" width="120px" height="120px" />
            <PlaceholderComponent name="Average Order Value (KPI)" width="120px" height="120px" />
            <PlaceholderComponent name="Category Diversity (KPI)" width="120px" height="120px" />
            <PlaceholderComponent name="Channel Mix (KPI)" width="120px" height="120px" />
            <PlaceholderComponent name="Churn Risk (KPI)" width="120px" height="120px" />
          </div>
        </section>

        {/* Section 4.1: Purchase Pattern Explorer */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Purchase Pattern Explorer</h2>
          <div style={componentContainerStyle}>
            <div style={{...chartWrapperStyle, flexBasis: '680px', minHeight:'420px'}}>
              <PatternRadarChart patterns={patterns} width={680} height={420} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: '300px'}}>
              <div style={{...chartWrapperStyle, flex: 1}}>
                <PatternIntervalHistogram patterns={patterns} />
              </div>
              <PlaceholderComponent name="Spend pattern breakdown (Donut Chart)" height="200px" />
            </div>
          </div>
          <div style={{...componentContainerStyle, marginTop: '20px'}}>
            <PlaceholderComponent name="Time period selector" height="80px" width="calc(50% - 10px)" />
            <PlaceholderComponent name="Segment filter" height="80px" width="calc(50% - 10px)" />
          </div>
        </section>

        {/* Section 4.2: Product Preference Analyzer */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Product Preference Analyzer</h2>
          <div style={componentContainerStyle}>
            <div style={{...chartWrapperStyle, flexBasis: '720px', minHeight:'520px'}}>
              {/* This will show the adapted Customer Avg. Order Value Treemap for now */}
              <CategoryTreemap categories={patterns} width={720} height={520} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: '300px'}}>
              <PlaceholderComponent name="Affinity network" height="300px" />
              <PlaceholderComponent name="Category spend distribution (Bar Chart)" height="200px" />
            </div>
          </div>
           <div style={{...componentContainerStyle, marginTop: '20px'}}>
            <PlaceholderComponent name="Insights panel" height="150px" width="calc(60% - 10px)" />
            <PlaceholderComponent name="Category filter" height="150px" width="calc(40% - 10px)" />
          </div>
        </section>

        {/* Section 4.3: Channel Usage Visualizer */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Channel Usage Visualizer</h2>
          <div style={componentContainerStyle}>
            <div style={{...chartWrapperStyle, flexBasis: '300px', minHeight:'300px', display:'flex', alignItems:'center', justifyContent:'center'}}>
              {/* This will show the adapted Customer Churn Risk Donut for now */}
              <ChannelDonutChart channels={patterns} width={250} height={250} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minWidth: '300px'}}>
              <PlaceholderComponent name="Channel journey sankey" height="280px" />
              <PlaceholderComponent name="Cross-channel matrix" height="300px" />
            </div>
          </div>
          <div style={{...componentContainerStyle, marginTop: '20px'}}>
             <PlaceholderComponent name="Channel metrics panel" height="150px" width="calc(60% - 10px)" />
             <PlaceholderComponent name="Time-based view toggle" height="150px" width="calc(40% - 10px)" />
          </div>
        </section>

        {/* Section 4.4: Engagement Level Matrix - Placeholder */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Engagement Level Matrix</h2>
          <div style={componentContainerStyle}>
            <PlaceholderComponent name="Engagement quadrant plot" width="760px" height="540px" />
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', flex: 1}}>
              <PlaceholderComponent name="Recency histogram (side panel)" height="400px"/>
              <PlaceholderComponent name="Engagement metrics summary" />
            </div>
      </div>
          <PlaceholderComponent name="Frequency histogram (top panel)" width="100%" height="160px" />
          <PlaceholderComponent name="Segment selector" width="100%" height="80px" />
        </section>
        
        {/* Add other sections like Temporal Behaviour Pattern and Customer Cohort Comparison as placeholders if needed */}

      </div>
    </ThemeProvider>
  );
};

export default CustomerBehaviourDashboardPage; 