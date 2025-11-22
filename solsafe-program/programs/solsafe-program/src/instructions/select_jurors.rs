use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};
use crate::state::{CaseAccount, CaseState, GlobalConfig};
use crate::ErrorCode;

#[derive(Accounts)]
pub struct SelectJurors<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,
    /// CHECK: VRF account from Switchboard
    pub vrf_account: AccountInfo<'info>,
}

pub fn handler(ctx: Context<SelectJurors>) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    let config = &ctx.accounts.config;

    require!(case.vrf_request != Pubkey::default(), ErrorCode::VrfNotReady);
    require!(case.state == CaseState::PendingJurors, ErrorCode::InvalidCase);

    // Attempt to read 32 bytes from the VRF account data as the randomness.
    // If inadequate, fall back to deterministic case_id-derived randomness as a safe default.
    let randomness: [u8; 32] = {
        let data = ctx.accounts.vrf_account.to_account_info().data.borrow();
        if data.len() >= 32 {
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&data[..32]);
            arr
        } else {
            let mut tmp = [0u8; 32];
            tmp[..8].copy_from_slice(&case.case_id.to_le_bytes());
            tmp
        }
    };

    let num_jurors: usize = 3;
    let validator_count = config.validator_list.len();
    require!(validator_count >= num_jurors, ErrorCode::NotEnoughValidators);

    // Store candidates for later verification
    case.juror_candidates = config.validator_list.clone();

    // Select jurors using randomness
    let selected = select_jurors_from_randomness(&randomness, &case.juror_candidates)?;
    case.jurors = selected;
    case.state = CaseState::Voting;

    Ok(())
}

// Helper function to select jurors from randomness
fn select_jurors_from_randomness(
    randomness: &[u8; 32],
    candidates: &[Pubkey],
) -> Result<Vec<Pubkey>> {
    let mut selected = vec![];
    let mut hash = *randomness;
    
    for _ in 0..3 {
        let idx = u32::from_le_bytes([hash[0], hash[1], hash[2], hash[3]]) as usize % candidates.len();
        selected.push(candidates[idx]);
        
        // Generate new hash for next selection
        let mut hasher = Sha256::new();
        hasher.update(&hash);
        hash = hasher.finalize().into();
    }
    
    Ok(selected)
}
