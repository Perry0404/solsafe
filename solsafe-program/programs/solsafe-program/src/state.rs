use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub validator_list: Vec<Pubkey>,
    pub bump: u8,
    pub quorum: u8,        // Number of votes needed to approve
    pub min_jurors: u8,    // Minimum jurors needed to vote
}

#[account]
pub struct CaseAccount {
    pub case_id: u64,
    pub scam_address: Pubkey,
    pub evidence: String,
    pub jurors: Vec<Pubkey>,
    pub juror_candidates: Vec<Pubkey>,  // All potential jurors before selection
    pub votes_for: u64,
    pub votes_against: u64,
    pub voted_jurors: Vec<Pubkey>,      // Track who has voted
    pub status: CaseStatus,
    pub state: CaseState,               // Voting state
    pub vrf_request: Pubkey,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    Closed,
    Frozen,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseState {
    PendingJurors,  // Waiting for juror selection
    Voting,         // Active voting period
    Approved,       // Case approved for freeze
    Rejected,       // Case rejected
    Executed,       // Freeze executed
}

#[account]
pub struct VoteRecord {
    pub juror: Pubkey,
    pub case_id: u64,
    pub approved: bool,
    pub timestamp: i64,
}