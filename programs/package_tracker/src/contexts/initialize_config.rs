use anchor_lang::prelude::*;
use crate::state::GlobalConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"config",
                admin.key().as_ref()
                ],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeConfig<'info> {
pub fn initialize_config(&mut self, fee_collector: Pubkey, creation_fee: u64, update_fee: u64) -> Result<()> {
    self.global_config.set_inner(GlobalConfig {
        fee_collector,
        creation_fee,
        update_fee,
        admin: self.admin.key(),
    });
       
    Ok(())
}
}