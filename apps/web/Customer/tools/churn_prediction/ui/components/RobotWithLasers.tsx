import React, { useState, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  label: string;
  value: number;
  chartType: string;
}

interface RobotWithLasersProps {
  enabled?: boolean;
}

export const RobotWithLasers: React.FC<RobotWithLasersProps> = ({ enabled = true }) => {
  const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [robotPosition, setRobotPosition] = useState({ x: -100, y: 100 });
  const [isVisible, setIsVisible] = useState(false);
  const [bubbleContent, setBubbleContent] = useState('');
  const [insightMode, setInsightMode] = useState<'quick' | 'strategic' | 'forecast'>('quick');
  const robotRef = useRef<HTMLDivElement>(null);

  // Make this available globally
  useEffect(() => {
    if (!enabled) return;

    // Global function to add points from charts
    (window as any).addChartPoint = (point: Point) => {
      setSelectedPoints(prev => {
        const isShiftPressed = (window as any).isShiftPressed || false;
        
        if (isShiftPressed) {
          // Multi-select: add to existing
          const exists = prev.find(p => p.x === point.x && p.y === point.y);
          if (exists) {
            return prev.filter(p => !(p.x === point.x && p.y === point.y));
          }
          return [...prev, point];
        } else {
          // Single select: replace all
          return [point];
        }
      });
      setIsVisible(true);
    };

    // Track shift key
    let shiftPressed = false;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed = true;
        (window as any).isShiftPressed = true;
      }
      if (e.key === 'Escape') {
        setSelectedPoints([]);
        setIsVisible(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftPressed = false;
        (window as any).isShiftPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      delete (window as any).addChartPoint;
      delete (window as any).isShiftPressed;
    };
  }, [enabled]);

  // Update robot position when points change
  useEffect(() => {
    if (selectedPoints.length > 0) {
      const avgX = selectedPoints.reduce((sum, p) => sum + p.x, 0) / selectedPoints.length;
      const avgY = selectedPoints.reduce((sum, p) => sum + p.y, 0) / selectedPoints.length;
      
      setRobotPosition({
        x: Math.min(avgX + 100, window.innerWidth - 150),
        y: window.innerHeight - avgY - 100
      });

      // Generate insight
      generateInsight();
    }
  }, [selectedPoints, insightMode]);

  const generateInsight = () => {
    if (selectedPoints.length === 0) return;

    const totalCustomers = selectedPoints.reduce((sum, p) => sum + p.value, 0);
    const avgRisk = selectedPoints.reduce((sum, p) => sum + p.value, 0) / selectedPoints.length;
    const revenueAtRisk = totalCustomers * 15; // $15K average per customer
    
    let insightData = {
      title: '',
      metrics: [],
      insights: [],
      actions: []
    };

    if (insightMode === 'quick') {
      insightData = {
        title: 'Quick Analysis',
        metrics: [
          { label: 'Customers Analyzed', value: totalCustomers.toLocaleString(), trend: 'neutral' },
          { label: 'Avg Risk Score', value: `${avgRisk.toFixed(1)}%`, trend: avgRisk > 70 ? 'high' : avgRisk > 40 ? 'medium' : 'low' },
          { label: 'Data Points', value: selectedPoints.length.toString(), trend: 'neutral' }
        ],
        insights: [
          selectedPoints.length > 1 
            ? 'Multi-segment risk analysis reveals diversified churn patterns across customer portfolio'
            : 'Focused segment analysis provides targeted risk assessment for strategic intervention',
          avgRisk > 70 
            ? 'Critical risk threshold exceeded - immediate executive intervention required to prevent revenue loss'
            : 'Moderate risk levels present proactive retention opportunities with high success probability',
          'Customer behavior patterns indicate 72-hour response window for optimal engagement effectiveness'
        ],
        actions: [
          'Prioritize highest-risk segments for immediate C-level outreach within 24 hours',
          'Deploy targeted retention campaigns with personalized value propositions',
          'Schedule executive review of at-risk accounts with dedicated success managers',
          'Implement enhanced monitoring for early warning indicators'
        ]
      };
    } else if (insightMode === 'strategic') {
      const roi = 3.2;
      const campaignCost = revenueAtRisk * 0.15;
      const projectedSavings = revenueAtRisk * 0.65;
      
      insightData = {
        title: 'Strategic Impact Assessment',
        metrics: [
          { label: 'Revenue at Risk', value: `$${(revenueAtRisk / 1000).toFixed(1)}M`, trend: 'high' },
          { label: 'Retention ROI', value: `${roi}x`, trend: 'positive' },
          { label: 'Campaign Investment', value: `$${(campaignCost / 1000).toFixed(0)}K`, trend: 'neutral' },
          { label: 'Projected Savings', value: `$${(projectedSavings / 1000).toFixed(1)}M`, trend: 'positive' }
        ],
        insights: [
          `${totalCustomers} high-value customers represent ${((revenueAtRisk / 50000000) * 100).toFixed(1)}% of total revenue exposure - immediate C-suite attention required`,
          'Strategic retention investment demonstrates 3.2x ROI with 65% success rate based on industry benchmarks',
          'Early intervention reduces churn probability by 40% and increases customer lifetime value by 25%',
          'Competitive analysis shows 15% market share vulnerability if churn rates exceed industry average'
        ],
        actions: [
          'Deploy enterprise-grade retention program with dedicated budget allocation',
          'Establish C-level customer success team with direct CEO reporting line',
          'Implement real-time predictive analytics dashboard for board-level visibility',
          'Create executive escalation pathway for accounts >$100K ARR',
          'Initiate strategic partnership discussions to enhance value proposition'
        ]
      };
    } else if (insightMode === 'forecast') {
      const churnRate30 = Math.min(avgRisk * 0.4, 85);
      const churnRate60 = Math.min(avgRisk * 0.7, 95);
      const churnRate90 = Math.min(avgRisk * 0.9, 98);
      
      insightData = {
        title: 'Predictive Forecast Analysis',
        metrics: [
          { label: '30-Day Churn Risk', value: `${churnRate30.toFixed(0)}%`, trend: 'high' },
          { label: '60-Day Churn Risk', value: `${churnRate60.toFixed(0)}%`, trend: 'high' },
          { label: '90-Day Churn Risk', value: `${churnRate90.toFixed(0)}%`, trend: 'critical' },
          { label: 'Intervention Window', value: '21 days', trend: 'urgent' }
        ],
        insights: [
          `Critical forecast: ${Math.round(totalCustomers * churnRate60 / 100)} customers at risk of churning within 60 days - potential market confidence impact`,
          `Revenue trajectory: $${(revenueAtRisk * churnRate30 / 100 / 1000).toFixed(0)}K immediate risk escalating to $${(revenueAtRisk * churnRate60 / 100 / 1000).toFixed(0)}K without intervention`,
          'Optimal intervention window closes in 21 days - beyond this point, retention costs increase 3x',
          'Predictive confidence: 87% accuracy based on historical patterns and market indicators',
          'Competitive threat assessment: 23% of at-risk customers have engaged with competitors in past 30 days'
        ],
        actions: [
          'Activate Code Red retention protocols with immediate C-suite involvement',
          'Deploy executive relationship managers for accounts >$250K ARR within 48 hours',
          'Implement war room with real-time monitoring and daily CEO briefings',
          'Establish emergency budget allocation for retention incentives up to $2M',
          'Initiate competitor intelligence gathering and counter-positioning strategy',
          'Schedule emergency board meeting to discuss market position and retention strategy'
        ]
      };
    }

    setBubbleContent(JSON.stringify(insightData));
  };

  if (!enabled || !isVisible) return null;

  return (
    <>
      <style>
        {`
          @keyframes robotFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @keyframes laserPulse {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.4; }
          }

          @keyframes visorGlow {
            0%, 100% { box-shadow: 0 0 10px #00e5ff, inset 0 0 5px #00e5ff; }
            50% { box-shadow: 0 0 20px #00e5ff, inset 0 0 10px #00e5ff; }
          }

          .robot-container {
            position: fixed;
            z-index: 99999;
            pointer-events: none;
            transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
            animation: robotFloat 3s ease-in-out infinite;
          }

          .robot-wrapper {
            position: relative;
            width: 60px;
            height: 80px;
          }

          .robot-main-body {
            width: 40px;
            height: 50px;
            background: linear-gradient(135deg, #cfd8dc 0%, #90a4ae 50%, #607d8b 100%);
            border-radius: 10px 10px 5px 5px;
            position: absolute;
            left: 10px;
            top: 20px;
            border: 2px solid #455a64;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3), inset 0 2px 5px rgba(255,255,255,0.3);
          }

          .robot-head {
            width: 30px;
            height: 25px;
            background: linear-gradient(135deg, #b0bec5 0%, #78909c 100%);
            border-radius: 15px 15px 10px 10px;
            position: absolute;
            left: 15px;
            top: 0;
            border: 2px solid #455a64;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }

          .robot-visor {
            width: 20px;
            height: 6px;
            background: #00e5ff;
            border-radius: 10px;
            position: absolute;
            left: 20px;
            top: 8px;
            animation: visorGlow 2s ease-in-out infinite;
          }

          .robot-arm {
            width: 8px;
            height: 25px;
            background: linear-gradient(135deg, #90a4ae 0%, #607d8b 100%);
            border-radius: 4px;
            position: absolute;
            top: 25px;
            border: 1px solid #455a64;
          }

          .robot-arm.left { left: 2px; transform: rotate(-5deg); }
          .robot-arm.right { right: 2px; transform: rotate(5deg); }

          .robot-leg {
            width: 10px;
            height: 15px;
            background: linear-gradient(135deg, #90a4ae 0%, #607d8b 100%);
            border-radius: 0 0 5px 5px;
            position: absolute;
            bottom: -10px;
            border: 1px solid #455a64;
          }

          .robot-leg.left { left: 12px; }
          .robot-leg.right { right: 12px; }

          .laser-container {
            position: absolute;
            left: 30px;
            top: 40px;
            width: 0;
            height: 0;
            pointer-events: none;
          }

          .laser-beam {
            position: absolute;
            width: 2px;
            background: linear-gradient(to top, 
              transparent 0%, 
              rgba(57, 255, 20, 0.3) 10%,
              rgba(57, 255, 20, 0.8) 50%,
              #39ff14 100%);
            transform-origin: bottom center;
            animation: laserPulse 1.5s ease-in-out infinite;
            box-shadow: 0 0 10px #39ff14, 0 0 20px rgba(57, 255, 20, 0.5);
            pointer-events: none;
          }

          .context-bubble {
            position: absolute;
            bottom: 100px;
            left: -200px;
            width: 480px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 16px;
            padding: 0;
            box-shadow: 
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              0 0 40px rgba(59, 130, 246, 0.1);
            font-size: 13px;
            color: #1e293b;
            pointer-events: auto;
            max-height: 500px;
            overflow: hidden;
            backdrop-filter: blur(20px);
            animation: bubbleAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          @keyframes bubbleAppear {
            0% {
              opacity: 0;
              transform: translateY(20px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .context-bubble::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 240px;
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid rgba(248, 250, 252, 0.98);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }

          .insight-header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
            color: white;
            padding: 16px 20px;
            border-radius: 16px 16px 0 0;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.2s;
            flex-shrink: 0;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }

          .header-title {
            flex: 1;
            text-align: center;
          }

          .insight-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
            animation: shimmer 3s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .insight-content {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
          }

          .insight-content::-webkit-scrollbar {
            width: 6px;
          }

          .insight-content::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 3px;
          }

          .insight-content::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 3px;
          }

          .insight-content::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }

          .metric-card {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            transition: all 0.2s ease;
          }

          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .metric-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .metric-value {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 2px;
          }

          .metric-value.trend-high { color: #dc2626; }
          .metric-value.trend-medium { color: #ea580c; }
          .metric-value.trend-low { color: #16a34a; }
          .metric-value.trend-positive { color: #059669; }
          .metric-value.trend-neutral { color: #475569; }
          .metric-value.trend-critical { color: #991b1b; }
          .metric-value.trend-urgent { color: #b91c1c; }

          .insights-section {
            margin-bottom: 20px;
          }

          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 2px;
          }

          .insight-item {
            background: rgba(59, 130, 246, 0.05);
            border-left: 3px solid #3b82f6;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 0 8px 8px 0;
            font-size: 13px;
            line-height: 1.5;
            color: #334155;
          }

          .actions-section {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
            border-radius: 12px;
            padding: 16px;
            border: 1px solid rgba(16, 185, 129, 0.1);
          }

          .action-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(16, 185, 129, 0.1);
            font-size: 13px;
            line-height: 1.4;
            color: #0f172a;
          }

          .action-item:last-child {
            border-bottom: none;
          }

          .action-number {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .insight-buttons {
            display: flex;
            gap: 8px;
            padding: 16px 20px;
            background: rgba(248, 250, 252, 0.8);
            border-top: 1px solid rgba(148, 163, 184, 0.1);
            border-radius: 0 0 16px 16px;
          }

          .insight-btn {
            flex: 1;
            padding: 10px 16px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
            color: #475569;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }

          .insight-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .insight-btn:hover::before {
            left: 100%;
          }

          .insight-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.3);
          }

          .insight-btn.active {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border-color: #059669;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }

          .insight-btn.active:hover {
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
          }

          .selection-indicator {
            position: fixed;
            width: 12px;
            height: 12px;
            border: 2px solid #39ff14;
            border-radius: 50%;
            background: rgba(57, 255, 20, 0.3);
            pointer-events: none;
            z-index: 99998;
            animation: pulse 1.5s ease-out infinite;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }

          .shift-indicator {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
            pointer-events: none;
          }
        `}
      </style>

      {/* Selection indicators for points */}
      {selectedPoints.map((point, idx) => (
        <div
          key={idx}
          className="selection-indicator"
          style={{ left: point.x - 6, top: point.y - 6 }}
        />
      ))}

      {/* Shift mode indicator */}
      {(window as any).isShiftPressed && (
        <div className="shift-indicator">
          ⇧ Multi-select mode - Click to add/remove points
        </div>
      )}

      {/* Robot Container */}
      <div
        ref={robotRef}
        className="robot-container"
        style={{ left: robotPosition.x, bottom: robotPosition.y }}
      >
        <div className="robot-wrapper">
          {/* Robot Parts */}
          <div className="robot-head" />
          <div className="robot-visor" />
          <div className="robot-main-body" />
          <div className="robot-arm left" />
          <div className="robot-arm right" />
          <div className="robot-leg left" />
          <div className="robot-leg right" />

          {/* Laser Container */}
          <div className="laser-container">
            {selectedPoints.map((point, idx) => {
              const dx = point.x - (robotPosition.x + 30);
              const dy = (window.innerHeight - point.y) - robotPosition.y - 40;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;

              return (
                <div
                  key={idx}
                  className="laser-beam"
                  style={{
                    height: `${distance}px`,
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              );
            })}
          </div>

          {/* Context Bubble */}
          {bubbleContent && (() => {
            try {
              const data = JSON.parse(bubbleContent);
              return (
                <div className="context-bubble">
                  <div className="insight-header">
                    <div></div>
                    <div className="header-title">
                      🤖 AI Intelligence: {data.title}
                    </div>
                    <button 
                      className="close-btn"
                      onClick={() => {
                        setSelectedPoints([]);
                        setIsVisible(false);
                      }}
                      title="Close insights"
                    >
                      ×
                    </button>
                  </div>
                  <div className="insight-content">
                    {/* Metrics Grid */}
                    <div className="metrics-grid">
                      {data.metrics.map((metric, idx) => (
                        <div key={idx} className="metric-card">
                          <div className="metric-label">{metric.label}</div>
                          <div className={`metric-value trend-${metric.trend}`}>
                            {metric.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Key Insights */}
                    <div className="insights-section">
                      <div className="section-title">📊 Key Insights</div>
                      {data.insights.map((insight, idx) => (
                        <div key={idx} className="insight-item">
                          {insight}
                        </div>
                      ))}
                    </div>

                    {/* Recommended Actions */}
                    <div className="actions-section">
                      <div className="section-title">⚡ Recommended Actions</div>
                      {data.actions.map((action, idx) => (
                        <div key={idx} className="action-item">
                          <div className="action-number">{idx + 1}</div>
                          <div>{action}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="insight-buttons">
                    <button
                      className={`insight-btn ${insightMode === 'quick' ? 'active' : ''}`}
                      onClick={() => setInsightMode('quick')}
                    >
                      📈 Quick
                    </button>
                    <button
                      className={`insight-btn ${insightMode === 'strategic' ? 'active' : ''}`}
                      onClick={() => setInsightMode('strategic')}
                    >
                      🎯 Strategic
                    </button>
                    <button
                      className={`insight-btn ${insightMode === 'forecast' ? 'active' : ''}`}
                      onClick={() => setInsightMode('forecast')}
                    >
                      🔮 Forecast
                    </button>
                  </div>
                </div>
              );
            } catch (e) {
              return (
                <div className="context-bubble">
                  <div className="insight-header">🤖 AI Intelligence</div>
                  <div className="insight-content">
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      Loading insights...
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </>
  );
};

export default RobotWithLasers;