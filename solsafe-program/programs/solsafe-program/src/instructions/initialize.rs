use anchor_lang::prelude::*;
use crate::state::GlobalConfig;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + (32 * 100) + 1 + 1 + 1, // discriminator + admin + vec len + 100 validators + bump + quorum + min_jurors
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, quorum: u8, min_jurors: u8) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = *ctx.accounts.admin.key;
    config.validator_list = vec![];
    config.bump = ctx.bumps.config;
    config.quorum = quorum;
    config.min_jurors = min_jurors;
    Ok(())
}
