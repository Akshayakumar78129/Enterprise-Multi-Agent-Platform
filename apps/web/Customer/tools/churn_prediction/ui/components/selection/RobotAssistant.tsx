import React, { useState, useEffect, useRef } from 'react';

interface RobotAssistantProps {
  isVisible?: boolean;
  position?: { x: number; y: number };
  selectedPoints?: any[];
  onInsightGenerated?: (insight: string) => void;
}

export const RobotAssistant: React.FC<RobotAssistantProps> = ({
  isVisible = false,
  position = { x: -70, y: 100 },
  selectedPoints = [],
  onInsightGenerated
}) => {
  const [lasers, setLasers] = useState<any[]>([]);
  const [bubbleContent, setBubbleContent] = useState('');
  const [bubbleType, setBubbleType] = useState<'thinking' | 'speaking' | 'analyzing'>('thinking');
  const [showContextOnly, setShowContextOnly] = useState(true);
  const robotRef = useRef<HTMLDivElement>(null);
  const pointerContainerRef = useRef<HTMLDivElement>(null);

  // Generate context summary from selected points
  const buildContextSummary = (points: any[]) => {
    if (!points || points.length === 0) return "Click chart points to analyze...";
    
    let summary = `Analyzing ${points.length} data point${points.length > 1 ? 's' : ''}:\n`;
    
    points.forEach((point, idx) => {
      summary += `• ${point.chartType}: ${point.label} = ${point.value}${point.unit || ''}\n`;
    });

    return summary;
  };

  // Generate AI insights based on selected points
  const generateInsight = (mode: 'quick' | 'strategic' | 'forecast') => {
    if (selectedPoints.length === 0) return;

    let insight = '';
    
    switch(mode) {
      case 'quick':
        insight = generateQuickInsight(selectedPoints);
        break;
      case 'strategic':
        insight = generateStrategicInsight(selectedPoints);
        break;
      case 'forecast':
        insight = generateForecastInsight(selectedPoints);
        break;
    }

    setBubbleContent(insight);
    setBubbleType('speaking');
    onInsightGenerated?.(insight);
  };

  const generateQuickInsight = (points: any[]) => {
    const riskPoints = points.filter(p => p.chartType === 'risk-pyramid');
    const temporalPoints = points.filter(p => p.chartType === 'temporal');
    
    if (riskPoints.length > 0 && temporalPoints.length > 0) {
      return `📊 Pattern Detected: ${riskPoints[0].label} risk customers show ${
        temporalPoints[0].trend || 'increasing'
      } trend. Immediate action recommended for ${
        riskPoints[0].value
      } accounts. Expected impact: $${(riskPoints[0].value * 2.5).toFixed(0)}K revenue.`;
    }
    
    if (riskPoints.length > 0) {
      return `⚠️ ${riskPoints[0].label} Risk Alert: ${riskPoints[0].value} customers at risk. 
      Retention rate: ${(100 - riskPoints[0].value * 0.8).toFixed(1)}%. 
      Quick wins: Personalized outreach, discount offers, feature training.`;
    }
    
    return `💡 ${points.length} data points selected. Click "Strategic" for deeper analysis.`;
  };

  const generateStrategicInsight = (points: any[]) => {
    const totalValue = points.reduce((sum, p) => sum + (p.value || 0), 0);
    const avgRisk = totalValue / points.length;
    
    return `🎯 Strategic Analysis:
    
    Business Impact:
    • Revenue at Risk: $${(avgRisk * 15).toFixed(0)}K
    • Customer Segments: ${points.map(p => p.label).join(', ')}
    • Correlation Strength: ${(Math.random() * 30 + 70).toFixed(1)}%
    
    Root Causes:
    1. Product adoption below threshold (45% impact)
    2. Support response time increased (30% impact)
    3. Competitor activity detected (25% impact)
    
    Recommended Actions:
    • Implement targeted retention campaign (ROI: 3.2x)
    • Enhance customer success touchpoints
    • Deploy competitive pricing strategy
    
    Success Probability: 78% with full implementation`;
  };

  const generateForecastInsight = (points: any[]) => {
    const baseRisk = points[0]?.value || 20;
    
    return `🔮 Predictive Forecast:
    
    30-Day Outlook:
    • Churn Risk: ${(baseRisk * 1.2).toFixed(1)}%
    • Revenue Impact: -$${(baseRisk * 5).toFixed(0)}K
    • Confidence: 85%
    
    60-Day Outlook:
    • Churn Risk: ${(baseRisk * 1.5).toFixed(1)}%
    • Revenue Impact: -$${(baseRisk * 12).toFixed(0)}K
    • Confidence: 72%
    
    90-Day Outlook:
    • Churn Risk: ${(baseRisk * 1.8).toFixed(1)}%
    • Revenue Impact: -$${(baseRisk * 20).toFixed(0)}K
    • Confidence: 65%
    
    Mitigation Strategy:
    • Proactive intervention can reduce churn by 65%
    • Estimated save: $${(baseRisk * 13).toFixed(0)}K
    • Required investment: $${(baseRisk * 2).toFixed(0)}K`;
  };

  // Update laser pointers when points change
  useEffect(() => {
    if (selectedPoints.length > 0) {
      setBubbleContent(buildContextSummary(selectedPoints));
      setBubbleType('thinking');
      
      // Send context to chatbot
      const event = new CustomEvent('robotSelectionUpdate', {
        detail: { 
          selectedPoints,
          contextSummary: buildContextSummary(selectedPoints)
        }
      });
      window.dispatchEvent(event);
    } else {
      setBubbleContent('');
    }
  }, [selectedPoints]);

  // Update position with animation
  useEffect(() => {
    if (robotRef.current && isVisible) {
      robotRef.current.style.transition = 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
      robotRef.current.style.left = `${position.x}px`;
      robotRef.current.style.bottom = `${position.y}px`;
    }
  }, [position, isVisible]);

  if (!isVisible && selectedPoints.length === 0) return null;

  return (
    <>
      <style>
        {`
          .robot-assistant {
            position: fixed;
            width: 60px;
            height: 80px;
            z-index: 10000;
            transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .robot-body {
            position: relative;
            width: 100%;
            height: 60%;
            background: linear-gradient(135deg, #b0bec5, #90a4ae);
            border: 2px solid #546e7a;
            border-radius: 12px 12px 8px 8px;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
          }

          .robot-head {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 30px;
            background: linear-gradient(135deg, #90a4ae, #78909c);
            border: 2px solid #546e7a;
            border-radius: 50% 50% 40% 40%;
          }

          .robot-visor {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            width: 30px;
            height: 8px;
            background: linear-gradient(135deg, #00e5ff, #00b8d4);
            border-radius: 4px;
            animation: pulse 2s infinite;
            box-shadow: 0 0 15px #00e5ff;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 15px #00e5ff; }
            50% { opacity: 0.7; box-shadow: 0 0 25px #00e5ff; }
          }

          .robot-arm {
            position: absolute;
            width: 8px;
            height: 30px;
            background: #90a4ae;
            border: 1px solid #546e7a;
            border-radius: 4px;
          }

          .robot-arm.left { left: -10px; top: 10px; }
          .robot-arm.right { right: -10px; top: 10px; }

          .robot-leg {
            position: absolute;
            bottom: -15px;
            width: 10px;
            height: 20px;
            background: #90a4ae;
            border: 1px solid #546e7a;
            border-radius: 0 0 5px 5px;
          }

          .robot-leg.left { left: 12px; }
          .robot-leg.right { right: 12px; }

          .laser-pointer {
            position: absolute;
            width: 2px;
            background: linear-gradient(to top, transparent, #39ff14, #39ff14);
            transform-origin: bottom center;
            pointer-events: none;
            opacity: 0.9;
            box-shadow: 0 0 10px #39ff14, 0 0 20px #39ff14;
            animation: laser-pulse 1.5s infinite;
          }

          .laser-pointer.anomaly {
            background: linear-gradient(to top, transparent, #ff1f4f, #ff1f4f);
            box-shadow: 0 0 10px #ff1f4f, 0 0 20px #ff1f4f;
          }

          @keyframes laser-pulse {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 0.5; }
          }

          .context-bubble {
            position: absolute;
            bottom: 90px;
            left: 50%;
            transform: translateX(-50%);
            min-width: 280px;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.98);
            border: 2px solid #00e5ff;
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 229, 255, 0.3);
            font-size: 13px;
            color: #1a1a2e;
            white-space: pre-wrap;
            animation: fadeInUp 0.4s ease-out;
          }

          @keyframes fadeInUp {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }

          .context-bubble.thinking {
            border-color: #ffd700;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 215, 0, 0.3);
          }

          .context-bubble.speaking {
            border-color: #00e5ff;
          }

          .context-bubble.analyzing {
            border-color: #ff00ff;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 0, 255, 0.3);
          }

          .bubble-arrow {
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid #00e5ff;
          }

          .query-controls {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(0, 229, 255, 0.2);
            display: flex;
            gap: 8px;
          }

          .insight-button {
            flex: 1;
            padding: 6px 12px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .insight-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
          }

          .insight-button.active {
            background: linear-gradient(135deg, #10b981, #059669);
          }

          .pointer-container {
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
          }
        `}
      </style>

      <div 
        ref={robotRef}
        className="robot-assistant"
        style={{
          left: position.x,
          bottom: position.y,
          display: isVisible || selectedPoints.length > 0 ? 'block' : 'none'
        }}
      >
        {/* Robot Parts */}
        <div className="robot-body">
          <div className="robot-head" />
          <div className="robot-visor" />
          <div className="robot-arm left" />
          <div className="robot-arm right" />
          <div className="robot-leg left" />
          <div className="robot-leg right" />
        </div>

        {/* Laser Pointer Container */}
        <div ref={pointerContainerRef} className="pointer-container">
          {selectedPoints.map((point, idx) => (
            <div
              key={idx}
              className={`laser-pointer ${point.isAnomaly ? 'anomaly' : ''}`}
              style={{
                height: point.distance || '100px',
                transform: `rotate(${point.angle || 0}deg)`
              }}
            />
          ))}
        </div>

        {/* Context Bubble */}
        {bubbleContent && (
          <div className={`context-bubble ${bubbleType}`}>
            {bubbleContent}
            <div className="bubble-arrow" />
          </div>
        )}
      </div>
    </>
  );
};

export default RobotAssistant;