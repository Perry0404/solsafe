use anchor_lang::prelude::*;
use crate::state::GlobalConfig;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct SyncValidators<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,
}

pub fn handler(ctx: Context<SyncValidators>, validators: Vec<Pubkey>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    
    // Only admin can sync validators
    require_eq!(
        ctx.accounts.admin.key(),
        config.admin,
        ErrorCode::Unauthorized
    );

    msg!("Syncing {} validators", validators.len());
    config.validator_list = validators;
    msg!("Validators synced. Total: {}", config.validator_list.len());

    Ok(())
}
