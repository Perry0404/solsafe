use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use spl_token::instruction::AuthorityType;

declare_id!("Hvo63PGhSivug4ju5bEWrVwLuDukk45DcKBZM2XPUUVr");

pub mod state;
pub mod instructions;

use state::{GlobalConfig, CaseAccount, CaseStatus, CaseState, VoteRecord};
use instructions::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid case")]
    InvalidCase,
    #[msg("Case not open")]
    CaseNotOpen,
    #[msg("VRF not ready")]
    VrfNotReady,
    #[msg("Invalid randomness")]
    InvalidRandomness,
    #[msg("Not enough validators")]
    NotEnoughValidators,
    #[msg("Not a juror")]
    NotJuror,
    #[msg("Not approved")]
    NotApproved,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Case not in voting state")]
    CaseNotVoting,
}

#[program]
pub mod solsafe_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, quorum: u8, min_jurors: u8) -> Result<()> {
        instructions::initialize::handler(ctx, quorum, min_jurors)
    }

    pub fn update_validators(ctx: Context<UpdateValidators>, validators: Vec<Pubkey>) -> Result<()> {
        instructions::update_validators::handler(ctx, validators)
    }

    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        case_id: u64,
        evidence: String,
        scam_address: Pubkey,
        bump: u8,
    ) -> Result<()> {
        instructions::submit_evidence::handler(ctx, case_id, evidence, scam_address, bump)
    }

    pub fn request_jurors(ctx: Context<RequestJurors>, case_id: u64) -> Result<()> {
        instructions::request_jurors::handler(ctx, case_id)
    }

    pub fn select_jurors(ctx: Context<SelectJurors>) -> Result<()> {
        instructions::select_jurors::handler(ctx)
    }

    pub fn vote(ctx: Context<Vote>, approve: bool) -> Result<()> {
        instructions::vote::handler(ctx, approve)
    }
}

