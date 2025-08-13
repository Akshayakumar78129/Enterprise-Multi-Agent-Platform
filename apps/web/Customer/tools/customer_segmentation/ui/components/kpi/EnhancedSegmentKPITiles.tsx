import React from 'react';
import { motion } from 'framer-motion';
import { segmentationTheme } from '../../styles/theme';

interface KPIData {
  totalSegments: number;
  segmentationQuality: number;
  largestSegment: { name: string; percentage: number };
  mostValuableSegment: { name: string; avgSpend: number };
  segmentStability: number;
}

interface EnhancedSegmentKPITilesProps {
  kpis: KPIData;
}

const EnhancedSegmentKPITiles: React.FC<EnhancedSegmentKPITilesProps> = ({ kpis }) => {
  const tiles = [
    {
      title: 'Total Segments',
      value: kpis.totalSegments || 0,
      subtitle: 'Customer Segments',
      color: segmentationTheme.colors.accentCyan,
      icon: '📊',
      trend: null,
    },
    {
      title: 'Segmentation Quality',
      value: `${kpis.segmentationQuality || 0}`,
      subtitle: 'Cluster Validity',
      color: segmentationTheme.colors.accentPurple,
      icon: '✨',
      trend: kpis.segmentationQuality > 80 ? 'excellent' : kpis.segmentationQuality > 60 ? 'good' : 'fair',
    },
    {
      title: 'Largest Segment',
      value: `${kpis.largestSegment?.percentage || 0}%`,
      subtitle: kpis.largestSegment?.name || 'N/A',
      color: segmentationTheme.colors.segment1,
      icon: '👥',
      trend: kpis.largestSegment?.percentage > 50 ? 'warning' : null,
    },
    {
      title: 'Most Valuable',
      value: kpis.mostValuableSegment?.name || 'N/A',
      subtitle: `$${kpis.mostValuableSegment?.avgSpend?.toLocaleString() || 0} avg`,
      color: segmentationTheme.colors.segment2,
      icon: '💎',
      trend: 'up',
    },
    {
      title: 'Segment Stability',
      value: `${kpis.segmentStability || 0}%`,
      subtitle: 'Customer Retention',
      color: segmentationTheme.colors.success,
      icon: '🔒',
      trend: kpis.segmentStability > 90 ? 'high' : kpis.segmentStability > 70 ? 'medium' : 'low',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: segmentationTheme.spacing.lg,
      marginBottom: segmentationTheme.spacing.xl,
    }}>
      {tiles.map((tile, index) => (
        <motion.div
          key={tile.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ 
            y: -12, 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          style={{
            background: segmentationTheme.gradients.container,
            backdropFilter: segmentationTheme.effects.backdropBlur,
            WebkitBackdropFilter: segmentationTheme.effects.backdropBlur,
            borderRadius: segmentationTheme.borderRadius.xl,
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            boxShadow: segmentationTheme.effects.tileShadow,
            padding: segmentationTheme.spacing.lg,
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            minHeight: '140px',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${tile.color}, ${tile.color}80)`,
          }} />
          
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            fontSize: '48px',
            opacity: 0.1,
          }}>
            {tile.icon}
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '12px',
              color: segmentationTheme.colors.textTertiary,
              marginBottom: segmentationTheme.spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {tile.title}
            </div>
            
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: segmentationTheme.colors.textPrimary,
              marginBottom: segmentationTheme.spacing.xs,
              background: `linear-gradient(135deg, ${tile.color}, ${segmentationTheme.colors.textPrimary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {tile.value}
            </div>
            
            <div style={{
              fontSize: '14px',
              color: segmentationTheme.colors.textSecondary,
            }}>
              {tile.subtitle}
            </div>
            
            {tile.trend && (
              <div style={{
                position: 'absolute',
                top: segmentationTheme.spacing.md,
                right: segmentationTheme.spacing.md,
                padding: '4px 8px',
                borderRadius: segmentationTheme.borderRadius.sm,
                background: tile.trend === 'up' || tile.trend === 'excellent' || tile.trend === 'high' 
                  ? `${segmentationTheme.colors.success}20`
                  : tile.trend === 'warning' || tile.trend === 'medium'
                  ? `${segmentationTheme.colors.warning}20`
                  : `${segmentationTheme.colors.error}20`,
                color: tile.trend === 'up' || tile.trend === 'excellent' || tile.trend === 'high'
                  ? segmentationTheme.colors.success
                  : tile.trend === 'warning' || tile.trend === 'medium'
                  ? segmentationTheme.colors.warning
                  : segmentationTheme.colors.error,
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {tile.trend}
              </div>
            )}
          </div>
          
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            right: '-50px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${tile.color}15 0%, transparent 70%)`,
          }} />
        </motion.div>
      ))}
    </div>
  );
};

export default EnhancedSegmentKPITiles;