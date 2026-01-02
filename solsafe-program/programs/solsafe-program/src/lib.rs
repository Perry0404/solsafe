use anchor_lang::prelude::*;

declare_id!("D4mtpATBupFapyGgX3QHaUU1ZpMUTXP7LE12Lpgc77m1");

pub mod state;
pub mod instructions;
pub mod zk_proofs;

use state::{GlobalConfig, CaseAccount, CaseStatus, CaseState};
use instructions::*;
use zk_proofs::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid case")]
    InvalidCase,
    #[msg("Case not open")]
    CaseNotOpen,
    #[msg("VRF not ready")]
    VrfNotReady,
    #[msg("Invalid randomness")]
    InvalidRandomness,
    #[msg("Not enough validators")]
    NotEnoughValidators,
    #[msg("Not a juror")]
    NotJuror,
    #[msg("Not approved")]
    NotApproved,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Case not in voting state")]
    CaseNotVoting,
    // ZK Proof errors
    #[msg("Invalid ZK proof")]
    InvalidZkProof,
    #[msg("Invalid proof type")]
    InvalidProofType,
    #[msg("Invalid reveal")]
    InvalidReveal,
    #[msg("Invalid batch size")]
    InvalidBatchSize,
    // MPC errors
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Too many jurors")]
    TooManyJurors,
    #[msg("All shares submitted")]
    AllSharesSubmitted,
    #[msg("Share not verified")]
    ShareNotVerified,
    #[msg("Threshold not reached")]
    ThresholdNotReached,
    #[msg("Insufficient shares")]
    InsufficientShares,
    // Evidence errors
    #[msg("Evidence too large")]
    EvidenceTooLarge,
    // Confidential transfer errors
    #[msg("Confidential transfers disabled")]
    ConfidentialTransfersDisabled,
    #[msg("Invalid range proof")]
    InvalidRangeProof,
    #[msg("Invalid compliance proof")]
    InvalidComplianceProof,
    #[msg("Transfer not pending")]
    TransferNotPending,
    // Security errors
    #[msg("Voting period has expired")]
    VotingPeriodExpired,
    #[msg("Nullifier already used - double voting prevented")]
    NullifierAlreadyUsed,
    #[msg("Case already exists")]
    CaseAlreadyExists,
    #[msg("Juror selection failed after max attempts")]
    JurorSelectionFailed,
    #[msg("Arithmetic overflow detected")]
    ArithmeticOverflow,
}

#[program]
pub mod solsafe_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, quorum: u8, min_jurors: u8) -> Result<()> {
        instructions::initialize::handler(ctx, quorum, min_jurors)
    }

    pub fn update_validators(ctx: Context<UpdateValidators>, validators: Vec<Pubkey>) -> Result<()> {
        instructions::update_validators::handler(ctx, validators)
    }

    

    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        case_id: u64,
        evidence: String,
        scam_address: Pubkey,
        bump: u8,
    ) -> Result<()> {
        instructions::submit_evidence::handler(ctx, case_id, evidence, scam_address, bump)
    }

    pub fn request_jurors(ctx: Context<RequestJurors>, case_id: u64) -> Result<()> {
        instructions::request_jurors::handler(ctx, case_id)
    }

    pub fn select_jurors(ctx: Context<SelectJurors>) -> Result<()> {
        instructions::select_jurors::handler(ctx)
    }

    pub fn vote(ctx: Context<Vote>, approve: bool) -> Result<()> {
        instructions::vote::handler(ctx, approve)
    }

    pub fn vote_and_freeze(ctx: Context<VoteWithFreeze>, approve: bool) -> Result<()> {
        instructions::vote::handler_freeze(ctx, approve)
    }

    pub fn sync_validators(ctx: Context<SyncValidators>, validators: Vec<Pubkey>) -> Result<()> { 
        instructions::sync_validators::handler(ctx, validators) 
    }

    // ZK Proof-based Private Voting Instructions - NOW FUNCTIONAL
    
    pub fn private_vote(
        ctx: Context<private_vote::PrivateVote>,
        case_id: u64,
        commitment: [u8; 32],
        nullifier: [u8; 32],
        zk_proof: ZkProof,
    ) -> Result<()> {
        private_vote::private_vote_handler(ctx, case_id, commitment, nullifier, zk_proof)
    }

    pub fn reveal_vote(
        ctx: Context<private_vote::RevealVote>,
        vote: bool,
        salt: [u8; 32],
    ) -> Result<()> {
        private_vote::reveal_vote_handler(ctx, vote, salt)
    }

    pub fn initialize_private_evidence(
        ctx: Context<evidence_verification::InitializePrivateEvidence>,
        case_id: u64,
        evidence_hash: [u8; 32],
        encrypted_evidence: Vec<u8>,
        threshold: u8,
    ) -> Result<()> {
        evidence_verification::initialize_private_evidence_handler(
            ctx, case_id, evidence_hash, encrypted_evidence, threshold
        )
    }

    pub fn verify_evidence_share(
        ctx: Context<evidence_verification::VerifyEvidenceShare>,
        share_commitment: [u8; 32],
    ) -> Result<()> {
        evidence_verification::verify_evidence_share_handler(ctx, share_commitment)
    }

    pub fn initialize_mpc(
        ctx: Context<arcium_mpc::InitializeMpc>,
        case_id: u64,
        threshold: u8,
        total_jurors: u8,
    ) -> Result<()> {
        arcium_mpc::initialize_mpc_handler(ctx, case_id, threshold, total_jurors)
    }

    pub fn submit_mpc_share(
        ctx: Context<arcium_mpc::SubmitMpcShare>,
        public_share: [u8; 32],
        share_commitment: [u8; 32],
    ) -> Result<()> {
        arcium_mpc::submit_mpc_share_handler(ctx, public_share, share_commitment)
    }

    pub fn submit_partial_decryption(
        ctx: Context<arcium_mpc::SubmitPartialDecryption>,
        decryption_share: [u8; 32],
        proof: [u8; 64],
    ) -> Result<()> {
        arcium_mpc::submit_partial_decryption_handler(ctx, decryption_share, proof)
    }

    pub fn initiate_confidential_transfer(
        ctx: Context<dust_confidential::InitiateConfidentialTransfer>,
        transfer_id: u64,
        encrypted_amount: [u8; 64],
        range_proof: Vec<u8>,
        compliance_proof: Vec<u8>,
    ) -> Result<()> {
        dust_confidential::initiate_confidential_transfer_handler(
            ctx, transfer_id, encrypted_amount, range_proof, compliance_proof
        )
    }

    pub fn apply_confidential_transfer(
        ctx: Context<dust_confidential::ApplyConfidentialTransfer>,
    ) -> Result<()> {
        dust_confidential::apply_confidential_transfer_handler(ctx)
    }

    pub fn audit_confidential_transfer(
        ctx: Context<dust_confidential::AuditConfidentialTransfer>,
        flag: bool,
    ) -> Result<()> {
        dust_confidential::audit_transfer_handler(ctx, flag)
    }
}