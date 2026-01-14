import React, { useEffect, useRef, useState } from 'react';
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
  width = 1400, 
  height = 900 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TransactionNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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

    // Color scale based on risk score - More vibrant colors
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 30, 60, 100])
      .range(['#10b981', '#3b82f6', '#f59e0b', '#ef4444']); // Green → Blue → Orange → Red

    // Node type shapes with LARGER sizes for better visibility
    const nodeShapes: Record<string, string> = {
      target: 'M -20,-20 L 20,-20 L 0,25 Z', // Triangle (Larger)
      scammer: 'M -20,-20 L 20,-20 L 0,25 Z', // Triangle (Red)
      victim: 'M -18,-18 L 18,-18 L 18,18 L -18,18 Z', // Square (Larger)
      intermediary: 'M 0,-20 L 20,0 L 0,20 L -20,0 Z', // Diamond (Larger)
      exchange: 'M -20,0 A 20,20 0 1,1 20,0 A 20,20 0 1,1 -20,0', // Circle (Larger)
      mixer: 'M -20,-12 L 0,-20 L 20,-12 L 20,12 L 0,20 L -20,12 Z', // Hexagon (ZK Mixer)
      zk_pool: 'M -20,-12 L 0,-20 L 20,-12 L 20,12 L 0,20 L -20,12 Z', // Hexagon
      wallet: 'M -18,-18 L 18,-18 L 18,18 L -18,18 Z', // Square
      unknown: 'M 0,-20 L 20,0 L 0,20 L -20,0 Z', // Diamond
    };

    // Force simulation - stronger forces for better separation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges)
        .id((d: any) => d.address) // Changed from d.id to d.address
        .distance(200)) // Increased from 150
      .force('charge', d3.forceManyBody().strength(-600)) // Increased from -400
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50)); // Increased from 40

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

    // Tooltip - ENHANCED with more details
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'linear-gradient(135deg, rgba(17, 24, 39, 0.98), rgba(31, 41, 55, 0.98))')
      .style('color', '#64ffda')
      .style('padding', '16px')
      .style('border-radius', '12px')
      .style('border', '2px solid #64ffda')
      .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none')
      .style('z-index', 10000)
      .style('font-size', '14px')
      .style('min-width', '280px');

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

    // Node shapes - ENHANCED with glow effect
    node.append('path')
      .attr('d', (d: any) => nodeShapes[d.type] || nodeShapes['unknown'])
      .attr('fill', (d: any) => colorScale(d.riskScore || 50))
      .attr('stroke', (d: any) => d.type === 'target' || d.type === 'scammer' ? '#ef4444' : 
                                   d.type === 'mixer' || d.type === 'zk_pool' ? '#a855f7' : '#64ffda')
      .attr('stroke-width', 3)
      .style('filter', (d: any) => 
        d.type === 'mixer' || d.type === 'zk_pool' 
          ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))' 
          : 'drop-shadow(0 0 10px rgba(100, 255, 218, 0.6))'
      )
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        // Highlight node
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 5)
          .style('filter', 'drop-shadow(0 0 20px rgba(100, 255, 218, 1))');
        
        // Show detailed tooltip
        const riskColor = d.riskScore > 70 ? '#ef4444' : d.riskScore > 40 ? '#f59e0b' : '#10b981';
        const typeLabels: Record<string, string> = {
          target: '🎯 Target Address',
          scammer: '⚠️ Suspected Scammer',
          mixer: '🔐 ZK Mixer Protocol',
          zk_pool: '🔐 Privacy Pool',
          exchange: '🏦 Exchange',
          wallet: '👛 Wallet',
          victim: '😢 Potential Victim',
          intermediary: '🔄 Intermediary',
          unknown: '❓ Unknown'
        };
        
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="border-bottom: 2px solid #64ffda; padding-bottom: 8px; margin-bottom: 12px;">
            <strong style="font-size: 16px; color: #64ffda;">${typeLabels[d.type] || d.type}</strong>
          </div>
          <div style="line-height: 1.8;">
            <div style="margin-bottom: 8px;">
              <strong>Address:</strong> <code style="color: #fbbf24; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">${d.address.slice(0, 8)}...${d.address.slice(-6)}</code>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Label:</strong> <span style="color: #fff;">${d.label || 'Unknown'}</span>
            </div>
            <div style="margin-bottom: 8px;">
              <strong>Risk Score:</strong> 
              <span style="color: ${riskColor}; font-weight: bold; font-size: 18px; margin-left: 8px;">${d.riskScore || 0}/100</span>
            </div>
            ${d.balance !== undefined ? `
              <div style="margin-bottom: 8px;">
                <strong>Balance:</strong> <span style="color: #10b981;">${d.balance.toFixed(4)} ${d.chain === 'ethereum' ? 'ETH' : 'SOL'}</span>
              </div>
            ` : ''}
            ${d.txCount !== undefined ? `
              <div style="margin-bottom: 8px;">
                <strong>Transactions:</strong> <span style="color: #fff;">${d.txCount}</span>
              </div>
            ` : ''}
            ${d.tags && d.tags.length > 0 ? `
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(100, 255, 218, 0.3);">
                <strong>Tags:</strong><br/>
                ${d.tags.map((tag: string) => `<span style="display: inline-block; background: rgba(100, 255, 218, 0.2); color: #64ffda; padding: 4px 8px; border-radius: 6px; margin: 4px 4px 0 0; font-size: 12px;">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 28) + 'px');
        
        setSelectedNode(d);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('stroke-width', 3)
          .style('filter', (d: any) => 
            d.type === 'mixer' || d.type === 'zk_pool' 
              ? 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))' 
              : 'drop-shadow(0 0 10px rgba(100, 255, 218, 0.6))'
          );
        
        tooltip.transition().duration(300).style('opacity', 0);
      })
      .on('click', (event, d: any) => {
        // Copy address to clipboard
        navigator.clipboard.writeText(d.address);
        
        // Show temporary notification
        const notification = d3.select('body').append('div')
          .style('position', 'fixed')
          .style('top', '20px')
          .style('right', '20px')
          .style('background', 'linear-gradient(135deg, #10b981, #059669)')
          .style('color', 'white')
          .style('padding', '12px 20px')
          .style('border-radius', '8px')
          .style('box-shadow', '0 4px 12px rgba(0, 0, 0, 0.3)')
          .style('z-index', 10001)
          .style('font-weight', 'bold')
          .text('✓ Address copied to clipboard!');
        
        setTimeout(() => {
          notification.transition().duration(300).style('opacity', 0).remove();
        }, 2000);
      });

    // Node labels - BIGGER and more visible
    node.append('text')
      .text((d: any) => d.label || d.address.slice(0, 8))
      .attr('x', 0)
      .attr('y', 32)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none');

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
      {/* Control Panel */}
      <div className="graph-controls">
        <h3 style={{ margin: 0, color: '#64ffda', fontSize: '18px' }}>
          🕸️ Transaction Network Visualizer
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
          <button
            className="zoom-button"
            onClick={() => {
              const svg = d3.select(svgRef.current);
              svg.transition().call(
                (d3.zoom() as any).transform,
                d3.zoomIdentity.scale(zoomLevel * 1.3)
              );
              setZoomLevel(zoomLevel * 1.3);
            }}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            🔍+ Zoom In
          </button>
          <button
            className="zoom-button"
            onClick={() => {
              const svg = d3.select(svgRef.current);
              svg.transition().call(
                (d3.zoom() as any).transform,
                d3.zoomIdentity.scale(zoomLevel * 0.7)
              );
              setZoomLevel(zoomLevel * 0.7);
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            🔍- Zoom Out
          </button>
          <button
            className="reset-button"
            onClick={() => {
              const svg = d3.select(svgRef.current);
              svg.transition().call(
                (d3.zoom() as any).transform,
                d3.zoomIdentity
              );
              setZoomLevel(1);
            }}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            ↺ Reset View
          </button>
          <div style={{ 
            color: '#64ffda', 
            marginLeft: '16px', 
            fontSize: '14px',
            background: 'rgba(100, 255, 218, 0.1)',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(100, 255, 218, 0.3)'
          }}>
            💡 <strong>Tip:</strong> Click nodes to copy addresses • Drag to reposition • Scroll to zoom
          </div>
        </div>
      </div>

      {/* Legend - ENHANCED */}
      <div className="graph-legend">
        <h4 style={{ margin: '0 0 16px 0', color: '#64ffda', fontSize: '16px', fontWeight: 'bold' }}>
          📊 Node Types & Risk Levels
        </h4>
        <div className="legend-items">
          <div className="legend-item">
            <svg width="30" height="30" style={{ marginRight: '8px' }}>
              <path d="M 5,5 L 25,5 L 15,25 Z" fill="#ef4444" stroke="#fff" strokeWidth="2"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: '500' }}>🎯 Target/Scammer (High Risk)</span>
          </div>
          <div className="legend-item">
            <svg width="30" height="30" style={{ marginRight: '8px' }}>
              <path d="M 3,3 L 27,3 L 27,27 L 3,27 Z" fill="#3b82f6" stroke="#fff" strokeWidth="2"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: '500' }}>👛 Wallet</span>
          </div>
          <div className="legend-item">
            <svg width="30" height="30" style={{ marginRight: '8px' }}>
              <path d="M 15,3 L 27,15 L 15,27 L 3,15 Z" fill="#f59e0b" stroke="#fff" strokeWidth="2"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: '500' }}>🔄 Intermediary</span>
          </div>
          <div className="legend-item">
            <svg width="30" height="30" style={{ marginRight: '8px' }}>
              <circle cx="15" cy="15" r="12" fill="#10b981" stroke="#fff" strokeWidth="2"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: '500' }}>🏦 Exchange</span>
          </div>
          <div className="legend-item">
            <svg width="30" height="30" style={{ marginRight: '8px' }}>
              <path d="M 3,9 L 15,3 L 27,9 L 27,21 L 15,27 L 3,21 Z" fill="#a855f7" stroke="#fff" strokeWidth="2"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: '500' }}>🔐 ZK Mixer/Privacy Pool</span>
          </div>
        </div>
        
        <h4 style={{ margin: '20px 0 12px 0', color: '#64ffda', fontSize: '16px', fontWeight: 'bold' }}>
          🔗 Transaction Types
        </h4>
        <div className="edge-legend">
          <div className="edge-item">
            <div className="edge-line direct"></div>
            <span style={{ color: '#fff', fontWeight: '500' }}>Direct Transfer</span>
          </div>
          <div className="edge-item">
            <div className="edge-line routed"></div>
            <span style={{ color: '#fff', fontWeight: '500' }}>Multi-Hop Routing</span>
          </div>
          <div className="edge-item">
            <div className="edge-line zk"></div>
            <span style={{ color: '#fff', fontWeight: '500' }}>🔐 ZK Shielded (Privacy)</span>
          </div>
          <div className="edge-item">
            <div className="edge-line suspected"></div>
            <span style={{ color: '#fff', fontWeight: '500' }}>⚠️ Suspected Link (Probabilistic)</span>
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'rgba(100, 255, 218, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(100, 255, 218, 0.2)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#64ffda', fontSize: '14px' }}>📈 Network Statistics</h4>
          <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#fff' }}>
            <div><strong>Total Nodes:</strong> {nodes.length}</div>
            <div><strong>Total Edges:</strong> {edges.length}</div>
            <div><strong>High Risk Nodes:</strong> {nodes.filter(n => n.riskScore > 70).length}</div>
            <div><strong>ZK Protocols:</strong> {nodes.filter(n => n.type === 'mixer' || n.type === 'zk_pool').length}</div>
          </div>
        </div>
      </div>

      <svg ref={svgRef} style={{ border: '2px solid rgba(100, 255, 218, 0.3)', borderRadius: '12px' }}></svg>
    </div>
  );
};

export default TransactionGraph;
