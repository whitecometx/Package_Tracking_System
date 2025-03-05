import { PublicKey } from '@solana/web3.js';

export const CONFIG = {
  PROGRAM_ID: new PublicKey("6MvygZ6LsuRpgLFBb4Qmrdnh19aD1UsyceGXynwU9hp9"),
  //FEE_COLLECTOR: new PublicKey(""),
  //RPC_URL: "https://api.devnet.solana.com",
  RPC_URL: "http://localhost:5173",
  PACKAGE_ID_MAX_LENGTH: 10,
  ENCRYPTED_DATA_MAX_SIZE: 200
};