import React, { useState, useEffect } from 'react';
import { ChurnKPI } from '../../types';

interface ChurnKpiTilesProps {
  kpis: ChurnKPI;
  onKpiClick?: (kpiType: string, value: any, event: React.MouseEvent) => void;
}

const KpiTile = ({ 
  value, 
  label, 
  trend, 
  color = '#3b82f6',
  onClick,
  delay = 0
}: {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  onClick?: (event: React.MouseEvent) => void;
  delay?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Animate the value if it's a number
      if (typeof value === 'number') {
        let start = 0;
        const end = value;
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          
          setAnimatedValue(Math.round(start + (end - start) * easeOutQuart));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'neutral': return '→';
      default: return '';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#39ff14';
      case 'down': return '#ff1f4f';
      case 'neutral': return '#ffb800';
      default: return color;
    }
  };

  return (
    <div
      style={{
        minWidth: 200,
        height: 160,
        background: isHovered 
          ? `linear-gradient(135deg, rgba(30, 39, 56, 0.95) 0%, rgba(60, 68, 89, 0.95) 100%)`
          : `linear-gradient(135deg, rgba(30, 39, 56, 0.8) 0%, rgba(35, 42, 54, 0.8) 100%)`,
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f7f9fb',
        fontFamily: 'Inter, sans-serif',
        boxShadow: isHovered 
          ? `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px ${color}30, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
          : `0 10px 30px rgba(0, 0, 0, 0.2), 0 0 20px ${color}20`,
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        border: isHovered ? `2px solid ${color}80` : `1px solid rgba(255, 255, 255, 0.1)`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => onClick?.(e)}
    >
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 30% 20%, ${color}15 0%, transparent 50%), radial-gradient(circle at 70% 80%, ${color}10 0%, transparent 50%)`,
        opacity: isHovered ? 1 : 0.6,
        transition: 'opacity 0.4s ease'
      }} />
      
      {/* Glowing border effect */}
      <div style={{
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        background: `linear-gradient(45deg, ${color}40, transparent, ${color}40)`,
        borderRadius: 22,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: -1
      }} />
      
      {/* Trend indicator with enhanced styling */}
      {trend && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          fontSize: 20,
          color: getTrendColor(),
          zIndex: 2,
          background: `${getTrendColor()}20`,
          borderRadius: '50%',
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${getTrendColor()}40`,
          boxShadow: `0 0 15px ${getTrendColor()}30`
        }}>
          {getTrendIcon()}
        </div>
      )}
      
      {/* Main content with enhanced typography */}
      <div style={{ 
        fontSize: typeof value === 'string' && value.length > 8 ? 24 : 36, 
        fontWeight: 900,
        color: color,
        marginBottom: 12,
        zIndex: 1,
        textAlign: 'center',
        textShadow: `0 0 20px ${color}40`,
        filter: `drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))`
      }}>
        {value}
      </div>
      
      <div style={{ 
        fontSize: 13, 
        opacity: 0.95,
        fontWeight: 600,
        textAlign: 'center',
        lineHeight: 1.4,
        zIndex: 1,
        maxWidth: '90%',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      
      {/* Bottom accent line */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
        opacity: isHovered ? 1 : 0.5,
        transition: 'opacity 0.4s ease'
      }} />
    </div>
  );
};

export default function ChurnKpiTiles({ kpis, onKpiClick }: ChurnKpiTilesProps) {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 24,
      marginBottom: 40,
      padding: '0 8px'
    }}>
      <KpiTile
        value={`${kpis.overallRisk}%`}
        label="🎯 Overall Churn Risk"
        trend={kpis.overallRisk > 50 ? "up" : "down"}
        color="#FF6B6B"
        onClick={(e) => onKpiClick?.('overallRisk', kpis.overallRisk, e)}
      />
      <KpiTile
        value={kpis.highRiskCount}
        label="⚠️ Critical Risk Customers"
        trend="down"
        color="#FF8E53"
        onClick={(e) => onKpiClick?.('highRiskCount', kpis.highRiskCount, e)}
      />
      <KpiTile
        value={`${(kpis.modelConfidence * 100).toFixed(1)}%`}
        label="🤖 AI Model Accuracy"
        trend="up"
        color="#4ECDC4"
        onClick={(e) => onKpiClick?.('modelConfidence', kpis.modelConfidence, e)}
      />
      <KpiTile
        value={kpis.topFactor}
        label="📊 Primary Risk Factor"
        color="#45B7D1"
        onClick={(e) => onKpiClick?.('topFactor', kpis.topFactor, e)}
      />
      <KpiTile
        value={`+${kpis.riskTransition}`}
        label="📈 Risk Transitions (24h)"
        trend="up"
        color="#96CEB4"
        onClick={(e) => onKpiClick?.('riskTransition', kpis.riskTransition, e)}
      />
    </div>
  );
} 