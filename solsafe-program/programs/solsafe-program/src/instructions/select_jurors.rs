use anchor_lang::prelude::*;
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
    /// CHECK: Switchboard VRF account - must be provided by client after VRF reveal
    pub vrf_account: AccountInfo<'info>,
}

pub fn handler(ctx: Context<SelectJurors>) -> Result<()> {
    let case = &mut ctx.accounts.case_account;
    let config = &ctx.accounts.config;

    require!(case.vrf_request != Pubkey::default(), ErrorCode::VrfNotReady);
    require!(case.state == CaseState::PendingJurors, ErrorCode::InvalidCase);
    require!(case.vrf_request == ctx.accounts.vrf_account.key(), ErrorCode::InvalidCase);

    // Read Switchboard VRF randomness from account data
    // The VRF account stores the randomness result after reveal
    // Format: [discriminator: 8 bytes][randomness: 32 bytes][...]
    let vrf_data = ctx.accounts.vrf_account.try_borrow_data()?;
    require!(vrf_data.len() >= 40, ErrorCode::VrfNotReady);
    
    // Extract 32 bytes of randomness (skip 8-byte discriminator)
    let mut randomness = [0u8; 32];
    randomness.copy_from_slice(&vrf_data[8..40]);

    let num_jurors: usize = config.min_jurors as usize;
    let validator_count = config.validator_list.len();
    require!(validator_count >= num_jurors, ErrorCode::NotEnoughValidators);

    // Store all candidates for verification
    case.juror_candidates = config.validator_list.clone();

    // Select jurors using Switchboard's true randomness with duplicate prevention
    let mut selected = Vec::with_capacity(num_jurors);
    let mut selected_indices = Vec::with_capacity(num_jurors);
    let mut attempt = 0u32;
    
    while selected.len() < num_jurors {
        require!(attempt < 1000, ErrorCode::JurorSelectionFailed);
        
        // Use checked arithmetic to prevent overflow
        let offset = attempt.checked_mul(4)
            .ok_or(ErrorCode::ArithmeticOverflow)? as usize;
        
        let idx = u32::from_le_bytes([
            randomness[offset % 32],
            randomness[(offset + 1) % 32],
            randomness[(offset + 2) % 32],
            randomness[(offset + 3) % 32]
        ]) as usize % validator_count;
        
        // Only add if not already selected (prevent duplicates)
        if !selected_indices.contains(&idx) {
            selected_indices.push(idx);
            selected.push(config.validator_list[idx]);
        }
        
        attempt = attempt.checked_add(1)
            .ok_or(ErrorCode::ArithmeticOverflow)?;
    }
    
    case.jurors = selected;
    case.state = CaseState::Voting;

    Ok(())
}
