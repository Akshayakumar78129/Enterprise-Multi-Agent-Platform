import React from 'react';

const SegmentKPITiles = ({ 
  kpiData, 
  segmentDistribution = [], 
  loading = false, 
  onKPIClick = () => {} 
}) => {
  // Base tile style matching Enterprise IQ design
  const baseTileStyle = {
    width: '120px',
    height: '120px',
    background: '#1e2738',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f7f9fb',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #232a36',
    position: 'relative',
    overflow: 'hidden'
  };

  const hoverStyle = {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  };

  // Calculate KPI values
  const totalSegments = segmentDistribution.length || (kpiData?.total_segments || 0);
  
  const segmentationQuality = kpiData?.segmentation_quality || 0;
  const qualityScore = Math.round(segmentationQuality * 100);
  
  const largestSegment = segmentDistribution.length > 0 
    ? segmentDistribution.reduce((max, segment) => 
        segment.customer_count > max.customer_count ? segment : max
      )
    : null;
  const largestSegmentPct = largestSegment 
    ? Math.round((largestSegment.customer_count / segmentDistribution.reduce((sum, s) => sum + s.customer_count, 0)) * 100)
    : 0;

  const mostValuableSegment = segmentDistribution.length > 0
    ? segmentDistribution.reduce((max, segment) => 
        (segment.avg_lifetime_value || 0) > (max.avg_lifetime_value || 0) ? segment : max
      )
    : null;

  const segmentStability = kpiData?.segment_stability || 85; // Default value
  const stabilityPct = Math.round(segmentStability);

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            style={{
              ...baseTileStyle,
              background: 'linear-gradient(90deg, #1e2738 25%, #232a36 50%, #1e2738 75%)',
              backgroundSize: '200% 100%',
              animation: 'loading 1.5s infinite'
            }}
          >
            <div style={{
              width: '60%',
              height: '20px',
              background: '#232a36',
              borderRadius: '4px',
              marginBottom: '8px'
            }} />
            <div style={{
              width: '40%',
              height: '12px',
              background: '#232a36',
              borderRadius: '4px'
            }} />
          </div>
        ))}
        <style jsx>{`
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // Tile 1: Total Segments
  const TotalSegmentsTile = () => (
    <div
      style={baseTileStyle}
      onClick={() => onKPIClick('segments')}
      onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
      onMouseOut={(e) => Object.assign(e.target.style, baseTileStyle)}
    >
      {/* Segment distribution visual */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '24px',
        height: '24px'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          {segmentDistribution.slice(0, 3).map((segment, index) => (
            <circle
              key={index}
              cx={12}
              cy={12}
              r={6 - index * 1.5}
              fill="none"
              stroke={index === 0 ? '#00e0ff' : index === 1 ? '#e930ff' : '#5fd4d6'}
              strokeWidth="2"
              opacity={0.7}
            />
          ))}
        </svg>
      </div>
      
      <div style={{ fontSize: '32px', fontWeight: '600', color: '#f7f9fb' }}>
        {totalSegments}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
        Customer Segments
      </div>
    </div>
  );

  // Tile 2: Segmentation Quality
  const QualityTile = () => {
    const getQualityColor = (score) => {
      if (score >= 80) return '#00e0ff'; // Excellent
      if (score >= 60) return '#5fd4d6'; // Good
      if (score >= 40) return '#fbbf24'; // Fair
      return '#e930ff'; // Poor
    };

    const qualityColor = getQualityColor(qualityScore);
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (qualityScore / 100) * circumference;

    return (
      <div
        style={baseTileStyle}
        onClick={() => onKPIClick('quality')}
        onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
        onMouseOut={(e) => Object.assign(e.target.style, baseTileStyle)}
      >
        {/* Circular gauge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '36px',
          height: '36px'
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="#232a36"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={qualityColor}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        </div>
        
        <div style={{ fontSize: '32px', fontWeight: '600', color: qualityColor }}>
          {qualityScore}%
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
          Cluster Validity
        </div>
      </div>
    );
  };

  // Tile 3: Largest Segment
  const LargestSegmentTile = () => {
    const isWarning = largestSegmentPct > 50;
    const barColor = isWarning ? '#e930ff' : '#00e0ff';

    return (
      <div
        style={baseTileStyle}
        onClick={() => onKPIClick('distribution')}
        onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
        onMouseOut={(e) => Object.assign(e.target.style, baseTileStyle)}
      >
        {/* Horizontal progress bar */}
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '8px',
          height: '4px',
          background: '#232a36',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(largestSegmentPct, 100)}%`,
            height: '100%',
            background: barColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {isWarning && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            color: '#e930ff',
            fontSize: '12px'
          }}>
            ⚠
          </div>
        )}
        
        <div style={{ fontSize: '32px', fontWeight: '600', color: barColor }}>
          {largestSegmentPct}%
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
          {largestSegment?.segment_name || 'Unknown segment'}
        </div>
      </div>
    );
  };

  // Tile 4: Most Valuable Segment
  const ValuableSegmentTile = () => {
    const segmentName = mostValuableSegment?.segment_name || 'N/A';
    const displayName = segmentName.length > 12 ? segmentName.substring(0, 10) + '...' : segmentName;
    
    // 5-star rating based on value tier
    const avgValue = mostValuableSegment?.avg_lifetime_value || 0;
    const stars = Math.min(5, Math.max(1, Math.ceil(avgValue / 1000))); // Scale based on value

    return (
      <div
        style={baseTileStyle}
        onClick={() => onKPIClick('valuable')}
        onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
        onMouseOut={(e) => Object.assign(e.target.style, baseTileStyle)}
      >
        {/* Star rating visual */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '1px'
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <div
              key={star}
              style={{
                width: '3px',
                height: '12px',
                background: star <= stars ? '#fbbf24' : '#232a36',
                borderRadius: '1px'
              }}
            />
          ))}
        </div>
        
        <div style={{ fontSize: '28px', fontWeight: '600', color: '#f7f9fb', textAlign: 'center' }}>
          {displayName}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
          By Avg Spend
        </div>
      </div>
    );
  };

  // Tile 5: Segment Stability
  const StabilityTile = () => {
    const getStabilityColor = (pct) => {
      if (pct >= 90) return '#00e0ff'; // High
      if (pct >= 70) return '#5fd4d6'; // Medium
      return '#e930ff'; // Low
    };

    const stabilityColor = getStabilityColor(stabilityPct);
    const gaugeAngle = (stabilityPct / 100) * 180; // Half circle gauge

    return (
      <div
        style={baseTileStyle}
        onClick={() => onKPIClick('stability')}
        onMouseOver={(e) => Object.assign(e.target.style, hoverStyle)}
        onMouseOut={(e) => Object.assign(e.target.style, baseTileStyle)}
      >
        {/* Stability gauge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '32px',
          height: '16px'
        }}>
          <svg width="32" height="16" viewBox="0 0 32 16">
            <path
              d="M 2 14 A 14 14 0 0 1 30 14"
              fill="none"
              stroke="#232a36"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 2 14 A 14 14 0 0 1 30 14"
              fill="none"
              stroke={stabilityColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="44"
              strokeDashoffset={44 - (stabilityPct / 100) * 44}
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        </div>
        
        <div style={{ fontSize: '32px', fontWeight: '600', color: stabilityColor }}>
          {stabilityPct}%
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center' }}>
          Customer Retention
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
      <TotalSegmentsTile />
      <QualityTile />
      <LargestSegmentTile />
      <ValuableSegmentTile />
      <StabilityTile />
    </div>
  );
};

export default SegmentKPITiles; 