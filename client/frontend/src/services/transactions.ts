
import { SolTrackProgram, PackageData } from '../types/program_types'; 
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { derivePackageAddress } from '../utils/pda';

export const fetchPackage = async (
  program: SolTrackProgram,
  pda: PublicKey
): Promise<PackageData> => {
  try {
  const account = await (program.account as any).Package.fetch(pda);
  return account;

  } catch (error) {

  console.error("Error fetching package:", error);
  throw error; // Re-throw to allow error handling in the UI

  }
};

export const createPackage = async (
  program: SolTrackProgram,
  package_id: string,
  courierPubkey: PublicKey,
  encryptedData: Uint8Array,
  location: { lat: number; lng: number }
) => {
  const pda = await derivePackageAddress(package_id, courierPubkey);
    // Add null check for sender
    if (!program.provider.publicKey) {
      throw new Error("Wallet not connected");
    }
  return await program.methods.createPackage( package_id, Array.from(encryptedData), location.lat, location.lng)
      .accounts({
      Package: pda, 
      courier: courierPubkey,
      sender: program.provider.publicKey,
      systemProgram: SystemProgram.programId
    })
    .rpc();
};

export const updatePackageStatus = async (
  program: SolTrackProgram,
  package_id: string,
  courierPubkey: PublicKey,
  new_status: any,
  location: { lat: number; lng: number }
) => {
  const pda = await derivePackageAddress(package_id, courierPubkey);
  return await program.methods
    .updatePackageStatus(new_status, location.lat, location.lng)
    .accounts({
      Package: pda,
      courier: courierPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
};