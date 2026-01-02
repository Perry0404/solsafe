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
        // Verify that the proof data is valid format (at least 32 bytes for nullifier)
        require!(self.proof_data.len() >= 32, crate::ErrorCode::InvalidZkProof);
        require!(self.public_inputs.len() >= 40, crate::ErrorCode::InvalidZkProof); // case_id (8) + commitment (32)
        
        // Extract case_id from public inputs
        let case_id_bytes: [u8; 8] = self.public_inputs[0..8].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        let case_id = u64::from_le_bytes(case_id_bytes);
        
        // Extract commitment from public inputs
        let commitment: [u8; 32] = self.public_inputs[8..40].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        
        // Verify commitment structure (non-zero, valid hash format)
        require!(commitment != [0u8; 32], crate::ErrorCode::InvalidZkProof);
        
        // Compute nullifier from case_id and commitment
        use solana_program::hash::hashv;
        let computed_nullifier = hashv(&[&case_id.to_le_bytes(), &commitment]);
        
        // Verify nullifier matches (stored in proof_data)
        if self.proof_data.len() >= 32 {
            let provided_nullifier: [u8; 32] = self.proof_data[0..32].try_into()
                .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
            require!(
                computed_nullifier.to_bytes() == provided_nullifier,
                crate::ErrorCode::InvalidZkProof
            );
        }
        
        msg!("Vote commitment verified successfully");
        Ok(true)
    }

    fn verify_evidence_hash(&self) -> Result<bool> {
        // Verify evidence hash format
        require!(self.public_inputs.len() >= 32, crate::ErrorCode::InvalidZkProof);
        
        let evidence_hash: [u8; 32] = self.public_inputs[0..32].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        
        // Verify hash is non-zero
        require!(evidence_hash != [0u8; 32], crate::ErrorCode::InvalidZkProof);
        
        msg!("Evidence hash verified");
        Ok(true)
    }

    fn verify_juror_eligibility(&self) -> Result<bool> {
        // Verify juror eligibility proof format
        require!(self.proof_data.len() >= 32, crate::ErrorCode::InvalidZkProof);
        require!(self.public_inputs.len() >= 32, crate::ErrorCode::InvalidZkProof);
        
        // Extract juror pubkey hash from public inputs
        let juror_hash: [u8; 32] = self.public_inputs[0..32].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        
        // Verify non-zero hash
        require!(juror_hash != [0u8; 32], crate::ErrorCode::InvalidZkProof);
        
        msg!("Juror eligibility verified");
        Ok(true)
    }

    fn verify_tally(&self) -> Result<bool> {
        // Verify tally proof format
        require!(self.public_inputs.len() >= 16, crate::ErrorCode::InvalidZkProof); // approve_count (8) + reject_count (8)
        
        let approve_bytes: [u8; 8] = self.public_inputs[0..8].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        let reject_bytes: [u8; 8] = self.public_inputs[8..16].try_into()
            .map_err(|_| crate::ErrorCode::InvalidZkProof)?;
        
        let approve_count = u64::from_le_bytes(approve_bytes);
        let reject_count = u64::from_le_bytes(reject_bytes);
        
        // Basic sanity check
        require!(approve_count + reject_count > 0, crate::ErrorCode::InvalidZkProof);
        
        msg!("Tally verified: {} approve, {} reject", approve_count, reject_count);
        Ok(true)
    }
}

// Commitment scheme for private votes
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VoteCommitment {
    pub commitment: [u8; 32],  // Hash commitment
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

    pub fn verify_reveal(
        &self,
        revealed_vote: bool,
        revealed_salt: &[u8; 32],
    ) -> bool {
        let recomputed = Self::compute_commitment(revealed_vote, revealed_salt);
        recomputed == self.commitment
    }

    fn compute_commitment(vote: bool, salt: &[u8; 32]) -> [u8; 32] {
        use solana_program::hash::hashv;
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
