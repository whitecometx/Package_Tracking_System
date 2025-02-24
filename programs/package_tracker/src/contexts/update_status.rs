use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};
use crate::state::*;
use crate::contexts::*;
use anchor_lang::solana_program::clock::Clock;
use crate::SolTrackError;

#[derive(Accounts)]
pub struct UpdateStatus<'info> {
    #[account(mut)]
    pub courier: Signer<'info>,      // Must match package.courier_pubkey
    #[account(
        mut,
        constraint = package.courier_pubkey == courier.key() @ SolTrackError::UnauthorizedCourier
    )]
    pub package: Account<'info, Package>,
    #[account(mut)]
    /// CHECK: Protocol's fee collector address
    pub fee_collector: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> UpdateStatus<'info> {
    pub fn update_package_status(&mut self, new_status: PackageStatus, latitude: f64, longitude: f64) -> Result<()> {
    
        require!(
            self.package.is_valid_transition(&new_status),
            SolTrackError::InvalidStatusTransition
        );
        // Validate geolocation
        require!(
            (-90.0..=90.0).contains(&latitude) && (-180.0..=180.0).contains(&longitude),
            SolTrackError::InvalidGeoPoint
        );
    
        // Update package
        let cpi_program = self.system_program.to_account_info();
        let package = &mut self.package;
        package.status = new_status;
        package.current_location = GeoPoint { latitude, longitude };
        package.updated_at = Clock::get()?.unix_timestamp;
    
        // Charge fee (0.01 SOL)
        
        let fee = 10_000_000; // 0.01 SOL in lamports /* */
        let from= self.courier.to_account_info();
        let to= self.fee_collector.to_account_info();
        let cpi_account = Transfer {
            from,
            to
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_account);
        transfer(cpi_ctx, fee)?;
        require!(
            self.courier.key() == package.courier_pubkey,
            SolTrackError::UnauthorizedCourier
        );
    
        // Emit an event for the listener service
        emit!(StatusUpdated{
            package_id: package.package_id.clone(),
            new_status,
            timestamp: package.updated_at,
            latitude,
            longitude,
        });
    
        Ok(())
    }
}