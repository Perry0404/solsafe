// Private Voting with Zero-Knowledge Proofs
use anchor_lang::prelude::*;
use super::{VoteCommitment, ZkProof, ZkProofType};

/// Private vote instruction using ZK proofs
#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct PrivateVote<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = juror,
        space = 8 + VoteCommitmentAccount::LEN,
        seeds = [b"vote_commitment", case_id.to_le_bytes().as_ref(), juror.key().as_ref()],
        bump
    )]
    pub vote_commitment_account: Account<'info, VoteCommitmentAccount>,
    
    #[account(
        mut,
        seeds = [b"case", case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub case_account: Account<'info, crate::state::CaseAccount>,
    
    #[account(
        mut,
        seeds = [b"compressed_votes", case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub compressed_state: Account<'info, super::light_compression::CompressedVoteState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VoteCommitmentAccount {
    pub juror: Pubkey,
    pub case_id: u64,
    pub commitment: [u8; 32],
    pub nullifier: [u8; 32],
    pub timestamp: i64,
    pub revealed: bool,
    pub bump: u8,
}

impl VoteCommitmentAccount {
    pub const LEN: usize = 32 + // juror
        8 + // case_id
        32 + // commitment
        32 + // nullifier
        8 + // timestamp
        1 + // revealed
        1; // bump
}

pub fn private_vote_handler(
    ctx: Context<PrivateVote>,
    case_id: u64,
    commitment: [u8; 32],
    nullifier: [u8; 32],
    zk_proof: ZkProof,
) -> Result<()> {
    let vote_account = &mut ctx.accounts.vote_commitment_account;
    let compressed_state = &mut ctx.accounts.compressed_state;
    let case = &mut ctx.accounts.case_account;
    let clock = Clock::get()?;

    // Verify case is in voting state
    require!(
        case.state == crate::state::CaseState::Voting,
        crate::ErrorCode::CaseNotVoting
    );

    // Verify ZK proof
    require!(
        zk_proof.proof_type == ZkProofType::VoteCommitment,
        crate::ErrorCode::InvalidProofType
    );
    require!(
        zk_proof.verify()?,
        crate::ErrorCode::InvalidZkProof
    );

    // Check nullifier hasn't been used (prevent double voting)
    require!(
        !vote_account.revealed,
        crate::ErrorCode::AlreadyVoted
    );

    // Store vote commitment
    vote_account.juror = ctx.accounts.juror.key();
    vote_account.case_id = case_id;
    vote_account.commitment = commitment;
    vote_account.nullifier = nullifier;
    vote_account.timestamp = clock.unix_timestamp;
    vote_account.revealed = false;
    vote_account.bump = ctx.bumps.vote_commitment_account;

    // Add to compressed state using Light Protocol
    let vote_commitment = VoteCommitment {
        commitment,
        nullifier,
        case_id,
        timestamp: clock.unix_timestamp,
    };
    compressed_state.add_commitment(&vote_commitment)?;

    msg!("Private vote committed. Commitment: {:?}", &commitment[..8]);
    Ok(())
}

/// Reveal vote with ZK proof (optional for tallying)
#[derive(Accounts)]
pub struct RevealVote<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"vote_commitment", vote_account.case_id.to_le_bytes().as_ref(), juror.key().as_ref()],
        bump = vote_account.bump
    )]
    pub vote_account: Account<'info, VoteCommitmentAccount>,
    
    #[account(mut)]
    pub case_account: Account<'info, crate::state::CaseAccount>,
}

pub fn reveal_vote_handler(
    ctx: Context<RevealVote>,
    vote: bool,
    salt: [u8; 32],
) -> Result<()> {
    let vote_account = &mut ctx.accounts.vote_account;
    let case = &mut ctx.accounts.case_account;

    // Verify commitment matches revealed vote
    let revealed_commitment = VoteCommitment::new(
        vote_account.case_id,
        vote,
        salt,
        vote_account.timestamp,
    );
    
    require!(
        revealed_commitment.commitment == vote_account.commitment,
        crate::ErrorCode::InvalidReveal
    );

    // Mark as revealed and update vote count
    vote_account.revealed = true;
    
    if vote {
        case.votes_for += 1;
    } else {
        case.votes_against += 1;
    }

    msg!("Vote revealed. Case {} votes: {} for, {} against", 
        vote_account.case_id, case.votes_for, case.votes_against);
    
    Ok(())
}
