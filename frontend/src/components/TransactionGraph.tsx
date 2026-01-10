import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TransactionNode, TransactionEdge } from '../utils/advancedAnalysis';
import './TransactionGraph.css';

interface TransactionGraphProps {
  nodes: TransactionNode[];
  edges: TransactionEdge[];
  width?: number;
  height?: number;
}

const TransactionGraph: React.FC<TransactionGraphProps> = ({ 
  nodes, 
  edges, 
  width = 1200, 
  height = 800 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create zoom behavior
    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom as any);

    // Color scale based on risk score
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(['#4ade80', '#fbbf24', '#ef4444']);

    // Node type shapes
    const nodeShapes: Record<string, string> = {
      scammer: 'M -15,-15 L 15,-15 L 0,15 Z', // Triangle
      victim: 'M -12,-12 L 12,-12 L 12,12 L -12,12 Z', // Square
      intermediary: 'M 0,-15 L 15,0 L 0,15 L -15,0 Z', // Diamond
      exchange: 'M -15,0 A 15,15 0 1,1 15,0 A 15,15 0 1,1 -15,0', // Circle
      zk_pool: 'M -15,-10 L 0,-15 L 15,-10 L 15,10 L 0,15 L -15,10 Z', // Hexagon
      unknown: 'M -12,-12 L 12,-12 L 12,12 L -12,12 Z', // Square
    };

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges)
        .id((d: any) => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw edges with arrows
    const defs = g.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 20)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#64ffda');

    // Edge styles based on type
    const edgeColors: Record<string, string> = {
      direct: '#64ffda',
      routed: '#fbbf24',
      zk_shielded: '#a855f7',
      suspected: '#ef4444',
    };

    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => edgeColors[d.type] || '#666')
      .attr('stroke-width', (d: any) => Math.log(d.amount + 1) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)')
      .style('stroke-dasharray', (d: any) => 
        d.type === 'suspected' ? '5,5' : d.type === 'zk_shielded' ? '3,3' : '0'
      );

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', '#64ffda')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('z-index', 1000);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node shapes
    node.append('path')
      .attr('d', (d: any) => nodeShapes[d.type])
      .attr('fill', (d: any) => colorScale(d.riskScore))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 8px rgba(100, 255, 218, 0.6))')
      .on('mouseover', (event, d: any) => {
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(`
          <strong>${d.label}</strong><br/>
          Type: ${d.type}<br/>
          Risk: ${d.riskScore}/100<br/>
          Balance: ${d.balance.toFixed(4)} SOL<br/>
          TxCount: ${d.txCount}<br/>
          Tags: ${d.tags.join(', ')}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Node labels
    node.append('text')
      .text((d: any) => d.address.slice(0, 6))
      .attr('x', 0)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Risk score badges
    node.append('circle')
      .attr('cx', 15)
      .attr('cy', -15)
      .attr('r', 10)
      .attr('fill', (d: any) => d.riskScore > 70 ? '#ef4444' : d.riskScore > 40 ? '#fbbf24' : '#4ade80');

    node.append('text')
      .text((d: any) => d.riskScore)
      .attr('x', 15)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '8px')
      .attr('font-weight', 'bold');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [nodes, edges, width, height]);

  return (
    <div className="transaction-graph-container">
      <div className="graph-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-shape scammer"></div>
            <span>Scammer (Risk &gt; 80)</span>
          </div>
          <div className="legend-item">
            <div className="legend-shape victim"></div>
            <span>Victim</span>
          </div>
          <div className="legend-item">
            <div className="legend-shape intermediary"></div>
            <span>Intermediary</span>
          </div>
          <div className="legend-item">
            <div className="legend-shape exchange"></div>
            <span>Exchange</span>
          </div>
          <div className="legend-item">
            <div className="legend-shape zk-pool"></div>
            <span>ZK Pool</span>
          </div>
        </div>
        <div className="edge-legend">
          <div className="edge-item">
            <div className="edge-line direct"></div>
            <span>Direct Transfer</span>
          </div>
          <div className="edge-item">
            <div className="edge-line routed"></div>
            <span>Multi-Hop</span>
          </div>
          <div className="edge-item">
            <div className="edge-line zk"></div>
            <span>ZK Shielded</span>
          </div>
          <div className="edge-item">
            <div className="edge-line suspected"></div>
            <span>Suspected Link</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default TransactionGraph;
