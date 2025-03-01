use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};
use crate::errors::SolTrackError;
use crate::state::*;
use anchor_lang::solana_program::clock::Clock;

#[derive(Accounts)]
#[instruction(package_id: String)]
pub struct CreatePackage<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: Logistics provider's wallet
    #[account()]
    pub courier: UncheckedAccount<'info>,
    /// CHECK: Admin provider's wallet
    #[account(address = global_config.admin)]
    pub admin: UncheckedAccount<'info>,
    
    #[account(
        mut,
        address = global_config.fee_collector @ SolTrackError::InvalidFeeCollector,
    )]
    pub fee_collector: SystemAccount<'info>,
    #[account(
        seeds = [b"config",
                admin.key().as_ref()
                ],
        bump,
    )]
    pub global_config: Account<'info, GlobalConfig>,
    #[account(
        init,
        payer = sender, // Sender pays for PDA creation
        space = 8 + Package::MAX_SIZE,
        seeds = [
            b"package",
            package_id.as_bytes(),
            courier.key().as_ref()
        ],
        bump
    )]
    pub package: Box<Account<'info, Package>>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreatePackage<'info> {
    pub fn create_package(&mut self, package_id: String, encrypted_recipient_data: Vec<u8>, latitude: f64, longitude: f64, bumps: &CreatePackageBumps ) -> Result<()> {
        // Check sender balance before transferring
        require!(
            self.sender.lamports() >= self.global_config.creation_fee,
            SolTrackError::InsufficientFunds
        );
        // Deduct creation fee from sender
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.sender.to_account_info(),
            to: self.fee_collector.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        let amount = self.global_config.creation_fee;

        transfer(cpi_ctx, amount)?;

        let clock = Clock::get()?;
        require!(
            (-90.0..=90.0).contains(&latitude) && (-180.0..=180.0).contains(&longitude),
            SolTrackError::InvalidGeoPoint
        );
        let package = &mut self.package;
            package.set_inner(Package {
            package_id,
            status : PackageStatus::Created,
            sender: self.sender.key(),
            courier_pubkey: self.courier.key(),
            created_at : clock.unix_timestamp,
            updated_at : clock.unix_timestamp,
            current_location : GeoPoint { latitude, longitude },
            encrypted_recipient_data, 
        });

        // Emit an event for the listener service
        emit!(PackageCreated {
        package_id: package.package_id.clone(),
        courier: package.courier_pubkey,
        timestamp: package.created_at,
        });
        
        Ok(())
    }   
}

