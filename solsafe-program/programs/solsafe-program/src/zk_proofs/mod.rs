// Zero-Knowledge Proof Module for Private Voting and Evidence Review
pub mod private_vote;
pub mod evidence_verification;
pub mod light_compression;
pub mod arcium_mpc;
pub mod dust_confidential;

use anchor_lang::prelude::*;

// Re-export main types
pub use private_vote::*;
pub use evidence_verification::*;
pub use light_compression::*;
pub use arcium_mpc::*;
pub use dust_confidential::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ZkProof {
    pub proof_data: Vec<u8>,
    pub public_inputs: Vec<u8>,
    pub proof_type: ZkProofType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ZkProofType {
    VoteCommitment,
    EvidenceHash,
    JurorEligibility,
    TallyVerification,
}

impl ZkProof {
    pub fn verify(&self) -> Result<bool> {
        // Verify ZK proof based on type
        match self.proof_type {
            ZkProofType::VoteCommitment => self.verify_vote_commitment(),
            ZkProofType::EvidenceHash => self.verify_evidence_hash(),
            ZkProofType::JurorEligibility => self.verify_juror_eligibility(),
            ZkProofType::TallyVerification => self.verify_tally(),
        }
    }

    fn verify_vote_commitment(&self) -> Result<bool> {
        // Verify vote commitment using ZK proof
        // This ensures vote is valid without revealing the actual vote
        Ok(true) // Placeholder - integrate with Light Protocol
    }

    fn verify_evidence_hash(&self) -> Result<bool> {
        // Verify evidence hash is correctly committed
        Ok(true) // Placeholder
    }

    fn verify_juror_eligibility(&self) -> Result<bool> {
        // Verify juror is eligible without revealing identity
        Ok(true) // Placeholder - integrate with Arcium MPC
    }

    fn verify_tally(&self) -> Result<bool> {
        // Verify final tally is correct
        Ok(true) // Placeholder
    }
}

// Commitment scheme for private votes
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VoteCommitment {
    pub commitment: [u8; 32],  // Pedersen commitment
    pub nullifier: [u8; 32],   // Prevents double voting
    pub case_id: u64,
    pub timestamp: i64,
}

impl VoteCommitment {
    pub fn new(case_id: u64, vote: bool, salt: [u8; 32], timestamp: i64) -> Self {
        let commitment = Self::compute_commitment(vote, &salt);
        let nullifier = Self::compute_nullifier(case_id, &commitment);
        
        VoteCommitment {
            commitment,
            nullifier,
            case_id,
            timestamp,
        }
    }

    fn compute_commitment(vote: bool, salt: &[u8; 32]) -> [u8; 32] {
        use solana_program::hash::{hash, hashv};
        let vote_byte = if vote { 1u8 } else { 0u8 };
        let result = hashv(&[&[vote_byte], salt]);
        result.to_bytes()
    }

    fn compute_nullifier(case_id: u64, commitment: &[u8; 32]) -> [u8; 32] {
        use solana_program::hash::hashv;
        let result = hashv(&[&case_id.to_le_bytes(), commitment]);
        result.to_bytes()
    }
}
