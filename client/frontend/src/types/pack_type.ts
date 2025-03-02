//import type { Idl } from '@coral-xyz/anchor';

export type PackageTrackerIDL = {
  version: string;
  name: string;
  instructions: Array<{
    name: string;
    accounts: Array<{
      name: string;
      isMut: boolean;
      isSigner: boolean;
    }>;
    args: Array<{
      name: string;
      type: string | { defined: string };
    }>;
  }>;
  accounts: Array<{
    name: string;
    type: {
      kind: string;
      fields: Array<{
        name: string;
        type: string | { defined: string };
      }>;
    };
  }>;
  types: Array<{
    name: string;
    type: {
      kind: string;
      variants: string[];
    };
  }>;
};
