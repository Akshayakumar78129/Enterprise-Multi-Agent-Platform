import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const SegmentQuadrant = ({ data, width = 500, height = 400, highlightSegment = null }) => {
  const svgRef = useRef(null);
  
  // Colors for each segment
  const segmentColors = {
    champions: '#00e0ff', // Electric Cyan
    loyal: '#34d399', // Green
    big_spenders: '#e930ff', // Signal Magenta
    at_risk: '#ef4444', // Red
    others: '#94a3b8' // Gray
  };

  // Segment labels
  const segmentLabels = {
    champions: 'Champions',
    loyal: 'Loyal',
    big_spenders: 'Big Spenders',
    at_risk: 'At Risk',
    others: 'Others'
  };

  // Map segment to quadrant
  const segmentToQuadrant = {
    champions: { x: 1, y: 1 }, // top right
    loyal: { x: 1, y: 0 }, // bottom right
    big_spenders: { x: 0, y: 1 }, // top left
    at_risk: { x: 0, y: 0 }, // bottom left
    others: { x: 0.5, y: 0.5 } // center (will be distributed)
  };

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG and main group for the chart
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, 10])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 10])
      .range([innerHeight, 0]);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth);

    // Add x-axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', '#2D3748')
      .attr('stroke-dasharray', '2,2');

    // Add y-axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('line')
      .attr('stroke', '#2D3748')
      .attr('stroke-dasharray', '2,2');

    // Remove tick texts
    g.selectAll('.tick text').remove();

    // Add axis labels
    g.append('text')
      .attr('class', 'x-axis-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E2E8F0')
      .text('Purchase Frequency');

    g.append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#E2E8F0')
      .text('Average Transaction Value');

    // Add quadrant lines
    const midX = innerWidth / 2;
    const midY = innerHeight / 2;

    // Horizontal divider
    g.append('line')
      .attr('x1', 0)
      .attr('y1', midY)
      .attr('x2', innerWidth)
      .attr('y2', midY)
      .attr('stroke', '#4B5563')
      .attr('stroke-dasharray', '3,3');

    // Vertical divider
    g.append('line')
      .attr('x1', midX)
      .attr('y1', 0)
      .attr('x2', midX)
      .attr('y2', innerHeight)
      .attr('stroke', '#4B5563')
      .attr('stroke-dasharray', '3,3');

    // Add quadrant labels
    const labelOffsetFromEdge = 20;
    
    // Top-right: Champions
    g.append('text')
      .attr('x', midX + labelOffsetFromEdge)
      .attr('y', labelOffsetFromEdge)
      .attr('fill', '#E2E8F0')
      .attr('text-anchor', 'start')
      .text('Champions');

    // Top-left: Big Spenders
    g.append('text')
      .attr('x', midX - labelOffsetFromEdge)
      .attr('y', labelOffsetFromEdge)
      .attr('fill', '#E2E8F0')
      .attr('text-anchor', 'end')
      .text('Big Spenders');

    // Bottom-right: Loyal
    g.append('text')
      .attr('x', midX + labelOffsetFromEdge)
      .attr('y', innerHeight - labelOffsetFromEdge)
      .attr('fill', '#E2E8F0')
      .attr('text-anchor', 'start')
      .text('Loyal');

    // Bottom-left: At Risk
    g.append('text')
      .attr('x', midX - labelOffsetFromEdge)
      .attr('y', innerHeight - labelOffsetFromEdge)
      .attr('fill', '#E2E8F0')
      .attr('text-anchor', 'end')
      .text('At Risk');

    // Process data for visualization
    const processedData = data.map(segment => {
      // Map segment position to quadrant position
      const quadrantPos = segmentToQuadrant[segment.segment];
      const baseX = quadrantPos.x * innerWidth;
      const baseY = (1 - quadrantPos.y) * innerHeight;
      
      // Offset based on frequency and recency to distribute within quadrant
      let xOffset = 0;
      let yOffset = 0;
      
      // For 'others', distribute them across the center
      if (segment.segment === 'others') {
        xOffset = (Math.random() * 0.6 + 0.2) * innerWidth; // 20-80% of width
        yOffset = (Math.random() * 0.6 + 0.2) * innerHeight; // 20-80% of height
      } else {
        // For the main segments, use frequency and monetary to distribute
        const xPct = segment.segment === 'champions' || segment.segment === 'loyal' 
          ? 0.5 + (Math.min(segment.frequency, 100) / 200) 
          : 0.5 - (Math.min(segment.frequency, 100) / 200);
          
        const yPct = segment.segment === 'champions' || segment.segment === 'big_spenders'
          ? 0.5 - (Math.min(segment.monetary, 5000) / 10000)
          : 0.5 + (Math.min(segment.monetary, 5000) / 10000);
          
        xOffset = xPct * innerWidth;
        yOffset = yPct * innerHeight;
      }
      
      // Calculate bubble size based on percentage of customers
      const bubbleSize = Math.max(10, Math.sqrt(segment.percentage) * 5);
      
      return {
        ...segment,
        x: xOffset,
        y: yOffset,
        radius: bubbleSize
      };
    });

    // Add bubbles for each segment
    g.selectAll('.segment-bubble')
      .data(processedData)
      .enter()
      .append('circle')
      .attr('class', 'segment-bubble')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', d => segmentColors[d.segment])
      .attr('fill-opacity', d => (highlightSegment && d.segment !== highlightSegment) ? 0.3 : 0.7)
      .attr('stroke', d => (highlightSegment && d.segment === highlightSegment) ? '#ffffff' : 'none')
      .attr('stroke-width', 2);

    // Add labels to bubbles
    g.selectAll('.segment-label')
      .data(processedData)
      .enter()
      .append('text')
      .attr('class', 'segment-label')
      .attr('x', d => d.x)
      .attr('y', d => d.y + 3)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .text(d => d.count > 0 ? d.count : '');

    // Add legend
    const legendData = Object.keys(segmentLabels).map(key => ({
      id: key,
      color: segmentColors[key], 
      label: segmentLabels[key],
      count: data.find(d => d.segment === key)?.count || 0
    }));

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(10, ${height - 25})`);

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 100}, 0)`);

    legendItems.append('circle')
      .attr('cx', 5)
      .attr('cy', 5)
      .attr('r', 5)
      .attr('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .attr('fill', '#E2E8F0')
      .attr('font-size', '10px')
      .text(d => `${d.label} (${d.count})`);

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
        Customer Segment Quadrant (RFM)
      </h3>
      <svg ref={svgRef} style={{ width: '100%', height: 'calc(100% - 30px)' }}></svg>
    </div>
  );
};

export default SegmentQuadrant; 