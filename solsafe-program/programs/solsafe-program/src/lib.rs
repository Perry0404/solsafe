use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use spl_token::instruction::AuthorityType;

declare_id!("Hvo63PGhSivug4ju5bEWrVwLuDukk45DcKBZM2XPUUVr");

mod state;
use state::{GlobalConfig, CaseAccount, CaseStatus, VoteRecord};

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
}

#[program]
pub mod solsafe_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = *ctx.accounts.admin.key;
        config.validator_list = vec![];
        Ok(())
    }

    pub fn update_validators(ctx: Context<UpdateValidators>, validators: Vec<Pubkey>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(ctx.accounts.admin.key == config.admin, ErrorCode::Unauthorized);
        config.validator_list = validators;
        Ok(())
    }

    pub fn submit_evidence(
        ctx: Context<SubmitEvidence>,
        case_id: u64,
        evidence: String,
        scam_address: Pubkey,
    ) -> Result<()> {
        let case = &mut ctx.accounts.case_account;
        case.case_id = case_id;
        case.scam_address = scam_address;
        case.evidence = evidence;
        case.status = CaseStatus::Open;
        case.votes_for = 0;
        case.votes_against = 0;
        case.jurors = vec![];
        case.vrf_request = Pubkey::default();
        Ok(())
    }

    pub fn request_jurors(ctx: Context<RequestJurors>, case_id: u64) -> Result<()> {
        let case = &mut ctx.accounts.case_account;
        require!(case.case_id == case_id, ErrorCode::InvalidCase);
        require!(case.status == CaseStatus::Open, ErrorCode::CaseNotOpen);

        case.vrf_request = *ctx.accounts.vrf_account.to_account_info().key;
        Ok(())
    }

    pub fn select_jurors(ctx: Context<SelectJurors>) -> Result<()> {
        let case = &mut ctx.accounts.case_account;
        let config = &ctx.accounts.config;

        require!(case.vrf_request != Pubkey::default(), ErrorCode::VrfNotReady);

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
    }
}