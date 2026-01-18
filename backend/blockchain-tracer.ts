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

    res.json({
      success: true,
      chain,
      addressInfo,
      graph: { nodes, edges }
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
 * 
 * Universal tracer - Auto-detect chain and trace
 */
router.get('/api/trace/auto/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Auto-detect chain based on address format
    let chain = 'unknown';
    
    if (address.startsWith('0x') && address.length === 42) {
      // EVM address
      chain = 'ethereum';
    } else if (address.length >= 26 && address.length <= 44 && !address.startsWith('0x')) {
      // Solana address
      chain = 'solana';
    } else if (address.length === 34 && (address.startsWith('1') || address.startsWith('3') || address.startsWith('bc1'))) {
      // Bitcoin address
      chain = 'bitcoin';
    } else if (address.length === 34 && (address.startsWith('L') || address.startsWith('M') || address.startsWith('ltc1'))) {
      // Litecoin address
      chain = 'litecoin';
    } else if (address.length === 95 || address.length === 106) {
      // Monero address (standard or integrated)
      chain = 'monero';
    }

    res.json({
      success: true,
      detectedChain: chain,
      address,
      message: `Use /api/trace/${chain}/${address} for detailed tracing`
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
