import type { Idl } from '@coral-xyz/anchor';


export type PackageTrackerIDL = Idl & {
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
      pda?: {
        seeds: Array<{
          kind: 'const' | 'arg' | 'account';
          value?: number[];
          path?: string;
        }>;
      };
    }>;
    args: Array<{
      name: string;
      type: string | { defined: string };
    }>;
  }>;
};
