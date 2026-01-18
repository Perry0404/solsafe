import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './BlockchainTracer.css';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
  confirmations: number;
  fee: number;
  blockHeight?: number;
}

interface AddressInfo {
  address: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  transactions: Transaction[];
}

interface NetworkNode {
  id: string;
  label: string;
  type: 'address' | 'transaction';
  value: number;
  group: string;
}

interface NetworkEdge {
  from: string;
  to: string;
  value: number;
  label: string;
}

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    val: number;
    color: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
    label?: string;
  }>;
}

const BlockchainTracer: React.FC = () => {
  const [blockchain, setBlockchain] = useState<'bitcoin' | 'litecoin' | 'solana'>('bitcoin');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const graphRef = useRef<any>();

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

  // Fetch blockchain stats on mount
  useEffect(() => {
    fetchStats();
  }, [blockchain]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${blockchain}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const traceAddress = async () => {
    if (!address.trim()) {
      alert('Please enter an address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/trace/${blockchain}/${address}`);
      const data = await response.json();

      if (data.success) {
        setAddressInfo(data.addressInfo);

        // Transform data for force graph
        const nodes = data.graph.nodes.map((node: NetworkNode) => ({
          id: node.id,
          name: node.label,
          val: Math.max(node.value * 10, 5),
          color: getNodeColor(node.group)
        }));

        const links = data.graph.edges.map((edge: NetworkEdge) => ({
          source: edge.from,
          target: edge.to,
          value: edge.value,
          label: edge.label
        }));

        setGraphData({ nodes, links });
      } else {
        alert(`Error: ${data.message || 'Failed to trace address'}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Failed to trace address. Please check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (group: string): string => {
    switch (group) {
      case 'central':
        return '#8a2be2'; // Purple for central address
      case 'sender':
        return '#ff6b6b'; // Red for senders
      case 'receiver':
        return '#51cf66'; // Green for receivers
      case 'transaction':
        return '#339af0'; // Blue for transactions
      default:
        return '#868e96';
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const renderNodeCanvas = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const label = node.name;
    const fontSize = 12;
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.color;
    ctx.fillText(label, node.x, node.y + node.val + 5);
  }, []);

  return (
    <div className="blockchain-tracer">
      {/* Header */}
      <div className="tracer-header">
        <h1>🔍 Blockchain Transaction Tracer</h1>
        <p>Trace and visualize cryptocurrency transactions in real-time</p>
      </div>

      {/* Controls */}
      <div className="tracer-controls">
        <div className="control-group">
          <label>Select Blockchain</label>
          <div className="blockchain-selector">
            <button
              className={blockchain === 'bitcoin' ? 'active' : ''}
              onClick={() => setBlockchain('bitcoin')}
            >
              <span className="crypto-icon">₿</span> Bitcoin
            </button>
            <button
              className={blockchain === 'litecoin' ? 'active' : ''}
              onClick={() => setBlockchain('litecoin')}
            >
              <span className="crypto-icon">Ł</span> Litecoin
            </button>
            <button
              className={blockchain === 'solana' ? 'active' : ''}
              onClick={() => setBlockchain('solana')}
            >
              <span className="crypto-icon">◎</span> Solana
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Enter Address</label>
          <div className="address-input-group">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Enter ${blockchain} address...`}
              onKeyPress={(e) => e.key === 'Enter' && traceAddress()}
            />
            <button onClick={traceAddress} disabled={loading}>
              {loading ? '⏳ Tracing...' : '🔍 Trace'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          {blockchain === 'bitcoin' && (
            <>
              <div className="stat-item">
                <span className="stat-label">Price</span>
                <span className="stat-value">${stats.marketPrice?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Blocks</span>
                <span className="stat-value">{stats.totalBlocks?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Hash Rate</span>
                <span className="stat-value">{(stats.hashRate / 1000000000).toFixed(2)} EH/s</span>
              </div>
            </>
          )}
          {blockchain === 'litecoin' && (
            <>
              <div className="stat-item">
                <span className="stat-label">Last Block</span>
                <span className="stat-value">{stats.lastBlock?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Peers</span>
                <span className="stat-value">{stats.peersConnected}</span>
              </div>
            </>
          )}
          {blockchain === 'solana' && (
            <>
              <div className="stat-item">
                <span className="stat-label">Slot</span>
                <span className="stat-value">{stats.currentSlot?.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">TPS</span>
                <span className="stat-value">{stats.tps?.toFixed(0)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Circulating</span>
                <span className="stat-value">{stats.circulatingSupply?.toLocaleString()} SOL</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="tracer-content">
        {/* Address Info */}
        {addressInfo && (
          <div className="address-info-panel">
            <h3>Address Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Balance</span>
                <span className="info-value">{addressInfo.balance.toFixed(8)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Received</span>
                <span className="info-value">{addressInfo.totalReceived.toFixed(8)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Sent</span>
                <span className="info-value">{addressInfo.totalSent.toFixed(8)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Transactions</span>
                <span className="info-value">{addressInfo.txCount}</span>
              </div>
            </div>

            <h4>Recent Transactions</h4>
            <div className="transactions-list">
              {addressInfo.transactions.slice(0, 10).map((tx) => (
                <div key={tx.hash} className="transaction-item">
                  <div className="tx-hash">{tx.hash.substring(0, 16)}...</div>
                  <div className="tx-details">
                    <span className="tx-value">{tx.value.toFixed(4)}</span>
                    <span className="tx-time">{new Date(tx.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graph Visualization */}
        <div className="graph-container">
          {graphData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel="name"
              nodeColor="color"
              nodeVal="val"
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.25}
              onNodeClick={handleNodeClick}
              nodeCanvasObject={renderNodeCanvas}
              d3VelocityDecay={0.3}
              width={800}
              height={600}
              backgroundColor="#0a0e27"
            />
          ) : (
            <div className="graph-placeholder">
              <div className="placeholder-content">
                <span className="placeholder-icon">🌐</span>
                <p>Enter an address and click "Trace" to visualize the transaction network</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="node-details-modal" onClick={() => setSelectedNode(null)}>
          <div className="node-details-content" onClick={(e) => e.stopPropagation()}>
            <h3>Node Details</h3>
            <div className="detail-row">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedNode.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Label:</span>
              <span className="detail-value">{selectedNode.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Value:</span>
              <span className="detail-value">{selectedNode.val}</span>
            </div>
            <button onClick={() => setSelectedNode(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#8a2be2' }}></span>
          <span>Central Address</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff6b6b' }}></span>
          <span>Sender</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#51cf66' }}></span>
          <span>Receiver</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#339af0' }}></span>
          <span>Transaction</span>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTracer;
