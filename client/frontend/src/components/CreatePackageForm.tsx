import { useWallet } from '@solana/wallet-adapter-react';
import { encryptData } from '../utils/encryption';
import { createPackage } from '../services/transactions';
import { useState } from 'react';

export default function CreatePackageForm() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [formData, setFormData] = useState({/* ... */});

  const handleSubmit = async () => {
    if (!connected) {
      alert("Please connect wallet first");
      return;
    }
    const encrypted = encryptData(
      JSON.stringify(formData.recipient),
      publicKey.toBytes()
    );
    
    await createPackage(
      program,
      formData.packageId,
      publicKey,
      encrypted,
      formData.location
    );
  };

  return (
    <Form>
      {/* Form inputs */}
      <Button onClick={handleSubmit}>Create Package</Button>
    </Form>
  );
}