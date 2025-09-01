import React, { useMemo, useState } from 'react';
import { Box, Typography, Slider, Tooltip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { setWACC } from '../../state/arAgingSlice';

export const NPVAdjustedPortfolio: React.FC = () => {
  const dispatch = useDispatch();
  const { agingBuckets, wacc } = useSelector((state: any) => state.arAging);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return agingBuckets.map((bucket: any, index: number) => ({
      name: bucket.range,
      grossValue: bucket.amount,
      npvAdjusted: bucket.npvAdjustedAmount,
      valueErosion: bucket.valueErosion,
      carryingCost: bucket.amount * (wacc / 100) * (index * 30 / 365),
      color: bucket.color
    }));
  }, [agingBuckets, wacc]);

  const totalValueLost = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.valueErosion + item.carryingCost, 0);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: '#1e2738',
          border: '1px solid #00e0ff40',
          borderRadius: 1,
          p: 1.5
        }}>
          <Typography sx={{ color: '#f7f9fb', fontSize: 12, fontWeight: 600, mb: 0.5 }}>
            {data.name}
          </Typography>
          <Box sx={{ fontSize: 11, color: '#8892a8' }}>
            <div>Gross Value: ${(data.grossValue / 1000).toFixed(0)}K</div>
            <div style={{ color: '#00e0ff' }}>NPV Adjusted: ${(data.npvAdjusted / 1000).toFixed(0)}K</div>
            <div style={{ color: '#e930ff' }}>Value Erosion: -${(data.valueErosion / 1000).toFixed(0)}K</div>
            <div style={{ color: '#ffc145' }}>Carrying Cost: -${(data.carryingCost / 1000).toFixed(0)}K</div>
          </Box>
        </Box>
      );
    }
    return null;
  };

  const getBarColor = (index: number) => {
    if (index === 0) return '#00e0ff'; // 0-30 days - Value creating
    if (index === 1) return '#5fd4d6'; // 31-45 days - Break-even
    if (index === 2) return '#ffc145'; // 46-60 days - Value eroding
    return '#e930ff'; // 60+ days - Value destroying
  };

  return (
    <Box>
      <Typography sx={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: '#f7f9fb',
        mb: 2
      }}>
        NPV-Adjusted AR Portfolio Analysis
      </Typography>

      {/* WACC Adjustment Slider */}
      <Box sx={{ mb: 3, px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 12, color: '#8892a8' }}>
            Cost of Capital (WACC)
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#00e0ff', fontWeight: 600 }}>
            {wacc}%
          </Typography>
        </Box>
        <Slider
          value={wacc}
          onChange={(_, value) => dispatch(setWACC(value as number))}
          min={8}
          max={15}
          step={0.5}
          sx={{
            color: '#00e0ff',
            '& .MuiSlider-thumb': {
              backgroundColor: '#00e0ff',
              '&:hover': {
                boxShadow: '0 0 12px #00e0ff60'
              }
            },
            '& .MuiSlider-track': {
              backgroundColor: '#00e0ff'
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#232a36'
            }
          }}
        />
      </Box>

      {/* Economic Value Waterfall Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232a36" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#8892a8', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fill: '#8892a8', fontSize: 11 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: 11 }}>{value}</span>
            )}
          />
          
          <Bar 
            dataKey="grossValue" 
            name="Gross AR Value"
            fill="#5fd4d6"
            opacity={0.6}
          />
          <Bar 
            dataKey="npvAdjusted" 
            name="NPV Adjusted"
            onMouseEnter={(_, index) => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {chartData.map((entry: any, index: number) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index)}
                opacity={hoveredBar === null || hoveredBar === index ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Value Destruction Metrics */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        backgroundColor: '#232a36',
        borderRadius: 1,
        border: '1px solid #e930ff40'
      }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8', mb: 0.5 }}>
                Total Economic Value Lost
              </Typography>
              <Typography sx={{ fontSize: 20, color: '#e930ff', fontWeight: 600 }}>
                ${(totalValueLost / 1000000).toFixed(2)}M
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8', mb: 0.5 }}>
                Daily Value Erosion
              </Typography>
              <Typography sx={{ fontSize: 20, color: '#ffc145', fontWeight: 600 }}>
                ${(totalValueLost / 30 / 1000).toFixed(0)}K
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8', mb: 0.5 }}>
                ROIC Impact
              </Typography>
              <Typography sx={{ fontSize: 20, color: '#00e0ff', fontWeight: 600 }}>
                -2.3%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

// Fix for Grid import
import Grid from '@mui/material/Grid';

export default NPVAdjustedPortfolio;