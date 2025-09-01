import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Drawer, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { selectCustomer } from '../../state/arAgingSlice';
import { Phone, Email, Description, Warning } from '@mui/icons-material';

export const CashConversionProbability: React.FC = () => {
  const dispatch = useDispatch();
  const { customerRisks, agingBuckets } = useSelector((state: any) => state.arAging);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heatMapData = useMemo(() => {
    const bucketRanges = ['0-30', '31-45', '46-60', '61-90', '90+'];
    const topCustomers = customerRisks.slice(0, 15);
    
    return topCustomers.map((customer: any) => {
      const row = {
        customerName: customer.customerName,
        customerId: customer.customerId,
        total: customer.outstandingAmount,
        buckets: bucketRanges.map((range, index) => {
          const amount = Math.random() * customer.outstandingAmount / 5;
          const riskScore = customer.paymentRiskScore + (index * 15);
          return {
            range,
            amount,
            riskScore: Math.min(riskScore, 100),
            probability: Math.max(100 - riskScore, 10)
          };
        })
      };
      return row;
    });
  }, [customerRisks]);

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return '#00e0ff';
    if (riskScore < 50) return '#5fd4d6';
    if (riskScore < 70) return '#ffc145';
    return '#e930ff';
  };

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
    dispatch(selectCustomer(customer.customerId));
  };

  const priorityAccounts = useMemo(() => {
    return customerRisks
      .slice()
      .sort((a: any, b: any) => b.outstandingAmount * b.paymentRiskScore - a.outstandingAmount * a.paymentRiskScore)
      .slice(0, 5);
  }, [customerRisks]);

  return (
    <Box>
      <Typography sx={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: '#f7f9fb',
        mb: 2
      }}>
        Cash Conversion Probability Engine
      </Typography>

      {/* Risk Heat Map */}
      <Box sx={{ 
        overflowX: 'auto',
        overflowY: 'hidden',
        mb: 3
      }}>
        <Box sx={{ minWidth: 600 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', mb: 1 }}>
            <Box sx={{ width: 150, pr: 1 }}>
              <Typography sx={{ fontSize: 11, color: '#8892a8', fontWeight: 600 }}>
                Customer
              </Typography>
            </Box>
            {['0-30 Days', '31-45 Days', '46-60 Days', '61-90 Days', '90+ Days'].map((bucket) => (
              <Box key={bucket} sx={{ width: 80, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 10, color: '#8892a8' }}>
                  {bucket}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Heat Map Rows */}
          {heatMapData.map((row: any) => (
            <Box 
              key={row.customerId}
              sx={{ 
                display: 'flex', 
                mb: 0.5,
                '&:hover': {
                  backgroundColor: '#1e273840'
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 150, 
                  pr: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    color: '#00e0ff'
                  }
                }}
                onClick={() => handleCustomerClick(row)}
              >
                <Typography sx={{ 
                  fontSize: 11, 
                  color: '#f7f9fb',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {row.customerName}
                </Typography>
                <Typography sx={{ fontSize: 9, color: '#8892a8' }}>
                  ${(row.total / 1000).toFixed(0)}K
                </Typography>
              </Box>
              
              {row.buckets.map((bucket: any, index: number) => {
                const cellSize = Math.sqrt(bucket.amount / 1000) * 5;
                return (
                  <Box 
                    key={index}
                    sx={{ 
                      width: 80, 
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <Box
                      sx={{
                        width: Math.max(cellSize, 20),
                        height: Math.max(cellSize, 20),
                        backgroundColor: getRiskColor(bucket.riskScore),
                        opacity: 0.8,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          opacity: 1
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: '#0a1224', fontWeight: 600 }}>
                        {bucket.probability}%
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Collection Priority List */}
      <Paper sx={{ 
        p: 2, 
        backgroundColor: '#232a36',
        border: '1px solid #e930ff40'
      }}>
        <Typography sx={{ fontSize: 14, color: '#f7f9fb', fontWeight: 600, mb: 2 }}>
          Priority Collection Targets
        </Typography>
        <List sx={{ p: 0 }}>
          {priorityAccounts.map((account: any, index: number) => (
            <ListItem 
              key={account.customerId}
              sx={{ 
                px: 0,
                borderBottom: index < priorityAccounts.length - 1 ? '1px solid #1e2738' : 'none'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 12, color: '#f7f9fb' }}>
                      {index + 1}. {account.customerName}
                    </Typography>
                    <Chip 
                      label={`Risk: ${account.paymentRiskScore.toFixed(0)}`}
                      size="small"
                      sx={{ 
                        backgroundColor: getRiskColor(account.paymentRiskScore) + '20',
                        color: getRiskColor(account.paymentRiskScore),
                        fontSize: 10,
                        height: 20
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: '#8892a8' }}>
                      ${(account.outstandingAmount / 1000).toFixed(0)}K • {account.daysPastDue} days past due
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleCustomerClick(account)}
                      sx={{ 
                        fontSize: 10,
                        py: 0.25,
                        px: 1,
                        borderColor: '#00e0ff40',
                        color: '#00e0ff',
                        '&:hover': {
                          borderColor: '#00e0ff',
                          backgroundColor: '#00e0ff10'
                        }
                      }}
                    >
                      Contact
                    </Button>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Customer Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 360,
            backgroundColor: '#232a36',
            color: '#f7f9fb'
          }
        }}
      >
        {selectedCustomer && (
          <Box sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 3 }}>
              {selectedCustomer.customerName}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: '#8892a8', mb: 1 }}>
                Outstanding Amount
              </Typography>
              <Typography sx={{ fontSize: 24, color: '#e930ff', fontWeight: 600 }}>
                ${(selectedCustomer.total / 1000).toFixed(0)}K
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: '#8892a8', mb: 2 }}>
                Collection Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<Phone />}
                  fullWidth
                  variant="contained"
                  sx={{ 
                    backgroundColor: '#00e0ff',
                    color: '#0a1224',
                    '&:hover': {
                      backgroundColor: '#00e0ffcc'
                    }
                  }}
                >
                  Call Customer
                </Button>
                <Button
                  startIcon={<Email />}
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    borderColor: '#00e0ff40',
                    color: '#00e0ff'
                  }}
                >
                  Send Reminder
                </Button>
                <Button
                  startIcon={<Description />}
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    borderColor: '#ffc14540',
                    color: '#ffc145'
                  }}
                >
                  Generate Letter
                </Button>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: 12, color: '#8892a8', mb: 2 }}>
                Recommended Strategy
              </Typography>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: '#1e2738',
                border: '1px solid #e930ff40'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Warning sx={{ fontSize: 16, color: '#e930ff' }} />
                  <Typography sx={{ fontSize: 12, color: '#e930ff', fontWeight: 600 }}>
                    High Priority
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: '#8892a8', lineHeight: 1.6 }}>
                  Immediate escalation recommended. Consider offering payment plan 
                  or early payment discount. High risk of becoming bad debt if not 
                  addressed within 7 days.
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default CashConversionProbability;