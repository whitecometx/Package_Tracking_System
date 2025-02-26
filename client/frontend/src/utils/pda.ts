import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '../config';

export const derivePackageAddress = async (
  packageId: string,
  courierPubkey: PublicKey
): Promise<PublicKey> => {
  const [pda] = await PublicKey.findProgramAddressSync(
    [
      Buffer.from("package"),
      Buffer.from(packageId),
      courierPubkey.toBuffer()
    ],
    CONFIG.PROGRAM_ID
  );
  return pda;
};
export const generateTrackingLink = (pda: PublicKey): string => 
  `${window.location.origin}/track/${pda.toBase58()}`;