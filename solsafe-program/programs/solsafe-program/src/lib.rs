use anchor_lang::prelude::*;

declare_id!("ReplaceWithProgramID111111111111111111111111111");

#[program]
pub mod solsaf e_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // Add program instructions (submit_case, vote, freeze, unfreeze) here.
}

#[derive(Accounts)]
pub struct Initialize {}