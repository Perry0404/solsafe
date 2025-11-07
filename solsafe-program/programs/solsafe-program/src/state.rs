use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>, // Fixed: was Vec
}

impl GlobalConfig {
    /// Conservative space estimate for GlobalConfig:
    /// admin (32) + vec discriminator (4) + up to 50 validators * 32 bytes each = 32 + 4 + 1600 = 1636
    pub const LEN: usize = 32 + 4 + 1600;
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
    /// case_id (8) + scam_address (32) + evidence String (4 + 1000 chars) + 
    /// jurors Vec (4 + 3 * 32) + votes_for (8) + votes_against (8) + 
    /// status (1 + padding) + vrf_request (32) = 8 + 32 + 1004 + 100 + 8 + 8 + 2 + 32 = 1194
    pub const LEN: usize = 8 + 32 + 1004 + 100 + 8 + 8 + 2 + 32;
}

#[account]
pub struct VoteRecord {
    pub case: Pubkey,
    pub validator: Pubkey,
}

impl VoteRecord {
    /// Space for VoteRecord: case (32) + validator (32) = 64
    pub const LEN: usize = 32 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}