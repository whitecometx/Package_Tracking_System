// package_tracker.ts
export type PackageTracker = typeof import('../idl/package_tracker.json');

import idl from '../idl/package_tracker.json';

export type PackageStatus = 
  typeof idl.types[number]['type'] extends { variants: Array<{ name: infer N }> } 
    ? N 
    : string;