import React, { useState } from 'react';
import { Box, Typography, ButtonGroup, Button, Paper, Slider } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { setScenarioMode } from '../../state/arAgingSlice';

export const CollectionForecast: React.FC = () => {
  const dispatch = useDispatch();
  const { collectionForecast, scenarioMode } = useSelector((state: any) => state.arAging);
  const [targetLine, setTargetLine] = useState(85);

  // Generate sample forecast data if not available
  const forecastData = collectionForecast.length > 0 ? collectionForecast : [
    { date: 'Week 1', predictedAmount: 450000, upperBound: 520000, lowerBound: 380000, confidence: 85, target: 500000 },
    { date: 'Week 2', predictedAmount: 680000, upperBound: 780000, lowerBound: 580000, confidence: 82, target: 750000 },
    { date: 'Week 3', predictedAmount: 820000, upperBound: 950000, lowerBound: 690000, confidence: 78, target: 900000 },
    { date: 'Week 4', predictedAmount: 1200000, upperBound: 1400000, lowerBound: 1000000, confidence: 75, target: 1300000 },
    { date: 'Month 2', predictedAmount: 2800000, upperBound: 3200000, lowerBound: 2400000, confidence: 70, target: 3100000 },
    { date: 'Month 3', predictedAmount: 4200000, upperBound: 4800000, lowerBound: 3600000, confidence: 65, target: 4500000 }
  ];

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
            {data.date}
          </Typography>
          <Box sx={{ fontSize: 11, color: '#8892a8' }}>
            <div style={{ color: '#00e0ff' }}>
              Predicted: ${(data.predictedAmount / 1000000).toFixed(2)}M
            </div>
            <div style={{ color: '#5fd4d6' }}>
              Range: ${(data.lowerBound / 1000000).toFixed(2)}M - ${(data.upperBound / 1000000).toFixed(2)}M
            </div>
            <div style={{ color: '#ffc145' }}>
              Target: ${(data.target / 1000000).toFixed(2)}M
            </div>
            <div>Confidence: {data.confidence}%</div>
          </Box>
        </Box>
      );
    }
    return null;
  };

  const scenarios = ['optimistic', 'realistic', 'conservative'] as const;

  return (
    <Box>
      <Typography sx={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: '#f7f9fb',
        mb: 2
      }}>
        Cash Collection Forecast
      </Typography>

      {/* Scenario Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <ButtonGroup variant="outlined" size="small">
          {scenarios.map((scenario) => (
            <Button
              key={scenario}
              onClick={() => dispatch(setScenarioMode(scenario))}
              variant={scenarioMode === scenario ? 'contained' : 'outlined'}
              sx={{
                textTransform: 'capitalize',
                fontSize: 11,
                px: 2,
                backgroundColor: scenarioMode === scenario ? '#00e0ff' : 'transparent',
                color: scenarioMode === scenario ? '#0a1224' : '#00e0ff',
                borderColor: '#00e0ff40',
                '&:hover': {
                  backgroundColor: scenarioMode === scenario ? '#00e0ffcc' : '#00e0ff10'
                }
              }}
            >
              {scenario}
            </Button>
          ))}
        </ButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#8892a8' }}>
            Collection Target: {targetLine}%
          </Typography>
          <Slider
            value={targetLine}
            onChange={(_, value) => setTargetLine(value as number)}
            min={60}
            max={100}
            step={5}
            sx={{
              width: 100,
              color: '#ffc145',
              '& .MuiSlider-thumb': {
                backgroundColor: '#ffc145',
                width: 12,
                height: 12
              },
              '& .MuiSlider-track': {
                backgroundColor: '#ffc145'
              }
            }}
          />
        </Box>
      </Box>

      {/* Forecast Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e0ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00e0ff" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#232a36" />
          <XAxis 
            dataKey="date" 
            tick={{ fill: '#8892a8', fontSize: 11 }}
          />
          <YAxis 
            tick={{ fill: '#8892a8', fontSize: 11 }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: 11 }}>{value}</span>
            )}
          />
          
          {/* Confidence Band */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="none"
            fill="url(#confidenceGradient)"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="none"
            fill="url(#confidenceGradient)"
          />
          
          {/* Forecast Lines */}
          <Line 
            type="monotone" 
            dataKey="predictedAmount" 
            stroke="#00e0ff" 
            strokeWidth={3}
            name="Predicted Collections"
            dot={{ fill: '#00e0ff', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#ffc145" 
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Collection Target"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="upperBound" 
            stroke="#5fd4d6" 
            strokeWidth={1}
            strokeDasharray="2 2"
            name="Upper Bound"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="lowerBound" 
            stroke="#5fd4d6" 
            strokeWidth={1}
            strokeDasharray="2 2"
            name="Lower Bound"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Forecast Accuracy & Gap Analysis */}
      <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ 
          p: 2, 
          backgroundColor: '#232a36',
          border: '1px solid #00e0ff40'
        }}>
          <Typography sx={{ fontSize: 14, color: '#00e0ff', fontWeight: 600, mb: 1 }}>
            Forecast Accuracy
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Historical Accuracy</Typography>
              <Typography sx={{ fontSize: 16, color: '#f7f9fb', fontWeight: 600 }}>84.2%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>MAPE</Typography>
              <Typography sx={{ fontSize: 16, color: '#f7f9fb', fontWeight: 600 }}>12.5%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Model Confidence</Typography>
              <Typography sx={{ fontSize: 16, color: '#00e0ff', fontWeight: 600 }}>78%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Trend Accuracy</Typography>
              <Typography sx={{ fontSize: 16, color: '#5fd4d6', fontWeight: 600 }}>91%</Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ 
          p: 2, 
          backgroundColor: '#232a36',
          border: '1px solid #ffc14540'
        }}>
          <Typography sx={{ fontSize: 14, color: '#ffc145', fontWeight: 600, mb: 1 }}>
            Gap Analysis
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Gap to Target</Typography>
              <Typography sx={{ fontSize: 16, color: '#e930ff', fontWeight: 600 }}>-$1.2M</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Required Rate</Typography>
              <Typography sx={{ fontSize: 16, color: '#f7f9fb', fontWeight: 600 }}>92%</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Days Behind</Typography>
              <Typography sx={{ fontSize: 16, color: '#ffc145', fontWeight: 600 }}>8 days</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: '#8892a8' }}>Recovery Actions</Typography>
              <Typography sx={{ fontSize: 16, color: '#00e0ff', fontWeight: 600 }}>12 req.</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CollectionForecast;