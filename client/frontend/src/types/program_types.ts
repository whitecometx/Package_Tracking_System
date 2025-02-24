import { Program } from '@coral-xyz/anchor';
import type { PackageTracker } from '../idl'; // Your IDL type

// Simplified type that references your actual IDL
export type SolTrackProgram = Program<PackageTracker>;
