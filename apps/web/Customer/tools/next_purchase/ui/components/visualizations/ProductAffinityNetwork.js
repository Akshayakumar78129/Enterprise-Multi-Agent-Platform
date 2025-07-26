import React, { useState, useEffect, useRef } from "react";
import { Card } from "../../../../../../ui-common/design-system/components/Card";

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

  if (!data.nodes || data.nodes.length === 0) {
    return (
      <Card title="Product Affinity Network" isLoading={isLoading}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
            color: "#5891cb",
          }}
        >
          No product association data available
        </div>
      </Card>
    );
  }

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) / 2 - 60;

  // Position nodes in a circular layout
  const positionedNodes = data.nodes.map((node, index) => {
    const angle = (index / data.nodes.length) * 2 * Math.PI;
    const nodeRadius = Math.max(20, Math.min(40, node.size || 30));
    
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: nodeRadius
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
    <Card
      title="Product Affinity Network"
      subtitle={`${positionedNodes.length} products, ${filteredLinks.length} relationships`}
      isLoading={isLoading}
    >
      <div style={{ padding: "16px" }}>
        {/* Strength Filter */}
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#f7f9fb", fontWeight: "600" }}>
            Min Strength:
          </span>
          <input
            type="range"
            min="0"
            max="20"
            value={filterStrength}
            onChange={(e) => {}} // Would be controlled by parent
            style={{
              width: "120px",
              accentColor: "#00e0ff",
            }}
          />
          <span style={{ fontSize: "12px", color: "#b0c4d6" }}>
            {filterStrength}%
          </span>
        </div>

        {/* Network SVG */}
        <div
          style={{
            backgroundColor: "#232a36",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ cursor: "grab" }}
          >
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
                    <title>
                      {`${link.source} ↔ ${link.target}: ${link.strength?.toFixed(1)}% strength (${link.count} co-purchases)`}
                    </title>
                  </line>
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {positionedNodes.map((node) => (
                <g key={node.id}>
                  {/* Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={getNodeColor(node)}
                    stroke="#3a4459"
                    strokeWidth="2"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <title>
                      {`${node.id} (${node.category})`}
                    </title>
                  </circle>

                  {/* Node Icon */}
                  <text
                    x={node.x}
                    y={node.y + 6}
                    textAnchor="middle"
                    fontSize="16"
                    fill="#f7f9fb"
                    style={{ 
                      userSelect: "none", 
                      pointerEvents: "none",
                      filter: "contrast(1.2)"
                    }}
                  >
                    {getProductIcon(node.id)}
                  </text>

                  {/* Node Label */}
                  <text
                    x={node.x}
                    y={node.y + node.radius + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#f7f9fb"
                    fontWeight="600"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </g>

            {/* Prediction Paths */}
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

            {/* Glow Filter Definition */}
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#3a4459",
              borderRadius: "8px",
              borderLeft: "4px solid #00e0ff",
            }}
          >
            <div style={{ fontSize: "14px", color: "#f7f9fb", fontWeight: "600" }}>
              {getProductIcon(selectedNode.id)} {selectedNode.id}
            </div>
            <div style={{ fontSize: "12px", color: "#b0c4d6", marginTop: "4px" }}>
              Connected to: {getConnectedNodes(selectedNode.id).join(", ") || "None"}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: "16px", display: "flex", gap: "24px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#5fd4d6",
                borderRadius: "50%",
              }}
            />
            <span style={{ color: "#f7f9fb" }}>Merchandise (M)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: "#aa45dd",
                borderRadius: "50%",
              }}
            />
            <span style={{ color: "#f7f9fb" }}>Running/Sports (R)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "2px",
                backgroundColor: "#3a4459",
              }}
            />
            <span style={{ color: "#f7f9fb" }}>Product Association</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductAffinityNetwork; 