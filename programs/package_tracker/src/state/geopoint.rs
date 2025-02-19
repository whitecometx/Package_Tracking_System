use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct GeoPoint {
    pub latitude: f64,
    pub longitude: f64,
}
impl Space for GeoPoint {
    const INIT_SPACE: usize = 2 ; // Assuming you use 1 byte to represent the enum
}
