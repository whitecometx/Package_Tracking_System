import { Program, IdlAccounts, BN } from '@coral-xyz/anchor';
import type { PackageTracker } from '../idl';

export type SolTrackProgram = Program<PackageTracker>;

export type PackageData = IdlAccounts<PackageTracker>['Package'] & {
  package_id: string;
  status: PackageStatus; 
  current_location: { latitude: number; longitude: number };
  created_at: BN;
  updated_at: BN;
  encrypted_recipient_data: Uint8Array;
};
/*export type PackageStatus = IdlAccounts<PackageTracker>['Package']['status'];


// Optional: If you need event types
export type PackageCreatedEvent = IdlEvents<PackageTracker>['PackageCreated'];
export type StatusUpdatedEvent = IdlEvents<PackageTracker>['StatusUpdated'];

console.log(require.resolve('../idl/package_tracker'));*/


// For enum type safety
export type PackageStatus = 
  | 'Created'
  | 'Dispatched'
  | 'InTransit'
  | 'OutForDelivery'
  | 'Delivered'
  | 'AttemptedDelivery'
  | 'Canceled'
  | 'HeldAtCustoms'
  | 'Delayed'
  | 'Lost';
