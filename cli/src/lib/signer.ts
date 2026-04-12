import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { requireInit, decryptSecret } from './config-store';

export function getKeypair(): Keypair {
  const cfg = requireInit();
  const secret = decryptSecret(cfg.encryptedSecret!);
  return Keypair.fromSecret(secret);
}

export function signTransactionXdr(unsignedXdr: string): string {
  const keypair = getKeypair();
  const tx = TransactionBuilder.fromXDR(unsignedXdr, Networks.TESTNET);
  tx.sign(keypair);
  return tx.toXDR();
}
