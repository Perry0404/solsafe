use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>, // Fixed: was Vec
}

impl GlobalConfig {
    // Space calculation: 8 (discriminator) + 32 (admin) + 4 (vec length) + 32*50 (50 validators max)
    pub const LEN: usize = 8 + 32 + 4 + (32 * 50);
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
    // Space calculation: 8 (discriminator) + 8 (case_id) + 32 (scam_address) + 4 (string length) + 500 (evidence max) + 4 (vec length) + 32*3 (3 jurors) + 8 (votes_for) + 8 (votes_against) + 1 (status enum) + 32 (vrf_request)
    pub const LEN: usize = 8 + 8 + 32 + 4 + 500 + 4 + (32 * 3) + 8 + 8 + 1 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub case_id: u64,
    pub voted: bool,
}

impl VoteRecord {
    // Space calculation: 8 (discriminator) + 32 (voter) + 8 (case_id) + 1 (voted)
    pub const LEN: usize = 8 + 32 + 8 + 1;
}