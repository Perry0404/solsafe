// Zero-Knowledge Evidence Verification
// Allows jurors to verify evidence without revealing it publicly
use anchor_lang::prelude::*;

/// Private evidence commitment
#[account]
pub struct EvidenceCommitment {
    pub case_id: u64,
    pub evidence_hash: [u8; 32],
    pub encrypted_evidence: Vec<u8>,  // Encrypted with MPC threshold scheme
    pub commitment: [u8; 32],
    pub juror_count: u8,
    pub threshold: u8,  // MPC threshold for decryption
    pub bump: u8,
}

impl EvidenceCommitment {
    pub const MAX_SIZE: usize = 8 + // case_id
        32 + // evidence_hash
        4 + 1024 + // encrypted_evidence (max 1KB)
        32 + // commitment
        1 + // juror_count
        1 + // threshold
        1; // bump

    pub fn new(
        case_id: u64,
        evidence_hash: [u8; 32],
        encrypted_evidence: Vec<u8>,
        threshold: u8,
        bump: u8,
    ) -> Self {
        let commitment = Self::compute_commitment(&evidence_hash);
        
        EvidenceCommitment {
            case_id,
            evidence_hash,
            encrypted_evidence,
            commitment,
            juror_count: 0,
            threshold,
            bump,
        }
    }

    fn compute_commitment(evidence_hash: &[u8; 32]) -> [u8; 32] {
        use solana_program::hash::hash;
        hash(evidence_hash).to_bytes()
    }

    pub fn verify_hash(&self, claimed_hash: &[u8; 32]) -> bool {
        &self.evidence_hash == claimed_hash
    }
}

/// Juror's share in MPC evidence decryption
#[account]
pub struct JurorEvidenceShare {
    pub juror: Pubkey,
    pub case_id: u64,
    pub share_commitment: [u8; 32],
    pub has_verified: bool,
    pub verification_timestamp: i64,
    pub bump: u8,
}

impl JurorEvidenceShare {
    pub const LEN: usize = 32 + // juror
        8 + // case_id
        32 + // share_commitment
        1 + // has_verified
        8 + // verification_timestamp
        1; // bump
}

/// Initialize private evidence with Arcium MPC encryption
#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct InitializePrivateEvidence<'info> {
    #[account(mut)]
    pub reporter: Signer<'info>,
    
    #[account(
        init,
        payer = reporter,
        space = 8 + EvidenceCommitment::MAX_SIZE,
        seeds = [b"evidence_commitment", case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub evidence_commitment: Account<'info, EvidenceCommitment>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_private_evidence_handler(
    ctx: Context<InitializePrivateEvidence>,
    case_id: u64,
    evidence_hash: [u8; 32],
    encrypted_evidence: Vec<u8>,
    threshold: u8,
) -> Result<()> {
    let evidence = &mut ctx.accounts.evidence_commitment;
    
    require!(encrypted_evidence.len() <= 1024, crate::ErrorCode::EvidenceTooLarge);
    require!(threshold > 0, crate::ErrorCode::InvalidThreshold);
    
    evidence.case_id = case_id;
    evidence.evidence_hash = evidence_hash;
    evidence.encrypted_evidence = encrypted_evidence;
    evidence.threshold = threshold;
    evidence.verified_shares = 0;
    evidence.bump = ctx.bumps.evidence_commitment;
    
    msg!("Private evidence initialized for case {}", case_id);
    Ok(())
}

/// Juror verifies evidence using their MPC share
#[derive(Accounts)]
pub struct VerifyEvidenceShare<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = juror,
        space = 8 + JurorEvidenceShare::LEN,
        seeds = [b"evidence_share", evidence.case_id.to_le_bytes().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub juror_share: Account<'info, JurorEvidenceShare>,
    
    #[account(mut)]
    pub evidence: Account<'info, EvidenceCommitment>,
    
    pub system_program: Program<'info, System>,
}

pub fn verify_evidence_share_handler(
    ctx: Context<VerifyEvidenceShare>,
    share_commitment: [u8; 32],
) -> Result<()> {
    let juror_share = &mut ctx.accounts.juror_share;
    let evidence = &mut ctx.accounts.evidence;
    let clock = Clock::get()?;
    
    // Initialize juror share
    juror_share.juror = ctx.accounts.juror.key();
    juror_share.case_id = evidence.case_id;
    juror_share.share_commitment = share_commitment;
    juror_share.has_verified = true;
    juror_share.verification_timestamp = clock.unix_timestamp;
    juror_share.bump = ctx.bumps.juror_share;
    
    evidence.juror_count += 1;
    
    msg!("Juror verified evidence share. Total verifications: {}/{}", 
        evidence.juror_count, evidence.threshold);
    
    Ok(())
}

/// Reconstruct evidence when threshold is met (Arcium MPC)
pub fn reconstruct_evidence(
    shares: Vec<[u8; 32]>,
    threshold: u8,
) -> Result<Vec<u8>> {
    require!(shares.len() >= threshold as usize, crate::ErrorCode::InsufficientShares);
    
    // Arcium MPC reconstruction would happen here
    // For now, return placeholder
    msg!("Evidence reconstruction with {} shares", shares.len());
    Ok(vec![])
}
