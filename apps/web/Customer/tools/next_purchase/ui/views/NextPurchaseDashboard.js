import React, { useState, useEffect, useRef, useMemo } from "react";
import NextPurchaseKPITiles from "../components/kpi/NextPurchaseKPITiles";
import PredictionConfidenceMatrix from "../components/visualizations/PredictionConfidenceMatrix";
import CustomerPurchaseJourney from "../components/visualizations/CustomerPurchaseJourney";
import ProductAffinityNetwork from "../components/visualizations/ProductAffinityNetwork";
import CategoryPerformanceOverview from "../components/visualizations/CategoryPerformanceOverview";
import PurchaseTimingPredictor from "../components/visualizations/PurchaseTimingPredictor";
import EnhancedContextAwareChatbot from "../components/chat/EnhancedContextAwareChatbot";
// Synthetic journey generation removed; timelines fetched per customer from API

const NextPurchaseDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    timeframe: "30days",
    confidenceThreshold: 0.5,
    selectedCustomer: null,
  });
  const [showJourneyPredictions, setShowJourneyPredictions] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState(()=>{
    if (typeof window !== 'undefined') {
      const saved = window.sessionStorage.getItem('np_expanded_customer');
      return saved ? parseInt(saved) : null;
    }
    return null;
  });
  const [journeyCache, setJourneyCache] = useState({}); // { customerId: purchases[] }
  const [loadingJourneys, setLoadingJourneys] = useState({}); // { customerId: boolean }
  const expansionRefs = useRef({});
  // Footer timestamp (set after mount to avoid SSR/client mismatch)
  const [renderedAt, setRenderedAt] = useState('');
  useEffect(() => {
    setRenderedAt(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/next-purchase/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: filters.timeframe })
      });
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      // Derive business KPIs client-side from prediction table & timeline (server returns base metrics for model ops panel)
  const predictionData = json.data?.predictionData || [];
      const customerTimeline = json.data?.visualizationData?.customerTimeline || [];
      const totalPredictions = predictionData.length;
      const highIntentCustomers = predictionData.filter(p=> p.prediction_probability >= 0.7).length;
      const customersWithin7d = predictionData.filter(p=> p.predicted_days_to_purchase <= 7).length;
      const avgPredictedDays = Math.round(predictionData.reduce((a,c)=> a + c.predicted_days_to_purchase,0)/Math.max(1,totalPredictions));
      const confidenceIndex = +(predictionData.reduce((a,c)=> a + c.prediction_probability,0)/Math.max(1,totalPredictions)).toFixed(2);
      const predictedRevenue30d = predictionData.reduce((a,c)=> a + (c.prediction_probability * c.avg_amount),0);
      const timelineMap = new Map(customerTimeline.map(c => [c.customerId, new Set(c.purchases.map(p=> p.category))]));
      const crossSellCount = predictionData.filter(p=> { const set = timelineMap.get(p['Customer Key']); return set ? !set.has(p.predicted_product) : false; }).length;
      const crossSellRate = +((crossSellCount/Math.max(1,totalPredictions))*100).toFixed(1);
      // Keep secondary metrics for Model Ops panel
      const productCounts = predictionData.reduce((acc,p)=> { acc[p.predicted_product] = (acc[p.predicted_product]||0)+1; return acc; }, {});
      const topDemandProduct = Object.entries(productCounts).sort((a,b)=> b[1]-a[1])[0];
      const topDemandShare = topDemandProduct ? +((topDemandProduct[1]/totalPredictions)*100).toFixed(1) : 0;
      const primaryKpis = {
        predictedRevenue30d: +predictedRevenue30d.toFixed(0),
        highIntentCustomers,
        customersWithin7d,
        confidenceIndex,
        crossSellRate,
        avgPredictedDays,
        activeCustomers: json.data?.kpis?.activeCustomers || 0
      };
      const secondaryKpis = {
        topDemandShare,
        topDemandProduct: topDemandProduct ? topDemandProduct[0] : 'N/A',
        predictionCoverage: json.data?.kpis?.predictionCoverage || 0,
        activeCustomers: json.data?.kpis?.activeCustomers || 0,
        totalCustomers: json.data?.kpis?.totalCustomers || 0,
  avgPurchaseWindow: json.data?.kpis?.avgPurchaseWindow || 0
      };
      setData({
        kpis: primaryKpis,
        modelOps: secondaryKpis,
        visualizationData: json.data?.visualizationData,
        predictionData
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (timeframe) => {
    setFilters(prev => ({ ...prev, timeframe }));
  };

  const handleCustomerChange = (customerId) => {
    setFilters(prev => ({ ...prev, selectedCustomer: customerId }));
  };

  const handleCellClick = (segment, product) => {
    console.log(`Selected: ${segment} → ${product}`);
    // Could filter other components based on selection
  };

  const handleNodeClick = (nodeId) => {
    console.log(`Selected product: ${nodeId}`);
    // Could highlight product across other components
  };

  const toggleExpandCustomer = async (custId, predictedProduct) => {
    setExpandedCustomer(prev => {
      const next = prev === custId ? null : custId;
      if (typeof window !== 'undefined') {
        if (next) window.sessionStorage.setItem('np_expanded_customer', String(next));
        else window.sessionStorage.removeItem('np_expanded_customer');
      }
      return next;
    });
    setJourneyCache(cache => ({ ...cache, [custId]: cache[custId] || [] }));
    if (journeyCache[custId] && journeyCache[custId].length > 0) return;
    setLoadingJourneys(l => ({ ...l, [custId]: true }));
    try {
      const res = await fetch('/api/next-purchase/customer-timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: custId, limit: 20 })
      });
      if (res.ok) {
        const json = await res.json();
        setJourneyCache(cache => ({ ...cache, [custId]: json.purchases || [] }));
      }
    } catch (e) {
      console.warn('Failed to fetch customer timeline', e);
    } finally {
      setLoadingJourneys(l => ({ ...l, [custId]: false }));
    }
  };

  const journeyPredictionRow = useMemo(()=> {
    if (!data?.predictionData || data.predictionData.length === 0) return null;
    const baseCustomer = filters.selectedCustomer || data?.visualizationData?.customerTimeline?.[0]?.customerId;
    const direct = data.predictionData.find(p => p['Customer Key'] === baseCustomer);
    if (direct) return direct;
    return [...data.predictionData].sort((a,b)=> b.prediction_probability - a.prediction_probability)[0];
  }, [data, filters.selectedCustomer]);

  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#0a1224",
          minHeight: "100vh",
          color: "#f7f9fb",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            backgroundColor: "#232a36",
            borderRadius: "8px",
            border: "1px solid #e930ff",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "16px", color: "#e930ff" }}>
            ⚠️ Error Loading Dashboard
          </div>
          <div style={{ fontSize: "16px", color: "#b0c4d6" }}>
            {error}
          </div>
          <button
            onClick={fetchData}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              backgroundColor: "#00e0ff",
              color: "#0a1224",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#0a1224",
        minHeight: "100vh",
        color: "#f7f9fb",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            margin: "0 0 8px 0",
            fontSize: "32px",
            fontWeight: "700",
            color: "#00e0ff",
            textShadow: "0 2px 4px rgba(0, 224, 255, 0.3)",
          }}
        >
          Next Purchase Predictor
        </h1>
        <p
          style={{
            margin: "0",
            fontSize: "16px",
            color: "#b0c4d6",
            fontWeight: "400",
          }}
        >
          AI-powered customer purchase prediction and recommendation system
        </p>
      </div>

      {/* KPI Tiles */}
      <NextPurchaseKPITiles kpis={data?.kpis} isLoading={isLoading} />
      {/* Model Ops secondary metrics panel */}
      {data?.modelOps && (
        <div style={{marginTop:'-12px', marginBottom:'40px', display:'flex', flexWrap:'wrap', gap:'16px', padding:'18px 20px 22px', background:'linear-gradient(135deg, rgba(30,39,56,0.55), rgba(44,51,65,0.55))', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'26px'}}>
          {[{label:'Top Demand Share', value: data.modelOps.topDemandShare+'%', detail:data.modelOps.topDemandProduct}, {label:'Coverage', value:(data.modelOps.predictionCoverage||0).toFixed(1)+'%', detail:`${data.modelOps.activeCustomers}/${data.modelOps.totalCustomers}`}, {label:'Avg Purchase Window', value:data.modelOps.avgPurchaseWindow+'d', detail:'Historical avg'},].map((m,i)=>(
            <div key={i} style={{minWidth:160, position:'relative'}}>
              <div style={{fontSize:'12px', letterSpacing:'.4px', color:'#94a3b8', marginBottom:'6px'}}>{m.label}</div>
              <div style={{fontSize:'22px', fontWeight:700, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent'}}>{m.value}</div>
              <div style={{fontSize:'11px', color:'#64748b', marginTop:'4px'}}>{m.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Insights quick actions */}
      <div style={{display:'flex', flexWrap:'wrap', gap:'12px', marginBottom:'24px'}}>
        {[
          'High likelihood apparel segment primed for M-3003 repurchase',
          'Spike in running gear purchase probability over next 10 days',
          'Cross-sell opportunity: accessories bundle for M-3003 buyers'
        ].map((insight,i)=>(
          <button key={i} onClick={()=>console.log('AI Insight clicked:', insight)} style={{
            position:'relative',
            background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))',
            border:'1px solid rgba(255,255,255,0.12)',
            color:'#f1f5f9',
            fontSize:'12px',
            letterSpacing:'.4px',
            padding:'10px 14px',
            borderRadius:'14px',
            cursor:'pointer',
            backdropFilter:'blur(10px)',
            WebkitBackdropFilter:'blur(10px)',
            transition:'all .35s ease',
            overflow:'hidden'
          }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6'; e.currentTarget.style.boxShadow='0 4px 14px -4px rgba(59,130,246,0.5)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow='none'}}>
            <span style={{position:'relative', zIndex:1}}>{insight}</span>
            <span style={{position:'absolute', inset:0, background:'radial-gradient(circle at 75% 25%, rgba(255,255,255,0.12), transparent 60%)', pointerEvents:'none'}} />
          </button>
        ))}
      </div>

      {/* Top Predictions (moved up) */}
      <div style={{
        position:'relative',
        marginTop:'-12px',
        marginBottom:'52px',
        background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
        backdropFilter:'blur(18px) saturate(180%)',
        WebkitBackdropFilter:'blur(18px) saturate(180%)',
        border:'1px solid rgba(59,130,246,0.25)',
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        borderRadius:'30px',
        padding:'28px 30px 34px 30px',
        overflow:'hidden',
        animation:'fadeInUp .7s ease both'
      }}>
        <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 78% 18%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <h3 style={{
          margin:'0 0 20px 0',
          fontSize:'22px',
          fontWeight:800,
          background:'linear-gradient(90deg,#3b82f6,#8b5cf6)',
          WebkitBackgroundClip:'text',
          color:'transparent',
          letterSpacing:'.5px'
        }}>Top Predictions</h3>
        {isLoading ? (
          <div style={{ textAlign:'center', padding:'46px 0', color:'#94a3b8', fontSize:'14px' }}>Loading predictions...</div>
        ) : data?.predictionData?.length > 0 ? (
          <div style={{ overflowX:'auto', position:'relative', zIndex:1 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(148,163,184,0.25)' }}>
                  {['Customer','Predicted Product','Probability','Days to Purchase','Total Purchases','Avg Amount'].map(h => (
                    <th key={h} style={{
                      padding:'10px 12px 12px',
                      textAlign: h==='Customer' || h==='Predicted Product'? 'left':'right',
                      fontWeight:700,
                      color:'#f1f5f9',
                      letterSpacing:'.5px'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.predictionData.slice(0,12).map((prediction, idx) => {
                  const custId = prediction['Customer Key'];
                  const isOpen = expandedCustomer === custId;
                  return (
                    <React.Fragment key={custId+"-row"}>
                      <tr
                        style={{ borderBottom:'1px solid rgba(148,163,184,0.12)', transition:'background .25s ease', cursor:'pointer' }}
                        onClick={()=> toggleExpandCustomer(custId, prediction.predicted_product)}
                        onMouseEnter={e=> e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                        onMouseLeave={e=> e.currentTarget.style.background= isOpen? 'rgba(255,255,255,0.03)':'transparent'}
                      >
                        <td style={{ padding:'10px 12px', color:'#f8fafc', fontWeight:600, display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{display:'inline-block', transform:isOpen?'rotate(90deg)':'rotate(0deg)', transition:'transform .25s ease'}}>
                            ▶
                          </span>
                          {custId}
                        </td>
                        <td style={{ padding:'10px 12px', color:'#f1f5f9' }}>
                          <span style={{
                            padding:'4px 10px',
                            background:'linear-gradient(90deg,rgba(0,224,255,0.18),rgba(139,92,246,0.18))',
                            border:'1px solid rgba(0,224,255,0.3)',
                            borderRadius:'14px',
                            fontSize:'11px',
                            fontWeight:600,
                            letterSpacing:'.5px'
                          }}>{prediction.predicted_product}</span>
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right' }}>
                          <span style={{ fontWeight:700, color: prediction.prediction_probability > 0.7 ? '#00e0ff' : prediction.prediction_probability > 0.5 ? '#5fd4d6' : '#94a3b8' }}>
                            {Math.round(prediction.prediction_probability * 100)}%
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'#e2e8f0' }}>{prediction.predicted_days_to_purchase}d</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'#cbd5e1' }}>{prediction.total_purchases}</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'#cbd5e1' }}>${Math.round(prediction.avg_amount).toLocaleString()}</td>
                      </tr>
                      <tr style={{ height: isOpen ? 'auto' : 0, transition:'all .45s cubic-bezier(.4,.14,.12,1)', background: isOpen? 'rgba(255,255,255,0.03)':'transparent' }}>
                        {isOpen && (
                          <td colSpan={6} style={{ padding:'14px 18px 22px' }} ref={el => { if (el) expansionRefs.current[custId]=el; }}>
                            <div style={{fontSize:'11px', letterSpacing:'.5px', color:'#94a3b8', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                              <span>Customer Journey (last {journeyCache[custId]?.length || 0} events)</span>
                              <button onClick={(e)=> { e.stopPropagation(); toggleExpandCustomer(custId, prediction.predicted_product); }} style={{background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'11px'}}>Close</button>
                            </div>
                            {loadingJourneys[custId] && (
                              <div style={{display:'flex', gap:'14px'}}>
                                {Array.from({length:5}).map((_,i)=>(
                                  <div key={i} style={{background:'linear-gradient(90deg, rgba(59,130,246,0.15), rgba(0,224,255,0.12))', border:'1px solid rgba(59,130,246,0.35)', borderRadius:'16px', width:110, padding:'16px 12px', position:'relative', overflow:'hidden'}}>
                                    <div style={{height:10, width:'60%', background:'rgba(255,255,255,0.15)', borderRadius:4, marginBottom:8}} />
                                    <div style={{height:8, width:'40%', background:'rgba(255,255,255,0.1)', borderRadius:4}} />
                                    <div style={{position:'absolute', inset:0, background:'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.25) 40%, transparent 80%)', animation:'shimmer 1.5s infinite'}} />
                                  </div>
                                ))}
                              </div>
                            )}
                            {!loadingJourneys[custId] && (
                              <div style={{overflowX:'auto', paddingBottom:'6px'}}>
                                <div style={{display:'flex', alignItems:'flex-end', gap:'18px', minWidth:'640px'}}>
                                  {(journeyCache[custId]||[]).map((p,i,arr)=> (
                                    <div key={i} style={{position:'relative', flex:'0 0 auto'}}>
                                      <div style={{position:'absolute', top:'14px', left:'50%', width:i<arr.length-1? '120px':'0', height:'2px', background:'linear-gradient(90deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6))', transform:'translateY(-50%)', zIndex:0}} />
                                      <div style={{position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(0,224,255,0.16))', border:'1px solid rgba(59,130,246,0.5)', borderRadius:'16px', padding:'10px 12px', minWidth:'110px', boxShadow:'0 4px 10px -2px rgba(0,0,0,0.45)'}}>
                                        <div style={{fontSize:'11px', fontWeight:700, color:'#f1f5f9'}}>{p.category}</div>
                                        <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'2px'}}>${p.amount.toLocaleString()}</div>
                                        <div style={{fontSize:'9px', color:'#64748b', marginTop:'6px'}}>{new Date(p.date).toLocaleDateString()}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'46px 0', color:'#94a3b8', fontSize:'14px' }}>No prediction data available</div>
        )}
      </div>

      {/* Customer Purchase Journey (second) */}
      <div style={{ marginBottom:'42px' }}>
        <CustomerPurchaseJourney
          data={data?.visualizationData?.customerTimeline}
          isLoading={isLoading}
          selectedCustomer={filters.selectedCustomer}
          onCustomerChange={handleCustomerChange}
          showPredictions={showJourneyPredictions}
          onTogglePredictions={(val)=> setShowJourneyPredictions(val)}
          predictionRow={journeyPredictionRow}
        />
      </div>

      {/* Product Affinity + Category Performance (swapped layout) */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(420px,1fr))', gap:'28px', marginBottom:'42px' }}>
        <ProductAffinityNetwork
          data={data?.visualizationData?.affinityNetwork}
          isLoading={isLoading}
          onNodeClick={handleNodeClick}
          filterStrength={5}
        />
        <CategoryPerformanceOverview
          data={data?.visualizationData?.categoryPerformance || []}
          isLoading={isLoading}
          series={data?.visualizationData?.categoryRevenueSeries || []}
        />
      </div>

      {/* Confidence Matrix + Time to Purchase */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(420px,1fr))', gap:'28px', marginBottom:'36px' }}>
        <PredictionConfidenceMatrix
          data={data?.visualizationData?.confidenceMatrix}
          isLoading={isLoading}
          initialTimeframe={filters.timeframe}
          onTimeframePersist={(tf)=> {/* persist only if needed without triggering full refetch */}}
          onCellClick={handleCellClick}
        />
        <PurchaseTimingPredictor
          data={data?.visualizationData?.purchaseTiming || []}
          isLoading={isLoading}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          textAlign: "center",
          fontSize: "12px",
          color: "#5891cb",
          borderTop: "1px solid #3a4459",
        }}
        suppressHydrationWarning
      >
        Next Purchase Predictor Dashboard • Last updated: {renderedAt || '—'}
      </div>
      {/* Chatbot floating UI (portal-like fixed positioning handled internally) */}
      <EnhancedContextAwareChatbot />
    </div>
  );
};

export default NextPurchaseDashboard; 