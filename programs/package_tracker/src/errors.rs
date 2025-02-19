use anchor_lang::error_code;

#[error_code]
    pub enum SolTrackError {
        #[msg("Unauthorized access")]
        UnauthorizedCourier,
        #[msg("Invalid status transition")]
        InvalidStatusTransition,
        #[msg("Geolocation out of bounds")]
        InvalidGeoPoint,
    }