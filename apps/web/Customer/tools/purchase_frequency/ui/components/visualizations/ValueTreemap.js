import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ValueTreemap = ({ data, width = 500, height = 400, highlightSegment = null }) => {
  const svgRef = useRef(null);
  
  // Colors for each segment
  const segmentColors = {
    premium: '#00e0ff', // Electric Cyan
    standard: '#4ade80', // Green
    budget: '#a855f7', // Purple
    occasional: '#f43f5e' // Pink
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create hierarchy data for treemap
    const root = d3.hierarchy({ children: data })
      .sum(d => d.percentage || 0);
    
    // Create treemap layout
    const treemap = d3.treemap()
      .size([width, height])
      .paddingOuter(1)
      .paddingInner(1)
      .round(true);
    
    // Apply layout
    treemap(root);
    
    // Create SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Create groups for each segment
    const cell = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    // Add rectangle for each segment
    cell.append('rect')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => segmentColors[d.data.segment])
      .attr('fill-opacity', d => (highlightSegment && d.data.segment !== highlightSegment) ? 0.5 : 0.9)
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 1);
    
    // Add segment name
    cell.append('text')
      .attr('x', 5)
      .attr('y', 20)
      .attr('fill', '#FFFFFF')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text(d => d.data.segment.charAt(0).toUpperCase() + d.data.segment.slice(1));
    
    // Add percentage text
    cell.append('text')
      .attr('x', 5)
      .attr('y', 40)
      .attr('fill', '#FFFFFF')
      .attr('font-size', '12px')
      .text(d => `${d.data.percentage.toFixed(1)}% of customers`);
    
    // Add total count
    cell.append('text')
      .attr('x', 5)
      .attr('y', 60)
      .attr('fill', '#FFFFFF')
      .attr('font-size', '12px')
      .text(d => `${d.data.count} customers`);
    
    // Add average value
    cell.append('text')
      .attr('x', 5)
      .attr('y', 80)
      .attr('fill', '#FFFFFF')
      .attr('font-size', '12px')
      .text(d => `Avg: $${d.data.avgValue.toLocaleString()}`);
    
  }, [data, width, height, highlightSegment]);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        color: '#E2E8F0',
        fontSize: '16px',
        textAlign: 'center'
      }}>
        Value Segment Treemap
      </h3>
      <svg ref={svgRef} style={{ width: '100%', height: 'calc(100% - 30px)' }}></svg>
    </div>
  );
};

export default ValueTreemap; 