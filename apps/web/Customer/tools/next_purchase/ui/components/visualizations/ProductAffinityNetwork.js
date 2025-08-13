import React, { useState, useEffect, useRef } from "react";

const ProductAffinityNetwork = ({
  data = { nodes: [], links: [] },
  isLoading = false,
  onNodeClick = null,
  highlightPath = [],
  filterStrength = 0,
}) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 560, height: 560 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({
          width: Math.min(560, rect.width - 32),
          height: Math.min(560, rect.width - 32)
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
        backdropFilter:'blur(18px) saturate(180%)',
        WebkitBackdropFilter:'blur(18px) saturate(180%)',
        border:'1px solid rgba(59,130,246,0.25)',
        borderRadius:'30px',
        padding:'24px 26px 34px',
        position:'relative',
        overflow:'hidden',
        minHeight:400,
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 80% 15%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <div style={{height:20, width:240, background:'rgba(255,255,255,0.1)', borderRadius:10, marginBottom:18}} />
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:26}}>
          {Array.from({length:6}).map((_,i)=>(<div key={i} style={{height:54, background:'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.16), rgba(255,255,255,0.08))', backgroundSize:'200% 100%', animation:'shimmer 1.6s ease-in-out infinite', borderRadius:18}} />))}
        </div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', height:240}}>
          <div style={{width:220, height:220, borderRadius:'50%', border:'2px dashed rgba(255,255,255,0.12)', position:'relative'}}>
            {Array.from({length:8}).map((_,i)=> (
              <div key={i} style={{position:'absolute', top:'50%', left:'50%', width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.12)', transform:`rotate(${(i/8)*360}deg) translate(90px) rotate(-${(i/8)*360}deg)`, animation:'pulse 2s ease-in-out infinite', animationDelay:`${i*0.12}s`}} />
            ))}
          </div>
        </div>
        <style>{`@keyframes shimmer {0%{background-position:0% 50%;}100%{background-position:200% 50%;}} @keyframes pulse {0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      </div>
    );
  }
  if (!data.nodes || data.nodes.length === 0) {
    return (
      <div style={{
        background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
        backdropFilter:'blur(18px) saturate(180%)',
        WebkitBackdropFilter:'blur(18px) saturate(180%)',
        border:'1px solid rgba(59,130,246,0.25)',
        borderRadius:'30px',
        padding:'24px 26px 34px',
        position:'relative',
        overflow:'hidden',
        minHeight:400,
        boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
        animation:'fadeInUp .65s ease both'
      }}>
        <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 80% 15%, rgba(0,224,255,0.18), transparent 60%)'}} />
        <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Product Affinity Network</h3>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:260, color:'#5891cb'}}>No product association data available</div>
      </div>
    );
  }

  // Shift network further left & shrink radius to avoid right-side clipping completely
  const centerX = (dimensions.width / 2) - 55; // stronger left bias
  const centerY = dimensions.height / 2;
  // Increase padding on right by reducing radius
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 100;
  // Position nodes in a circular layout
  // Force uniform node sizing per user request (ignore backend-provided size scaling)
  const UNIFORM_RADIUS = 36;
  const positionedNodes = data.nodes.map((node, index) => {
    const angle = (index / data.nodes.length) * 2 * Math.PI;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: UNIFORM_RADIUS
    };
  });

  // Filter links based on strength threshold
  const filteredLinks = data.links.filter(link => 
    (link.strength || 0) >= filterStrength
  );

  const getNodeColor = (node) => {
    if (selectedNode?.id === node.id) return "#00e0ff";
    if (hoveredNode?.id === node.id) return "#e930ff";
    if (highlightPath.includes(node.id)) return "#00e0ff";
    
    // Color by product category
    const colorMap = {
      'M': '#5fd4d6',
      'R': '#aa45dd',
      'default': '#3e7b97'
    };
    return colorMap[node.id?.[0]] || colorMap.default;
  };

  const getLinkColor = (link) => {
    const sourceHighlighted = highlightPath.includes(link.source);
    const targetHighlighted = highlightPath.includes(link.target);
    
    if (sourceHighlighted && targetHighlighted) return "#00e0ff";
    if (sourceHighlighted || targetHighlighted) return "#e930ff80";
    
    return "#3a4459";
  };

  const getLinkWidth = (link) => {
    const baseWidth = Math.max(1, Math.min(6, (link.strength || 0) / 5));
    const highlighted = highlightPath.includes(link.source) && highlightPath.includes(link.target);
    return highlighted ? baseWidth + 2 : baseWidth;
  };

  const getProductIcon = (nodeId) => {
    const icons = {
      'M': '👕',
      'R': '🏃',
      'default': '📦'
    };
    return icons[nodeId?.[0]] || icons.default;
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const getConnectedNodes = (nodeId) => {
    const connected = new Set();
    filteredLinks.forEach(link => {
      if (link.source === nodeId) connected.add(link.target);
      if (link.target === nodeId) connected.add(link.source);
    });
    return Array.from(connected);
  };

  return (
    <div style={{
      background:'linear-gradient(135deg, rgba(30,39,56,0.72), rgba(44,51,65,0.72))',
      backdropFilter:'blur(18px) saturate(180%)',
      WebkitBackdropFilter:'blur(18px) saturate(180%)',
      border:'1px solid rgba(59,130,246,0.25)',
      borderRadius:'30px',
      padding:'24px 26px 34px',
      position:'relative',
      overflow:'hidden',
      minHeight:400,
      boxShadow:'0 6px 18px -4px rgba(0,0,0,0.55), 0 18px 48px -12px rgba(59,130,246,0.3)',
      animation:'fadeInUp .65s ease both'
    }}>
      <div style={{position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(circle at 80% 15%, rgba(0,224,255,0.18), transparent 60%)'}} />
      <div style={{position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18}}>
        <div>
          <h3 style={{margin:0, fontSize:20, fontWeight:800, background:'linear-gradient(90deg,#3b82f6,#8b5cf6)', WebkitBackgroundClip:'text', color:'transparent', letterSpacing:'.6px'}}>Product Affinity Network</h3>
          <div style={{fontSize:12, color:'#5891cb', marginTop:4}}>{`${positionedNodes.length} products • ${filteredLinks.length} relationships`}</div>
        </div>
      </div>
      <div style={{ position:'relative' }}>

        {/* Strength Filter */}
    <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", position:'relative', zIndex:2, background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'22px', border:'1px solid rgba(59,130,246,0.35)' }}>
          <span style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "600" }}>Min Strength:</span>
          <input
            type="range"
            min="0"
            max="20"
            value={filterStrength}
            onChange={() => {}}
      style={{ width: "160px", accentColor: "#00e0ff", background:'linear-gradient(90deg, rgba(59,130,246,0.35), rgba(139,92,246,0.35))', height:'4px', borderRadius:'4px' }}
          />
          <span style={{ fontSize: "12px", color: "#b0c4d6" }}>{filterStrength}%</span>
        </div>

        {/* Network SVG */}
    <div style={{
      background:'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.14))',
      borderRadius:'26px',
      padding:'24px 24px 32px',
      display:'flex',
      justifyContent:'flex-start',
      overflow:'hidden',
      border:'1px solid rgba(255,255,255,0.12)',
      boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'
    }}>
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} style={{ cursor: "grab" }}>
            <defs>
              {positionedNodes.map(node => (
                <radialGradient id={`grad-${node.id}`} key={node.id} cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor={getNodeColor(node)} stopOpacity="1" />
                  <stop offset="100%" stopColor={getNodeColor(node)} stopOpacity="0.55" />
                </radialGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Links */}
            <g>
              {filteredLinks.map((link, index) => {
                const sourceNode = positionedNodes.find(n => n.id === link.source);
                const targetNode = positionedNodes.find(n => n.id === link.target);
                if (!sourceNode || !targetNode) return null;
                return (
                  <line
                    key={index}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={getLinkColor(link)}
                    strokeWidth={getLinkWidth(link)}
                    opacity={0.7}
                    strokeDasharray={link.strength < 5 ? "4,4" : "none"}
                  >
                    <title>{`${link.source} ↔ ${link.target}: ${link.strength?.toFixed(1)}% strength (${link.count} co-purchases)`}</title>
                  </line>
                );
              })}
            </g>

            {/* Highlight Path */}
            {highlightPath.length > 1 && (
              <g>
                {highlightPath.slice(0, -1).map((nodeId, index) => {
                  const sourceNode = positionedNodes.find(n => n.id === nodeId);
                  const targetNode = positionedNodes.find(n => n.id === highlightPath[index + 1]);
                  if (!sourceNode || !targetNode) return null;
                  return (
                    <line
                      key={`path-${index}`}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="#00e0ff"
                      strokeWidth="4"
                      opacity={0.8}
                      strokeDasharray="none"
                      filter="url(#glow)"
                    />
                  );
                })}
              </g>
            )}

            {/* Nodes */}
            <g>
              {positionedNodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={`url(#grad-${node.id})`}
                    stroke={selectedNode?.id===node.id? '#00e0ff':'#3a4459'}
                    strokeWidth={selectedNode?.id===node.id? 3:2}
                    style={{ cursor: "pointer", filter: hoveredNode?.id===node.id? 'drop-shadow(0 0 10px rgba(0,224,255,0.8))':'drop-shadow(0 0 4px rgba(0,224,255,0.25))' , transition:'all .3s ease' }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <title>{`${node.id} (${node.category})`}</title>
                  </circle>
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fill="#f7f9fb"
                    style={{ userSelect: "none", pointerEvents: "none", fontWeight:600 }}
                  >
                    {getProductIcon(node.id)}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + node.radius + 14}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#b0c4d6"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div style={{
              marginTop:'26px',
              padding:'18px 20px 20px',
              background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))',
              borderRadius:'22px',
              border:'1px solid rgba(255,255,255,0.12)',
              boxShadow:'0 4px 12px -3px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: "14px", color: "#f7f9fb", fontWeight: "600" }}>
              {getProductIcon(selectedNode.id)} {selectedNode.id}
            </div>
            <div style={{ fontSize: "12px", color: "#b0c4d6", marginTop: "4px" }}>
              Connected to: {getConnectedNodes(selectedNode.id).join(", ") || "None"}
            </div>
          </div>
        )}

    {/* Legend */}
  <div style={{ marginTop: "24px", display: "flex", gap: "32px", fontSize: "12px", flexWrap:'wrap', position:'relative', zIndex:1, background:'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))', padding:'12px 16px', borderRadius:'26px', border:'1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width:12, height:12, backgroundColor:'#5fd4d6', borderRadius:'50%' }} />
            <span style={{ color: "#f7f9fb" }}>Merchandise (M)</span>
          </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width:12, height:12, backgroundColor:'#aa45dd', borderRadius:'50%' }} />
            <span style={{ color: "#f7f9fb" }}>Running/Sports (R)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width:12, height:2, backgroundColor:'#3a4459' }} />
            <span style={{ color: "#f7f9fb" }}>Product Association</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAffinityNetwork; 