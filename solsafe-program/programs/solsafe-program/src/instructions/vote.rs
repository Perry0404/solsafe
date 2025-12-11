use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::FreezeAccount;
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

#[derive(Accounts)]
pub struct VoteWithFreeze<'info> {
    #[account(mut)]
    pub juror: Signer<'info>,
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,
    /// Scam token account to be frozen
    #[account(mut)]
    pub scam_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    /// Mint account of the token
    pub mint: Account<'info, anchor_spl::token::Mint>,
    /// Program authority PDA that will freeze the account
    #[account(
        seeds = [b"authority"],
        bump
    )]
    pub program_authority: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Vote>, approve: bool) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    let config = &ctx.accounts.config;
    let _clock = Clock::get()?;

    // Verify case is in voting state
    require!(case.state == CaseState::Voting, ErrorCode::CaseNotVoting);

    // Verify juror is in validator list
    require!(
        config.validator_list.contains(&ctx.accounts.juror.key()),
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
        msg!("Validator voted approve. Votes for: {}", case.votes_for);
    } else {
        case.votes_against += 1;
        msg!("Validator voted reject. Votes against: {}", case.votes_against);
    }
    case.voted_jurors.push(ctx.accounts.juror.key());

    // Calculate voting threshold: 2/3 majority
    let total_validators = config.validator_list.len() as u64;
    let required_votes = (total_validators * 2) / 3 + 1;

    msg!("Total validators: {}, Required votes: {}", total_validators, required_votes);

    // Auto-execute if threshold reached
    if case.votes_for >= required_votes {
        case.state = CaseState::Approved;
        case.status = CaseStatus::Closed;
        msg!("Voting threshold reached! Case approved.");
    } else if case.votes_for + case.votes_against >= total_validators {
        // All validators have voted
        if case.votes_for > case.votes_against {
            case.state = CaseState::Approved;
        } else {
            case.state = CaseState::Rejected;
        }
        case.status = CaseStatus::Closed;
        msg!("All validators have voted. Final state set.");
    }

    Ok(())
}

pub fn handler_freeze(ctx: Context<VoteWithFreeze>, approve: bool) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    let config = &ctx.accounts.config;
    let _clock = Clock::get()?;

    // Verify case is in voting state
    require!(case.state == CaseState::Voting, ErrorCode::CaseNotVoting);

    // Verify juror is in validator list
    require!(
        config.validator_list.contains(&ctx.accounts.juror.key()),
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
        msg!("Validator voted approve. Votes for: {}", case.votes_for);
    } else {
        case.votes_against += 1;
        msg!("Validator voted reject. Votes against: {}", case.votes_against);
    }
    case.voted_jurors.push(ctx.accounts.juror.key());

    // Calculate voting threshold: 2/3 majority
    let total_validators = config.validator_list.len() as u64;
    let required_votes = (total_validators * 2) / 3 + 1;

    msg!("Total validators: {}, Required votes: {}", total_validators, required_votes);

    // Auto-execute if threshold reached
    if case.votes_for >= required_votes {
        case.state = CaseState::Approved;
        case.status = CaseStatus::Frozen;
        freeze_scam_account(ctx)?;
        msg!("Validator consensus reached! Scam account frozen");
    } else if case.votes_for + case.votes_against >= total_validators {
        // All validators have voted
        if case.votes_for > case.votes_against {
            case.state = CaseState::Approved;
        } else {
            case.state = CaseState::Rejected;
        }
        case.status = CaseStatus::Closed;
        msg!("All validators have voted. Final state set.");
    }

    Ok(())
}

fn freeze_scam_account(ctx: Context<VoteWithFreeze>) -> Result<()> {
    msg!("Freezing scam token account...");
    
    let cpi_accounts = FreezeAccount {
        account: ctx.accounts.scam_token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.program_authority.to_account_info(),
    };
    
    let bump = ctx.bumps.program_authority;
    let seeds: &[&[u8]] = &[&b"authority"[..], &[bump]];
    let signer_seeds: &[&[&[u8]]] = &[seeds];
    
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    
    anchor_spl::token::freeze_account(cpi_ctx)?;
    msg!("Token account successfully frozen!");
    
    Ok(())
}
