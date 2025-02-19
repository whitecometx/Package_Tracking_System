use anchor_lang::prelude::*;
use crate::PackageStatus;

#[event]
pub struct PackageCreated {
    pub package_id: String,
    pub courier: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StatusUpdated {
    pub package_id: String,
    pub new_status: PackageStatus,
    pub timestamp: i64,
    pub latitude: f64,
    pub longitude: f64,
}