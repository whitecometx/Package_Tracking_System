use solana_sdk::pubkey::Pubkey;
use sodiumoxide::crypto::box_;

pub fn encrypt_recipient_data(
    data: &str,
    courier_pubkey: &Pubkey
) -> Vec<u8> {
    let (ephemeral_pk, ephemeral_sk) = box_::gen_keypair();
    let nonce = box_::gen_nonce();
    let ciphertext = box_::seal(
        data.as_bytes(),
        &nonce,
        &box_::PublicKey(*courier_pubkey.as_ref()),
        &ephemeral_sk
    );
    [ephemeral_pk.0.to_vec(), nonce.0.to_vec(), ciphertext].concat()
}

pub fn decrypt_recipient_data(
    encrypted_data: &[u8],
    courier_keypair: &box_::SecretKey
) -> String {
    let ephemeral_pk = box_::PublicKey::from_slice(&encrypted_data[..32]).unwrap();
    let nonce = box_::Nonce::from_slice(&encrypted_data[32..56]).unwrap();
    let ciphertext = &encrypted_data[56..];
    
    box_::open(
        ciphertext,
        &nonce,
        &ephemeral_pk,
        courier_keypair
    ).map(|plaintext| String::from_utf8(plaintext).unwrap())
}