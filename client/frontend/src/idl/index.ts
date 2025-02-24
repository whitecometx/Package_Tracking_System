import idl from './package_tracker.json';
import type { PackageTrackerIDL } from './types';

export const PackageTrackerIDL = idl as PackageTrackerIDL;
export type PackageTracker = typeof PackageTrackerIDL;