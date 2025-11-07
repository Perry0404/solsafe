use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token};
use spl_token::instruction::AuthorityType;

declare_id!("solsafe11111111111111111111111111111111111"); // declared as 'solsafe' placeholder

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
    #[msg("Already voted")]
    AlreadyVoted,
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

        // TODO: replace placeholder randomness extraction with the oracle's VRF result decoding.
        let randomness: [u8; 32] = {
            let mut tmp = [0u8; 32];
            tmp[..8].copy_from_slice(&case.case_id.to_le_bytes());
            tmp
        };

        let num_jurors: usize = 3;
        let validator_count = config.validator_list.len();
        require!(validator_count >= num_jurors, ErrorCode::NotEnoughValidators);

        let mut jurors: Vec<Pubkey> = Vec::with_capacity(num_jurors);
        for i in 0..num_jurors {
            let index = (randomness[i % 32] as usize) % validator_count;
            jurors.push(config.validator_list[index]);
        }
        case.jurors = jurors;
        Ok(())
    }

    /// Vote: enforces one-vote-per-wallet by initializing a VoteRecord PDA.
    pub fn vote(ctx: Context<Vote>, vote_for: bool) -> Result<()> {
        let case = &mut ctx.accounts.case_account;

        require!(case.status == CaseStatus::Open, ErrorCode::CaseNotOpen);
        require!(
            case.jurors.iter().any(|j| j == ctx.accounts.validator.key),
            ErrorCode::NotJuror
        );

        // VoteRecord init is enforced by the account constraint in the Vote context.
        // If the VoteRecord PDA already exists, Anchor will return an error and prevent double voting.
        if vote_for {
            case.votes_for = case.votes_for.checked_add(1).ok_or(ErrorCode::InvalidRandomness)?;
        } else {
            case.votes_against = case.votes_against.checked_add(1).ok_or(ErrorCode::InvalidRandomness)?;
        }
        Ok(())
    }

    pub fn freeze_assets(ctx: Context<FreezeAssets>) -> Result<()> {
        let case = &ctx.accounts.case_account;
        require!(case.votes_for > case.votes_against, ErrorCode::NotApproved);

        // CPI to set freeze authority: current_authority must sign (or be a PDA with seeds).
        let cpi_accounts = token::SetAuthority {
            account_or_mint: ctx.accounts.scam_token_account.to_account_info(),
            current_authority: ctx.accounts.current_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

        token::set_authority(
            cpi_ctx,
            AuthorityType::FreezeAccount,
            Some(ctx.accounts.program_authority.key()),
        )?;

        let case_mut = &mut ctx.accounts.case_account;
        case_mut.status = CaseStatus::Frozen;
        Ok(())
    }
}

/* ======================= ACCOUNT STRUCTS / CONTEXTS ======================= */

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = admin, space = 8 + GlobalConfig::LEN)]
    pub config: Account<'info, GlobalConfig>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateValidators<'info> {
    #[account(mut, has_one = admin)]
    pub config: Account<'info, GlobalConfig>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: u64)]
pub struct SubmitEvidence<'info> {
    #[account(
        init,
        payer = submitter,
        space = 8 + CaseAccount::LEN,
        seeds = [b"case", submitter.key().as_ref(), &case_id.to_le_bytes()],
        bump
    )]
    pub case_account: Account<'info, CaseAccount>,
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RequestJurors<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    /// VRF account representation: use correct oracle account type; kept as UncheckedAccount for flexibility
    pub vrf_account: UncheckedAccount<'info>,
    pub program_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SelectJurors<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    pub config: Account<'info, GlobalConfig>,
    pub vrf_account: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,

    /// The validator (juror) signing the vote
    pub validator: Signer<'info>,

    /// One VoteRecord per (case, validator) prevents double voting:
    /// seeds = [b"vote", case.key().as_ref(), validator.key().as_ref()]
    #[account(
        init,
        payer = validator,
        space = 8 + VoteRecord::LEN,
        seeds = [b"vote", case_account.key().as_ref(), validator.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FreezeAssets<'info> {
    #[account(mut)]
    pub case_account: Account<'info, CaseAccount>,
    #[account(mut)]
    pub scam_token_account: Account<'info, TokenAccount>,
    // current_authority must be the current owner of the token account (Signer or PDA with seeds)
    pub current_authority: Signer<'info>,
    pub program_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}