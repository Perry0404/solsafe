import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import ForceGraph2D from 'react-force-graph-2d';
import './EvidenceGeneratorV2.css';

interface BlockchainData {
  address: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  transactions: Transaction[];
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: number;
  timestamp: number;
  confirmations: number;
  fee: number;
}

interface TrendingToken {
  symbol: string;
  name: string;
  volume: string;
  marketCap: string;
  price: string;
  change: number;
  transfers: number;
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
  }>;
}

const EvidenceGeneratorV2: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChain, setSelectedChain] = useState<'bitcoin' | 'litecoin' | 'solana' | 'ethereum' | 'bsc' | 'polygon' | 'zksync' | 'aztec'>('solana');
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState<BlockchainData | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [trendingTokens] = useState<TrendingToken[]>([
    { symbol: 'SOL', name: 'Solana', volume: '$2.5B', marketCap: '$45B', price: '$108.50', change: 5.2, transfers: 145000 },
    { symbol: 'ETH', name: 'Ethereum', volume: '$18B', marketCap: '$420B', price: '$3,500', change: 4.8, transfers: 1200000 },
    { symbol: 'BONK', name: 'Bonk', volume: '$89M', marketCap: '$1.2B', price: '$0.00002', change: 12.5, transfers: 89000 },
    { symbol: 'JUP', name: 'Jupiter', volume: '$156M', marketCap: '$2.8B', price: '$1.45', change: -2.3, transfers: 67000 },
  ]);
  const [featuredTokens] = useState<TrendingToken[]>([
    { symbol: 'BTC', name: 'Bitcoin', volume: '$45B', marketCap: '$1.2T', price: '$62,500', change: 3.1, transfers: 250000 },
    { symbol: 'LTC', name: 'Litecoin', volume: '$1.2B', marketCap: '$8.5B', price: '$115.20', change: 1.8, transfers: 45000 },
    { symbol: 'MATIC', name: 'Polygon', volume: '$890M', marketCap: '$7.2B', price: '$0.95', change: 6.5, transfers: 156000 },
    { symbol: 'USDC', name: 'USD Coin', volume: '$8.9B', marketCap: '$32B', price: '$1.00', change: 0.01, transfers: 890000 },
  ]);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchBlockchainStats();
  }, [selectedChain]);

  const fetchBlockchainStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats/${selectedChain}`);
      const data = await response.json();
      if (data.success) {
        setBlockchainStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter an address or transaction hash');
      return;
    }

    setLoading(true);
    try {
      // Determine API endpoint based on chain
      let apiEndpoint = '';
      if (['ethereum', 'bsc', 'polygon'].includes(selectedChain)) {
        apiEndpoint = `${API_URL}/api/trace/evm/${selectedChain}/${searchQuery}`;
      } else if (selectedChain === 'zksync') {
        apiEndpoint = `${API_URL}/api/trace/zksync/${searchQuery}`;
      } else if (selectedChain === 'aztec') {
        apiEndpoint = `${API_URL}/api/trace/aztec/${searchQuery}`;
      } else {
        apiEndpoint = `${API_URL}/api/trace/${selectedChain}/${searchQuery}`;
      }

      const response = await fetch(apiEndpoint);
      const data = await response.json();

      if (data.success) {
        setAddressData(data.addressInfo);

        const nodes = data.graph.nodes.map((node: any) => ({
          id: node.id,
          name: node.label,
          val: Math.max(node.value * 10, 5),
          color: getNodeColor(node.group)
        }));

        const links = data.graph.edges.map((edge: any) => ({
          source: edge.from,
          target: edge.to,
          value: edge.value
        }));

        setGraphData({ nodes, links });
      } else {
        alert(`Error: ${data.message || 'Failed to fetch data'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch blockchain data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (group: string): string => {
    switch (group) {
      case 'central': return '#8a2be2';
      case 'sender': return '#ff6b6b';
      case 'receiver': return '#51cf66';
      case 'transaction': return '#339af0';
      default: return '#868e96';
    }
  };

  return (
    <div className="evidence-generator-v2">
      {/* Hero Section with Search */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>🔍 Blockchain Evidence Tracer</h1>
          <p>Trace and analyze cryptocurrency transactions across multiple blockchains</p>
          
          <div className="search-container">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search Address, Transaction Hash, or Token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          <div className="chain-selector-hero">
            <button
              className={selectedChain === 'solana' ? 'active' : ''}
              onClick={() => setSelectedChain('solana')}
            >
              <span className="chain-icon">◎</span> Solana
            </button>
            <button
              className={selectedChain === 'bitcoin' ? 'active' : ''}
              onClick={() => setSelectedChain('bitcoin')}
            >
              <span className="chain-icon">₿</span> Bitcoin
            </button>
            <button
              className={selectedChain === 'litecoin' ? 'active' : ''}
              onClick={() => setSelectedChain('litecoin')}
            >
              <span className="chain-icon">Ł</span> Litecoin
            </button>
          </div>
        </div>
      </div>

      {/* Blockchain Stats Bar */}
      {blockchainStats && (
        <div className="stats-banner">
          {selectedChain === 'bitcoin' && (
            <>
              <div className="stat-card">
                <span className="stat-label">BTC Price</span>
                <span className="stat-value">${blockchainStats.marketPrice?.toLocaleString()}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Blocks</span>
                <span className="stat-value">{blockchainStats.totalBlocks?.toLocaleString()}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Hash Rate</span>
                <span className="stat-value">{(blockchainStats.hashRate / 1000000000).toFixed(2)} EH/s</span>
              </div>
            </>
          )}
          {selectedChain === 'solana' && (
            <>
              <div className="stat-card">
                <span className="stat-label">Current Slot</span>
                <span className="stat-value">{blockchainStats.currentSlot?.toLocaleString()}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">TPS</span>
                <span className="stat-value">{blockchainStats.tps?.toFixed(0)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Circulating Supply</span>
                <span className="stat-value">{(blockchainStats.circulatingSupply / 1000000).toFixed(1)}M SOL</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {/* Address Analysis Panel */}
        {addressData && (
          <div className="analysis-panel">
            <h2>📊 Address Analysis</h2>
            <div className="address-info-grid">
              <div className="info-card">
                <span className="info-label">Address</span>
                <span className="info-value mono">{addressData.address.substring(0, 12)}...{addressData.address.substring(addressData.address.length - 8)}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Balance</span>
                <span className="info-value">{addressData.balance.toFixed(6)}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Total Received</span>
                <span className="info-value">{addressData.totalReceived.toFixed(6)}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Total Sent</span>
                <span className="info-value">{addressData.totalSent.toFixed(6)}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Transactions</span>
                <span className="info-value">{addressData.txCount}</span>
              </div>
            </div>

            <h3>Recent Transactions</h3>
            <div className="transactions-table">
              {addressData.transactions.slice(0, 10).map((tx) => (
                <div key={tx.hash} className="tx-row">
                  <span className="tx-hash">{tx.hash.substring(0, 16)}...</span>
                  <span className="tx-value">{tx.value.toFixed(4)}</span>
                  <span className="tx-time">{new Date(tx.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Graph Visualization */}
        {graphData.nodes.length > 0 && (
          <div className="graph-panel">
            <h2>🌐 Transaction Network</h2>
            <div className="graph-wrapper">
              <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeColor="color"
                nodeVal="val"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                onNodeClick={(node) => setSelectedNode(node)}
                d3VelocityDecay={0.3}
                width={800}
                height={600}
                backgroundColor="rgba(10, 14, 39, 0.8)"
              />
            </div>
          </div>
        )}

        {/* Explore Tokens Section */}
        {!addressData && !graphData.nodes.length && (
          <div className="explore-section">
            <h2>🔥 Trending Tokens</h2>
            <div className="tokens-grid">
              <div className="token-header">
                <span>Token</span>
                <span>Transfers</span>
                <span>Volume</span>
                <span>Market Cap / Price</span>
              </div>
              {trendingTokens.map((token) => (
                <div key={token.symbol} className="token-row" onClick={() => setSearchQuery(token.symbol)}>
                  <div className="token-info">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                  </div>
                  <span className="token-transfers">{token.transfers.toLocaleString()}</span>
                  <span className="token-volume">{token.volume}</span>
                  <div className="token-market">
                    <span className="token-price">{token.price}</span>
                    <span className={`token-change ${token.change > 0 ? 'positive' : 'negative'}`}>
                      {token.change > 0 ? '▲' : '▼'} {Math.abs(token.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: '3rem' }}>⭐ Featured Tokens</h2>
            <div className="tokens-grid">
              <div className="token-header">
                <span>Token</span>
                <span>Transfers</span>
                <span>Volume</span>
                <span>Market Cap / Price</span>
              </div>
              {featuredTokens.map((token) => (
                <div key={token.symbol} className="token-row" onClick={() => setSearchQuery(token.symbol)}>
                  <div className="token-info">
                    <span className="token-symbol">{token.symbol}</span>
                    <span className="token-name">{token.name}</span>
                  </div>
                  <span className="token-transfers">{token.transfers.toLocaleString()}</span>
                  <span className="token-volume">{token.volume}</span>
                  <div className="token-market">
                    <span className="token-price">{token.price}</span>
                    <span className={`token-change ${token.change > 0 ? 'positive' : 'negative'}`}>
                      {token.change > 0 ? '▲' : '▼'} {Math.abs(token.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <h4>Graph Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#8a2be2' }}></span>
            <span>Central Address</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#ff6b6b' }}></span>
            <span>Sender</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#51cf66' }}></span>
            <span>Receiver</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#339af0' }}></span>
            <span>Transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceGeneratorV2;
