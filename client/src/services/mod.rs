use anchor_client::{anchor_lang::prelude::*, Client};
use solana_sdk::{signature::Keypair, commitment_config::CommitmentConfig};

pub struct SoltrackClient {
    program: Client<Keypair>,
}

impl SoltrackClient {
    pub fn new(
        program_id: Pubkey,
        payer: Keypair,
        cluster_url: &str
    ) -> Self {
        let client = Client::new_with_options(
            Cluster::Custom(cluster_url.to_string(), cluster_url.to_string()),
            Arc::new(payer),
            CommitmentConfig::confirmed()
        );
        
        SoltrackClient {
            program: client.program(program_id),
        }
    }

    pub async fn create_package(
        &self,
        package_id: String,
        courier_pubkey: Pubkey,
        encrypted_data: Vec<u8>,
        lat: f64,
        lng: f64
    ) -> Result<()> {
        let pda = derive_package_address(&package_id, &courier_pubkey, &self.program.id());
        
        self.program
            .request()
            .accounts(soltrack::accounts::CreatePackage {
                sender: self.program.payer(),
                courier: courier_pubkey,
                package: pda,
                system_program: system_program::ID,
            })
            .args(soltrack::instruction::CreatePackage {
                package_id,
                encrypted_recipient_data: encrypted_data,
                latitude: lat,
                longitude: lng,
            })
            .send()
            .await
    }
}