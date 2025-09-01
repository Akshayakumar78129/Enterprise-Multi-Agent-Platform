import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, ZAxis } from 'recharts';
import { selectCustomer } from '../../state/arAgingSlice';

export const CustomerPortfolioMatrix: React.FC = () => {
  const dispatch = useDispatch();
  const { customerRisks } = useSelector((state: any) => state.arAging);
  const [hoveredCustomer, setHoveredCustomer] = useState<string | null>(null);

  const chartData = useMemo(() => {
    return customerRisks.map((customer: any) => ({
      x: customer.clv,
      y: customer.paymentRiskScore,
      z: customer.outstandingAmount,
      name: customer.customerName,
      id: customer.customerId,
      segment: customer.segment,
      daysPastDue: customer.daysPastDue,
      profitability: customer.profitability
    }));
  }, [customerRisks]);

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Strategic Partners': return '#00e0ff';
      case 'Growth Opportunities': return '#ffc145';
      case 'Efficiency Targets': return '#5fd4d6';
      case 'Value Destroyers': return '#e930ff';
      default: return '#8892a8';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          backgroundColor: '#1e2738',
          border: `1px solid ${getSegmentColor(data.segment)}60`,
          borderRadius: 1,
          p: 1.5,
          minWidth: 200
        }}>
          <Typography sx={{ color: '#f7f9fb', fontSize: 13, fontWeight: 600, mb: 1 }}>
            {data.name}
          </Typography>
          <Box sx={{ fontSize: 11, color: '#8892a8' }}>
            <div>CLV: ${(data.x / 1000).toFixed(0)}K</div>
            <div>Risk Score: {data.y.toFixed(1)}</div>
            <div>Outstanding: ${(data.z / 1000).toFixed(0)}K</div>
            <div>Days Past Due: {data.daysPastDue}</div>
            <div style={{ color: getSegmentColor(data.segment), marginTop: 4 }}>
              Segment: {data.segment}
            </div>
          </Box>
        </Box>
      );
    }
    return null;
  };

  const quadrants = [
    { name: 'Strategic Partners', x: 75, y: 25, color: '#00e0ff' },
    { name: 'Growth Opportunities', x: 75, y: 75, color: '#ffc145' },
    { name: 'Efficiency Targets', x: 25, y: 25, color: '#5fd4d6' },
    { name: 'Value Destroyers', x: 25, y: 75, color: '#e930ff' }
  ];

  return (
    <Box>
      <Typography sx={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: '#f7f9fb',
        mb: 2
      }}>
        Customer Portfolio Value Matrix
      </Typography>

      {/* Matrix Chart */}
      <Box sx={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232a36" />
            <XAxis 
              type="number"
              dataKey="x"
              name="Customer Lifetime Value"
              tick={{ fill: '#8892a8', fontSize: 11 }}
              label={{ value: 'Customer Lifetime Value (CLV)', position: 'insideBottom', offset: -10, fill: '#8892a8', fontSize: 12 }}
              domain={[0, 'dataMax']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <YAxis 
              type="number"
              dataKey="y"
              name="Payment Risk Score"
              tick={{ fill: '#8892a8', fontSize: 11 }}
              label={{ value: 'Payment Risk Score', angle: -90, position: 'insideLeft', fill: '#8892a8', fontSize: 12 }}
              domain={[0, 100]}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[50, 400]}
              name="Outstanding Amount"
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Scatter
              name="Customers"
              data={chartData}
              onMouseEnter={(data: any) => setHoveredCustomer(data.id)}
              onMouseLeave={() => setHoveredCustomer(null)}
              onClick={(data: any) => dispatch(selectCustomer(data.id))}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={getSegmentColor(entry.segment)}
                  fillOpacity={hoveredCustomer === null || hoveredCustomer === entry.id ? 0.8 : 0.3}
                  stroke={hoveredCustomer === entry.id ? '#fff' : 'none'}
                  strokeWidth={2}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels */}
        {quadrants.map((quadrant) => (
          <Box
            key={quadrant.name}
            sx={{
              position: 'absolute',
              top: quadrant.y < 50 ? '25%' : '55%',
              left: quadrant.x < 50 ? '15%' : '60%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            <Typography sx={{
              fontSize: 11,
              color: quadrant.color,
              fontWeight: 600,
              opacity: 0.6,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {quadrant.name}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Strategic Actions */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontSize: 14, color: '#8892a8', mb: 2 }}>
          Strategic Actions by Segment
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Paper sx={{ 
            p: 1.5, 
            backgroundColor: '#232a36',
            border: '1px solid #00e0ff40',
            flex: '1 1 45%'
          }}>
            <Typography sx={{ fontSize: 12, color: '#00e0ff', fontWeight: 600, mb: 0.5 }}>
              Strategic Partners
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#8892a8' }}>
              Expand credit, premium service
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 1.5, 
            backgroundColor: '#232a36',
            border: '1px solid #ffc14540',
            flex: '1 1 45%'
          }}>
            <Typography sx={{ fontSize: 12, color: '#ffc145', fontWeight: 600, mb: 0.5 }}>
              Growth Opportunities
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#8892a8' }}>
              Credit insurance, intensive management
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 1.5, 
            backgroundColor: '#232a36',
            border: '1px solid #5fd4d640',
            flex: '1 1 45%'
          }}>
            <Typography sx={{ fontSize: 12, color: '#5fd4d6', fontWeight: 600, mb: 0.5 }}>
              Efficiency Targets
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#8892a8' }}>
              Automate, standardize terms
            </Typography>
          </Paper>
          
          <Paper sx={{ 
            p: 1.5, 
            backgroundColor: '#232a36',
            border: '1px solid #e930ff40',
            flex: '1 1 45%'
          }}>
            <Typography sx={{ fontSize: 12, color: '#e930ff', fontWeight: 600, mb: 0.5 }}>
              Value Destroyers
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#8892a8' }}>
              Exit strategy, COD conversion
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Portfolio Metrics */}
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        backgroundColor: '#232a36',
        borderRadius: 1
      }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: 11, color: '#8892a8', mb: 0.5 }}>
              Concentration Risk (HHI)
            </Typography>
            <Typography sx={{ fontSize: 16, color: '#ffc145', fontWeight: 600 }}>
              2,145
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: 11, color: '#8892a8', mb: 0.5 }}>
              Portfolio VaR (95%)
            </Typography>
            <Typography sx={{ fontSize: 16, color: '#e930ff', fontWeight: 600 }}>
              $1.2M
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

import Grid from '@mui/material/Grid';

export default CustomerPortfolioMatrix;