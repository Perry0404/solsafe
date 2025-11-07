use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>, // Fixed: was Vec
}

impl GlobalConfig {
    pub const LEN: usize = 32 + 4 + (32 * 10); // admin + vec length + 10 validators (adjust as needed)
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

impl CaseAccount {
    pub const LEN: usize = 8 + 32 + (4 + 256) + (4 + 32 * 3) + 8 + 8 + 1 + 32; // case_id + scam_address + evidence (256 chars) + jurors (3) + votes_for + votes_against + status + vrf_request
}

#[account]
pub struct VoteRecord {
    pub case: Pubkey,
    pub validator: Pubkey,
}

impl VoteRecord {
    pub const LEN: usize = 32 + 32; // case + validator
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}