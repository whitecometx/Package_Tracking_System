use solana_client::{
    nonblocking::websocket::WebSocketRpcClient,
    rpc_response::RpcLogsResponse,
};
use solana_sdk::commitment_config::CommitmentConfig;

pub async fn listen_package_events(
    program_id: Pubkey,
    ws_url: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let client = WebSocketRpcClient::new(ws_url).await?;
    
    let (mut notifications, _) = client
        .logs_subscribe(
            json!({
                "mentions": [program_id.to_string()],
            }),
            CommitmentConfig::confirmed(),
        )
        .await?;

    while let Some(notification) = notifications.next().await {
        match notification {
            RpcLogsResponse::Logs(logs) => {
                // Parse Anchor events here
                println!("New event: {:?}", logs);
            }
            _ => {}
        }
    }
    
    Ok(())
}