import idl from '../idl/package_tracker.json';
export type PackageTracker = typeof idl;

export type PackageStatus = 
  typeof idl.types[number]['type'] extends { variants: Array<{ name: infer N }> } 
    ? N 
    : string;