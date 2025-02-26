import { Program, IdlAccounts, IdlEvents } from '@coral-xyz/anchor';
import type { PackageTracker } from '../idl'; // Your IDL type

// Simplified type that references your actual IDL
export type SolTrackProgram = Program<PackageTracker>;

export type PackageData = IdlAccounts<PackageTracker>['package'];
export type PackageStatus = IdlAccounts<PackageTracker>['package']['status'];

// Optional: If you need event types
export type PackageCreatedEvent = IdlEvents<PackageTracker>['PackageCreated'];
export type StatusUpdatedEvent = IdlEvents<PackageTracker>['StatusUpdated'];


