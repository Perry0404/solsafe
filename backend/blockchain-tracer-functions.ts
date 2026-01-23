import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';

const BLOCKCHAIN_INFO_API = 'https://blockchain.info';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken';

const API_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://api.etherscan.io/api',
  bsc: 'https://api.bscscan.com/api',
  polygon: 'https://api.polygonscan.com/api',
  arbitrum: 'https://api.arbiscan.io/api',
  optimism: 'https://api-optimistic.etherscan.io/api',
  avalanche: 'https://api.snowtrace.io/api',
  fantom: 'https://api.ftmscan.com/api',
  base: 'https://api.basescan.org/api',
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

interface IntelligenceAnalysis {
  mixerUsage: boolean;
  exchangeDeposits: string[];
  suspiciousPatterns: string[];
  riskFactors: string[];
}

export async function traceEVMAddress(chain: string, address: string, limit: number = 50) {
  const apiUrl = API_ENDPOINTS[chain.toLowerCase()];
  if (!apiUrl) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  const balanceResponse = await axios.get(apiUrl, {
    params: {
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      apikey: ETHERSCAN_API_KEY
    }
  });

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
      apikey: ETHERSCAN_API_KEY
    }
  });

  if (txResponse.data.status !== '1') {
    throw new Error(txResponse.data.message || 'Failed to fetch transactions');
  }

  const balance = parseFloat(ethers.formatEther(balanceResponse.data.result || '0'));
  const txList = txResponse.data.result || [];

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

  const nodes: NetworkNode[] = [{
    id: address,
    label: `${address.substring(0, 8)}...`,
    type: 'address',
    value: balance,
    group: 'central'
  }];

  const edges: NetworkEdge[] = [];
  const uniqueAddresses = new Set<string>();

  transactions.forEach((tx) => {
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

  const intelligence: IntelligenceAnalysis = {
    mixerUsage: false,
    exchangeDeposits: [],
    suspiciousPatterns: [],
    riskFactors: []
  };

  return {
    addressInfo,
    graph: { nodes, edges },
    intelligence
  };
}

export async function traceSolanaAddress(address: string, limit: number = 100) {
  const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
  const publicKey = new PublicKey(address);

  const balance = await connection.getBalance(publicKey);
  const signatures = await connection.getSignaturesForAddress(publicKey, { limit });

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
          value: Math.abs((tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1000000000),
          timestamp: (tx.blockTime || 0) * 1000,
          confirmations: sig.confirmationStatus === 'finalized' ? 32 : 1,
          fee: tx.meta.fee / 1000000000,
          blockHeight: sig.slot
        });
      }
    } catch (err) {
      console.error('Error fetching Solana transaction:', err);
    }
  }

  const addressInfo: AddressInfo = {
    address,
    balance: balance / 1000000000,
    totalReceived: 0,
    totalSent: 0,
    txCount: signatures.length,
    transactions
  };

  const nodes: NetworkNode[] = [{
    id: address,
    label: `${address.substring(0, 8)}...`,
    type: 'address',
    value: addressInfo.balance,
    group: 'central'
  }];

  const edges: NetworkEdge[] = [];

  return {
    addressInfo,
    graph: { nodes, edges },
    intelligence: {
      mixerUsage: false,
      exchangeDeposits: [],
      suspiciousPatterns: [],
      riskFactors: []
    }
  };
}

export async function traceBitcoinAddress(address: string) {
  const response = await axios.get(`${BLOCKCHAIN_INFO_API}/rawaddr/${address}?limit=50`);
  const data = response.data;

  const addressInfo: AddressInfo = {
    address: data.address,
    balance: data.final_balance / 100000000,
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

  const nodes: NetworkNode[] = [{
    id: address,
    label: `${address.substring(0, 8)}...`,
    type: 'address',
    value: addressInfo.balance,
    group: 'central'
  }];

  const edges: NetworkEdge[] = [];

  return {
    addressInfo,
    graph: { nodes, edges },
    intelligence: {
      mixerUsage: false,
      exchangeDeposits: [],
      suspiciousPatterns: [],
      riskFactors: []
    }
  };
}

export async function getBlockchainStats(chain: string) {
  return {
    chain,
    status: 'operational',
    message: 'Stats endpoint not yet implemented'
  };
}
