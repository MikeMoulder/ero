import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

let masterKey: Buffer;

function getKeyFilePath(): string {
  const dir = path.resolve(__dirname, '../../../data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, '.wallet-key');
}

function getMasterKey(): Buffer {
  if (masterKey) return masterKey;

  // 1. Use env var if provided
  if (config.wallet.encryptionKey) {
    masterKey = Buffer.from(config.wallet.encryptionKey, 'hex');
    if (masterKey.length !== 32) {
      throw new Error('WALLET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return masterKey;
  }

  // 2. Load from persisted key file
  const keyFile = getKeyFilePath();
  if (fs.existsSync(keyFile)) {
    const hex = fs.readFileSync(keyFile, 'utf8').trim();
    masterKey = Buffer.from(hex, 'hex');
    console.log('[Crypto] Loaded encryption key from file');
    return masterKey;
  }

  // 3. Generate and persist to file
  masterKey = crypto.randomBytes(32);
  fs.writeFileSync(keyFile, masterKey.toString('hex'), { encoding: 'utf8', mode: 0o600 });
  console.warn('[Crypto] Generated new encryption key (set WALLET_ENCRYPTION_KEY in .env to use a fixed key)');

  return masterKey;
}

export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const key = getMasterKey();
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted data: expected format iv:authTag:ciphertext');
  }
  const [ivHex, authTagHex, ciphertext] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
