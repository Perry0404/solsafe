import express from 'express';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

const router = express.Router();

// Blockchain API endpoints
const BLOCKCHAIN_INFO_API = 'https://blockchain.info';
const BLOCKCYPHER_API = 'https://api.blockcypher.com/v1';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';
const ETHERSCAN_API = 'https://api.etherscan.io/api';
const BSCSCAN_API = 'https://api.bscscan.com/api';
const POLYGONSCAN_API = 'https://api.polygonscan.com/api';
const ZKSYNC_API = 'https://block-explorer-api.mainnet.zksync.io/api';
const AZTEC_API = 'https://api.aztec.network/aztec-connect-prod/falafel';
const MONERO_API = 'https://xmrchain.net/api';
const CARDANO_API = 'https://cardano-mainnet.blockfrost.io/api/v0';
const RIPPLE_API = 'https://data.ripple.com/v2';
const TRON_API = 'https://apilist.tronscan.org/api';
const AVALANCHE_API = 'https://api.avax.network/ext/bc/C/rpc';
const ARBITRUM_API = 'https://api.arbiscan.io/api';
const OPTIMISM_API = 'https://api-optimistic.etherscan.io/api';
const BASE_API = 'https://api.basescan.org/api';

// Known entity addresses for labeling
const KNOWN_ENTITIES = {
  exchanges: {
    '0x28C6c06298d514Db089934071355E5743bf21d60': 'Binance Hot Wallet',
    '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549': 'Binance Cold Wallet',
    '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0': 'Kraken Exchange',
    '0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13': 'Coinbase Hot Wallet',
    '0xA090e606E30bD747d4E6245a1517EbE430F0057e': 'Coinbase Cold Wallet',
    '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b': 'OKX Exchange',
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE': 'Binance: Bridge',
    '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF': 'Binance: Ethereum',
    '0x4Fabb145d64652a948d72533023f6E7A623C7C53': 'Binance USD (BUSD)',
    'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': 'Binance Bitcoin',
  },
  mixers: {
    '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936': 'Tornado Cash: 100 ETH',
    '0x910Cbd523D972eb0a6f4cAe4618aD62622b39DbF': 'Tornado Cash: 10 ETH',
    '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291': 'Tornado Cash: 1 ETH',
    '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc': 'Tornado Cash: 0.1 ETH',
    '0x8589427373D6D84E98730D7795D8f6f8731FDA16': 'Tornado Cash: Router',
    '0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b': 'Tornado Cash: Proxy',
  },
  defi: {
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': 'Uniswap V2: Router 2',
    '0xE592427A0AEce92De3Edee1F18E0157C05861564': 'Uniswap V3: Router',
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': 'Uniswap V3: Router 2',
    '0x1111111254fb6c44bAC0beD2854e76F90643097d': '1inch: Aggregation Router V4',
    '0x881D40237659C251811CEC9c364ef91dC08D300C': 'Metamask: Swap Router',
    '0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49': 'Curve.fi: TriCrypto2',
    '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7': 'Curve.fi: 3pool',
  },
  scams: {
    // Add known scam addresses
  }
};

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

interface EntityLabel {
  address: string;
  name: string;
  type: 'exchange' | 'mixer' | 'defi' | 'scam' | 'mev' | 'whale' | 'contract' | 'unknown';
  risk: 'low' | 'medium' | 'high' | 'critical';
}

interface IntelligenceAnalysis {
  mixerUsage: boolean;
  exchangeDeposits: string[];
  mevBotActivity: boolean;
  washTradingDetected: boolean;
  rugPullRisk: number;
  whaleActivity: boolean;
  entities: EntityLabel[];
  riskFactors: string[];
  suspiciousPatterns: string[];
}

/**
 * Advanced Intelligence: Label addresses with known entities
 */
function labelAddress(address: string): EntityLabel {
  // Check exchanges
  if (KNOWN_ENTITIES.exchanges[address]) {
    return {
      address,
      name: KNOWN_ENTITIES.exchanges[address],
      type: 'exchange',
      risk: 'low'
    };
  }
  
  // Check mixers (HIGH RISK)
  if (KNOWN_ENTITIES.mixers[address]) {
    return {
      address,
      name: KNOWN_ENTITIES.mixers[address],
      type: 'mixer',
      risk: 'critical'
    };
  }
  
  // Check DeFi protocols
  if (KNOWN_ENTITIES.defi[address]) {
    return {
      address,
      name: KNOWN_ENTITIES.defi[address],
      type: 'defi',
      risk: 'low'
    };
  }
  
  return {
    address,
    name: 'Unknown',
    type: 'unknown',
    risk: 'medium'
  };
}

/**
 * Advanced Intelligence: Detect mixer usage (Tornado Cash, etc.)
 */
function detectMixerUsage(transactions: Transaction[]): boolean {
  const mixerAddresses = Object.keys(KNOWN_ENTITIES.mixers);
  return transactions.some(tx => 
    mixerAddresses.includes(tx.from.toLowerCase()) || 
    mixerAddresses.includes(tx.to.toLowerCase())
  );
}

/**
 * Advanced Intelligence: Detect exchange deposits
 */
function detectExchangeDeposits(transactions: Transaction[]): string[] {
  const exchangeAddresses = Object.keys(KNOWN_ENTITIES.exchanges);
  const deposits: string[] = [];
  
  transactions.forEach(tx => {
    const toExchange = exchangeAddresses.find(ex => ex.toLowerCase() === tx.to.toLowerCase());
    if (toExchange) {
      deposits.push(KNOWN_ENTITIES.exchanges[toExchange]);
    }
  });
  
  return [...new Set(deposits)];
}

/**
 * Advanced Intelligence: Detect MEV bot activity
 */
function detectMEVBot(transactions: Transaction[]): boolean {
  // MEV bots typically have:
  // 1. High frequency trading (many txs in short time)
  // 2. Interactions with DEX routers
  // 3. Sandwich attack patterns (before & after user transactions)
  
  if (transactions.length < 10) return false;
  
  const dexRouters = Object.keys(KNOWN_ENTITIES.defi);
  const dexInteractions = transactions.filter(tx => 
    dexRouters.includes(tx.to.toLowerCase())
  );
  
  // High DEX interaction rate suggests MEV bot
  return dexInteractions.length > transactions.length * 0.7;
}

/**
 * Advanced Intelligence: Detect wash trading
 */
function detectWashTrading(transactions: Transaction[]): boolean {
  // Wash trading: Same addresses trading back and forth
  const addressPairs = new Map<string, number>();
  
  transactions.forEach(tx => {
    const pair = [tx.from, tx.to].sort().join('-');
    addressPairs.set(pair, (addressPairs.get(pair) || 0) + 1);
  });
  
  // If any pair trades more than 5 times, likely wash trading
  return Array.from(addressPairs.values()).some(count => count > 5);
}

/**
 * Advanced Intelligence: Calculate rug pull risk
 */
function calculateRugPullRisk(addressInfo: AddressInfo): number {
  let risk = 0;
  
  // High outflow vs inflow ratio
  if (addressInfo.totalSent > addressInfo.totalReceived * 2) {
    risk += 30;
  }
  
  // Rapid selling (many outgoing transactions)
  const recentTxs = addressInfo.transactions.slice(0, 10);
  const outgoingRatio = recentTxs.filter(tx => 
    tx.from.toLowerCase() === addressInfo.address.toLowerCase()
  ).length / recentTxs.length;
  
  if (outgoingRatio > 0.8) {
    risk += 40;
  }
  
  // Large single transactions (dump)
  const avgValue = addressInfo.totalSent / addressInfo.txCount;
  const hasLargeDump = addressInfo.transactions.some(tx => 
    tx.value > avgValue * 10
  );
  
  if (hasLargeDump) {
    risk += 30;
  }
  
  return Math.min(100, risk);
}

/**
 * Advanced Intelligence: Detect whale activity
 */
function detectWhaleActivity(addressInfo: AddressInfo): boolean {
  // Whale criteria:
  // 1. Large balance (context-dependent)
  // 2. Large transaction volumes
  const largeTxThreshold = 10; // Adjust per chain
  
  return addressInfo.balance > 100 || 
         addressInfo.transactions.some(tx => tx.value > largeTxThreshold);
}

/**
 * Advanced Intelligence: Comprehensive analysis
 */
function performIntelligenceAnalysis(addressInfo: AddressInfo): IntelligenceAnalysis {
  const mixerUsage = detectMixerUsage(addressInfo.transactions);
  const exchangeDeposits = detectExchangeDeposits(addressInfo.transactions);
  const mevBotActivity = detectMEVBot(addressInfo.transactions);
  const washTradingDetected = detectWashTrading(addressInfo.transactions);
  const rugPullRisk = calculateRugPullRisk(addressInfo);
  const whaleActivity = detectWhaleActivity(addressInfo);
  
  // Label all unique addresses in transactions
  const uniqueAddresses = new Set<string>();
  addressInfo.transactions.forEach(tx => {
    uniqueAddresses.add(tx.from.toLowerCase());
    uniqueAddresses.add(tx.to.toLowerCase());
  });
  
  const entities = Array.from(uniqueAddresses)
    .map(addr => labelAddress(addr))
    .filter(entity => entity.type !== 'unknown');
  
  // Build risk factors list
  const riskFactors: string[] = [];
  const suspiciousPatterns: string[] = [];
  
  if (mixerUsage) {
    riskFactors.push('Tornado Cash / Mixer Usage');
    suspiciousPatterns.push('PRIVACY_MIXER');
  }
  
  if (exchangeDeposits.length > 0) {
    riskFactors.push(`Exchange Deposits: ${exchangeDeposits.join(', ')}`);
  }
  
  if (mevBotActivity) {
    riskFactors.push('MEV Bot Activity Detected');
    suspiciousPatterns.push('MEV_BOT');
  }
  
  if (washTradingDetected) {
    riskFactors.push('Wash Trading Pattern Detected');
    suspiciousPatterns.push('WASH_TRADING');
  }
  
  if (rugPullRisk > 70) {
    riskFactors.push(`High Rug Pull Risk: ${rugPullRisk}%`);
    suspiciousPatterns.push('RUG_PULL_RISK');
  }
  
  if (whaleActivity) {
    riskFactors.push('Whale-Level Holdings or Transactions');
  }
  
  return {
    mixerUsage,
    exchangeDeposits,
    mevBotActivity,
    washTradingDetected,
    rugPullRisk,
    whaleActivity,
    entities,
    riskFactors,
    suspiciousPatterns
  };
}

/**
 * Trace Bitcoin address transactions
 */
router.get('/api/trace/bitcoin/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Fetch address info from Blockchain.info API
    const response = await axios.get(`${BLOCKCHAIN_INFO_API}/rawaddr/${address}?limit=${limit}`);
    const data = response.data;

    const addressInfo: AddressInfo = {
      address: data.address,
      balance: data.final_balance / 100000000, // Convert satoshis to BTC
      totalReceived: data.total_received / 100000000,
      totalSent: data.total_sent / 100000000,
      txCount: data.n_tx,
      transactions: data.txs.map((tx: any) => ({
        hash: tx.hash,
        from: tx.inputs[0]?.prev_out?.addr || 'Unknown',
        to: tx.out[0]?.addr || 'Unknown',
        value: tx.out[0]?.value / 100000000 || 0,
        timestamp: tx.time * 1000,
        confirmations: tx.confirmations || 0,
        fee: tx.fee / 100000000,
        blockHeight: tx.block_height
      }))
    };

    // Generate network graph data
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `${address.substring(0, 8)}...`,
        type: 'address',
        value: addressInfo.balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    addressInfo.transactions.forEach((tx, idx) => {
      // Add transaction node
      nodes.push({
        id: tx.hash,
        label: `Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      // Add edges
      if (tx.from !== 'Unknown' && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({
          id: tx.from,
          label: `${tx.from.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'sender'
        });
      }

      if (tx.to !== 'Unknown' && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({
          id: tx.to,
          label: `${tx.to.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'receiver'
        });
      }

      edges.push({
        from: tx.from,
        to: tx.hash,
        value: tx.value,
        label: `${tx.value.toFixed(4)} BTC`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: tx.value,
        label: ''
      });
    });

    res.json({
      success: true,
      chain: 'bitcoin',
      addressInfo,
      graph: { nodes, edges }
    });

  } catch (error: any) {
    console.error('Bitcoin trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Bitcoin address',
      message: error.message
    });
  }
});

/**
 * Trace Litecoin address transactions
 */
router.get('/api/trace/litecoin/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Use BlockCypher API for Litecoin
    const response = await axios.get(
      `${BLOCKCYPHER_API}/ltc/main/addrs/${address}?limit=${limit}`
    );
    const data = response.data;

    const addressInfo: AddressInfo = {
      address: data.address,
      balance: data.balance / 100000000, // Convert satoshis to LTC
      totalReceived: data.total_received / 100000000,
      totalSent: data.total_sent / 100000000,
      txCount: data.n_tx,
      transactions: (data.txrefs || []).slice(0, limit).map((tx: any) => ({
        hash: tx.tx_hash,
        from: 'Multiple Inputs',
        to: address,
        value: tx.value / 100000000,
        timestamp: new Date(tx.confirmed).getTime(),
        confirmations: tx.confirmations,
        fee: 0,
        blockHeight: tx.block_height
      }))
    };

    // Generate network graph
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `${address.substring(0, 8)}...`,
        type: 'address',
        value: addressInfo.balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];

    addressInfo.transactions.forEach((tx) => {
      nodes.push({
        id: tx.hash,
        label: `Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      edges.push({
        from: tx.from === 'Multiple Inputs' ? `input-${tx.hash}` : tx.from,
        to: tx.hash,
        value: tx.value,
        label: `${tx.value.toFixed(4)} LTC`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: tx.value,
        label: ''
      });
    });

    res.json({
      success: true,
      chain: 'litecoin',
      addressInfo,
      graph: { nodes, edges }
    });

  } catch (error: any) {
    console.error('Litecoin trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Litecoin address',
      message: error.message
    });
  }
});

/**
 * Trace Solana address transactions
 */
router.get('/api/trace/solana/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const publicKey = new PublicKey(address);

    // Get account balance
    const balance = await connection.getBalance(publicKey);

    // Get transaction signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });

    // Fetch transaction details
    const transactions: Transaction[] = [];
    
    for (const sig of signatures.slice(0, Math.min(limit, 20))) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (tx && tx.meta) {
          transactions.push({
            hash: sig.signature,
            from: tx.transaction.message.staticAccountKeys[0]?.toString() || 'Unknown',
            to: tx.transaction.message.staticAccountKeys[1]?.toString() || 'Unknown',
            value: (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1000000000,
            timestamp: (tx.blockTime || 0) * 1000,
            confirmations: sig.confirmationStatus === 'finalized' ? 32 : 1,
            fee: tx.meta.fee / 1000000000,
            blockHeight: sig.slot
          });
        }
      } catch (txError) {
        console.error('Error fetching transaction:', txError);
      }
    }

    const addressInfo: AddressInfo = {
      address,
      balance: balance / 1000000000, // Convert lamports to SOL
      totalReceived: 0, // Would need additional calculation
      totalSent: 0,
      txCount: signatures.length,
      transactions
    };

    // Generate network graph
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `${address.substring(0, 8)}...`,
        type: 'address',
        value: addressInfo.balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      nodes.push({
        id: tx.hash,
        label: `Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: Math.abs(tx.value),
        group: 'transaction'
      });

      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({
          id: tx.from,
          label: `${tx.from.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'sender'
        });
      }

      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({
          id: tx.to,
          label: `${tx.to.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'receiver'
        });
      }

      edges.push({
        from: tx.from,
        to: tx.hash,
        value: Math.abs(tx.value),
        label: `${Math.abs(tx.value).toFixed(4)} SOL`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: Math.abs(tx.value),
        label: ''
      });
    });

    res.json({
      success: true,
      chain: 'solana',
      addressInfo,
      graph: { nodes, edges }
    });

  } catch (error: any) {
    console.error('Solana trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Solana address',
      message: error.message
    });
  }
});

/**
 * Get transaction details by hash
 */
router.get('/api/transaction/:chain/:txHash', async (req, res) => {
  try {
    const { chain, txHash } = req.params;

    let txData: any = {};

    switch (chain.toLowerCase()) {
      case 'bitcoin':
        const btcResponse = await axios.get(`${BLOCKCHAIN_INFO_API}/rawtx/${txHash}`);
        txData = {
          hash: btcResponse.data.hash,
          blockHeight: btcResponse.data.block_height,
          timestamp: btcResponse.data.time * 1000,
          fee: btcResponse.data.fee / 100000000,
          inputs: btcResponse.data.inputs.map((inp: any) => ({
            address: inp.prev_out?.addr || 'Unknown',
            value: inp.prev_out?.value / 100000000 || 0
          })),
          outputs: btcResponse.data.out.map((out: any) => ({
            address: out.addr || 'Unknown',
            value: out.value / 100000000
          }))
        };
        break;

      case 'litecoin':
        const ltcResponse = await axios.get(`${BLOCKCYPHER_API}/ltc/main/txs/${txHash}`);
        txData = {
          hash: ltcResponse.data.hash,
          blockHeight: ltcResponse.data.block_height,
          timestamp: new Date(ltcResponse.data.confirmed).getTime(),
          fee: ltcResponse.data.fees / 100000000,
          inputs: ltcResponse.data.inputs.map((inp: any) => ({
            address: inp.addresses?.[0] || 'Unknown',
            value: inp.output_value / 100000000
          })),
          outputs: ltcResponse.data.outputs.map((out: any) => ({
            address: out.addresses?.[0] || 'Unknown',
            value: out.value / 100000000
          }))
        };
        break;

      case 'solana':
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const tx = await connection.getTransaction(txHash, {
          maxSupportedTransactionVersion: 0
        });

        if (tx && tx.meta) {
          txData = {
            hash: txHash,
            blockHeight: tx.slot,
            timestamp: (tx.blockTime || 0) * 1000,
            fee: tx.meta.fee / 1000000000,
            accounts: tx.transaction.message.staticAccountKeys.map((key, idx) => ({
              address: key.toString(),
              balanceChange: (tx.meta!.postBalances[idx] - tx.meta!.preBalances[idx]) / 1000000000
            }))
          };
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported blockchain'
        });
    }

    res.json({
      success: true,
      chain,
      transaction: txData
    });

  } catch (error: any) {
    console.error('Transaction fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction',
      message: error.message
    });
  }
});

/**
 * Get blockchain statistics
 */
router.get('/api/stats/:chain', async (req, res) => {
  try {
    const { chain } = req.params;
    let stats: any = {};

    switch (chain.toLowerCase()) {
      case 'bitcoin':
        const btcStats = await axios.get(`${BLOCKCHAIN_INFO_API}/stats`);
        stats = {
          chain: 'Bitcoin',
          marketPrice: btcStats.data.market_price_usd,
          totalBlocks: btcStats.data.n_blocks_total,
          difficulty: btcStats.data.difficulty,
          hashRate: btcStats.data.hash_rate,
          totalBTC: btcStats.data.totalbc / 100000000
        };
        break;

      case 'litecoin':
        const ltcStats = await axios.get(`${BLOCKCYPHER_API}/ltc/main`);
        stats = {
          chain: 'Litecoin',
          lastBlock: ltcStats.data.height,
          peersConnected: ltcStats.data.peer_count,
          unconfirmedTxs: ltcStats.data.unconfirmed_count
        };
        break;

      case 'solana':
        const connection = new Connection(SOLANA_RPC, 'confirmed');
        const slot = await connection.getSlot();
        const supply = await connection.getSupply();
        const performance = await connection.getRecentPerformanceSamples(1);

        stats = {
          chain: 'Solana',
          currentSlot: slot,
          totalSupply: supply.value.total / 1000000000,
          circulatingSupply: supply.value.circulating / 1000000000,
          tps: performance[0]?.numTransactions / performance[0]?.samplePeriodSecs || 0
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported blockchain'
        });
    }

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Stats fetch error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

/**
 * Trace EVM address transactions (Ethereum, BSC, Polygon)
 */
router.get('/api/trace/evm/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    let apiUrl = '';
    let apiKey = ETHERSCAN_API_KEY;
    
    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'eth':
        apiUrl = ETHERSCAN_API;
        break;
      case 'bsc':
      case 'binance':
        apiUrl = BSCSCAN_API;
        break;
      case 'polygon':
      case 'matic':
        apiUrl = POLYGONSCAN_API;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported EVM chain. Use: ethereum, bsc, or polygon'
        });
    }

    // Fetch address balance
    const balanceResponse = await axios.get(apiUrl, {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: apiKey
      }
    });

    // Fetch transaction list
    const txResponse = await axios.get(apiUrl, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: limit,
        sort: 'desc',
        apikey: apiKey
      }
    });

    if (txResponse.data.status !== '1') {
      throw new Error(txResponse.data.message || 'Failed to fetch transactions');
    }

    const balance = parseFloat(ethers.formatEther(balanceResponse.data.result || '0'));
    const txList = txResponse.data.result || [];

    // Calculate total received and sent
    let totalReceived = 0;
    let totalSent = 0;

    const transactions: Transaction[] = txList.map((tx: any) => {
      const value = parseFloat(ethers.formatEther(tx.value));
      const isReceived = tx.to.toLowerCase() === address.toLowerCase();
      
      if (isReceived) {
        totalReceived += value;
      } else {
        totalSent += value;
      }

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        confirmations: tx.confirmations,
        fee: parseFloat(ethers.formatEther((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())),
        blockHeight: parseInt(tx.blockNumber)
      };
    });

    const addressInfo: AddressInfo = {
      address,
      balance,
      totalReceived,
      totalSent,
      txCount: txList.length,
      transactions
    };

    // Generate network graph
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `${address.substring(0, 8)}...`,
        type: 'address',
        value: balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      // Add transaction node
      nodes.push({
        id: tx.hash,
        label: `Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({
          id: tx.from,
          label: `${tx.from.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'sender'
        });
      }

      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({
          id: tx.to,
          label: `${tx.to.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'receiver'
        });
      }

      edges.push({
        from: tx.from,
        to: tx.hash,
        value: tx.value,
        label: `${tx.value.toFixed(4)} ${chain.toUpperCase()}`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: tx.value,
        label: ''
      });
    });

    // Perform advanced intelligence analysis
    const intelligence = performIntelligenceAnalysis(addressInfo);

    res.json({
      success: true,
      chain,
      addressInfo,
      graph: { nodes, edges },
      intelligence // Add intelligence analysis
    });

  } catch (error: any) {
    console.error('EVM trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace EVM address',
      message: error.message
    });
  }
});

/**
 * Trace zkSync transactions (ZK Rollup)
 */
router.get('/api/trace/zksync/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Fetch zkSync account info
    const accountResponse = await axios.get(`${ZKSYNC_API}`, {
      params: {
        module: 'account',
        action: 'balance',
        address
      }
    });

    // Fetch zkSync transactions
    const txResponse = await axios.get(`${ZKSYNC_API}`, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        page: 1,
        offset: limit,
        sort: 'desc'
      }
    });

    const balance = parseFloat(ethers.formatEther(accountResponse.data.result || '0'));
    const txList = txResponse.data.result || [];

    const transactions: Transaction[] = txList.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: parseFloat(ethers.formatEther(tx.value)),
      timestamp: parseInt(tx.timeStamp) * 1000,
      confirmations: tx.confirmations || 0,
      fee: parseFloat(ethers.formatEther(tx.fee || '0')),
      blockHeight: parseInt(tx.blockNumber)
    }));

    // Generate network graph
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `zkSync: ${address.substring(0, 8)}...`,
        type: 'address',
        value: balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      nodes.push({
        id: tx.hash,
        label: `ZK Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({
          id: tx.from,
          label: `${tx.from.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'sender'
        });
      }

      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({
          id: tx.to,
          label: `${tx.to.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'receiver'
        });
      }

      edges.push({
        from: tx.from,
        to: tx.hash,
        value: tx.value,
        label: `${tx.value.toFixed(4)} ETH (ZK)`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: tx.value,
        label: 'Private'
      });
    });

    const addressInfo: AddressInfo = {
      address,
      balance,
      totalReceived: 0,
      totalSent: 0,
      txCount: transactions.length,
      transactions
    };

    res.json({
      success: true,
      chain: 'zksync',
      zkPrivacy: true,
      addressInfo,
      graph: { nodes, edges }
    });

  } catch (error: any) {
    console.error('zkSync trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace zkSync address',
      message: error.message
    });
  }
});

/**
 * Trace Aztec Network ZK transactions
 */
router.get('/api/trace/aztec/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Query Aztec Network for private transactions
    const response = await axios.get(`${AZTEC_API}/account/${address}`);
    
    const accountData = response.data;
    
    const addressInfo: AddressInfo = {
      address,
      balance: accountData.balance || 0,
      totalReceived: accountData.totalReceived || 0,
      totalSent: accountData.totalSent || 0,
      txCount: accountData.txCount || 0,
      transactions: (accountData.transactions || []).map((tx: any) => ({
        hash: tx.txHash || 'private',
        from: 'Private (ZK)',
        to: 'Private (ZK)',
        value: tx.value || 0,
        timestamp: tx.timestamp || Date.now(),
        confirmations: tx.confirmations || 0,
        fee: tx.fee || 0
      }))
    };

    // Generate privacy-preserving graph
    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `Aztec: ${address.substring(0, 8)}...`,
        type: 'address',
        value: addressInfo.balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];

    addressInfo.transactions.forEach((tx, idx) => {
      nodes.push({
        id: `zk-tx-${idx}`,
        label: 'Private TX',
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      edges.push({
        from: address,
        to: `zk-tx-${idx}`,
        value: tx.value,
        label: 'ZK-SNARK Protected'
      });
    });

    res.json({
      success: true,
      chain: 'aztec',
      zkPrivacy: true,
      privacyLevel: 'maximum',
      addressInfo,
      graph: { nodes, edges },
      note: 'Aztec Network provides maximum privacy. Transaction details are encrypted with ZK-SNARKs.'
    });

  } catch (error: any) {
    console.error('Aztec trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Aztec address',
      message: error.message,
      note: 'Aztec Network is privacy-focused. Limited data may be available.'
    });
  }
});

/**Trace Monero (XMR) address transactions
 * Note: Monero is privacy-focused with ring signatures and stealth addresses
 */
router.get('/api/trace/monero/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Note: Monero's privacy features make full tracing difficult
    // We can query the network but many details are obscured by design
    
    try {
      // Attempt to query Monero blockchain explorer API
      const response = await axios.get(`${MONERO_API}/outputs?txhash=${address}&address=${address}&viewkey=&txprove=0`, {
        timeout: 10000
      });

      // If address is found, extract available data
      const addressInfo: AddressInfo = {
        address,
        balance: 0, // Monero balances are not publicly visible without view key
        totalReceived: 0, // Privacy feature - not visible
        totalSent: 0, // Privacy feature - not visible
        txCount: 0,
        transactions: []
      };

      // Generate privacy-focused graph
      const nodes: NetworkNode[] = [
        {
          id: address,
          label: `XMR: ${address.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'central'
        }
      ];

      const edges: NetworkEdge[] = [];

      res.json({
        success: true,
        chain: 'monero',
        privacyLevel: 'maximum',
        privacyFeatures: [
          'Ring Signatures',
          'Stealth Addresses',
          'RingCT (Confidential Transactions)',
          'Dandelion++ Protocol'
        ],
        addressInfo,
        graph: { nodes, edges },
        note: 'Monero (XMR) is designed for maximum privacy. Transaction amounts, senders, and receivers are hidden by default. Tracing requires private view keys.'
      });

    } catch (apiError) {
      // Monero APIs may be limited - provide privacy-focused response
      const addressInfo: AddressInfo = {
        address,
        balance: 0,
        totalReceived: 0,
        totalSent: 0,
        txCount: 0,
        transactions: []
      };

      const nodes: NetworkNode[] = [
        {
          id: address,
          label: `XMR: ${address.substring(0, 8)}...`,
          type: 'address',
          value: 0,
          group: 'central'
        }
      ];

      res.json({
        success: true,
        chain: 'monero',
        privacyLevel: 'maximum',
        privacyFeatures: [
          'Ring Signatures - Mixins hide true sender',
          'Stealth Addresses - One-time addresses for each transaction',
          'RingCT - Hidden transaction amounts',
          'Dandelion++ - IP address protection'
        ],
        addressInfo,
        graph: { nodes, edges: [] },
        note: 'Monero (XMR) provides the highest level of privacy. Transaction details are encrypted and obfuscated by default. Public blockchain explorers cannot reveal sender, receiver, or amount information without private view keys.',
        limitedData: true
      });
    }

  } catch (error: any) {
    console.error('Monero trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Monero address',
      message: error.message,
      note: 'Monero is privacy-focused. Transaction tracing requires private view keys.'
    });
  }
});

/**
 * Trace Dogecoin (DOGE) address transactions
 */
router.get('/api/trace/dogecoin/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Use BlockCypher API for Dogecoin
    const response = await axios.get(
      `${BLOCKCYPHER_API}/doge/main/addrs/${address}?limit=${limit}`
    );
    const data = response.data;

    const addressInfo: AddressInfo = {
      address: data.address,
      balance: data.balance / 100000000,
      totalReceived: data.total_received / 100000000,
      totalSent: data.total_sent / 100000000,
      txCount: data.n_tx,
      transactions: (data.txrefs || []).slice(0, limit).map((tx: any) => ({
        hash: tx.tx_hash,
        from: 'Multiple Inputs',
        to: address,
        value: tx.value / 100000000,
        timestamp: new Date(tx.confirmed).getTime(),
        confirmations: tx.confirmations,
        fee: 0,
        blockHeight: tx.block_height
      }))
    };

    const nodes: NetworkNode[] = [
      {
        id: address,
        label: `DOGE: ${address.substring(0, 8)}...`,
        type: 'address',
        value: addressInfo.balance,
        group: 'central'
      }
    ];

    const edges: NetworkEdge[] = [];
    addressInfo.transactions.forEach((tx) => {
      nodes.push({
        id: tx.hash,
        label: `Tx: ${tx.hash.substring(0, 8)}...`,
        type: 'transaction',
        value: tx.value,
        group: 'transaction'
      });

      edges.push({
        from: tx.from,
        to: tx.hash,
        value: tx.value,
        label: `${tx.value.toFixed(2)} DOGE`
      });

      edges.push({
        from: tx.hash,
        to: tx.to,
        value: tx.value,
        label: ''
      });
    });

    res.json({
      success: true,
      chain: 'dogecoin',
      addressInfo,
      graph: { nodes, edges },
      note: 'Much wow! Such blockchain!'
    });

  } catch (error: any) {
    console.error('Dogecoin trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Dogecoin address',
      message: error.message
    });
  }
});

/**
 * Trace Arbitrum (L2 Rollup) transactions
 */
router.get('/api/trace/arbitrum/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const response = await axios.get(ARBITRUM_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        page: 1,
        offset: limit,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balanceResponse = await axios.get(ARBITRUM_API, {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balance = parseFloat(ethers.formatEther(balanceResponse.data.result || '0'));
    const txList = response.data.result || [];

    let totalReceived = 0;
    let totalSent = 0;

    const transactions: Transaction[] = txList.map((tx: any) => {
      const value = parseFloat(ethers.formatEther(tx.value));
      const isReceived = tx.to.toLowerCase() === address.toLowerCase();
      
      if (isReceived) totalReceived += value;
      else totalSent += value;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        confirmations: tx.confirmations,
        fee: parseFloat(ethers.formatEther((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())),
        blockHeight: parseInt(tx.blockNumber)
      };
    });

    const addressInfo: AddressInfo = {
      address,
      balance,
      totalReceived,
      totalSent,
      txCount: txList.length,
      transactions
    };

    const nodes: NetworkNode[] = [{ id: address, label: `ARB: ${address.substring(0, 8)}...`, type: 'address', value: balance, group: 'central' }];
    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      nodes.push({ id: tx.hash, label: `Tx: ${tx.hash.substring(0, 8)}...`, type: 'transaction', value: tx.value, group: 'transaction' });
      
      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({ id: tx.from, label: `${tx.from.substring(0, 8)}...`, type: 'address', value: 0, group: 'sender' });
      }
      
      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({ id: tx.to, label: `${tx.to.substring(0, 8)}...`, type: 'address', value: 0, group: 'receiver' });
      }

      edges.push({ from: tx.from, to: tx.hash, value: tx.value, label: `${tx.value.toFixed(4)} ETH` });
      edges.push({ from: tx.hash, to: tx.to, value: tx.value, label: '' });
    });

    const intelligence = performIntelligenceAnalysis(addressInfo);

    res.json({
      success: true,
      chain: 'arbitrum',
      layer: 'L2',
      addressInfo,
      graph: { nodes, edges },
      intelligence
    });

  } catch (error: any) {
    console.error('Arbitrum trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Arbitrum address',
      message: error.message
    });
  }
});

/**
 * Trace Optimism (L2 Rollup) transactions
 */
router.get('/api/trace/optimism/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const response = await axios.get(OPTIMISM_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        page: 1,
        offset: limit,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balanceResponse = await axios.get(OPTIMISM_API, {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balance = parseFloat(ethers.formatEther(balanceResponse.data.result || '0'));
    const txList = response.data.result || [];

    let totalReceived = 0;
    let totalSent = 0;

    const transactions: Transaction[] = txList.map((tx: any) => {
      const value = parseFloat(ethers.formatEther(tx.value));
      const isReceived = tx.to.toLowerCase() === address.toLowerCase();
      
      if (isReceived) totalReceived += value;
      else totalSent += value;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        confirmations: tx.confirmations,
        fee: parseFloat(ethers.formatEther((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())),
        blockHeight: parseInt(tx.blockNumber)
      };
    });

    const addressInfo: AddressInfo = {
      address,
      balance,
      totalReceived,
      totalSent,
      txCount: txList.length,
      transactions
    };

    const nodes: NetworkNode[] = [{ id: address, label: `OP: ${address.substring(0, 8)}...`, type: 'address', value: balance, group: 'central' }];
    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      nodes.push({ id: tx.hash, label: `Tx: ${tx.hash.substring(0, 8)}...`, type: 'transaction', value: tx.value, group: 'transaction' });
      
      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({ id: tx.from, label: `${tx.from.substring(0, 8)}...`, type: 'address', value: 0, group: 'sender' });
      }
      
      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({ id: tx.to, label: `${tx.to.substring(0, 8)}...`, type: 'address', value: 0, group: 'receiver' });
      }

      edges.push({ from: tx.from, to: tx.hash, value: tx.value, label: `${tx.value.toFixed(4)} ETH` });
      edges.push({ from: tx.hash, to: tx.to, value: tx.value, label: '' });
    });

    const intelligence = performIntelligenceAnalysis(addressInfo);

    res.json({
      success: true,
      chain: 'optimism',
      layer: 'L2',
      addressInfo,
      graph: { nodes, edges },
      intelligence
    });

  } catch (error: any) {
    console.error('Optimism trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Optimism address',
      message: error.message
    });
  }
});

/**
 * Trace Base (Coinbase L2) transactions
 */
router.get('/api/trace/base/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const response = await axios.get(BASE_API, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        page: 1,
        offset: limit,
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balanceResponse = await axios.get(BASE_API, {
      params: {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: ETHERSCAN_API_KEY
      }
    });

    const balance = parseFloat(ethers.formatEther(balanceResponse.data.result || '0'));
    const txList = response.data.result || [];

    let totalReceived = 0;
    let totalSent = 0;

    const transactions: Transaction[] = txList.map((tx: any) => {
      const value = parseFloat(ethers.formatEther(tx.value));
      const isReceived = tx.to.toLowerCase() === address.toLowerCase();
      
      if (isReceived) totalReceived += value;
      else totalSent += value;

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value,
        timestamp: parseInt(tx.timeStamp) * 1000,
        confirmations: tx.confirmations,
        fee: parseFloat(ethers.formatEther((BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString())),
        blockHeight: parseInt(tx.blockNumber)
      };
    });

    const addressInfo: AddressInfo = {
      address,
      balance,
      totalReceived,
      totalSent,
      txCount: txList.length,
      transactions
    };

    const nodes: NetworkNode[] = [{ id: address, label: `BASE: ${address.substring(0, 8)}...`, type: 'address', value: balance, group: 'central' }];
    const edges: NetworkEdge[] = [];
    const uniqueAddresses = new Set<string>();

    transactions.forEach((tx) => {
      nodes.push({ id: tx.hash, label: `Tx: ${tx.hash.substring(0, 8)}...`, type: 'transaction', value: tx.value, group: 'transaction' });
      
      if (tx.from && !uniqueAddresses.has(tx.from)) {
        uniqueAddresses.add(tx.from);
        nodes.push({ id: tx.from, label: `${tx.from.substring(0, 8)}...`, type: 'address', value: 0, group: 'sender' });
      }
      
      if (tx.to && !uniqueAddresses.has(tx.to)) {
        uniqueAddresses.add(tx.to);
        nodes.push({ id: tx.to, label: `${tx.to.substring(0, 8)}...`, type: 'address', value: 0, group: 'receiver' });
      }

      edges.push({ from: tx.from, to: tx.hash, value: tx.value, label: `${tx.value.toFixed(4)} ETH` });
      edges.push({ from: tx.hash, to: tx.to, value: tx.value, label: '' });
    });

    const intelligence = performIntelligenceAnalysis(addressInfo);

    res.json({
      success: true,
      chain: 'base',
      layer: 'L2',
      network: 'Coinbase',
      addressInfo,
      graph: { nodes, edges },
      intelligence
    });

  } catch (error: any) {
    console.error('Base trace error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to trace Base address',
      message: error.message
    });
  }
});

/**
 * Universal tracer - Auto-detect chain and trace
 */
router.get('/api/trace/auto/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Auto-detect chain based on address format
    let chain = 'unknown';
    let supportedChains = [];
    
    if (address.startsWith('0x') && address.length === 42) {
      // EVM address - could be Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, zkSync
      chain = 'ethereum';
      supportedChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'base', 'zksync'];
    } else if (address.length >= 26 && address.length <= 44 && !address.startsWith('0x')) {
      // Solana address
      chain = 'solana';
      supportedChains = ['solana'];
    } else if (address.length === 34 && (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1'))) {
      // Bitcoin address
      chain = 'bitcoin';
      supportedChains = ['bitcoin'];
    } else if (address.length === 34 && (address.startsWith('L') || address.startsWith('M') || address.startsWith('ltc1'))) {
      // Litecoin address
      chain = 'litecoin';
      supportedChains = ['litecoin'];
    } else if (address.length === 34 && address.startsWith('D')) {
      // Dogecoin address
      chain = 'dogecoin';
      supportedChains = ['dogecoin'];
    } else if (address.length === 95 || address.length === 106) {
      // Monero address (standard or integrated)
      chain = 'monero';
      supportedChains = ['monero'];
    }

    res.json({
      success: true,
      detectedChain: chain,
      supportedChains,
      address,
      message: `Use /api/trace/${chain}/${address} for detailed tracing`,
      availableEndpoints: supportedChains.map(c => `/api/trace/${c}/${address}`)
    });

  } catch (error: any) {
    console.error('Auto-detect error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to detect chain',
      message: error.message
    });
  }
});

export default router;
