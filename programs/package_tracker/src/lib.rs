use anchor_lang::prelude::*;

pub mod contexts;
pub mod state;
pub mod errors;

pub use crate::contexts::*;
pub use crate::state::*;
pub use crate::errors::*;


declare_id!("6MvygZ6LsuRpgLFBb4Qmrdnh19aD1UsyceGXynwU9hp9");

#[program]
    pub mod package_tracker {
    use crate::update_status::UpdateStatus;

    use super::*;
    pub fn initialize_config(ctx:Context<InitializeConfig>, fee_collector: Pubkey, creation_fee: u64, update_fee: u64) -> Result<()> {
        ctx.accounts.initialize_config(fee_collector,creation_fee, update_fee);
        Ok(())
    }
    // Create a new package
    pub fn create_package(ctx:Context<CreatePackage>, package_id: String, encrypted_recipient_data: Vec<u8>, latitude: f64, longitude: f64) -> Result<()> {
        ctx.accounts.create_package(package_id, encrypted_recipient_data, latitude, longitude, &ctx.bumps)?;
        Ok(())
    }

    // Update package status
    pub fn update_package_status(ctx:Context<UpdateStatus>, new_status: PackageStatus, latitude: f64, longitude: f64) -> Result<()> {
        ctx.accounts.update_package_status(new_status,latitude, longitude)?;
        Ok(())
    }
    
}