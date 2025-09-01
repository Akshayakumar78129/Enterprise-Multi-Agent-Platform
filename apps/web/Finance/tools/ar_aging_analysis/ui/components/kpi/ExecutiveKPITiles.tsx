import React from 'react';
import { Box, Grid } from '@mui/material';
import { useSelector } from 'react-redux';
import { TrendingUp, TrendingDown, Warning, CheckCircle } from '@mui/icons-material';

interface KPITileProps {
  title: string;
  value: string | number;
  subtitle: string;
  change?: number;
  status: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

const KPITile: React.FC<KPITileProps> = ({ title, value, subtitle, change, status, icon }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return '#00e0ff';
      case 'warning': return '#ffc145';
      case 'critical': return '#e930ff';
      default: return '#5fd4d6';
    }
  };

  const getTrendIcon = () => {
    if (!change) return null;
    if (change > 0) return <TrendingUp sx={{ fontSize: 16, color: '#00e0ff' }} />;
    if (change < 0) return <TrendingDown sx={{ fontSize: 16, color: '#e930ff' }} />;
    return null;
  };

  return (
    <Box sx={{
      width: 240,
      height: 120,
      backgroundColor: '#232a36',
      border: `1px solid ${getStatusColor()}40`,
      borderRadius: 2,
      p: 2,
      position: 'relative',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${getStatusColor()}20`
      }
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ 
          fontSize: '11px', 
          color: '#8892a8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 600
        }}>
          {title}
        </Box>
        {icon}
      </Box>
      
      <Box sx={{ 
        fontSize: '32px', 
        fontWeight: 600,
        color: '#f7f9fb',
        lineHeight: 1,
        mb: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        {value}
        {getTrendIcon()}
      </Box>
      
      <Box sx={{ 
        fontSize: '12px', 
        color: getStatusColor(),
        display: 'flex',
        alignItems: 'center',
        gap: 0.5
      }}>
        {subtitle}
        {change && (
          <span style={{ color: change > 0 ? '#00e0ff' : '#e930ff' }}>
            ({change > 0 ? '+' : ''}{change}%)
          </span>
        )}
      </Box>
    </Box>
  );
};

export const ExecutiveKPITiles: React.FC = () => {
  const kpis = useSelector((state: any) => state.arAging.kpis);

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item>
        <KPITile
          title="Working Capital ROI"
          value={`${kpis.workingCapitalROI.value}%`}
          subtitle="vs. 10% cost of capital"
          change={kpis.workingCapitalROI.change}
          status={kpis.workingCapitalROI.status}
          icon={
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#00e0ff20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp sx={{ fontSize: 18, color: '#00e0ff' }} />
            </Box>
          }
        />
      </Grid>

      <Grid item>
        <KPITile
          title="Economic Value Lost"
          value={`$${(kpis.economicValueLost.value / 1000000).toFixed(1)}M`}
          subtitle="Monthly value erosion"
          change={kpis.economicValueLost.change}
          status={kpis.economicValueLost.status}
          icon={
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#e930ff20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Warning sx={{ fontSize: 18, color: '#e930ff' }} />
            </Box>
          }
        />
      </Grid>

      <Grid item>
        <KPITile
          title="Cash Velocity Score"
          value={kpis.cashVelocityScore.value}
          subtitle="vs. top quartile: 75"
          change={kpis.cashVelocityScore.change}
          status={kpis.cashVelocityScore.status}
          icon={
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#5fd4d620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 3s linear infinite'
            }}>
              <Box sx={{ 
                width: 18, 
                height: 18, 
                border: '2px solid #5fd4d6',
                borderTopColor: 'transparent',
                borderRadius: '50%'
              }} />
            </Box>
          }
        />
      </Grid>

      <Grid item>
        <KPITile
          title="Concentration Risk"
          value={kpis.concentrationRisk.value}
          subtitle="Portfolio diversification"
          change={kpis.concentrationRisk.change}
          status={kpis.concentrationRisk.status}
          icon={
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#ffc14520',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{
                width: 16,
                height: 16,
                backgroundColor: '#ffc145',
                borderRadius: 1,
                transform: 'rotate(45deg)'
              }} />
            </Box>
          }
        />
      </Grid>

      <Grid item>
        <KPITile
          title="Collection ROI"
          value={`${kpis.collectionROI.value}:1`}
          subtitle="Return per dollar spent"
          change={kpis.collectionROI.change}
          status={kpis.collectionROI.status}
          icon={
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#00e0ff20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle sx={{ fontSize: 18, color: '#00e0ff' }} />
            </Box>
          }
        />
      </Grid>
    </Grid>
  );
};

export default ExecutiveKPITiles;