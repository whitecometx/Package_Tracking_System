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