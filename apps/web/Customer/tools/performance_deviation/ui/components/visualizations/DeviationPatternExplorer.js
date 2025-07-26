import React, { useState, useMemo } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

const DeviationPatternExplorer = ({
  data = { calendar: {}, monthlyStats: {}, patterns: [] },
  selectedYear = null,
  onYearSelect = null,
  significanceThreshold = 0.5,
  onThresholdChange = null,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState("calendar");
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const availableYears = Object.keys(data.calendar).map(Number).sort();
  const currentYear = selectedYear || (availableYears.length > 0 ? availableYears[0] : new Date().getFullYear());

  const filteredPatterns = useMemo(() => {
    return data.patterns.filter(p => Math.abs(p.deviation_magnitude) >= significanceThreshold);
  }, [data.patterns, significanceThreshold]);

  if (isLoading) {
    return (
      <Card title="Deviation Pattern Explorer" isLoading={true}>
        <div style={{ height: "480px" }} />
      </Card>
    );
  }

  if (availableYears.length === 0) {
    return (
      <Card title="Deviation Pattern Explorer">
        <div style={{ height: "480px", display: "flex", justifyContent: "center", alignItems: "center", color: "#5891cb" }}>
          No deviation pattern data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="Deviation Pattern Explorer" subtitle={`${filteredPatterns.length} significant deviations`}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>View:</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { value: 'calendar', label: 'Calendar' },
              { value: 'timeline', label: 'Timeline' },
              { value: 'stats', label: 'Statistics' }
            ].map(mode => (
              <button
                key={mode.value}
                onClick={() => setViewMode(mode.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #3a4459',
                  backgroundColor: viewMode === mode.value ? '#00e0ff' : '#232a36',
                  color: viewMode === mode.value ? '#0a1224' : '#f7f9fb',
                  cursor: 'pointer'
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>Year:</label>
          <select
            value={currentYear}
            onChange={(e) => onYearSelect && onYearSelect(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #3a4459',
              backgroundColor: '#232a36',
              color: '#f7f9fb',
              fontSize: '14px'
            }}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ color: '#f7f9fb', fontSize: '14px', fontWeight: '500' }}>
            Threshold: {significanceThreshold.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={significanceThreshold}
            onChange={(e) => onThresholdChange && onThresholdChange(Number(e.target.value))}
            style={{ width: '100px', accentColor: '#00e0ff' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ height: "400px", backgroundColor: 'rgba(58, 68, 89, 0.1)', borderRadius: '8px', padding: '16px' }}>
        {viewMode === 'calendar' && <CalendarView year={currentYear} data={data.calendar[currentYear] || {}} />}
        {viewMode === 'timeline' && <TimelineView patterns={filteredPatterns.filter(p => p.year === currentYear)} />}
        {viewMode === 'stats' && <StatsView monthlyStats={data.monthlyStats} year={currentYear} />}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px',
        backgroundColor: 'rgba(58, 68, 89, 0.1)',
        borderRadius: '8px'
      }}>
        <span style={{ color: '#5891cb', fontSize: '12px' }}>Strong Negative</span>
        <div style={{
          width: '200px',
          height: '12px',
          background: 'linear-gradient(90deg, #e930ff, #aa45dd, #232a36, #5fd4d6, #00e0ff)',
          borderRadius: '6px'
        }} />
        <span style={{ color: '#5891cb', fontSize: '12px' }}>Strong Positive</span>
      </div>
    </Card>
  );
};

const CalendarView = ({ year, data }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {months.map((month, monthIndex) => {
          const monthData = data[monthIndex + 1] || [];
          
          return (
            <div key={month} style={{ textAlign: 'center' }}>
              <h4 style={{ color: '#f7f9fb', margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
                {month} {year}
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                  <div key={day} style={{ color: '#5891cb', textAlign: 'center', padding: '2px', fontSize: '8px' }}>
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: 35 }, (_, index) => {
                  const dayData = monthData.find(d => d.day === index + 1);
                  const magnitude = dayData ? dayData.magnitude : 0;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: getDeviationColor(magnitude),
                        border: '1px solid #0a1224',
                        borderRadius: '2px',
                        fontSize: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={dayData ? `Day ${dayData.day}: ${magnitude.toFixed(2)}` : ''}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TimelineView = ({ patterns }) => {
  const sortedPatterns = patterns.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {sortedPatterns.map((pattern, index) => (
        <div
          key={`${pattern.date}-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginBottom: '8px',
            backgroundColor: 'rgba(26, 32, 56, 0.6)',
            borderRadius: '6px',
            borderLeft: `4px solid ${getPatternColor(pattern.pattern_type)}`
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#f7f9fb', fontWeight: '600', fontSize: '14px' }}>
                {new Date(pattern.date).toLocaleDateString()}
              </span>
              <span style={{ color: getPatternColor(pattern.pattern_type), fontSize: '12px', fontWeight: '600' }}>
                {pattern.deviation_magnitude.toFixed(2)}
              </span>
            </div>
            <div style={{ color: '#5891cb', fontSize: '12px' }}>
              {pattern.pattern_type.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsView = ({ monthlyStats, year }) => {
  const yearlyStats = Object.entries(monthlyStats)
    .filter(([key]) => key.startsWith(year.toString()))
    .map(([key, stats]) => ({ month: key, ...stats }));

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {yearlyStats.map(stat => (
          <div key={stat.month} style={{ padding: '12px', backgroundColor: 'rgba(26, 32, 56, 0.6)', borderRadius: '8px' }}>
            <h4 style={{ color: '#f7f9fb', margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600' }}>
              {stat.month.split('-')[1]}/'{stat.month.split('-')[0].slice(-2)}
            </h4>
            <div style={{ fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#5891cb' }}>Total:</span>
                <span style={{ color: '#f7f9fb' }}>{stat.totalDeviations}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#5891cb' }}>Significant:</span>
                <span style={{ color: '#f7f9fb' }}>{stat.significantDeviations}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#5891cb' }}>Avg Mag:</span>
                <span style={{ color: '#f7f9fb' }}>{stat.averageMagnitude.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getDeviationColor(magnitude) {
  if (magnitude > 0.5) return '#00e0ff';
  if (magnitude > 0.2) return '#5fd4d6';
  if (magnitude < -0.5) return '#e930ff';
  if (magnitude < -0.2) return '#aa45dd';
  return '#232a36';
}

function getPatternColor(type) {
  switch (type) {
    case 'positive_anomaly': return '#00e0ff';
    case 'negative_anomaly': return '#e930ff';
    default: return '#3a4459';
  }
}

export default DeviationPatternExplorer; 