use solana_program::{pubkey::Pubkey, system_program};
use solana_sdk::signer::Signer;

pub fn derive_package_address(
    package_id: &str,
    courier_pubkey: &Pubkey,
    program_id: &Pubkey
) -> Pubkey {
    Pubkey::find_program_address(
        &[
            b"package",
            package_id.as_bytes(),
            courier_pubkey.as_ref()
        ],
        program_id
    ).0
}

pub fn tracking_link(pda: &Pubkey) -> String {
    format!("https://soltrack.com/{}", pda.to_string())
}