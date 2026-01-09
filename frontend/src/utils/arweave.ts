import Arweave from 'arweave';
import { sha3_256 } from 'js-sha3';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  timeout: 60000,
  logging: false,
});

export async function uploadToArweave(evidenceData, walletKey) {
  try {
    const evidenceJSON = JSON.stringify(evidenceData, null, 2);
    const transaction = await arweave.createTransaction({ data: evidenceJSON }, walletKey);
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'SOLSAFE');
    transaction.addTag('Type', 'ScamEvidence');
    transaction.addTag('Quantum-Resistant', 'true');
    await arweave.transactions.sign(transaction, walletKey);
    const response = await arweave.transactions.post(transaction);
    if (response.status === 200) {
      console.log('Evidence uploaded to Arweave:', transaction.id);
      return transaction.id;
    } else {
      throw new Error(`Arweave upload failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Arweave upload error:', error);
    throw error;
  }
}

export async function uploadViaBundlr(evidenceData) {
  try {
    const evidenceJSON = JSON.stringify(evidenceData, null, 2);
    const response = await fetch('https://node1.bundlr.network/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: Buffer.from(evidenceJSON).toString('base64'),
        tags: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'App-Name', value: 'SOLSAFE' },
          { name: 'Quantum-Resistant', value: 'true' }
        ]
      })
    });
    if (!response.ok) throw new Error(`Bundlr upload failed: ${response.status}`);
    const result = await response.json();
    console.log('Evidence uploaded via Bundlr:', result.id);
    return result.id;
  } catch (error) {
    console.error('Bundlr upload error:', error);
    throw error;
  }
}

export function buildMerkleTree(evidenceComponents) {
  if (evidenceComponents.length === 0) throw new Error('Cannot build Merkle tree from empty array');
  let currentLevel = evidenceComponents.map(component => new Uint8Array(sha3_256.arrayBuffer('SOLSAFE_LEAF:' + component)));
  const tree = [currentLevel];
  const proofs = new Map();
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = new Uint8Array(left.length + right.length + 14);
      const prefix = new TextEncoder().encode('SOLSAFE_NODE:');
      combined.set(prefix, 0);
      combined.set(left, prefix.length);
      combined.set(right, prefix.length + left.length);
      nextLevel.push(new Uint8Array(sha3_256.arrayBuffer(combined)));
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }
  for (let i = 0; i < tree[0].length; i++) {
    const proof = [];
    let index = i;
    for (let level = 0; level < tree.length - 1; level++) {
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
      if (siblingIndex < tree[level].length) proof.push(tree[level][siblingIndex]);
      index = Math.floor(index / 2);
    }
    proofs.set(i, proof);
  }
  return { root: currentLevel[0], tree, proofs };
}

export function verifyMerkleProof(leaf, root, proof, index) {
  let computedHash = new Uint8Array(sha3_256.arrayBuffer('SOLSAFE_LEAF:' + leaf));
  let currentIndex = index;
  for (const sibling of proof) {
    const combined = new Uint8Array(computedHash.length + sibling.length + 14);
    const prefix = new TextEncoder().encode('SOLSAFE_NODE:');
    combined.set(prefix, 0);
    if (currentIndex % 2 === 0) {
      combined.set(computedHash, prefix.length);
      combined.set(sibling, prefix.length + computedHash.length);
    } else {
      combined.set(sibling, prefix.length);
      combined.set(computedHash, prefix.length + sibling.length);
    }
    computedHash = new Uint8Array(sha3_256.arrayBuffer(combined));
    currentIndex = Math.floor(currentIndex / 2);
  }
  if (computedHash.length !== root.length) return false;
  for (let i = 0; i < computedHash.length; i++) {
    if (computedHash[i] !== root[i]) return false;
  }
  return true;
}

export function hashEvidence(evidenceData) {
  const evidenceJSON = JSON.stringify(evidenceData);
  return new Uint8Array(sha3_256.arrayBuffer(evidenceJSON));
}

export async function getStorageCostEstimate(evidenceSize) {
  const priceResponse = await arweave.transactions.getPrice(evidenceSize);
  const arweaveCostAR = parseInt(priceResponse) / 1e12;
  const arweaveCostUSD = arweaveCostAR * 8.5;
  return {
    ipfsCost: 0.01,
    arweaveCost: arweaveCostUSD,
    solanaCost: 0.01,
    totalCost: 0.02 + arweaveCostUSD
  };
}

export default {
  uploadToArweave,
  uploadViaBundlr,
  buildMerkleTree,
  verifyMerkleProof,
  hashEvidence,
  getStorageCostEstimate
};
