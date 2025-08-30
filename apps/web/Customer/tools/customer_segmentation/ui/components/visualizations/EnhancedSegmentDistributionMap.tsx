import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { segmentationTheme, getSegmentColor } from '../../styles/theme';
import { agentCommunication } from '../../services/agentCommunication';
// Removed unused import - createChartJsClickHandler

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface DataPoint {
  customer_id: string;
  x: number;
  y: number;
  segment: number | string;
  value?: number;
  name?: string;
}

interface EnhancedSegmentDistributionMapProps {
  scatterData: DataPoint[];
  highlights?: { segment?: number };
  width?: number;
  height?: number;
  onPointClick?: (point: DataPoint) => void;
}

const EnhancedSegmentDistributionMap: React.FC<EnhancedSegmentDistributionMapProps> = ({
  scatterData,
  highlights,
  width = 760,
  height = 560,
  onPointClick,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [aiInsightContent, setAiInsightContent] = useState<any>(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });
  const [questionAnswer, setQuestionAnswer] = useState<{ question: string; answer: string } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  const segmentData = React.useMemo(() => {
    const segments = new Map<string, DataPoint[]>();
    
    // Handle both empty data and valid data
    if (!scatterData || scatterData.length === 0) {
      // Return empty map if no data
      return segments;
    }
    
    scatterData.forEach(point => {
      const segmentKey = String(point.segment);
      if (!segments.has(segmentKey)) {
        segments.set(segmentKey, []);
      }
      segments.get(segmentKey)?.push(point);
    });
    return segments;
  }, [scatterData]);

  const generatePointInsight = (point: DataPoint) => {
    const segmentPoints = segmentData.get(String(point.segment)) || [];
    const avgX = segmentPoints.reduce((sum, p) => sum + p.x, 0) / segmentPoints.length;
    const avgY = segmentPoints.reduce((sum, p) => sum + p.y, 0) / segmentPoints.length;
    const distance = Math.sqrt(Math.pow(point.x - avgX, 2) + Math.pow(point.y - avgY, 2));
    
    const position = distance < 5 ? 'core' : distance < 10 ? 'typical' : 'outlier';
    const emoji = position === 'core' ? '🎯' : position === 'typical' ? '📍' : '🔍';
    
    return {
      emoji,
      title: `Customer ${point.customer_id}`,
      subtitle: `Segment ${point.segment} - ${position} position`,
      summary: `This customer is ${distance.toFixed(2)} units from segment center. ${position === 'outlier' ? 'May be transitioning to another segment.' : position === 'core' ? 'Highly representative of this segment.' : 'Typical member of this segment.'}`,
      details: [
        `📍 Position: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
        `🎯 Segment Center: (${avgX.toFixed(2)}, ${avgY.toFixed(2)})`,
        `📏 Distance from Center: ${distance.toFixed(2)}`,
        `👥 Segment Size: ${segmentPoints.length} customers`,
        `📊 Classification: ${position}`
      ],
      questions: [
        'Why is this customer in this segment?',
        'Show similar customers',
        'Predict segment migration',
        'View purchase history'
      ],
      actions: [
        'Send personalized offer',
        'Add to campaign',
        'Monitor behavior',
        'Export profile'
      ]
    };
  };

  const chartData = {
    datasets: Array.from(segmentData.entries()).map(([segment, points], index) => {
      // Use the segment name directly if it's a string, otherwise format it
      const segmentLabel = isNaN(Number(segment)) ? segment : `Segment ${segment}`;
      const segmentIndex = index; // Use index for color selection
      
      return {
        label: segmentLabel,
        data: points.map(p => ({ x: p.x, y: p.y, customer_id: p.customer_id })),
        backgroundColor: `${getSegmentColor(segmentIndex)}${
          hoveredSegment === segment ? 'FF' : highlights?.segment === Number(segment) ? 'CC' : '99'
        }`,
        borderColor: getSegmentColor(segmentIndex),
        borderWidth: highlights?.segment === Number(segment) ? 2 : 1,
        pointRadius: hoveredSegment === segment || highlights?.segment === Number(segment) ? 8 : 6,
        pointHoverRadius: 10,
        pointStyle: 'circle',
      };
    }),
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: segmentationTheme.colors.textPrimary,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: `${dataset.label} (${dataset.data.length})`,
              fillStyle: getSegmentColor(i),
              strokeStyle: getSegmentColor(i),
              lineWidth: 2,
              hidden: false,
              index: i,
            }));
          },
        },
        onClick: (e, legendItem, legend) => {
          // Prevent default legend click behavior to avoid animation errors
          e.native?.preventDefault?.();
          e.native?.stopPropagation?.();
          
          // Optional: You can implement custom visibility toggle here if needed
          // For now, we just prevent the error by blocking the default behavior
          console.log('Legend click disabled to prevent animation errors');
        },
      },
      tooltip: {
        backgroundColor: segmentationTheme.colors.bgGlass,
        titleColor: segmentationTheme.colors.textPrimary,
        bodyColor: segmentationTheme.colors.textSecondary,
        borderColor: segmentationTheme.colors.accentCyan,
        borderWidth: 1,
        padding: 16,
        displayColors: true,
        bodyFont: {
          size: 13,
        },
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        callbacks: {
          title: (context) => {
            const segmentName = context[0].dataset.label || 'Unknown Segment';
            return `${segmentName}`;
          },
          label: (context) => {
            const point = context.raw as any;
            const segmentPoints = segmentData.get(String(point.segment)) || [];
            
            return [
              `Customer: ${point.customer_id}`,
              `Segment Size: ${segmentPoints.length} customers`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: segmentationTheme.colors.textTertiary,
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Value Dimension (Spending & Frequency)',
          color: segmentationTheme.colors.textSecondary,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          lineWidth: 1,
        },
        ticks: {
          color: segmentationTheme.colors.textTertiary,
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: 'Engagement Dimension (Recency & Loyalty)',
          color: segmentationTheme.colors.textSecondary,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      // Stop event propagation to prevent chatbot from opening
      if (event?.native) {
        event.native.stopPropagation?.();
        event.native.preventDefault?.();
      }
      
      if (elements.length > 0) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const point = scatterData.find(
          p => p.x === chartData.datasets[datasetIndex].data[index].x &&
               p.y === chartData.datasets[datasetIndex].data[index].y
        );
        
        if (point) {
          setSelectedPoint(point);
          onPointClick?.(point);
          
          // Check if shift key is pressed for multi-selection
          if (event?.native?.shiftKey) {
            // Shift+click - send to dashboard context
            const selectionAPI = (window as any).chartSelectionAPI;
            if (selectionAPI) {
              selectionAPI.addPoint({
                chartId: 'enhanced-segment-distribution',
                chartType: 'scatter',
                dataIndex: index,
                label: `Customer ${point.customer_id}`,
                value: point.y,
                unit: '',
                coordinates: { x: event.native?.clientX || 0, y: event.native?.clientY || 0 },
                metadata: point
              });
            }
          } else {
            // Regular click - show internal AI insight popup (don't send to chatbot)
            const insight = generatePointInsight(point);
            setAiInsightContent(insight);
            setInsightPosition({ 
              x: event?.native?.clientX || window.innerWidth / 2, 
              y: event?.native?.clientY || window.innerHeight / 2 
            });
            setShowAIInsight(true);
          }
        }
      }
      
      // Return false to prevent any default handling
      return false;
    },
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const segmentIndex = elements[0].datasetIndex + 1;
        setHoveredSegment(segmentIndex);
      } else {
        setHoveredSegment(null);
      }
    },
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: segmentationTheme.gradients.container,
        backdropFilter: segmentationTheme.effects.backdropBlur,
        WebkitBackdropFilter: segmentationTheme.effects.backdropBlur,
        borderRadius: segmentationTheme.borderRadius.xl,
        border: `1px solid rgba(0, 224, 255, 0.2)`,
        boxShadow: segmentationTheme.effects.glassShadow,
        padding: segmentationTheme.spacing.xl,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: segmentationTheme.spacing.lg,
      }}>
        <div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: segmentationTheme.colors.textPrimary,
            marginBottom: segmentationTheme.spacing.xs,
          }}>
            Customer Segment Distribution
          </h3>
          <p style={{
            fontSize: '14px',
            color: segmentationTheme.colors.textTertiary,
          }}>
            Interactive visualization of customer segments in feature space
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: segmentationTheme.spacing.md,
        }}>
          <button
            style={{
              background: segmentationTheme.colors.bgGlass,
              border: `1px solid ${segmentationTheme.colors.accentCyan}40`,
              borderRadius: segmentationTheme.borderRadius.md,
              color: segmentationTheme.colors.textPrimary,
              padding: '8px 16px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: segmentationTheme.animation.fast,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = segmentationTheme.gradients.primary;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = segmentationTheme.colors.bgGlass;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Reset View
          </button>
        </div>
      </div>

      <div style={{ 
        width: '100%', 
        height: `${height}px`,
        position: 'relative',
      }}>
        {!scatterData || scatterData.length === 0 || chartData.datasets.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: segmentationTheme.colors.textTertiary,
            fontSize: '16px',
            gap: '20px'
          }}>
            <div style={{ fontSize: '48px', opacity: 0.5 }}>📊</div>
            <div>No segment distribution data available</div>
            <div style={{ fontSize: '14px', opacity: 0.7 }}>
              Data will appear here once customers are segmented
            </div>
          </div>
        ) : (
          <Scatter data={chartData} options={options} />
        )}
        
        {selectedPoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: segmentationTheme.colors.bgGlass,
              borderRadius: segmentationTheme.borderRadius.md,
              padding: segmentationTheme.spacing.md,
              border: `1px solid ${segmentationTheme.colors.accentCyan}60`,
              boxShadow: segmentationTheme.effects.tileShadow,
            }}
          >
            <div style={{ color: segmentationTheme.colors.textPrimary, fontSize: '14px' }}>
              <strong>Selected Customer:</strong> {selectedPoint.customer_id}
            </div>
            <div style={{ color: segmentationTheme.colors.textSecondary, fontSize: '13px' }}>
              Segment {selectedPoint.segment}
            </div>
          </motion.div>
        )}
      </div>

      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${segmentationTheme.colors.accentCyan}10 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '150px',
        height: '150px',
        background: `radial-gradient(circle, ${segmentationTheme.colors.accentPurple}10 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* AI Insight Popup */}
      {showAIInsight && aiInsightContent && (
        <div
          style={{
            position: 'fixed',
            left: insightPosition.x,
            top: insightPosition.y,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #1e2738, #2a3447)',
            border: '2px solid rgba(124, 58, 237, 0.5)',
            borderRadius: 12,
            padding: 20,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
            zIndex: 1001,
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f7f9fb', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                {aiInsightContent.emoji} {aiInsightContent.title}
              </div>
              {aiInsightContent.subtitle && (
                <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.7)' }}>
                  {aiInsightContent.subtitle}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAIInsight(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(247, 249, 251, 0.6)',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f7f9fb'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(247, 249, 251, 0.6)'}
            >
              ×
            </button>
          </div>
          
          <div style={{ fontSize: 14, color: 'rgba(247, 249, 251, 0.9)', marginBottom: 12 }}>
            {aiInsightContent.summary}
          </div>
          
          {aiInsightContent.details && (
            <div style={{ marginBottom: 12 }}>
              {aiInsightContent.details.map((detail: string, idx: number) => (
                <div key={idx} style={{ fontSize: 12, color: 'rgba(247, 249, 251, 0.8)', marginBottom: 4 }}>
                  {detail}
                </div>
              ))}
            </div>
          )}
          
          {/* Answer Display */}
          {questionAnswer && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              animation: 'fadeInScale 0.3s ease-out'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 8 }}>
                🤖 AI Answer
              </div>
              <div style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.9)', marginBottom: 6 }}>
                <strong>Q:</strong> {questionAnswer.question}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.85)', lineHeight: 1.4 }}>
                <strong>A:</strong> {isAnswering ? (
                  <span style={{ color: '#8b5cf6' }}>Analyzing segment data...</span>
                ) : (
                  questionAnswer.answer
                )}
              </div>
              {!isAnswering && (
                <button
                  onClick={() => setQuestionAnswer(null)}
                  style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 4,
                    color: 'rgba(139, 92, 246, 0.9)',
                    fontSize: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                  }}
                >
                  Clear Answer
                </button>
              )}
            </div>
          )}
          
          {/* Key Questions */}
          {aiInsightContent.questions && !questionAnswer && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 6,
              padding: 8,
              marginBottom: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(139, 92, 246, 0.9)', marginBottom: 6 }}>
                💡 Key Questions
              </div>
              {aiInsightContent.questions.map((question: string, idx: number) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: 11, 
                    color: 'rgba(247, 249, 251, 0.8)', 
                    marginBottom: 3,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={async (e) => {
                    e.stopPropagation();
                    
                    // Answer the question directly instead of sending to chatbot
                    setIsAnswering(true);
                    setQuestionAnswer({ question, answer: 'Analyzing...' });
                    
                    try {
                      // Use the customer agent to answer questions about segments
                      const response = await agentCommunication.sendToAgent('customer', {
                        query: question,
                        context: {
                          title: aiInsightContent.title,
                          summary: aiInsightContent.summary,
                          details: aiInsightContent.details
                        }
                      });
                      
                      if (response.success) {
                        setQuestionAnswer({ question, answer: response.response });
                      } else {
                        setQuestionAnswer({ question, answer: 'Unable to analyze segment data.' });
                      }
                    } catch (error) {
                      console.error('Error answering question:', error);
                      setQuestionAnswer({ question, answer: 'An error occurred while analyzing the data.' });
                    } finally {
                      setIsAnswering(false);
                    }
                  }}
                >
                  • {question}
                </div>
              ))}
            </div>
          )}
          
          {/* Recommended Actions */}
          {aiInsightContent.actions && (
            <div style={{
              background: 'rgba(0, 230, 118, 0.1)',
              border: '1px solid rgba(0, 230, 118, 0.3)',
              borderRadius: 6,
              padding: 8
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#00e676', marginBottom: 6 }}>
                ⚡ Recommended Actions
              </div>
              {aiInsightContent.actions.map((action: string, idx: number) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: 11, 
                    color: 'rgba(247, 249, 251, 0.8)', 
                    marginBottom: 3,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 3,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 230, 118, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Just close the AI insight popup - actions are for display only
                    setShowAIInsight(false);
                  }}
                >
                  • {action}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ fontSize: 11, color: 'rgba(247, 249, 251, 0.6)', marginTop: 12, textAlign: 'center' }}>
            Press <strong>Shift+Click</strong> for multi-selection
          </div>
        </div>
      )}
    </motion.div>
    </>
  );
};

export default EnhancedSegmentDistributionMap;