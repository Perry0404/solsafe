use anchor_lang::prelude::*;
use crate::state::{CaseAccount, CaseStatus, CaseState};

#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct SubmitEvidence<'info> {
    #[account(
        init,
        payer = reporter,
        space = 8 + 8 + 32 + 4 + 256 + 4 + (32 * 3) + 4 + (32 * 100) + 8 + 8 + 4 + (32 * 3) + 1 + 1 + 32 + 1,
        seeds = [b"case", case_id.to_le_bytes().as_ref()],
        bump
    )]
    pub case_account: Account<'info, CaseAccount>,
    #[account(mut)]
    pub reporter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitEvidence>,
    case_id: u64,
    evidence: String,
    scam_address: Pubkey,
    bump: u8,
) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    case.case_id = case_id;
    case.scam_address = scam_address;
    case.evidence = evidence;
    case.status = CaseStatus::Open;
    case.state = CaseState::PendingJurors;
    case.votes_for = 0;
    case.votes_against = 0;
    case.jurors = vec![];
    case.juror_candidates = vec![];
    case.voted_jurors = vec![];
    case.vrf_request = Pubkey::default();
    case.bump = bump;
    Ok(())
}
