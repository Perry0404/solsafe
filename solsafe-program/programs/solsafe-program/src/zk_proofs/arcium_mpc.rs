// Arcium MPC Integration for Secure Multi-Juror Computation
// Enables threshold cryptography and secure multi-party computation
use anchor_lang::prelude::*;

/// Arcium MPC Configuration for the case
#[account]
pub struct MpcConfig {
    pub case_id: u64,
    pub threshold: u8,           // Minimum jurors needed to decrypt
    pub total_jurors: u8,        // Total jurors in MPC group
    pub current_shares: u8,      // Current submitted shares
    pub computation_id: [u8; 32], // Unique MPC computation identifier
    pub state: MpcState,
    pub bump: u8,
}

impl MpcConfig {
    pub const LEN: usize = 8 + // case_id
        1 + // threshold
        1 + // total_jurors
        1 + // current_shares
        32 + // computation_id
        1 + // state
        1; // bump

    pub fn new(case_id: u64, threshold: u8, total_jurors: u8, bump: u8) -> Self {
        let computation_id = Self::generate_computation_id(case_id);
        
        MpcConfig {
            case_id,
            threshold,
            total_jurors,
            current_shares: 0,
            computation_id,
            state: MpcState::Initialized,
            bump,
        }
    }

    fn generate_computation_id(case_id: u64) -> [u8; 32] {
        use solana_program::hash::{hash, hashv};
        let clock = Clock::get().unwrap();
        let result = hashv(&[
            b"arcium_mpc",
            &case_id.to_le_bytes(),
            &clock.unix_timestamp.to_le_bytes(),
        ]);
        result.to_bytes()
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MpcState {
    Initialized,
    CollectingShares,
    ThresholdReached,
    ComputationComplete,
}

/// Individual juror's MPC key share
#[account]
pub struct MpcKeyShare {
    pub juror: Pubkey,
    pub case_id: u64,
    pub share_index: u8,
    pub public_share: [u8; 32],      // Public part of the share
    pub share_commitment: [u8; 32],  // Commitment to the share
    pub verified: bool,
    pub timestamp: i64,
    pub bump: u8,
}

impl MpcKeyShare {
    pub const LEN: usize = 32 + // juror
        8 + // case_id
        1 + // share_index
        32 + // public_share
        32 + // share_commitment
        1 + // verified
        8 + // timestamp
        1; // bump
}

/// Arcium MPC vote aggregation
#[account]
pub struct MpcVoteAggregation {
    pub case_id: u64,
    pub encrypted_tally: Vec<u8>,    // Homomorphically encrypted vote tally
    pub partial_decryptions: Vec<PartialDecryption>,
    pub final_result: Option<VoteResult>,
    pub computation_complete: bool,
    pub bump: u8,
}

impl MpcVoteAggregation {
    pub const MAX_SIZE: usize = 8 + // case_id
        4 + 256 + // encrypted_tally (max 256 bytes)
        4 + (PartialDecryption::SIZE * 20) + // partial_decryptions (max 20 jurors)
        1 + VoteResult::SIZE + // final_result
        1 + // computation_complete
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PartialDecryption {
    pub juror: Pubkey,
    pub decryption_share: [u8; 32],
    pub proof: [u8; 64],  // ZK proof of correct decryption
}

impl PartialDecryption {
    pub const SIZE: usize = 32 + 32 + 64;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VoteResult {
    pub votes_for: u64,
    pub votes_against: u64,
    pub total_votes: u64,
    pub verified: bool,
}

impl VoteResult {
    pub const SIZE: usize = 8 + 8 + 8 + 1;
}

/// Initialize MPC for a case
#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct InitializeMpc<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + MpcConfig::LEN,
        seeds = [b"mpc_config", case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub mpc_config: Account<'info, MpcConfig>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_mpc_handler(
    ctx: Context<InitializeMpc>,
    case_id: u64,
    threshold: u8,
    total_jurors: u8,
) -> Result<()> {
    let mpc_config = &mut ctx.accounts.mpc_config;
    
    require!(threshold > 0 && threshold <= total_jurors, crate::ErrorCode::InvalidThreshold);
    require!(total_jurors <= 20, crate::ErrorCode::TooManyJurors);
    
    let clock = Clock::get()?;`r`n    mpc_config.case_id = case_id;`r`n    mpc_config.threshold = threshold;`r`n    mpc_config.total_jurors = total_jurors;`r`n    mpc_config.current_shares = 0;`r`n    mpc_config.computation_id = MpcConfig::generate_computation_id(case_id, clock.unix_timestamp);`r`n    mpc_config.state = MpcState::Initialized;`r`n    mpc_config.bump = ctx.bumps.mpc_config; //
        case_id,
        threshold,
        total_jurors,
        ctx.bumps.mpc_config,
    );
    
    msg!("MPC initialized for case {}. Threshold: {}/{}", case_id, threshold, total_jurors);
    Ok(())
}

/// Juror submits their MPC key share
#[derive(Accounts)]
pub struct SubmitMpcShare<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    
    #[account(
        init,
        payer = juror,
        space = 8 + MpcKeyShare::LEN,
        seeds = [b"mpc_share", mpc_config.case_id.to_le_bytes().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub mpc_share: Account<'info, MpcKeyShare>,
    
    #[account(mut)]
    pub mpc_config: Account<'info, MpcConfig>,
    
    pub system_program: Program<'info, System>,
}

pub fn submit_mpc_share_handler(
    ctx: Context<SubmitMpcShare>,
    public_share: [u8; 32],
    share_commitment: [u8; 32],
) -> Result<()> {
    let mpc_share = &mut ctx.accounts.mpc_share;
    let mpc_config = &mut ctx.accounts.mpc_config;
    let clock = Clock::get()?;
    
    require!(
        mpc_config.current_shares < mpc_config.total_jurors,
        crate::ErrorCode::AllSharesSubmitted
    );
    
    // Initialize juror's share
    mpc_share.juror = ctx.accounts.juror.key();
    mpc_share.case_id = mpc_config.case_id;
    mpc_share.share_index = mpc_config.current_shares;
    mpc_share.public_share = public_share;
    mpc_share.share_commitment = share_commitment;
    mpc_share.verified = false;
    mpc_share.timestamp = clock.unix_timestamp;
    mpc_share.bump = ctx.bumps.mpc_share;
    
    mpc_config.current_shares += 1;
    
    if mpc_config.current_shares >= mpc_config.threshold {
        mpc_config.state = MpcState::ThresholdReached;
        msg!("MPC threshold reached!");
    }
    
    msg!("MPC share submitted. Progress: {}/{}", 
        mpc_config.current_shares, mpc_config.total_jurors);
    
    Ok(())
}

/// Submit partial decryption for vote aggregation
#[derive(Accounts)]
pub struct SubmitPartialDecryption<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    
    #[account(
        seeds = [b"mpc_share", mpc_config.case_id.to_le_bytes().as_ref(), juror.key().as_ref()],
        bump = mpc_share.bump,
        constraint = mpc_share.verified @ crate::ErrorCode::ShareNotVerified
    )]
    pub mpc_share: Account<'info, MpcKeyShare>,
    
    #[account(mut)]
    pub mpc_config: Account<'info, MpcConfig>,
    
    #[account(
        mut,
        seeds = [b"mpc_aggregation", mpc_config.case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vote_aggregation: Account<'info, MpcVoteAggregation>,
}

pub fn submit_partial_decryption_handler(
    ctx: Context<SubmitPartialDecryption>,
    decryption_share: [u8; 32],
    proof: [u8; 64],
) -> Result<()> {
    let vote_aggregation = &mut ctx.accounts.vote_aggregation;
    let mpc_config = &ctx.accounts.mpc_config;
    
    require!(
        mpc_config.state == MpcState::ThresholdReached,
        crate::ErrorCode::ThresholdNotReached
    );
    
    // Add partial decryption
    let partial_dec = PartialDecryption {
        juror: ctx.accounts.juror.key(),
        decryption_share,
        proof,
    };
    
    vote_aggregation.partial_decryptions.push(partial_dec);
    
    // Check if we can compute final result
    if vote_aggregation.partial_decryptions.len() >= mpc_config.threshold as usize {
        let result = combine_partial_decryptions(&vote_aggregation.partial_decryptions)?;
        vote_aggregation.final_result = Some(result);
        vote_aggregation.computation_complete = true;
        
        msg!("MPC computation complete! Votes: {} for, {} against",
            result.votes_for, result.votes_against);
    }
    
    Ok(())
}

/// Combine partial decryptions to get final tally (Arcium MPC protocol)
fn combine_partial_decryptions(
    partial_decryptions: &[PartialDecryption],
) -> Result<VoteResult> {
    // Arcium MPC threshold decryption happens here
    // This is a placeholder for the actual MPC protocol
    
    msg!("Combining {} partial decryptions", partial_decryptions.len());
    
    // In production, this would use Arcium's threshold decryption
    Ok(VoteResult {
        votes_for: 0,
        votes_against: 0,
        total_votes: partial_decryptions.len() as u64,
        verified: true,
    })
}
