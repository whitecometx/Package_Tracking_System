use anchor_lang::prelude::*;
use crate::GeoPoint;
use crate::PackageStatus;

#[account]
#[derive(InitSpace)]
pub struct Package {
    #[max_len(10)] 
    pub package_id: String,    // Unique per courier     
    pub status: PackageStatus,    // Enum: Created, Dispatched, InTransit, Delivered
    pub sender: Pubkey,             // Sender's wallet address
    pub courier_pubkey: Pubkey,         // Logistics provider's pubkey
    pub created_at: i64,            // Creation timestamp
    pub updated_at: i64, 
    pub current_location: GeoPoint, // { latitude: f64, longitude: f64 }
    #[max_len(200)] 
    pub encrypted_recipient_data: Vec<u8>,           // Receiver address encrypted

}

impl Package {
    /// Validates status transitions with business logic rules
    pub fn is_valid_transition(&self, new_status: &PackageStatus) -> bool {
        // Special case- Allow marking Lost from any non-terminal state
        if *new_status == PackageStatus::Lost {
            return !matches!(
                self.status,
                PackageStatus::Delivered | 
                PackageStatus::Canceled | 
                PackageStatus::Lost
            );
        }

        match self.status {
            PackageStatus::Created => {
                matches!(
                    new_status,
                    PackageStatus::Dispatched | // Direct dispatch
                    PackageStatus::Canceled
                )
            }
            PackageStatus::Dispatched => {
                matches!(
                    new_status,
                    PackageStatus::InTransit |
                    PackageStatus::Canceled
                )
            }
            PackageStatus::InTransit => {
                matches!(
                    new_status,
                    PackageStatus::OutForDelivery |
                    PackageStatus::HeldAtCustoms |
                    PackageStatus::Dispatched | // Return to warehouse
                    PackageStatus::Delayed |
                    PackageStatus::Canceled
                )
            }
            PackageStatus::OutForDelivery => {
                matches!(
                    new_status,
                    PackageStatus::Delivered |
                    PackageStatus::AttemptedDelivery |
                    PackageStatus::Delayed |
                    PackageStatus::Canceled
                )
            }
            PackageStatus::AttemptedDelivery => {
                matches!(
                    new_status,
                    PackageStatus::OutForDelivery | // Retry delivery
                    PackageStatus::Delayed |
                    PackageStatus::Canceled
                )
            }
            PackageStatus::HeldAtCustoms => {
                matches!(
                    new_status,
                    PackageStatus::InTransit | // Released from customs
                    PackageStatus::Delayed |
                    PackageStatus::Canceled
                )
            }
            PackageStatus::Delayed => {
                matches!(
                    new_status,
                    PackageStatus::InTransit | // Recovery from delay
                    PackageStatus::OutForDelivery |
                    PackageStatus::HeldAtCustoms |
                    PackageStatus::Canceled
                )
            }
            // Terminal states - no transitions allowed
            PackageStatus::Delivered |
            PackageStatus::Canceled |
            PackageStatus::Lost => false,
        }
    }

    /// Calculates account storage requirements
    pub const MAX_SIZE: usize = 
        50 +  // package_id (String)
        32 +  // sender_pubkey
        32 +  // courier_pubkey
        1 +   // status (enum discriminant)
        8 +   // created_at (i64)
        8 +   // updated_at (i64)
        16 +  // GeoPoint (2x f64)
        500; // encrypted_recipient_data (Vec<u8>)
}