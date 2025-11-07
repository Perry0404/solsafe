use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>, // Fixed: was Vec
}

impl GlobalConfig {
    /// Conservative space estimate for GlobalConfig:
    /// admin (32) + vec length (4) + validators (assume max 50 validators * 32 bytes each)
    pub const LEN: usize = 32 + 4 + (50 * 32);
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
    /// Conservative space estimate for CaseAccount:
    /// case_id (8) + scam_address (32) + evidence string (4 + 500 bytes conservative) +
    /// jurors vec (4 + 3 * 32) + votes_for (8) + votes_against (8) + status (1) + vrf_request (32)
    pub const LEN: usize = 8 + 32 + (4 + 500) + (4 + 3 * 32) + 8 + 8 + 1 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}

#[account]
pub struct VoteRecord {
    // Marker account to prevent double voting
    pub voted: bool,
}

impl VoteRecord {
    /// Space estimate for VoteRecord: voted (1)
    pub const LEN: usize = 1;
}