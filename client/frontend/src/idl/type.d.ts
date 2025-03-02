/*declare module '../idl/package_tracker.json' {
    import { Idl } from '@coral-xyz/anchor';
    const value: Idl;
    export default value;
  }*/
  declare module '*.json' {
    const value: Idl;
    export default value;
  }