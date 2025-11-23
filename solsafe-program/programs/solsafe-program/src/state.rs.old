use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>, // Fixed: was Vec
}

#[account]
pub struct CaseAccount {
    pub case_id: u64,
    pub scam_address: Pubkey,
    pub evidence: String,
    pub jurors: Vec<Pubkey>,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: CaseStatus,
    pub vrf_request: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}