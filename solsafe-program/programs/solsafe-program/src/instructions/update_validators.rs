use anchor_lang::prelude::*;
use crate::state::GlobalConfig;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct UpdateValidators<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateValidators>, validators: Vec<Pubkey>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    require!(ctx.accounts.admin.key == &config.admin, ErrorCode::Unauthorized);
    config.validator_list = validators;
    Ok(())
}
