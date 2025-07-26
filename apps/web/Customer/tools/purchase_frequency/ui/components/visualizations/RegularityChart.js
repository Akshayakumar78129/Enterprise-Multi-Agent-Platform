import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const RegularityChart = ({ data, width = 500, height = 400, highlightTimeframe = null }) => {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG and main group for the chart
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
      
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
      
    // Process data
    const timeframes = data.map(d => d.timeframe);
    const scores = data.map(d => d.regularity_score);
    const maxScore = Math.max(...scores, 100); // Cap at 100 or the max score
    
    // Create scales
    const angleScale = d3.scalePoint()
      .domain(timeframes)
      .range([0, 2 * Math.PI]);
      
    const radiusScale = d3.scaleLinear()
      .domain([0, maxScore])
      .range([0, Math.min(innerWidth, innerHeight) / 2 - 20]);
      
    // Draw circles
    const circles = [20, 40, 60, 80, 100];
    
    circles.forEach(circle => {
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', radiusScale(circle))
        .attr('fill', 'none')
        .attr('stroke', '#2D3748')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,2');
        
      // Add labels for circles (only for 20, 60, 100)
      if (circle % 40 === 20) {
        g.append('text')
          .attr('x', 0)
          .attr('y', -radiusScale(circle) - 5)
          .attr('text-anchor', 'middle')
          .attr('fill', '#94A3B8')
          .attr('font-size', '10px')
          .text(circle);
      }
    });
    
    // Draw axes for each timeframe
    timeframes.forEach(timeframe => {
      const angle = angleScale(timeframe);
      const lineEndX = Math.sin(angle) * radiusScale(maxScore);
      const lineEndY = -Math.cos(angle) * radiusScale(maxScore);
      
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineEndX)
        .attr('y2', lineEndY)
        .attr('stroke', '#4B5563')
        .attr('stroke-width', 1);
        
      // Label position slightly beyond the end of the axis
      const labelX = Math.sin(angle) * (radiusScale(maxScore) + 15);
      const labelY = -Math.cos(angle) * (radiusScale(maxScore) + 15);
      
      g.append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E2E8F0')
        .attr('font-size', '12px')
        .text(timeframe);
    });
    
    // Calculate points for radar chart
    const radarData = timeframes.map((timeframe, i) => {
      const angle = angleScale(timeframe);
      const radius = radiusScale(scores[i]);
      
      return {
        timeframe,
        score: scores[i],
        x: Math.sin(angle) * radius,
        y: -Math.cos(angle) * radius
      };
    });
    
    // Create line generator
    const lineGenerator = d3.lineRadial()
      .angle(d => angleScale(d.timeframe))
      .radius(d => radiusScale(d.score))
      .curve(d3.curveLinearClosed);
      
    // Create path for radar shape
    const radarPath = g.append('path')
      .datum(data)
      .attr('d', lineGenerator)
      .attr('fill', '#00e0ff')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#00e0ff')
      .attr('stroke-width', 2);
      
    // Add dots for each data point
    const dots = g.selectAll('.dot')
      .data(radarData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 6)
      .attr('fill', d => (highlightTimeframe && d.timeframe === highlightTimeframe) ? '#e930ff' : '#00e0ff')
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 2);
      
    // Add labels for each dot
    g.selectAll('.dot-label')
      .data(radarData)
      .enter()
      .append('text')
      .attr('class', 'dot-label')
      .attr('x', d => d.x)
      .attr('y', d => d.y - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E2E8F0')
      .attr('font-size', '10px')
      .text(d => d.score);
  }, [data, width, height, highlightTimeframe]);
  
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
        Purchase Regularity Chart
      </h3>
      <svg ref={svgRef} style={{ width: '100%', height: 'calc(100% - 30px)' }}></svg>
    </div>
  );
};

export default RegularityChart;