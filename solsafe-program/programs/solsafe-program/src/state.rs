// Optional: shared state structs can go here (Account structs)
use anchor_lang::prelude::*;

#[account]
pub struct Case {
    pub reporter: Pubkey,
    pub victim: String, // or Pubkey depending on desired schema
    pub votes: u64,
    pub status: u8, // e.g., 0=submitted,1=frozen,2=unfrozen
}