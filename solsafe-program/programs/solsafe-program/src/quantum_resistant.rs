use anchor_lang::prelude::*;
use sha3::{Digest, Sha3_256};

/// Quantum-resistant cryptographic utilities
/// Uses SHA3-256 which is quantum-resistant (Grover's algorithm only provides quadratic speedup)

/// Verify Merkle proof for evidence integrity
pub fn verify_merkle_proof(
    leaf: &[u8],
    merkle_root: &[u8; 32],
    proof: &[[u8; 32]],
    index: usize,
) -> bool {
    let mut computed_hash = hash_leaf(leaf);
    let mut current_index = index;

    for sibling in proof {
        computed_hash = if current_index % 2 == 0 {
            hash_pair(&computed_hash, sibling)
        } else {
            hash_pair(sibling, &computed_hash)
        };
        current_index /= 2;
    }

    &computed_hash == merkle_root
}

/// Hash a leaf node using SHA3-256
pub fn hash_leaf(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(b"SOLSAFE_LEAF:");
    hasher.update(data);
    hasher.finalize().into()
}

/// Hash two nodes together
pub fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(b"SOLSAFE_NODE:");
    hasher.update(left);
    hasher.update(right);
    hasher.finalize().into()
}

/// Compute SHA3-256 hash of evidence data
pub fn hash_evidence(evidence_json: &str) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(evidence_json.as_bytes());
    hasher.finalize().into()
}

/// Build Merkle tree from transaction signatures and compute root
/// This allows verifying individual transactions were part of original evidence
pub fn compute_merkle_root(leaves: &[Vec<u8>]) -> Result<[u8; 32]> {
    require!(leaves.len() > 0, ErrorCode::EmptyMerkleTree);
    
    let mut current_level: Vec<[u8; 32]> = leaves.iter().map(|leaf| hash_leaf(leaf)).collect();
    
    while current_level.len() > 1 {
        let mut next_level = Vec::new();
        
        for chunk in current_level.chunks(2) {
            let hash = if chunk.len() == 2 {
                hash_pair(&chunk[0], &chunk[1])
            } else {
                // Duplicate last element if odd number
                hash_pair(&chunk[0], &chunk[0])
            };
            next_level.push(hash);
        }
        
        current_level = next_level;
    }
    
    Ok(current_level[0])
}

/// Verify evidence timestamp is within acceptable range (not too old, not future)
pub fn verify_timestamp(timestamp: i64, max_age_seconds: i64) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;
    
    require!(
        timestamp <= current_time,
        ErrorCode::FutureTimestamp
    );
    
    require!(
        current_time - timestamp <= max_age_seconds,
        ErrorCode::EvidenceTooOld
    );
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Merkle tree cannot be empty")]
    EmptyMerkleTree,
    #[msg("Evidence timestamp is in the future")]
    FutureTimestamp,
    #[msg("Evidence is too old to be accepted")]
    EvidenceTooOld,
    #[msg("Merkle proof verification failed")]
    InvalidMerkleProof,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_proof() {
        let leaves = vec![
            b"tx1".to_vec(),
            b"tx2".to_vec(),
            b"tx3".to_vec(),
            b"tx4".to_vec(),
        ];
        
        let root = compute_merkle_root(&leaves).unwrap();
        
        // Build proof for leaf 0
        let leaf_hash = hash_leaf(&leaves[0]);
        let sibling1 = hash_leaf(&leaves[1]);
        let parent2 = hash_pair(&hash_leaf(&leaves[2]), &hash_leaf(&leaves[3]));
        
        let proof = vec![sibling1, parent2];
        
        assert!(verify_merkle_proof(&leaves[0], &root, &proof, 0));
    }

    #[test]
    fn test_hash_consistency() {
        let data = b"test evidence data";
        let hash1 = hash_leaf(data);
        let hash2 = hash_leaf(data);
        assert_eq!(hash1, hash2);
    }
}
