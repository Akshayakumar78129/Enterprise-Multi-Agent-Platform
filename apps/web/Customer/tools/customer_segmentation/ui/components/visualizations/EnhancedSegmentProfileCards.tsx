import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { segmentationTheme, getSegmentColor } from '../../styles/theme';
import { handleChartClick } from '../../utils/chartSelectionHelper';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface SegmentProfile {
  segment: number;
  customerCount: number;
  avgSpend: number;
  frequency: number;
  recency: number;
  loyaltyScore: number;
  engagementRate: number;
  regions: string[];
  characteristics: string[];
  recommendations: string[];
}

interface EnhancedSegmentProfileCardsProps {
  segments: SegmentProfile[];
  selectedSegment?: number;
  onSelect?: (segment: number) => void;
}

const EnhancedSegmentProfileCards: React.FC<EnhancedSegmentProfileCardsProps> = ({
  segments,
  selectedSegment,
  onSelect,
}) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [aiInsightContent, setAiInsightContent] = useState<any>(null);
  const [insightPosition, setInsightPosition] = useState({ x: 0, y: 0 });

  const getRadarData = (segment: SegmentProfile) => ({
    labels: ['Spend', 'Frequency', 'Recency', 'Loyalty', 'Engagement'],
    datasets: [
      {
        label: `Segment ${segment.segment}`,
        data: [
          (segment.avgSpend || 0) / 1000, // Normalize for display
          segment.frequency || 0,
          100 - (segment.recency || 0), // Invert recency
          segment.loyaltyScore || 0,
          segment.engagementRate || 0,
        ],
        backgroundColor: `${getSegmentColor(segment.segment - 1)}50`, // Semi-transparent fill
        borderColor: getSegmentColor(segment.segment - 1),
        borderWidth: 4, // Thicker lines for better visibility
        pointBackgroundColor: getSegmentColor(segment.segment - 1),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 3,
        pointRadius: 6, // Larger points
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: getSegmentColor(segment.segment - 1),
        pointHoverBorderWidth: 4,
      },
    ],
  });

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 6,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.3)', // More visible grid lines
          lineWidth: 2,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1.5,
        },
        pointLabels: {
          color: '#ffffff', // White labels for high contrast
          font: {
            size: 13, // Larger font for elderly users
            weight: 'bold',
          },
          padding: 10,
        },
        ticks: {
          display: true,
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 11,
          },
          backdropColor: 'transparent',
          stepSize: 25,
        },
        min: 0,
        max: 100,
      },
    },
  };

  const getValueRating = (value: number) => {
    const stars = Math.round((value / 10000) * 5);
    return '⭐'.repeat(Math.max(1, Math.min(5, stars)));
  };

  const generateSegmentInsight = (segment: SegmentProfile) => {
    const totalCustomers = segments.reduce((acc, s) => acc + (s.customerCount || 0), 0);
    const percentage = totalCustomers > 0 ? ((segment.customerCount || 0) / totalCustomers) * 100 : 0;
    
    const emoji = segment.loyaltyScore > 70 ? '👑' : 
                  segment.engagementRate > 60 ? '🌟' :
                  segment.avgSpend > 5000 ? '💎' :
                  segment.frequency > 5 ? '🚀' : '📊';
    
    return {
      emoji,
      title: `Segment ${segment.segment}`,
      subtitle: `${segment.customerCount} customers (${percentage.toFixed(1)}%)`,
      summary: `This segment has ${segment.customerCount} customers with average spend of $${segment.avgSpend.toFixed(0)}. Loyalty score: ${segment.loyaltyScore}%, Engagement: ${segment.engagementRate}%.`,
      details: [
        `👥 Customer Count: ${segment.customerCount}`,
        `💰 Average Spend: $${segment.avgSpend.toFixed(0)}`,
        `📈 Purchase Frequency: ${segment.frequency}`,
        `⏱️ Recency: ${segment.recency} days`,
        `⭐ Loyalty Score: ${segment.loyaltyScore}%`,
        `📊 Engagement Rate: ${segment.engagementRate}%`
      ],
      questions: [
        'What drives this segment?',
        'How to increase loyalty?',
        'Show purchase patterns',
        'Compare with other segments'
      ],
      actions: [
        'Create targeted campaign',
        'Export customer list',
        'Set up automation',
        'Schedule segment review'
      ],
      characteristics: segment.characteristics,
      recommendations: segment.recommendations
    };
  };

  return (
    <div style={{
      marginBottom: segmentationTheme.spacing.xl,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: segmentationTheme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: segmentationTheme.colors.textPrimary,
        }}>
          Segment Profiles
        </h3>
        <div style={{
          fontSize: '14px',
          color: segmentationTheme.colors.textTertiary,
        }}>
          {segments.length} segments identified
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: segmentationTheme.spacing.lg,
      }}>
        {segments.map((segment, index) => (
          <motion.div
            key={segment.segment}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={(e: React.MouseEvent) => {
              // Send to ChartSelectionManager
              handleChartClick({
                chartId: `segment-card-${segment.segment}`,
                chartType: 'segment-profile',
                label: `Segment ${segment.segment}`,
                value: segment.customerCount,
                unit: 'customers',
                metadata: segment
              }, e);
              
              if (e.shiftKey) {
                // Shift+Click for multi-selection
                const selectionAPI = (window as any).chartSelectionAPI;
                if (selectionAPI) {
                  selectionAPI.addPoint({
                    chartId: 'enhanced-segment-profile',
                    chartType: 'card',
                    dataIndex: index,
                    label: `Segment ${segment.segment}`,
                    value: segment.customerCount,
                    unit: ' customers',
                    coordinates: { x: e.clientX, y: e.clientY }
                  });
                }
              } else {
                // Regular click - just expand card
                setExpandedCard(expandedCard === segment.segment ? null : segment.segment);
                onSelect?.(segment.segment);
              }
            }}
            style={{
              background: `linear-gradient(135deg, ${segmentationTheme.colors.bgPrimary} 0%, ${
                selectedSegment === segment.segment ? segmentationTheme.colors.bgGlass : segmentationTheme.colors.bgSecondary
              } 100%)`,
              backdropFilter: segmentationTheme.effects.backdropBlur,
              WebkitBackdropFilter: segmentationTheme.effects.backdropBlur,
              borderRadius: segmentationTheme.borderRadius.xl,
              border: `2px solid ${
                selectedSegment === segment.segment 
                  ? getSegmentColor(segment.segment - 1) 
                  : 'rgba(255, 255, 255, 0.1)'
              }`,
              boxShadow: selectedSegment === segment.segment 
                ? `${segmentationTheme.effects.glassShadow}, 0 0 30px ${getSegmentColor(segment.segment - 1)}40`
                : segmentationTheme.effects.tileShadow,
              padding: segmentationTheme.spacing.lg,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: segmentationTheme.animation.normal,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: `linear-gradient(90deg, ${getSegmentColor(segment.segment - 1)}, ${getSegmentColor(segment.segment - 1)}60)`,
            }} />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: segmentationTheme.spacing.md,
            }}>
              <div>
                <h4 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: segmentationTheme.colors.textPrimary,
                  marginBottom: segmentationTheme.spacing.xs,
                }}>
                  Segment {segment.segment}
                </h4>
                <div style={{
                  fontSize: '14px',
                  color: segmentationTheme.colors.textSecondary,
                }}>
                  {segment.customerCount || 0} customers ({(() => {
                    const total = segments.reduce((acc, s) => acc + (s.customerCount || 0), 0);
                    const percentage = total > 0 ? ((segment.customerCount || 0) / total) * 100 : 0;
                    return percentage.toFixed(1);
                  })()}%)
                </div>
                <div style={{
                  fontSize: '13px',
                  color: getSegmentColor(segment.segment - 1),
                  marginTop: segmentationTheme.spacing.xs,
                }}>
                  {getValueRating(segment.avgSpend || 0)}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: segmentationTheme.spacing.xs,
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: `${segmentationTheme.colors.accentCyan}20`,
                    border: 'none',
                    borderRadius: segmentationTheme.borderRadius.sm,
                    color: segmentationTheme.colors.accentCyan,
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Export
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    background: `${segmentationTheme.colors.accentPurple}20`,
                    border: 'none',
                    borderRadius: segmentationTheme.borderRadius.sm,
                    color: segmentationTheme.colors.accentPurple,
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Target
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: segmentationTheme.spacing.sm,
              marginBottom: segmentationTheme.spacing.md,
            }}>
              {[
                { 
                  label: 'Avg Spend', 
                  value: `$${(segment.avgSpend || 0).toLocaleString()}`,
                  indicator: segment.avgSpend > 500 ? '🟢' : segment.avgSpend > 200 ? '🟡' : '🔴'
                },
                { 
                  label: 'Frequency', 
                  value: `${segment.frequency || 0}/mo`,
                  indicator: segment.frequency > 7 ? '🟢' : segment.frequency > 4 ? '🟡' : '🔴'
                },
                { 
                  label: 'Recency', 
                  value: `${segment.recency || 0} days`,
                  indicator: segment.recency < 10 ? '🟢' : segment.recency < 20 ? '🟡' : '🔴'
                },
                { 
                  label: 'Loyalty', 
                  value: `${segment.loyaltyScore || 0}%`,
                  indicator: segment.loyaltyScore > 80 ? '🟢' : segment.loyaltyScore > 60 ? '🟡' : '🔴'
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  style={{
                    background: 'rgba(10, 18, 36, 0.6)',
                    borderRadius: segmentationTheme.borderRadius.md,
                    padding: segmentationTheme.spacing.sm,
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    color: segmentationTheme.colors.textTertiary,
                    marginBottom: '4px',
                  }}>
                    {metric.label}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: getSegmentColor(segment.segment - 1),
                    }}>
                      {metric.value}
                    </div>
                    <span style={{ fontSize: '14px' }}>{metric.indicator}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              height: '200px',
              marginBottom: segmentationTheme.spacing.md,
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '10px',
              position: 'relative',
              boxShadow: `0 0 20px ${getSegmentColor(segment.segment - 1)}30`,
              border: `1px solid ${getSegmentColor(segment.segment - 1)}40`,
            }}>
              <Radar data={getRadarData(segment)} options={radarOptions} />
            </div>

            <AnimatePresence>
              {expandedCard === segment.segment && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
                    paddingTop: segmentationTheme.spacing.md,
                    marginTop: segmentationTheme.spacing.md,
                  }}>
                    <div style={{ marginBottom: segmentationTheme.spacing.md }}>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: segmentationTheme.colors.textPrimary,
                        marginBottom: segmentationTheme.spacing.sm,
                      }}>
                        Key Characteristics
                      </h5>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        fontSize: '13px',
                        color: segmentationTheme.colors.textSecondary,
                      }}>
                        {(segment.characteristics || []).slice(0, 3).map((char, i) => (
                          <li key={i}>{char}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: segmentationTheme.colors.textPrimary,
                        marginBottom: segmentationTheme.spacing.sm,
                      }}>
                        Marketing Recommendations
                      </h5>
                      {(segment.recommendations || []).slice(0, 2).map((rec, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'rgba(124, 58, 237, 0.1)',
                            borderLeft: `3px solid ${segmentationTheme.colors.accentPurple}`,
                            borderRadius: segmentationTheme.borderRadius.sm,
                            padding: segmentationTheme.spacing.sm,
                            marginBottom: segmentationTheme.spacing.xs,
                            fontSize: '12px',
                            color: segmentationTheme.colors.textSecondary,
                          }}
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{
              position: 'absolute',
              bottom: '-30px',
              right: '-30px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${getSegmentColor(segment.segment - 1)}20 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
          </motion.div>
        ))}
      </div>

      {/* AI Insight Popup removed - using ChartSelectionManager instead */}
      {false && (
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
          
          {/* Key Questions */}
          {aiInsightContent.questions && (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                      (window as any).addAIInsightToChat({
                        label: `${aiInsightContent.title} - Question`,
                        value: question,
                        actionType: 'question'
                      });
                    }
                    setShowAIInsight(false);
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
                    if (typeof window !== 'undefined' && (window as any).addAIInsightToChat) {
                      (window as any).addAIInsightToChat({
                        label: `${aiInsightContent.title} - Action`,
                        value: `Execute: ${action}`,
                        actionType: 'execute'
                      });
                    }
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
    </div>
  );
};

export default EnhancedSegmentProfileCards;