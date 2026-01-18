import express from 'express';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

const router = express.Router();

// Blockchain API endpoints
const BLOCKCHAIN_INFO_API = 'https://blockchain.info';
const BLOCKCYPHER_API = 'https://api.blockcypher.com/v1';
const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

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

export default router;
