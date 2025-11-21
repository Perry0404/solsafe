use anchor_lang::prelude::*;
use crate::state::{CaseAccount, CaseState, CaseStatus, GlobalConfig};
use crate::ErrorCode;

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Vote>, approve: bool) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    let config = &ctx.accounts.config;
    let clock = Clock::get()?;

    // Verify case is in voting state
    require!(case.state == CaseState::Voting, ErrorCode::CaseNotVoting);

    // Verify juror was actually selected
    require!(
        case.jurors.contains(&ctx.accounts.juror.key()),
        ErrorCode::NotJuror
    );

    // Verify juror hasn't already voted
    require!(
        !case.voted_jurors.contains(&ctx.accounts.juror.key()),
        ErrorCode::AlreadyVoted
    );

    // Record vote
    if approve {
        case.votes_for += 1;
    } else {
        case.votes_against += 1;
    }
    case.voted_jurors.push(ctx.accounts.juror.key());

    // Auto-execute if threshold reached
    if case.votes_for >= config.quorum as u64 {
        case.state = CaseState::Approved;
        case.status = CaseStatus::Frozen;
        // CPI to freeze token account goes here later
    } else if case.votes_for + case.votes_against >= config.min_jurors as u64 {
        case.state = CaseState::Rejected;
        case.status = CaseStatus::Closed;
    }

    Ok(())
}
