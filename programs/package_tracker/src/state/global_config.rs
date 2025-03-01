use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub fee_collector: Pubkey,  // Central fee destination
    pub creation_fee: u64,      // Fee for creating a package
    pub update_fee: u64,        // Fee for updating status
    pub admin: Pubkey,          // Admin to update fees
}