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

  const getRadarData = (segment: SegmentProfile) => ({
    labels: ['Spend', 'Frequency', 'Recency', 'Loyalty', 'Engagement'],
    datasets: [
      {
        label: `Segment ${segment.segment}`,
        data: [
          segment.avgSpend / 1000, // Normalize for display
          segment.frequency,
          100 - segment.recency, // Invert recency
          segment.loyaltyScore,
          segment.engagementRate,
        ],
        backgroundColor: `${getSegmentColor(segment.segment - 1)}30`,
        borderColor: getSegmentColor(segment.segment - 1),
        borderWidth: 2,
        pointBackgroundColor: getSegmentColor(segment.segment - 1),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: getSegmentColor(segment.segment - 1),
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
        enabled: false,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: segmentationTheme.colors.textTertiary,
          font: {
            size: 10,
          },
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  const getValueRating = (value: number) => {
    const stars = Math.round((value / 10000) * 5);
    return '⭐'.repeat(Math.max(1, Math.min(5, stars)));
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
            onClick={() => {
              setExpandedCard(expandedCard === segment.segment ? null : segment.segment);
              onSelect?.(segment.segment);
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
                  {segment.customerCount} customers ({((segment.customerCount / segments.reduce((acc, s) => acc + s.customerCount, 0)) * 100).toFixed(1)}%)
                </div>
                <div style={{
                  fontSize: '13px',
                  color: getSegmentColor(segment.segment - 1),
                  marginTop: segmentationTheme.spacing.xs,
                }}>
                  {getValueRating(segment.avgSpend)}
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
                { label: 'Avg Spend', value: `$${segment.avgSpend.toLocaleString()}` },
                { label: 'Frequency', value: `${segment.frequency}/mo` },
                { label: 'Recency', value: `${segment.recency} days` },
                { label: 'Loyalty', value: `${segment.loyaltyScore}%` },
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
                    fontSize: '16px',
                    fontWeight: '600',
                    color: getSegmentColor(segment.segment - 1),
                  }}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              height: '180px',
              marginBottom: segmentationTheme.spacing.md,
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
                        {segment.characteristics.slice(0, 3).map((char, i) => (
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
                      {segment.recommendations.slice(0, 2).map((rec, i) => (
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
    </div>
  );
};

export default EnhancedSegmentProfileCards;