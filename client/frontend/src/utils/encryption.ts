import nacl from 'tweetnacl';

export const encryptData = (
  data: string,
  publicKey: Uint8Array
): Uint8Array => {
  const encodedData = new TextEncoder().encode(data);
  return (nacl.box as any).seal(encodedData, publicKey);
};

export const decryptData = (
  encryptedData: Uint8Array,
  secretKey: Uint8Array
): string => {
  const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
  const decrypted = (nacl.box.open as any).sealed(encryptedData, keypair.publicKey, keypair.secretKey);
  if (!decrypted) throw new Error('Decryption failed');
  return new TextDecoder().decode(decrypted);
};