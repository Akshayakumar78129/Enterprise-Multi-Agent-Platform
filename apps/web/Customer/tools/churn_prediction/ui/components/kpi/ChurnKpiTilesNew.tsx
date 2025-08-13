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
  delay = 0,
  icon = '📊'
}: {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  onClick?: (event: React.MouseEvent) => void;
  delay?: number;
  icon?: string;
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
      case 'up': return '📈';
      case 'down': return '📉';
      case 'neutral': return '➡️';
      default: return '';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#22c55e';
      case 'down': return '#ef4444';
      case 'neutral': return '#eab308';
      default: return color;
    }
  };

  const displayValue = typeof value === 'number' ? animatedValue : value;

  return (
    <div
      style={{
        minWidth: 200,
        height: 160,
        background: isHovered 
          ? `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)`
          : `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)`,
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1e293b',
        fontFamily: 'Inter, sans-serif',
        boxShadow: isHovered 
          ? `0 20px 60px rgba(0, 0, 0, 0.1), 0 0 40px ${color}20`
          : `0 10px 30px rgba(0, 0, 0, 0.05), 0 0 20px ${color}10`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isVisible 
          ? (isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)')
          : 'translateY(20px) scale(0.95)',
        opacity: isVisible ? 1 : 0,
        border: isHovered ? `2px solid ${color}60` : `1px solid ${color}20`,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background glow effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 50% 50%, ${color}08 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Icon */}
      <div style={{
        fontSize: 32,
        marginBottom: 8,
        transform: isVisible ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-180deg)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${delay + 200}ms`
      }}>
        {icon}
      </div>

      {/* Value */}
      <div style={{
        fontSize: 36,
        fontWeight: 800,
        marginBottom: 4,
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${delay + 400}ms`
      }}>
        {displayValue}{typeof value === 'number' && label.includes('%') ? '%' : ''}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: trend ? 8 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: `${delay + 600}ms`
      }}>
        {label}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          color: getTrendColor(),
          background: `${getTrendColor()}15`,
          padding: '4px 8px',
          borderRadius: 12,
          border: `1px solid ${getTrendColor()}30`,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.8)',
          opacity: isVisible ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transitionDelay: `${delay + 800}ms`
        }}>
          <span>{getTrendIcon()}</span>
          <span>{trend.charAt(0).toUpperCase() + trend.slice(1)}</span>
        </div>
      )}

      {/* Hover glow effect */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: `linear-gradient(135deg, ${color}20, transparent)`,
          borderRadius: 22,
          pointerEvents: 'none',
          animation: 'pulse 2s infinite'
        }} />
      )}
    </div>
  );
};

export default function ChurnKpiTilesNew({ kpis, onKpiClick }: ChurnKpiTilesProps) {
  const kpiData = [
    {
      label: 'Overall Risk Score',
      value: kpis.overallRisk,
      color: '#ef4444',
      trend: 'up' as const,
      icon: '⚠️',
      key: 'overallRisk'
    },
    {
      label: 'High Risk Customers',
      value: kpis.highRiskCount,
      color: '#f97316',
      trend: 'neutral' as const,
      icon: '👥',
      key: 'highRiskCount'
    },
    {
      label: 'Model Confidence',
      value: Math.round(kpis.modelConfidence * 100),
      color: '#22c55e',
      trend: 'up' as const,
      icon: '🎯',
      key: 'modelConfidence'
    },
    {
      label: 'Risk Transitions',
      value: kpis.riskTransition,
      color: '#8b5cf6',
      trend: 'down' as const,
      icon: '🔄',
      key: 'riskTransition'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: 24,
      padding: '0 16px'
    }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}
      </style>
      {kpiData.map((kpi, index) => (
        <KpiTile
          key={kpi.key}
          value={kpi.value}
          label={kpi.label}
          color={kpi.color}
          trend={kpi.trend}
          icon={kpi.icon}
          delay={index * 150}
          onClick={(e) => onKpiClick?.(kpi.key, kpi.value, e)}
        />
      ))}
    </div>
  );
}