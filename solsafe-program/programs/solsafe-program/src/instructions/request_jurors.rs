use anchor_lang::prelude::*;
use crate::state::{CaseAccount, CaseState};
use crate::ErrorCode;

#[derive(Accounts)]
pub struct RequestJurors<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    /// CHECK: Switchboard randomness account - will be validated in handler
    pub randomness_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RequestJurors>, case_id: u64) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    
    require!(case.case_id == case_id, ErrorCode::InvalidCase);
    require!(case.status == crate::state::CaseStatus::Open, ErrorCode::CaseNotOpen);

    // Store the randomness account pubkey for later use in select_jurors
    case.vrf_request = ctx.accounts.randomness_account.key();
    case.state = CaseState::PendingJurors;
    
    Ok(())
}
