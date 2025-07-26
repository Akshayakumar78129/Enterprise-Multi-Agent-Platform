import React, { useState, useMemo } from 'react';
import { Card } from '../../../../../../ui-common/design-system/components/Card';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const GeographicValueMap = ({ 
  data = [], 
  isLoading = false,
  onRegionClick = null 
}) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [valueFilter, setValueFilter] = useState([0, 50000]);
  const [isNormalized, setIsNormalized] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState(['All']);

  const regionalData = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    // Data is already regional aggregates from the API
    const regionMap = {};
    data.forEach(regionData => {
      const region = regionData.region || 'Unknown';
      regionMap[region] = {
        customerCount: regionData.customer_count || 0,
        totalValue: regionData.total_ltv || regionData.region_ltv || 0,
        avgValue: regionData.avg_ltv || 0,
        totalRevenue: regionData.total_revenue || 0,
        avgRevenue: regionData.avg_customer_revenue || 0
      };
    });

    return regionMap;
  }, [data]);

  const mapData = useMemo(() => {
    const regions = Object.keys(regionalData);
    const values = regions.map(region => regionalData[region].avgValue);
    const maxValue = Math.max(...values);
    
    return {
      type: 'choropleth',
      locations: regions,
      z: isNormalized ? values.map(v => v / maxValue * 100) : values,
      text: regions.map(region => {
        const data = regionalData[region];
        return `${region}<br>Avg LTV: $${data.avgValue.toLocaleString()}<br>Customers: ${data.customerCount}`;
      }),
      hovertemplate: '%{text}<extra></extra>',
      colorscale: [
        [0, '#0a1224'],      // Midnight Navy
        [0.3, '#3e7b97'],    // Blue-gray
        [0.7, '#00e0ff'],    // Electric Cyan
        [1, '#e930ff']       // Signal Magenta
      ],
      showscale: true,
      colorbar: {
        title: isNormalized ? 'Value Index' : 'Avg LTV ($)',
        titlefont: { color: '#f7f9fb', size: 12 },
        tickfont: { color: '#f7f9fb', size: 10 }
      }
    };
  }, [regionalData, isNormalized]);

  const handleRegionClick = (event) => {
    if (event.points && event.points.length > 0) {
      const region = event.points[0].location;
      setSelectedRegion(region);
      if (onRegionClick) {
        onRegionClick(region, regionalData[region]);
      }
    }
  };

  const filteredData = useMemo(() => {
    return Object.keys(regionalData)
      .filter(region => {
        const avgValue = regionalData[region].avgValue;
        return avgValue >= valueFilter[0] && avgValue <= valueFilter[1];
      })
      .reduce((acc, region) => {
        acc[region] = regionalData[region];
        return acc;
      }, {});
  }, [regionalData, valueFilter]);

  if (!data || data.length === 0) {
    return (
      <Card title="Geographic Value Map" isLoading={isLoading}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '520px',
          color: '#5891cb'
        }}>
          No geographic data available
        </div>
      </Card>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#232a36', 
      borderRadius: '16px', 
      padding: '20px',
      height: '520px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: '#f7f9fb'
        }}>
          Geographic Value Distribution
        </h3>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Normalized Toggle */}
          <button
            onClick={() => setIsNormalized(!isNormalized)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: isNormalized ? '#00e0ff' : 'transparent',
              color: isNormalized ? '#0a1224' : '#f7f9fb',
              cursor: 'pointer',
              fontSize: '12px',
              border: `1px solid ${isNormalized ? '#00e0ff' : '#3a4459'}`
            }}
          >
            {isNormalized ? 'Indexed' : 'Absolute'}
          </button>
          
          {/* Value Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#f7f9fb' }}>Filter:</span>
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={valueFilter[0]}
              onChange={(e) => setValueFilter([parseInt(e.target.value), valueFilter[1]])}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '11px', color: '#5891cb' }}>
              ${valueFilter[0].toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '20px',
        height: 'calc(100% - 60px)'
      }}>
        {/* Map */}
        <div style={{ flex: 1 }}>
          <Plot
            data={[mapData]}
            layout={{
              geo: {
                showframe: false,
                showcoastlines: true,
                coastlinecolor: '#3a4459',
                bgcolor: '#0a1224',
                showland: true,
                landcolor: '#1e2738'
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
              font: { color: '#f7f9fb', size: 10 },
              margin: { t: 0, r: 0, b: 0, l: 0 }
            }}
            config={{ 
              displayModeBar: false,
              responsive: true
            }}
            onClick={handleRegionClick}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Region Details Panel */}
        {selectedRegion && (
          <div style={{
            width: '280px',
            backgroundColor: '#1e2738',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #3a4459'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#f7f9fb'
            }}>
              {selectedRegion}
            </h4>
            
            {regionalData[selectedRegion] && (
              <div style={{ fontSize: '14px', color: '#f7f9fb' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Average LTV:</strong> ${Math.round(regionalData[selectedRegion].avgValue).toLocaleString()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Total LTV:</strong> ${Math.round(regionalData[selectedRegion].totalValue).toLocaleString()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Customers:</strong> {regionalData[selectedRegion].customerCount.toLocaleString()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Total Revenue:</strong> ${Math.round(regionalData[selectedRegion].totalRevenue).toLocaleString()}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Avg Revenue/Customer:</strong> ${Math.round(regionalData[selectedRegion].avgRevenue).toLocaleString()}
                </div>
                
                {/* Performance Metrics */}
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '12px', color: '#5891cb' }}>
                    Performance Metrics:
                  </strong>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#f7f9fb',
                    marginLeft: '8px',
                    marginTop: '4px'
                  }}>
                    <div style={{ marginBottom: '2px' }}>
                      LTV Multiplier: {(regionalData[selectedRegion].avgValue / regionalData[selectedRegion].avgRevenue).toFixed(2)}x
                    </div>
                    <div style={{ marginBottom: '2px' }}>
                      Value per Customer: ${Math.round(regionalData[selectedRegion].totalValue / regionalData[selectedRegion].customerCount).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSelectedRegion(null)}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #3a4459',
                borderRadius: '6px',
                color: '#f7f9fb',
                cursor: 'pointer',
                fontSize: '12px',
                width: '100%'
              }}
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeographicValueMap; 