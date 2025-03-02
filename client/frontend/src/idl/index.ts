import idl from './package_tracker.json';
import { Idl } from '@coral-xyz/anchor'; 

export const PackageTrackerIDL = idl as Idl;
export type PackageTracker = typeof PackageTrackerIDL;
//export type PackageTracker = Idl;

/*export const PackageTrackerIDL = idl as Idl & {
  metadata: {
    address: string;
  };
  accounts: [
    {
      name: 'GlobalConfig';
      type: {
        kind: 'struct';
        fields: [
          { name: 'fee_collector'; type: 'pubkey' },
          { name: 'creation_fee'; type: 'u64' },
          { name: 'update_fee'; type: 'u64' },
          { name: 'admin'; type: 'pubkey' }
        ];
      };
    },
    {
      name: 'Package';
      type: {
        kind: 'struct';
        fields: [
          { name: 'package_id'; type: 'string' },
          { name: 'status'; type: { defined: 'PackageStatus' } },
          { name: 'sender'; type: 'pubkey' },
          { name: 'courier_pubkey'; type: 'pubkey' },
          { name: 'created_at'; type: 'i64' },
          { name: 'updated_at'; type: 'i64' },
          { name: 'current_location'; type: { defined: 'GeoPoint' } },
          { name: 'encrypted_recipient_data'; type: 'bytes' }
        ];
      };
    }
  ];
};

export type PackageTracker = typeof PackageTrackerIDL;*/