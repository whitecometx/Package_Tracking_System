use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum PackageStatus {
    Created,
    Dispatched,
    InTransit,
    OutForDelivery,
    Delivered,
    AttemptedDelivery,
    Canceled,
    HeldAtCustoms,
    Delayed,
    Lost

}

impl Space for PackageStatus {
    const INIT_SPACE: usize = 1 ; // Assuming you use 1 byte to represent the enum
}