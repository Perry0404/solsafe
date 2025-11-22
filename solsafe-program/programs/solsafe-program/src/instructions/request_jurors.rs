use anchor_lang::prelude::*;
use crate::state::{CaseAccount, CaseStatus};
use crate::ErrorCode;

#[derive(Accounts)]
pub struct RequestJurors<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    /// CHECK: VRF account from Switchboard
    pub vrf_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RequestJurors>, case_id: u64) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    require!(case.case_id == case_id, ErrorCode::InvalidCase);
    require!(case.status == CaseStatus::Open, ErrorCode::CaseNotOpen);

    case.vrf_request = *ctx.accounts.vrf_account.to_account_info().key;
    Ok(())
}
